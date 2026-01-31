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
import type {
    AgentIntegration,
    ConsentURLResponse,
    ImageData,
    ConversationMessage,
    ListMessagesResponse,
    UserInputRequestContent,
    AgentWithIntegrations,
} from "@wacht/types";

// ============================================================================
// useAgentContext - Main hook for realtime agent chat
// Assumes ticket has already been exchanged (uses session cookies)
// ============================================================================

interface UseAgentContextProps {
    contextId: string;
    agentName: string;
    platformAdapter?: {
        onPlatformEvent?: (eventName: string, eventData: unknown) => void;
        onPlatformFunction?: (
            functionName: string,
            parameters: unknown,
            executionId: string,
        ) => Promise<unknown>;
    };
    onUserInputRequest?: (request: UserInputRequestContent) => Promise<string>;
}

export function useAgentContext({
    contextId,
    agentName,
    platformAdapter,
}: UseAgentContextProps) {
    const { deployment } = useDeployment();
    const { client } = useClient();

    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [pendingImages, setPendingImages] = useState<ImageData[] | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionStatus, setExecutionStatus] = useState<FrontendStatus>(
        FRONTEND_STATUS.IDLE,
    );
    const [connectionState, setConnectionState] = useState<{
        status: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
    }>({ status: CONNECTION_STATES.DISCONNECTED });
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const oldestMessageIdRef = useRef<string | null>(null);

    const streamingMessageRef = useRef<{ id: number; content: string } | null>(
        null,
    );
    const fetchedContextRef = useRef<string | null>(null);
    const seenMessageIdsRef = useRef<Set<string | number>>(new Set());

    const handleConversationMessage = useCallback((data: any) => {
        const { id, content } = data;
        const message_type = data.message_type || data.metadata?.message_type || content?.type;

        let role: 'user' | 'assistant' = 'assistant';
        if (message_type === 'user_message') {
            role = 'user';
        }

        const message = {
            ...data,
            role,
            metadata: { ...(data.metadata || {}), message_type },
        } as ConversationMessage;

        if (
            message_type === "system_decision" ||
            message_type === "action_execution_result" ||
            message_type === "context_results"
        ) {
            setPendingMessage(null);
            setPendingImages(null);
            setPendingFiles(null);

            if (seenMessageIdsRef.current.has(id)) return;
            seenMessageIdsRef.current.add(id);

            setMessages((prev) => {
                return [...prev, message];
            });
            return;
        }

        if (message_type === "user_message") {
            setPendingMessage(null);
            setPendingImages(null);
            setPendingFiles(null);

            if (seenMessageIdsRef.current.has(id)) return;
            seenMessageIdsRef.current.add(id);

            console.log(seenMessageIdsRef.current, id);

            setMessages((prev) => {
                return [...prev, message];
            });
            return;
        }

        if (message_type === "assistant_acknowledgment") {
            setPendingMessage(null);
            setPendingImages(null);
            setPendingFiles(null);

            if (seenMessageIdsRef.current.has(id)) return;
            seenMessageIdsRef.current.add(id);

            setMessages((prev) => {
                return [...prev, message];
            });

            if (!data.further_action_required) {
                setIsExecuting(false);
                setExecutionStatus(FRONTEND_STATUS.IDLE);
                streamingMessageRef.current = null;
            }
            return;
        }



        if (message_type === "agent_response") {
            if (seenMessageIdsRef.current.has(id)) return;
            seenMessageIdsRef.current.add(id);

            setMessages((prev) => {
                return [...prev, message];
            });

            setIsExecuting(false);
            setExecutionStatus(FRONTEND_STATUS.IDLE);
            streamingMessageRef.current = null;
            return;
        }

        if (message_type === "user_input_request") {
            if (seenMessageIdsRef.current.has(id)) return;
            seenMessageIdsRef.current.add(id);

            setExecutionStatus(FRONTEND_STATUS.WAITING_FOR_INPUT);
            setMessages((prev) => {
                return [...prev, message];
            });
            return;
        }

        if (message_type === "execution_status") {
            // @ts-ignore
            const newStatus = mapBackendToFrontendStatus(content.status);
            setExecutionStatus(newStatus);
            setIsExecuting(isExecutionActive(newStatus));
            return;
        }
    }, []);

    const handlePlatformEvent = useCallback(
        (eventName: string, eventData: unknown) => {
            platformAdapter?.onPlatformEvent?.(eventName, eventData);
        },
        [platformAdapter],
    );

    // Refs for stable callback references in SSE effect
    const handleConversationMessageRef = useRef(handleConversationMessage);
    const handlePlatformEventRef = useRef(handlePlatformEvent);
    const clientRef = useRef(client);
    const deploymentRef = useRef(deployment);

    // Keep refs up to date
    useEffect(() => {
        handleConversationMessageRef.current = handleConversationMessage;
        handlePlatformEventRef.current = handlePlatformEvent;
        clientRef.current = client;
        deploymentRef.current = deployment;
    });

    // SSE EventSource ref
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;

    const fetchMessages = useCallback(
        async (beforeId?: string) => {
            if (!contextId) return;

            try {
                const params = new URLSearchParams({ limit: "100" });
                if (beforeId) {
                    params.append("before_id", beforeId);
                    setIsLoadingMore(true);
                }

                const response = await client(
                    `/api/agent/contexts/${contextId}/messages?${params}`,
                    { method: "GET" },
                );

                const result = await responseMapper<ListMessagesResponse>(response);

                if (result.data) {
                    const messages = [...result.data.data].sort((a, b) => {
                        const timeA = new Date(a.timestamp).getTime();
                        const timeB = new Date(b.timestamp).getTime();
                        return timeA - timeB;
                    });

                    if (messages.length > 0) {
                        oldestMessageIdRef.current = messages[0].id;
                    }

                    messages.forEach((msg) => {
                        seenMessageIdsRef.current.add(msg.id);
                    });

                    setMessages((prev) => {
                        if (beforeId) {
                            return [...messages, ...prev];
                        }
                        return messages;
                    });

                    setHasMoreMessages(result.data.has_more || false);
                    setIsLoadingMore(false);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
                setIsLoadingMore(false);
            }
        },
        [contextId, client],
    );

    useEffect(() => {
        const deployment = deploymentRef.current;
        if (!deployment || !contextId) return;

        const connect = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            const backendHost = deployment.backend_host.replace(/\/$/, "");
            const sseUrl = new URL(`${backendHost}/realtime/agent/stream`);
            sseUrl.searchParams.append("context_id", contextId);

            if (deployment.mode === "staging") {
                const devSession = localStorage.getItem("__dev_session__");
                if (devSession) {
                    sseUrl.searchParams.append("__dev_session__", devSession);
                }
            }

            console.log("SSE: Connecting to", sseUrl.toString());

            const eventSource = new EventSource(sseUrl.toString(), {
                withCredentials: deployment.mode !== "staging",
            });
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log("SSE: Connected successfully");
                setIsConnected(true);
                setConnectionState({ status: CONNECTION_STATES.CONNECTED });

                if (reconnectAttemptsRef.current > 0) {
                    setTimeout(() => {
                        client(`/api/agent/contexts/${contextId}/messages?limit=100`, { method: "GET" })
                            .then(async (response) => {
                                const result = await responseMapper<ListMessagesResponse>(response);
                                if (result.data) {
                                    const messages = [...result.data.data].sort((a, b) =>
                                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                    );
                                    setMessages(messages);
                                }
                            })
                            .catch(err => console.error("Failed to refetch messages:", err));
                    }, 100);
                }
                reconnectAttemptsRef.current = 0;
            };

            eventSource.onerror = (e) => {
                console.error("SSE error:", e);
                setIsConnected(false);
                setConnectionState({ status: CONNECTION_STATES.ERROR });

                eventSource.close();
                eventSourceRef.current = null;

                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`SSE: Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                } else {
                    console.error("SSE: Max reconnection attempts reached");
                    setConnectionState({ status: CONNECTION_STATES.DISCONNECTED });
                }
            };

            eventSource.addEventListener("conversation_message", (event) => {
                try {
                    console.log("SSE received conversation_message:", event.data);
                    const data = JSON.parse(event.data);
                    if (data.ConversationMessage) {
                        handleConversationMessageRef.current(data.ConversationMessage);
                    }
                } catch (err) {
                    console.error("Failed to parse conversation event:", err);
                }
            });

            eventSource.addEventListener("platform_event", (event) => {
                try {
                    console.log("SSE received platform_event:", event.data);
                    const data = JSON.parse(event.data);
                    if (data.PlatformEvent) {
                        handlePlatformEventRef.current(data.PlatformEvent[0], data.PlatformEvent[1]);
                    }
                } catch (err) {
                    console.error("Failed to parse platform event:", err);
                }
            });

            eventSource.addEventListener("user_input_request", (event) => {
                try {
                    console.log("SSE received user_input_request:", event.data);
                    const data = JSON.parse(event.data);
                    if (data.UserInputRequest) {
                        handleConversationMessage({
                            id: `input-${Date.now()}`,
                            content: data.UserInputRequest,
                            metadata: { message_type: "user_input_request" },
                        });
                    }
                } catch (err) {
                    console.error("Failed to parse user input request:", err);
                }
            });
        };

        // Initial connection
        connect();

        return () => {
            console.log("SSE: Cleanup running, closing connection for context:", contextId);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            setIsConnected(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextId]); // Only re-run when contextId changes


    // Send message
    const sendMessage = useCallback(
        async (
            message: string,
            images?: { mime_type: string; data?: string; url?: string }[],
            files?: File[],
        ) => {
            if (!contextId || !deployment) return;

            setPendingMessage(message);
            if (images && images.length > 0) {
                setPendingImages(images);
            }
            if (files && files.length > 0) {
                setPendingFiles(files);
            }

            try {
                const formData = new FormData();
                formData.append("agent_name", agentName);
                formData.append("message", message);
                if (files && files.length > 0) {
                    files.forEach((file) => {
                        formData.append("files", file);
                    });
                }
                // Content-Type header is set automatically by browser with boundary for FormData

                const response = await client(`/api/agent/contexts/${contextId}/execute`, {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    // SSE will provide the user message and clear pending state
                    setIsExecuting(true);
                    setExecutionStatus(FRONTEND_STATUS.RUNNING);
                } else {
                    // Clear pending on error - user needs to retry
                    setPendingMessage(null);
                    setPendingImages(null);
                    setPendingFiles(null);
                }
            } catch (err) {
                console.error("Failed to send message:", err);
                // Clear pending on error - user needs to retry
                setPendingMessage(null);
                setPendingImages(null);
                setPendingFiles(null);
            }
        },
        [contextId, agentName, deployment, client, fetchMessages],
    );

    // Submit user input
    const submitUserInput = useCallback(
        async (input: string) => {
            if (!contextId || executionStatus !== FRONTEND_STATUS.WAITING_FOR_INPUT) return;

            try {
                const formData = new FormData();
                formData.append("agent_name", agentName);
                formData.append("user_input", input);
                await client(`/api/agent/contexts/${contextId}/execute`, {
                    method: "POST",
                    body: formData,
                });
                setExecutionStatus(FRONTEND_STATUS.RUNNING);
            } catch (err) {
                console.error("Failed to submit user input:", err);
            }
        },
        [contextId, agentName, executionStatus, client],
    );

    // Load initial messages - only once per contextId
    useEffect(() => {
        if (contextId && fetchedContextRef.current !== contextId) {
            fetchedContextRef.current = contextId;
            fetchMessages();
        }
    }, [contextId]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadMoreMessages = useCallback(async () => {
        if (isLoadingMore || !hasMoreMessages || !oldestMessageIdRef.current) return;

        setIsLoadingMore(true);
        try {
            await fetchMessages(oldestMessageIdRef.current);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMoreMessages, fetchMessages]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setQuickQuestions([]);
        setPendingMessage(null);
        setPendingImages(null);
        setPendingFiles(null);
    }, []);

    const connect = useCallback(() => {
        // SSE auto-connects, this is kept for API compatibility
    }, []);

    const cancelExecution = useCallback(async () => {
        if (!contextId || !isExecuting) return;

        try {
            const formData = new FormData();
            formData.append("agent_name", agentName);
            formData.append("cancel", "true");
            await client(`/api/agent/contexts/${contextId}/execute`, {
                method: "POST",
                body: formData,
            });
            setIsExecuting(false);
            setExecutionStatus(FRONTEND_STATUS.IDLE);
        } catch (err) {
            console.error("Failed to cancel execution:", err);
        }
    }, [contextId, isExecuting, agentName, client]);

    return {
        messages,
        quickQuestions,
        pendingMessage,
        pendingImages,
        pendingFiles,
        connectionState,
        isConnected,
        isExecuting,
        executionStatus,
        isWaitingForInput: executionStatus === FRONTEND_STATUS.WAITING_FOR_INPUT,
        hasMoreMessages,
        isLoadingMore,
        sendMessage,
        submitUserInput,
        clearMessages,
        loadMoreMessages,
        cancelExecution,
        connect,
        disconnect: () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
                setIsConnected(false);
            }
        },
    };
}

// ============================================================================
// useAgentIntegrations - Hook for managing agent integrations
// Uses session cookies, no token needed
// ============================================================================

type UseAgentIntegrationsReturnType = {
    integrations: AgentIntegration[];
    loading: boolean;
    error: Error | null;
    generateConsentURL: (integrationId: string, redirectUrl?: string) => Promise<ConsentURLResponse>;
    removeIntegration: (integrationId: string) => Promise<void>;
    refetch: () => Promise<void>;
};

export function useAgentIntegrations(agentName: string | null): UseAgentIntegrationsReturnType {
    const { client } = useClient();

    const fetcher = useCallback(async () => {
        if (!agentName) return [];
        const response = await client(`/api/agent/integrations?agent_name=${agentName}`, {
            method: "GET",
        });
        const parsed = await responseMapper<AgentIntegration[]>(response);
        return parsed.data;
    }, [client, agentName]);

    const { data, error, mutate } = useSWR(
        agentName ? `wacht-agent-integrations:${agentName}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const generateConsentURL = useCallback(async (integrationId: string): Promise<ConsentURLResponse> => {
        const url = `/api/agent/integrations/${integrationId}/consent-url`;

        const response = await client(url, { method: "POST" });
        const parsed = await responseMapper<ConsentURLResponse>(response);
        return parsed.data;
    }, [client]);

    const removeIntegration = useCallback(async (integrationId: string): Promise<void> => {
        await client(`/api/agent/integrations/${integrationId}/remove`, {
            method: "POST",
        });

        await mutate((current) => {
            if (!current) return current;
            return current.filter((integration) => integration.id !== integrationId);
        });
    }, [client, mutate]);

    return {
        integrations: data || [],
        loading: !data && !error,
        error,
        generateConsentURL,
        removeIntegration,
        refetch: async () => { await mutate(); },
    };
}

// ============================================================================
// useAgentContexts - Hook for managing agent execution contexts (CRUD)
// Uses session cookies, no token needed
// ============================================================================

import type { AgentContext, CreateContextRequest, ListContextsOptions, ListContextsResponse } from "@wacht/types";

type UseAgentContextsReturnType = {
    contexts: AgentContext[];
    loading: boolean;
    error: Error | null;
    hasMore: boolean;
    createContext: (request: CreateContextRequest) => Promise<AgentContext>;
    deleteContext: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
};

export function useAgentContexts(
    options: ListContextsOptions = {}
): UseAgentContextsReturnType {
    const { client } = useClient();
    const { limit = 20, offset = 0, status, search } = options;

    const fetcher = useCallback(async () => {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        if (status) params.append("status", status);
        if (search) params.append("search", search);

        const response = await client(`/api/agent/contexts?${params.toString()}`, {
            method: "GET",
        });
        const parsed = await responseMapper<ListContextsResponse>(response);
        return parsed.data;
    }, [client, limit, offset, status, search]);

    const { data, error, mutate } = useSWR(
        `wacht-agent-contexts:${limit}:${offset}:${status}:${search}`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const createContext = useCallback(async (request: CreateContextRequest): Promise<AgentContext> => {
        const formData = new FormData();
        formData.append("title", request.title);
        if (request.system_instructions) {
            formData.append("system_instructions", request.system_instructions);
        }
        const response = await client("/api/agent/contexts", {
            method: "POST",
            body: formData,
        });

        const parsed = await responseMapper<AgentContext>(response);

        await mutate((current: ListContextsResponse | undefined) => {
            if (!current) return current;
            return {
                ...current,
                data: [parsed.data, ...current.data],
            };
        });

        return parsed.data;
    }, [client, mutate]);

    const deleteContext = useCallback(async (id: string): Promise<void> => {
        await client(`/api/agent/contexts/${id}/delete`, {
            method: "POST",
        });

        await mutate((current: ListContextsResponse | undefined) => {
            if (!current) return current;
            return {
                ...current,
                data: current.data.filter((ctx: AgentContext) => ctx.id !== id),
            };
        });
    }, [client, mutate]);

    return {
        contexts: data?.data || [],
        loading: !data && !error,
        error,
        hasMore: data?.has_more || false,
        createContext,
        deleteContext,
        refetch: async () => { await mutate(); },
    };
}

// ============================================================================
// useAgentSession - Unified hook for session management
// Handles: ticket exchange, session fetching, active agent, access control
// ============================================================================

interface AgentSessionData {
    session_id: string;
    context_group: string;
    agents: AgentWithIntegrations[];
}

interface UseAgentSessionResult {
    // Session state
    hasSession: boolean;
    sessionLoading: boolean;
    sessionError: Error | null;
    sessionId: string | null;
    contextGroup: string | null;

    // Agents
    agents: AgentWithIntegrations[];
    activeAgent: AgentWithIntegrations | null;
    setActiveAgent: (agent: AgentWithIntegrations) => void;

    // Ticket state
    ticketExchanged: boolean;
    ticketLoading: boolean;

    // Helpers
    refetch: () => Promise<void>;
}

export function useAgentSession(ticket?: string | null): UseAgentSessionResult {
    const { client } = useClient();

    const [ticketExchanged, setTicketExchanged] = useState(!ticket);
    const [ticketLoading, setTicketLoading] = useState(!!ticket);
    const [ticketError, setTicketError] = useState<Error | null>(null);
    const exchangedRef = useRef(false);
    const exchangingRef = useRef(false);

    const [activeAgent, setActiveAgent] = useState<AgentWithIntegrations | null>(null);

    const shouldFetch = ticketExchanged;

    const fetcher = useCallback(async () => {
        const response = await client("/api/agent/session", {
            method: "GET",
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("NO_SESSION");
            }
            throw new Error("Failed to fetch session");
        }

        const parsed = await responseMapper<AgentSessionData>(response);
        return parsed.data;
    }, [client]);

    const { data, error: fetchError, isLoading, mutate } = useSWR(
        shouldFetch ? "wacht-agent-session" : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Handle ticket exchange
    useEffect(() => {
        if (!ticket || exchangedRef.current || exchangingRef.current) return;

        const exchange = async () => {
            exchangingRef.current = true;
            setTicketLoading(true);
            try {
                const response = await client(`/session/ticket/exchange?ticket=${encodeURIComponent(ticket)}`, {
                    method: "GET",
                });

                if (response.ok) {
                    exchangedRef.current = true;
                    setTicketExchanged(true);
                } else {
                    setTicketError(new Error("Failed to exchange ticket"));
                }
            } catch (err) {
                setTicketError(err instanceof Error ? err : new Error("Failed to exchange ticket"));
            } finally {
                setTicketLoading(false);
                exchangingRef.current = false;
            }
        };

        exchange();
    }, [ticket, client]);

    // Auto-select first agent when data arrives
    useEffect(() => {
        if (!activeAgent && data?.agents && data.agents.length > 0) {
            setActiveAgent(data.agents[0]);
        }
    }, [data, activeAgent]);

    // Reset active agent when agents list changes significantly
    useEffect(() => {
        if (data?.agents && activeAgent) {
            const stillExists = data.agents.some((a: AgentWithIntegrations) => a.id === activeAgent.id);
            if (!stillExists && data.agents.length > 0) {
                setActiveAgent(data.agents[0]);
            }
        }
    }, [data, activeAgent]);

    const hasSession = !fetchError || fetchError.message !== "NO_SESSION";
    const sessionError = ticketError || (fetchError && fetchError.message !== "NO_SESSION" ? fetchError : null);
    const sessionLoading = ticketLoading || (shouldFetch && isLoading);

    return {
        hasSession,
        sessionLoading,
        sessionError,
        sessionId: data?.session_id || null,
        contextGroup: data?.context_group || null,
        agents: data?.agents || [],
        activeAgent,
        setActiveAgent,
        ticketExchanged,
        ticketLoading,
        refetch: async () => { await mutate(); }
    };
}
