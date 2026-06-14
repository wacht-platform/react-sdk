import { useState, useRef, useCallback, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
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
import {
    buildApprovalRunFormData,
    buildCancelRunFormData,
    buildMessageRunFormData,
    createConfirmedUserMessage,
    getConversationMessageType,
    getExecutionStatus,
    isFinalSteerMessage,
    isTerminalSystemDecision,
    normalizeConversationMessage,
    resolveThreadFileUrl,
    sortConversationMessages,
    unwrapConversationEvent,
} from "./agent-conversation-utils";
import type {
    Actor,
    AnswerSubmission,
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
    initialThread?: AgentThread | null;
    /** Scope the conversation to a single task (board item). Omit = whole thread. */
    boardItemId?: string;
    platformAdapter?: {
        onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    };
}

export function useAgentThreadConversation({
    threadId,
    initialThread = null,
    boardItemId,
    platformAdapter,
}: UseAgentThreadConversationProps) {
    const { deployment } = useDeployment();
    const { client } = useClient();

    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
    const [threadState, setThreadState] = useState<AgentThread | null>(
        initialThread,
    );
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
    const refreshThreadStatusRef = useRef<(() => Promise<void>) | null>(null);

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

            return sortConversationMessages(next);
        });
    }, []);

    const applyMessagePage = useCallback(
        ({
            messages,
            prepend,
            hasMore,
        }: {
            messages: ConversationMessage[];
            prepend?: boolean;
            hasMore?: boolean;
        }) => {
            const sortedMessages = sortConversationMessages(messages);

            if (sortedMessages.length > 0) {
                oldestMessageIdRef.current = sortedMessages[0].id;
            }

            setMessages((prev) =>
                prepend ? [...sortedMessages, ...prev] : sortedMessages,
            );

            if (hasMore !== undefined) {
                setHasMoreMessages(hasMore);
            }
        },
        [],
    );

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
        void refreshThreadStatusRef.current?.();
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

    const touchThreadActivity = useCallback((status?: string) => {
        setThreadState((current) => {
            if (!current) return current;

            return {
                ...current,
                ...(status ? { status } : {}),
                last_activity_at: new Date().toISOString(),
            };
        });
    }, []);

    const insertConfirmedUserMessage = useCallback(
        (conversationId: string, message: string) => {
            upsertMessage(createConfirmedUserMessage(conversationId, message));
            clearPendingSubmission();
        },
        [clearPendingSubmission, upsertMessage],
    );

    const handleConversationMessage = useCallback(
        (data: unknown) => {
            const message = normalizeConversationMessage(data);
            if (!message) return;

            const messageType = getConversationMessageType(message);

            switch (messageType) {
                case "system_decision":
                    upsertMessage(message);
                    if (isTerminalSystemDecision(message)) {
                        applyTerminalExecutionState();
                    }
                    return;

                case "execution_summary":
                case "tool_result":
                case "user_message":
                    upsertMessage(message);
                    return;

                case "steer":
                    upsertMessage(message);
                    if (isFinalSteerMessage(message)) {
                        applyTerminalExecutionState();
                    }
                    return;

                case "approval_request":
                    optimisticExecutionDeadlineRef.current = 0;
                    applyExecutionState(FRONTEND_STATUS.WAITING_FOR_INPUT);
                    upsertMessage(message);
                    return;

                case "approval_response":
                    upsertMessage(message);
                    markRunRequested(FRONTEND_STATUS.RUNNING);
                    return;

                case "execution_status": {
                    const nextStatus = getExecutionStatus(message);
                    if (!nextStatus) return;

                    applyAuthoritativeThreadStatus(nextStatus);
                    setThreadState((current) =>
                        current
                            ? { ...current, status: nextStatus }
                            : current,
                    );
                    return;
                }

                default:
                    upsertMessage(message);
            }
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
                if (boardItemId) {
                    params.append("board_item_id", boardItemId);
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
                    applyMessagePage({
                        messages: result.data.data,
                        prepend: Boolean(beforeId),
                        hasMore: result.data.has_more || false,
                    });
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
        [threadId, boardItemId, client, applyMessagePage],
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
                            `/ai/threads/${reconnectThreadId}/messages?limit=100${boardItemId ? `&board_item_id=${encodeURIComponent(boardItemId)}` : ""}`,
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
                                    applyMessagePage({
                                        messages: result.data.data,
                                        hasMore:
                                            result.data.has_more || false,
                                    });
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
                    const conversation = unwrapConversationEvent(
                        JSON.parse(event.data),
                    );
                    if (!conversation) return;
                    // When scoped to a task, drop live events for other tasks on
                    // the same (shared) thread. The streamed record carries
                    // board_item_id even though the REST payload strips it.
                    if (boardItemId) {
                        const raw = (conversation as { board_item_id?: unknown })
                            .board_item_id;
                        const eventBoardItemId =
                            raw === null || raw === undefined
                                ? ""
                                : String(raw);
                        if (eventBoardItemId !== boardItemId) return;
                    }
                    handleConversationMessageRef.current(conversation);
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
    }, [threadId, boardItemId, client, applyMessagePage]);

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
                void globalMutate(
                    `wacht-ai-thread:${requestThreadId}`,
                    result.data,
                    { revalidate: false },
                );
            }
        } catch {}
    }, [threadId, client, applyAuthoritativeThreadStatus]);

    useEffect(() => {
        refreshThreadStatusRef.current = refreshThreadStatus;
    }, [refreshThreadStatus]);

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
        setExecutionStatus(FRONTEND_STATUS.IDLE);
        clearPendingSubmission();
    }, [threadId, clearPendingSubmission]);

    useEffect(() => {
        if (!initialThread || initialThread.id !== threadId) return;
        setThreadState(initialThread);
    }, [initialThread, threadId]);

    // Send message
    const sendMessage = useCallback(
        async (message: string, files?: File[]) => {
            if (!threadId || !deployment) return;

            setPendingMessage(message);
            if (files && files.length > 0) {
                setPendingFiles(files);
            }
            markRunRequested(FRONTEND_STATUS.STARTING);

            try {
                const response = await client(`/ai/threads/${threadId}/run`, {
                    method: "POST",
                    body: buildMessageRunFormData(message, files),
                });

                if (response.ok) {
                    const result =
                        await responseMapper<ExecuteAgentResponse>(response);
                    const conversationId = result.data?.conversation_id ?? null;
                    touchThreadActivity(
                        typeof result.data?.status === "string"
                            ? result.data.status
                            : undefined,
                    );
                    if (conversationId) {
                        insertConfirmedUserMessage(conversationId, message);
                    } else {
                        clearPendingSubmission();
                    }
                    markRunRequested(FRONTEND_STATUS.RUNNING);
                } else {
                    optimisticExecutionDeadlineRef.current = 0;
                    applyExecutionState(FRONTEND_STATUS.IDLE);
                    clearPendingSubmission();
                }
            } catch (err) {
                optimisticExecutionDeadlineRef.current = 0;
                applyExecutionState(FRONTEND_STATUS.IDLE);
                clearPendingSubmission();
            }
        },
        [
            threadId,
            deployment,
            client,
            markRunRequested,
            applyExecutionState,
            touchThreadActivity,
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

            markRunRequested(FRONTEND_STATUS.STARTING);

            try {
                const response = await client(`/ai/threads/${threadId}/run`, {
                    method: "POST",
                    body: buildApprovalRunFormData(
                        requestMessageId,
                        approvals,
                    ),
                });

                if (!response.ok) {
                    optimisticExecutionDeadlineRef.current = 0;
                    applyExecutionState(FRONTEND_STATUS.IDLE);
                    return false;
                }

                touchThreadActivity();
                markRunRequested(FRONTEND_STATUS.RUNNING);
                return true;
            } catch {
                optimisticExecutionDeadlineRef.current = 0;
                applyExecutionState(FRONTEND_STATUS.IDLE);
                return false;
            }
        },
        [
            threadId,
            client,
            markRunRequested,
            applyExecutionState,
            touchThreadActivity,
        ],
    );

    const submitAnswer = useCallback(
        async (submission: AnswerSubmission): Promise<boolean> => {
            if (!threadId) return false;
            markRunRequested(FRONTEND_STATUS.STARTING);
            try {
                const response = await client(
                    `/ai/threads/${threadId}/messages/answer`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(submission),
                    },
                );
                if (!response.ok) {
                    optimisticExecutionDeadlineRef.current = 0;
                    applyExecutionState(FRONTEND_STATUS.IDLE);
                    return false;
                }
                touchThreadActivity();
                markRunRequested(FRONTEND_STATUS.RUNNING);
                return true;
            } catch {
                optimisticExecutionDeadlineRef.current = 0;
                applyExecutionState(FRONTEND_STATUS.IDLE);
                return false;
            }
        },
        [
            threadId,
            client,
            markRunRequested,
            applyExecutionState,
            touchThreadActivity,
        ],
    );

    const cancelExecution = useCallback(async () => {
        if (!threadId || !isExecutionActive(executionStatus)) return;

        try {
            await client(`/ai/threads/${threadId}/run`, {
                method: "POST",
                body: buildCancelRunFormData(),
            });
            optimisticExecutionDeadlineRef.current = 0;
            touchThreadActivity();
            applyExecutionState(FRONTEND_STATUS.IDLE);
        } catch {}
    }, [
        threadId,
        executionStatus,
        client,
        applyExecutionState,
        touchThreadActivity,
    ]);

    const resolveMessageFileUrl = useCallback(
        (file: FileData | null | undefined): string | null => {
            if (!deployment || !threadId || !file) return null;
            return resolveThreadFileUrl({ deployment, threadId, file });
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
    const pendingClarificationRequest =
        threadState?.execution_state?.pending_question ?? null;
    const threadStatus = threadState?.status;

    return {
        thread: threadState,
        threadState,
        threadStatus,
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
        pendingClarificationRequest,
        hasMoreMessages,
        isLoadingMore,
        messagesLoading,
        messagesError,
        refreshThread: refreshThreadStatus,
        refreshMessages,
        sendMessage,
        submitApprovalResponse,
        submitAnswer,
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

    // Handle ticket exchange. Allow re-exchange when a *new* ticket is passed
    // (e.g. proactive re-mint before the backend session expires). The
    // attemptedTicketRef dedupes same-ticket retries; exchangedRef must NOT
    // gate this — otherwise the first successful exchange permanently locks
    // out all future tickets for the lifetime of this hook instance.
    useEffect(() => {
        if (!ticket || exchangingRef.current) return;
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
