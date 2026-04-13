import { useState, useRef, useCallback, useEffect } from "react";
import useSWR from "swr";
import { CONNECTION_STATES } from "../constants/ai-agent";
import {
    FrontendStatus,
    mapBackendToFrontendStatus,
    isExecutionActive,
    FRONTEND_STATUS,
} from "../constants/execution-status";
import { useDeployment } from "./use-deployment";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { getStoredDevSession } from "../utils/dev-session";
import type {
    Actor,
    ToolApprovalDecision,
    ConversationMessage,
    ListMessagesResponse,
    FileData,
    Agent,
    AgentThread,
    ExecuteAgentResponse,
} from "@wacht/types";

const EXECUTION_STATE_GRACE_MS = 5000;
const THREAD_STATUS_POLL_INTERVAL_MS = 5000;

interface UseAgentThreadConversationProps {
    threadId: string;
    platformAdapter?: {
        onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    };
}

export function useAgentThreadConversation({
    threadId,
    platformAdapter,
}: UseAgentThreadConversationProps) {
    const { deployment } = useDeployment();
    const { client } = useClient();

    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
    const [threadState, setThreadState] = useState<AgentThread | null>(null);
    const [executionStatus, setExecutionStatus] = useState<FrontendStatus>(
        FRONTEND_STATUS.IDLE,
    );
    const [connectionState, setConnectionState] = useState<{
        status: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
    }>({ status: CONNECTION_STATES.DISCONNECTED });
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState<Error | null>(null);
    const oldestMessageIdRef = useRef<string | null>(null);
    const activeThreadIdRef = useRef(threadId);

    const optimisticExecutionDeadlineRef = useRef(0);
    const executionStatusRef = useRef<FrontendStatus>(FRONTEND_STATUS.IDLE);

    const upsertMessage = useCallback((message: ConversationMessage) => {
        setMessages((prev) => {
            const next = [...prev];
            const existingIndex = next.findIndex(
                (item) => String(item.id) === String(message.id),
            );

            if (existingIndex >= 0) {
                next[existingIndex] = message;
            } else {
                next.push(message);
            }

            next.sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
            );
            return next;
        });
    }, []);

    const applyExecutionState = useCallback((nextStatus: FrontendStatus) => {
        executionStatusRef.current = nextStatus;
        setExecutionStatus(nextStatus);
    }, []);

    const markRunRequested = useCallback(
        (nextStatus: FrontendStatus) => {
            optimisticExecutionDeadlineRef.current =
                Date.now() + EXECUTION_STATE_GRACE_MS;
            applyExecutionState(nextStatus);
        },
        [applyExecutionState],
    );

    const applyTerminalExecutionState = useCallback(() => {
        if (
            optimisticExecutionDeadlineRef.current > Date.now() &&
            isExecutionActive(executionStatusRef.current)
        ) {
            return;
        }

        applyExecutionState(FRONTEND_STATUS.IDLE);
    }, [applyExecutionState]);

    const applyAuthoritativeThreadStatus = useCallback(
        (backendStatus: string) => {
            const nextStatus = mapBackendToFrontendStatus(backendStatus);
            const nextIsExecuting = isExecutionActive(nextStatus);

            if (
                !nextIsExecuting &&
                optimisticExecutionDeadlineRef.current > Date.now() &&
                isExecutionActive(executionStatusRef.current)
            ) {
                return;
            }

            if (nextIsExecuting) {
                optimisticExecutionDeadlineRef.current = 0;
            }

            applyExecutionState(nextStatus);
        },
        [applyExecutionState],
    );

    const clearPendingSubmission = useCallback(() => {
        setPendingMessage(null);
        setPendingFiles(null);
    }, []);

    const insertConfirmedUserMessage = useCallback(
        (conversationId: string, message: string) => {
            const confirmedMessage: ConversationMessage = {
                id: conversationId,
                timestamp: new Date().toISOString(),
                content: {
                    type: "user_message",
                    message,
                },
                metadata: {
                    message_type: "user_message",
                },
            };

            upsertMessage(confirmedMessage);
            clearPendingSubmission();
        },
        [clearPendingSubmission, upsertMessage],
    );

    const handleConversationMessage = useCallback(
        (data: any) => {
            const { content } = data;
            const message_type =
                data.message_type ||
                data.metadata?.message_type ||
                content?.type;

            const message = {
                ...data,
                metadata: { ...(data.metadata || {}), message_type },
            } as ConversationMessage;

            if (
                message_type === "system_decision" ||
                message_type === "execution_summary" ||
                message_type === "tool_result"
            ) {
                upsertMessage(message);

                const step = content?.step;
                if (
                    message_type === "system_decision" &&
                    (step === "execution_cancelled" ||
                        step === "abort")
                ) {
                    applyTerminalExecutionState();
                }
                return;
            }

            if (message_type === "user_message") {
                upsertMessage(message);
                return;
            }

            if (message_type === "steer") {
                upsertMessage(message);

                if (!content?.further_actions_required) {
                    applyTerminalExecutionState();
                }
                return;
            }

            if (message_type === "approval_request") {
                optimisticExecutionDeadlineRef.current = 0;
                applyExecutionState(FRONTEND_STATUS.WAITING_FOR_INPUT);
                upsertMessage(message);
                return;
            }

            if (message_type === "approval_response") {
                upsertMessage(message);
                markRunRequested(FRONTEND_STATUS.RUNNING);
                return;
            }

            if (message_type === "execution_status") {
                // @ts-ignore
                applyAuthoritativeThreadStatus(content.status);
                return;
            }

            upsertMessage(message);
        },
        [
            applyAuthoritativeThreadStatus,
            applyTerminalExecutionState,
            applyExecutionState,
            markRunRequested,
            upsertMessage,
        ],
    );

    const handlePlatformEvent = useCallback(
        (eventName: string, eventData: unknown) => {
            platformAdapter?.onPlatformEvent?.(eventName, eventData);
        },
        [platformAdapter],
    );

    const handleConversationMessageRef = useRef(handleConversationMessage);
    const handlePlatformEventRef = useRef(handlePlatformEvent);
    const clientRef = useRef(client);
    const deploymentRef = useRef(deployment);

    useEffect(() => {
        handleConversationMessageRef.current = handleConversationMessage;
        handlePlatformEventRef.current = handlePlatformEvent;
        clientRef.current = client;
        deploymentRef.current = deployment;
    });

    useEffect(() => {
        activeThreadIdRef.current = threadId;
    }, [threadId]);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;

    const fetchMessages = useCallback(
        async (beforeId?: string) => {
            if (!threadId) return;
            const requestThreadId = threadId;

            if (beforeId) {
                setIsLoadingMore(true);
            } else {
                setMessagesLoading(true);
            }
            setMessagesError(null);

            try {
                const params = new URLSearchParams({ limit: "100" });
                if (beforeId) {
                    params.append("before_id", beforeId);
                }

                const response = await client(
                    `/ai/threads/${threadId}/messages?${params}`,
                    { method: "GET" },
                );

                const result =
                    await responseMapper<ListMessagesResponse>(response);

                if (
                    result.data &&
                    activeThreadIdRef.current === requestThreadId
                ) {
                    const messages = [...result.data.data].sort((a, b) => {
                        const timeA = new Date(a.timestamp).getTime();
                        const timeB = new Date(b.timestamp).getTime();
                        return timeA - timeB;
                    });

                    if (messages.length > 0) {
                        oldestMessageIdRef.current = messages[0].id;
                    }

                    setMessages((prev) => {
                        if (beforeId) {
                            return [...messages, ...prev];
                        }
                        return messages;
                    });

                    setHasMoreMessages(result.data.has_more || false);
                }
            } catch (error) {
                if (activeThreadIdRef.current === requestThreadId) {
                    setMessagesError(
                        error instanceof Error
                            ? error
                            : new Error("Failed to fetch messages"),
                    );
                }
            } finally {
                if (activeThreadIdRef.current === requestThreadId) {
                    if (beforeId) {
                        setIsLoadingMore(false);
                    } else {
                        setMessagesLoading(false);
                    }
                }
            }
        },
        [threadId, client],
    );

    useEffect(() => {
        const deployment = deploymentRef.current;
        if (!deployment || !threadId) return;

        const connect = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            const sseUrl = new URL(
                `${deployment.backend_host}/ai/threads/${encodeURIComponent(threadId)}/stream`,
            );

            if (deployment.mode === "staging") {
                const devSession = getStoredDevSession(deployment.backend_host);
                if (devSession) {
                    sseUrl.searchParams.append("__dev_session__", devSession);
                }
            }

            const eventSource = new EventSource(sseUrl.toString(), {
                withCredentials: deployment.mode !== "staging",
            });
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                setConnectionState({ status: CONNECTION_STATES.CONNECTED });

                if (reconnectAttemptsRef.current > 0) {
                    const reconnectThreadId = threadId;
                    setTimeout(() => {
                        client(
                            `/ai/threads/${reconnectThreadId}/messages?limit=100`,
                            { method: "GET" },
                        )
                            .then(async (response) => {
                                const result =
                                    await responseMapper<ListMessagesResponse>(
                                        response,
                                    );
                                if (
                                    result.data &&
                                    activeThreadIdRef.current ===
                                        reconnectThreadId
                                ) {
                                    const messages = [...result.data.data].sort(
                                        (a, b) =>
                                            new Date(a.timestamp).getTime() -
                                            new Date(b.timestamp).getTime(),
                                    );
                                    setMessages(messages);
                                }
                            })
                            .catch(() => {});
                    }, 100);
                }
                reconnectAttemptsRef.current = 0;
            };

            eventSource.onerror = () => {
                setConnectionState({ status: CONNECTION_STATES.ERROR });

                eventSource.close();
                eventSourceRef.current = null;

                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(
                        1000 * Math.pow(2, reconnectAttemptsRef.current),
                        30000,
                    );
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                } else {
                    setConnectionState({
                        status: CONNECTION_STATES.DISCONNECTED,
                    });
                }
            };

            eventSource.addEventListener("conversation_message", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const conversation =
                        data?.ConversationMessage ?? data ?? null;
                    if (conversation) {
                        handleConversationMessageRef.current(conversation);
                    }
                } catch {}
            });

            eventSource.addEventListener("platform_event", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data?.PlatformEvent) {
                        handlePlatformEventRef.current(
                            data.PlatformEvent[0],
                            data.PlatformEvent[1],
                        );
                    } else if (data?.event_label) {
                        handlePlatformEventRef.current(
                            data.event_label,
                            data.event_data,
                        );
                    }
                } catch {}
            });
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId]);

    const refreshThreadStatus = useCallback(async () => {
        if (!threadId) return;
        const requestThreadId = threadId;

        try {
            const response = await client(`/ai/threads/${requestThreadId}`, {
                method: "GET",
            });
            if (!response.ok) return;

            const result = await responseMapper<AgentThread>(response);
            if (result.data && activeThreadIdRef.current === requestThreadId) {
                setThreadState(result.data);
                applyAuthoritativeThreadStatus(result.data.status);
            }
        } catch {}
    }, [threadId, client, applyAuthoritativeThreadStatus]);

    useEffect(() => {
        if (!threadId) return;

        void refreshThreadStatus();
        const interval = window.setInterval(() => {
            if (
                !isExecutionActive(executionStatusRef.current) &&
                optimisticExecutionDeadlineRef.current <= Date.now()
            ) {
                return;
            }
            void refreshThreadStatus();
        }, THREAD_STATUS_POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(interval);
        };
    }, [threadId, refreshThreadStatus]);

    useEffect(() => {
        setMessages([]);
        setThreadState(null);
        setHasMoreMessages(true);
        setIsLoadingMore(false);
        setMessagesError(null);
        setMessagesLoading(Boolean(threadId));
        setConnectionState({ status: CONNECTION_STATES.DISCONNECTED });
        oldestMessageIdRef.current = null;
        optimisticExecutionDeadlineRef.current = 0;
        executionStatusRef.current = FRONTEND_STATUS.IDLE;
        clearPendingSubmission();
    }, [threadId, clearPendingSubmission]);

    // Send message
    const sendMessage = useCallback(
        async (message: string, files?: File[]) => {
            if (!threadId || !deployment) return;

            setPendingMessage(message);
            if (files && files.length > 0) {
                setPendingFiles(files);
            }

            try {
                const formData = new FormData();
                formData.append("message", message);
                if (files && files.length > 0) {
                    files.forEach((file) => {
                        formData.append("files", file);
                    });
                }

                const response = await client(`/ai/threads/${threadId}/run`, {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    const result =
                        await responseMapper<ExecuteAgentResponse>(response);
                    const conversationId = result.data?.conversation_id ?? null;
                    if (conversationId) {
                        insertConfirmedUserMessage(conversationId, message);
                    } else {
                        clearPendingSubmission();
                    }
                    markRunRequested(FRONTEND_STATUS.RUNNING);
                } else {
                    clearPendingSubmission();
                }
            } catch (err) {
                clearPendingSubmission();
            }
        },
        [
            threadId,
            deployment,
            client,
            markRunRequested,
            clearPendingSubmission,
            insertConfirmedUserMessage,
        ],
    );

    useEffect(() => {
        if (!threadId) return;
        void fetchMessages();
    }, [threadId, fetchMessages]);

    const refreshMessages = useCallback(async () => {
        await fetchMessages();
    }, [fetchMessages]);

    const loadMoreMessages = useCallback(async () => {
        if (isLoadingMore || !hasMoreMessages || !oldestMessageIdRef.current)
            return;

        setIsLoadingMore(true);
        try {
            await fetchMessages(oldestMessageIdRef.current);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMoreMessages, fetchMessages]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        clearPendingSubmission();
    }, [clearPendingSubmission]);

    const submitApprovalResponse = useCallback(
        async (
            requestMessageId: string,
            approvals: ToolApprovalDecision[],
        ): Promise<boolean> => {
            if (!threadId) return false;

            try {
                const formData = new FormData();
                formData.append("request_message_id", requestMessageId);
                approvals.forEach((approval) => {
                    formData.append("approval_tool_name", approval.tool_name);
                    formData.append("approval_mode", approval.mode);
                });

                const response = await client(`/ai/threads/${threadId}/run`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    return false;
                }

                markRunRequested(FRONTEND_STATUS.RUNNING);
                return true;
            } catch {
                return false;
            }
        },
        [threadId, client, markRunRequested],
    );

    const cancelExecution = useCallback(async () => {
        if (!threadId || !isExecutionActive(executionStatus)) return;

        try {
            const formData = new FormData();
            formData.append("cancel", "true");
            await client(`/ai/threads/${threadId}/run`, {
                method: "POST",
                body: formData,
            });
            optimisticExecutionDeadlineRef.current = 0;
            applyExecutionState(FRONTEND_STATUS.IDLE);
        } catch {}
    }, [threadId, executionStatus, client, applyExecutionState]);

    const resolveMessageFileUrl = useCallback(
        (file: FileData | null | undefined): string | null => {
            if (!deployment || !threadId || !file) return null;

            const raw = file.url || file.filename;
            if (!raw) return null;
            if (/^https?:\/\//i.test(raw)) return raw;

            const backendHost = deployment.backend_host.replace(/\/$/, "");
            let fileUrl: URL;

            if (raw.startsWith("/ai/threads/")) {
                fileUrl = new URL(raw, `${backendHost}/`);
            } else if (raw.startsWith("/uploads/")) {
                const filename = raw.split("/").pop() ?? "";
                if (!filename) return null;

                fileUrl = new URL(
                    `/ai/threads/${encodeURIComponent(threadId)}/filesystem/file`,
                    `${backendHost}/`,
                );
                fileUrl.searchParams.set("path", `uploads/${filename}`);
            } else {
                const filename = raw.includes("/")
                    ? (raw.split("/").pop() ?? "")
                    : raw;
                if (!filename) return null;

                fileUrl = new URL(
                    `/ai/threads/${encodeURIComponent(threadId)}/filesystem/file`,
                    `${backendHost}/`,
                );
                fileUrl.searchParams.set("path", `uploads/${filename}`);
            }

            if (deployment.mode === "staging") {
                const devSession = getStoredDevSession(deployment.backend_host);
                if (devSession) {
                    fileUrl.searchParams.set("__dev_session__", devSession);
                }
            }

            return fileUrl.toString();
        },
        [threadId, deployment],
    );

    const downloadMessageFile = useCallback(
        (file: FileData | null | undefined): void => {
            const fileUrl = resolveMessageFileUrl(file);
            if (!fileUrl) return;

            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = file?.filename || "attachment";
            link.rel = "noreferrer";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        [resolveMessageFileUrl],
    );

    const pendingApprovalRequest =
        threadState?.execution_state?.pending_approval_request ?? null;
    const activeApprovalRequestId =
        pendingApprovalRequest?.request_message_id ?? null;

    return {
        threadState,
        messages,
        pendingMessage,
        pendingFiles,
        connectionState,
        isConnected: connectionState.status === CONNECTION_STATES.CONNECTED,
        hasActiveRun: isExecutionActive(executionStatus),
        isRunning:
            executionStatus === FRONTEND_STATUS.STARTING ||
            executionStatus === FRONTEND_STATUS.RUNNING,
        executionStatus,
        isWaitingForInput:
            executionStatus === FRONTEND_STATUS.WAITING_FOR_INPUT,
        pendingApprovalRequest,
        activeApprovalRequestId,
        hasMoreMessages,
        isLoadingMore,
        messagesLoading,
        messagesError,
        refreshMessages,
        sendMessage,
        submitApprovalResponse,
        clearMessages,
        loadMoreMessages,
        cancelExecution,
        resolveMessageFileUrl,
        downloadMessageFile,
    };
}

interface UseAgentSessionData {
    session_id: string;
    actor: Actor;
    agents: Agent[];
}

interface UseAgentSessionResult {
    hasSession: boolean;
    sessionLoading: boolean;
    sessionError: Error | null;
    sessionId: string | null;
    actor: Actor | null;

    agents: Agent[];

    ticketExchanged: boolean;
    ticketLoading: boolean;

    refetch: () => Promise<void>;
}

export function useAgentSession(ticket?: string | null): UseAgentSessionResult {
    const { client } = useClient();

    const [ticketExchanged, setTicketExchanged] = useState(!ticket);
    const [ticketLoading, setTicketLoading] = useState(!!ticket);
    const [ticketError, setTicketError] = useState<Error | null>(null);
    const exchangedRef = useRef(false);
    const exchangingRef = useRef(false);
    const attemptedTicketRef = useRef<string | null>(null);

    const shouldFetch = ticketExchanged;

    const fetcher = useCallback(async () => {
        const response = await client("/ai/session", {
            method: "GET",
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("NO_SESSION");
            }
            throw new Error("Failed to fetch session");
        }

        const parsed = await responseMapper<UseAgentSessionData>(response);
        return parsed.data;
    }, [client]);

    const {
        data,
        error: fetchError,
        isLoading,
        mutate,
    } = useSWR(shouldFetch ? "wacht-agent-session" : null, fetcher, {
        revalidateOnFocus: false,
    });

    // Handle ticket exchange
    useEffect(() => {
        if (!ticket || exchangedRef.current || exchangingRef.current) return;
        if (attemptedTicketRef.current === ticket) return;
        attemptedTicketRef.current = ticket;

        const exchange = async () => {
            exchangingRef.current = true;
            setTicketLoading(true);
            try {
                const response = await client(
                    `/session/ticket/exchange?ticket=${encodeURIComponent(ticket)}`,
                    {
                        method: "GET",
                    },
                );

                if (response.ok) {
                    exchangedRef.current = true;
                    setTicketExchanged(true);
                } else {
                    setTicketError(new Error("Failed to exchange ticket"));
                }
            } catch (err) {
                setTicketError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to exchange ticket"),
                );
            } finally {
                setTicketLoading(false);
                exchangingRef.current = false;
            }
        };

        exchange();
    }, [ticket, client]);

    const hasSession =
        !ticketError &&
        (ticket ? ticketExchanged : true) &&
        (!fetchError || fetchError.message !== "NO_SESSION");
    const sessionError =
        ticketError ||
        (fetchError && fetchError.message !== "NO_SESSION" ? fetchError : null);
    const sessionLoading = ticketLoading || (shouldFetch && isLoading);

    return {
        hasSession,
        sessionLoading,
        sessionError,
        sessionId: data?.session_id || null,
        actor: data?.actor || null,
        agents: data?.agents || [],
        ticketExchanged,
        ticketLoading,
        refetch: async () => {
            await mutate();
        },
    };
}
