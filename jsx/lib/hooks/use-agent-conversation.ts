import { useState, useRef, useCallback, useEffect } from "react";
import { wsManager } from "../services/websocket-manager";
import { CONNECTION_STATES } from "../constants/ai-agent";
import {
  FrontendStatus,
  mapBackendToFrontendStatus,
  isExecutionActive,
  FRONTEND_STATUS,
} from "../constants/execution-status";
import { useDeployment } from "./use-deployment";
import { useClient } from "./use-client";

export interface UserInputRequest {
  question: string;
  context: string;
  input_type: "text" | "number" | "select" | "multiselect" | "boolean" | "date";
  options?: string[];
  default_value?: string;
  placeholder?: string;
}

export interface ImageData {
  mime_type: string;
  data?: string;
  url?: string;
}

export interface ConversationMessage {
  id: string | number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  images?: ImageData[];
  metadata?: {
    type?: "user_input_request" | "log";
    userInputRequest?: UserInputRequest;
    messageType?: string;
  };
}

interface UseAgentConversationProps {
  contextId: string;
  agentName: string;
  token: string;
  platformAdapter?: {
    onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    onPlatformFunction?: (
      functionName: string,
      parameters: unknown,
      executionId: string,
    ) => Promise<unknown>;
  };
  onUserInputRequest?: (request: UserInputRequest) => Promise<string>;
  autoConnect?: boolean;
}

export function useAgentConversation({
  contextId,
  agentName,
  token,
  platformAdapter,
  autoConnect = true,
}: UseAgentConversationProps) {
  const { deployment } = useDeployment();
  const { client } = useClient();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<ImageData[] | null>(null);
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

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message: any) => {
      switch (message.message_type) {
        case "session_connected":
          setIsConnected(true);
          setConnectionState({ status: CONNECTION_STATES.CONNECTED });

          // Update execution state from backend if provided
          if (message.data?.execution_status) {
            const backendStatus = message.data.execution_status;
            const frontendStatus = mapBackendToFrontendStatus(backendStatus);
            setExecutionStatus(frontendStatus);
            setIsExecuting(isExecutionActive(frontendStatus));
          }

          // Don't reload messages if they've already been loaded
          // They're now loaded immediately on mount
          break;

        case "conversation_message":
          handleConversationMessage(message.data);
          break;

        case "user_input_request":
          handleUserInputRequest(message.data);
          break;

        case "platform_event":
          handlePlatformEvent(message.data);
          break;

        case "platform_function":
          // Platform function received
          handlePlatformFunction(message.data);
          break;

        case "execution_complete":
          setIsExecuting(false);
          setExecutionStatus(FRONTEND_STATUS.IDLE);
          streamingMessageRef.current = null;
          break;

        case "execution_error":
          setIsExecuting(false);
          setExecutionStatus(FRONTEND_STATUS.FAILED);
          streamingMessageRef.current = null;
          break;

        case "execution_cancelled":
          setIsExecuting(false);
          setExecutionStatus(FRONTEND_STATUS.IDLE);
          streamingMessageRef.current = null;
          break;

        case "execution_status":
          // Handle execution status updates from backend
          const status = message.data?.status;
          if (status) {
            const frontendStatus = mapBackendToFrontendStatus(status);
            setExecutionStatus(frontendStatus);
            setIsExecuting(isExecutionActive(frontendStatus));
          }
          break;

        // Messages are now loaded from API via fetchMessages() instead of WebSocket
      }
    },
    [pendingMessage],
  );

  // Handle conversation messages
  const handleConversationMessage = useCallback((data: any) => {
    const { id, message_type, content } = data;

    // Check if message already exists to prevent duplicates
    const messageExists = (messageId: string | number) => {
      return messages.some((msg) => msg.id === messageId);
    };

    // Handle system/log messages
    if (
      message_type === "system_decision" ||
      message_type === "action_execution_result" ||
      message_type === "assistant_task_breakdown" ||
      message_type === "assistant_validation" ||
      message_type === "assistant_action_planning" ||
      message_type === "context_results"
    ) {
      setPendingMessage(null);
      setPendingImages(null);

      let logContent = "";

      if (message_type === "system_decision") {
        // Check if this is a gather_context step and add more context
        const step = content?.step;
        const reasoning = content?.reasoning;

        if (step === "gathercontext") {
          // Show the actual reasoning, clipped to a reasonable length
          if (reasoning && reasoning.length > 0) {
            const maxLength = 60;
            logContent =
              reasoning.length > maxLength
                ? `${reasoning.substring(0, maxLength)}...`
                : reasoning;
          } else {
            logContent = "Gathering context...";
          }
        } else if (step === "executeaction") {
          logContent = "Executing action";
        } else if (step === "deliverresponse") {
          logContent = "Preparing response";
        } else if (step === "taskplanning") {
          logContent = "Planning approach";
        } else if (step === "validateprogress") {
          logContent = "Validating progress";
        } else if (step === "acknowledge") {
          logContent = "Processing request";
        } else if (step === "finishplanning") {
          logContent = "Finalizing plan";
        } else if (step === "executetasks") {
          logContent = "Executing tasks";
        } else if (step === "requestuserinput") {
          logContent = "Waiting for input";
        } else if (step === "complete") {
          logContent = "Completed";
        } else if (step === "examinetool") {
          logContent = "Examining tool";
        } else if (step === "examineworkflow") {
          logContent = "Examining workflow";
        } else {
          // Default with varied text based on confidence
          const confidence = content?.confidence || 0.5;
          if (confidence > 0.8) {
            logContent = "Analyzing";
          } else if (confidence > 0.6) {
            logContent = "Thinking";
          } else {
            logContent = "Reasoning";
          }
        }
      } else if (message_type === "action_execution_result") {
        if (content.task_execution?.status === "completed") {
          logContent = "Task execution completed";
        } else if (content.task_execution?.approach) {
          logContent = content.task_execution.approach;
        } else {
          logContent = "Executing task";
        }
      } else if (message_type === "assistant_task_breakdown") {
        if (content.task_breakdown?.total_tasks) {
          logContent = `Identified ${content.task_breakdown.total_tasks} tasks`;
        } else {
          logContent = "Planning tasks";
        }
      } else if (message_type === "assistant_validation") {
        logContent = "Validated results";
      } else if (message_type === "assistant_action_planning") {
        if (content.task_execution?.total_tasks) {
          logContent = `Planned ${content.task_execution.total_tasks} tasks`;
        } else if (content.task_execution?.tasks?.length) {
          logContent = `Planned ${content.task_execution.tasks.length} tasks`;
        } else {
          logContent = "Planning actions";
        }
      } else if (message_type === "context_results") {
        const query = content.query;
        const resultCount = content.result_count || 0;
        if (query && query !== "General context gathering") {
          logContent = `${query}: Found ${resultCount} results`;
        } else {
          logContent = `Found ${resultCount} results`;
        }
      }

      if (logContent && !messageExists(id)) {
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "system",
            content: logContent,
            timestamp: new Date(),
            metadata: {
              type: "log",
              messageType: message_type,
            },
          },
        ]);
      }
      return;
    }

    if (message_type === "user_message") {
      if (!messageExists(id)) {
        setPendingMessage(null);
        setPendingImages(null);
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "user",
            content: content.message,
            images: content.images, // Include images from backend
            timestamp: new Date(),
          },
        ]);
      }
    } else if (message_type === "agent_response") {
      if (!messageExists(id)) {
        // Agent response indicates execution is complete
        setPendingMessage(null);
        setPendingImages(null);
        setIsExecuting(false);
        setExecutionStatus(FRONTEND_STATUS.IDLE);
        streamingMessageRef.current = null;

        // Add the final response message
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "assistant",
            content: content.response,
            timestamp: new Date(),
            isStreaming: false,
          },
        ]);
      }
    } else if (message_type === "assistant_acknowledgment") {
      if (!messageExists(id)) {
        setPendingMessage(null);
        setPendingImages(null);
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "assistant",
            content: content.acknowledgment_message,
            timestamp: new Date(),
          },
        ]);
      }
    } else if (
      message_type === "assistant_ideation" ||
      message_type === "assistant_action_planning" ||
      message_type === "action_execution_result" ||
      message_type === "assistant_validation" ||
      message_type === "assistant_context_gathering" ||
      message_type === "assistant_task_breakdown"
    ) {
      // Handle various assistant message types
      let messageContent = "";

      if (content.reasoning_summary) {
        messageContent = content.reasoning_summary;
      } else if (content.task_execution?.approach) {
        messageContent = content.task_execution.approach;
      } else if (content.strategic_synthesis) {
        messageContent = content.strategic_synthesis;
      } else if (content.task_breakdown?.total_tasks) {
        messageContent = `Breaking down into ${content.task_breakdown.total_tasks} tasks...`;
      } else if (content.acknowledgment_message) {
        messageContent = content.acknowledgment_message;
      } else {
        // Skip if no meaningful content
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant",
          content: messageContent,
          timestamp: new Date(),
        },
      ]);
    } else if (message_type === "user_input_request") {
      // Handle user input request from conversation messages
      const inputRequest = {
        question: content.question,
        context: content.context,
        input_type: content.input_type,
        options: content.options || content.suggestions,
        default_value: content.default_value,
        placeholder: content.placeholder,
      };

      setExecutionStatus("waiting_for_input");

      // Add as a system message with metadata for the component
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "system",
          content: inputRequest.question,
          timestamp: new Date(),
          metadata: {
            type: "user_input_request",
            userInputRequest: inputRequest,
          },
        },
      ]);
    }
  }, []);

  // Handle user input requests
  const handleUserInputRequest = useCallback(async (data: UserInputRequest) => {
    setExecutionStatus("waiting_for_input");

    // Add the user input request as a system message
    const requestId = `input-request-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: requestId,
        role: "system",
        content: data.question,
        timestamp: new Date(),
        metadata: {
          type: "user_input_request",
          userInputRequest: data,
        },
      },
    ]);
  }, []);

  // Handle platform events
  const handlePlatformEvent = useCallback(
    (data: any) => {
      const { event_label, event_data } = data;
      if (platformAdapter?.onPlatformEvent) {
        platformAdapter.onPlatformEvent(event_label, event_data);
      }
    },
    [platformAdapter],
  );

  // Handle platform function calls
  const handlePlatformFunction = useCallback(
    async (data: any) => {
      const { function_name, function_data } = data;
      const { parameters, execution_id } = function_data;

      // Processing platform function

      if (!platformAdapter?.onPlatformFunction) {
        // No handler registered for platform function
        wsManager.send({
          message_type: {
            platform_function_result: [
              execution_id,
              {
                error: `No platform function handler registered`,
              },
            ],
          },
          data: {},
        });
        return;
      }

      try {
        // Calling platform function handler
        const result = await platformAdapter.onPlatformFunction(
          function_name,
          parameters,
          execution_id,
        );
        // Platform function handler completed

        const message = {
          message_type: {
            platform_function_result: [execution_id, result],
          },
          data: {},
        };
        // Sending platform function result back
        wsManager.send(message);
      } catch (error) {
        // Platform function handler error
        wsManager.send({
          message_type: {
            platform_function_result: [
              execution_id,
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Function execution failed",
                stack: error instanceof Error ? error.stack : undefined,
              },
            ],
          },
          data: {},
        });
      }
    },
    [platformAdapter],
  );

  // Connect to WebSocket (once per deployment)
  useEffect(() => {
    if (!deployment) return;

    // Parse the backend host URL and construct WebSocket URL
    // const backendUrl = new URL(deployment.backend_host);

    // Connect to WebSocket
    const backendHost = deployment?.backend_host.replace(/https?:\/\//, "");
    const wsUrl = `wss://${backendHost}/realtime/agent?token=${encodeURIComponent(token)}`;

    setConnectionState({ status: CONNECTION_STATES.CONNECTING });
    wsManager.connect(wsUrl);
  }, [deployment, token]);

  // Handle WebSocket connection state changes
  useEffect(() => {
    const unsubConnection = wsManager.onConnectionStateChange((state) => {
      setConnectionState({
        status: state.isConnected
          ? CONNECTION_STATES.CONNECTED
          : state.error
            ? CONNECTION_STATES.ERROR
            : CONNECTION_STATES.DISCONNECTED,
      });
      setIsConnected(state.isConnected);
    });

    return unsubConnection;
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    const unsubscribe = wsManager.onMessage(handleWebSocketMessage);
    return unsubscribe;
  }, [handleWebSocketMessage]);

  // Connect to specific context when WebSocket is ready
  useEffect(() => {
    if (isConnected && contextId && agentName && autoConnect) {
      // Send session connect for this specific context
      wsManager.send({
        message_type: { session_connect: [contextId, agentName] },
        data: {},
      });
    }
  }, [isConnected, contextId, agentName, autoConnect]);

  // Manual connection function (simplified)
  const connect = useCallback(async () => {
    if (isConnected && contextId && agentName) {
      // Send session connect for this specific context
      wsManager.send({
        message_type: { session_connect: [contextId, agentName] },
        data: {},
      });
    }
    return () => {}; // No cleanup needed for individual contexts
  }, [isConnected, contextId, agentName]);

  // Send user message
  const sendMessage = useCallback(
    (content: string, images?: ImageData[]) => {
      if (!isConnected) return;

      setPendingMessage(content);
      setPendingImages(images || null);
      setIsExecuting(true);
      setExecutionStatus(FRONTEND_STATUS.STARTING);

      wsManager.send({
        message_type: { message_input: content },
        data: images ? { images } : {},
      });
    },
    [isConnected],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    streamingMessageRef.current = null;
  }, []);

  // Submit user input response
  const submitUserInput = useCallback(
    (value: string) => {
      if (!isConnected || executionStatus !== FRONTEND_STATUS.WAITING_FOR_INPUT)
        return;

      // Send the response using the dedicated user input response type
      wsManager.send({
        message_type: { user_input_response: value },
        data: {},
      });

      // Update status back to running
      setExecutionStatus(FRONTEND_STATUS.RUNNING);
    },
    [isConnected, executionStatus],
  );

  // Fetch messages from API (1-1 conversion from WebSocket logic)
  const fetchMessages = useCallback(async (beforeId?: string) => {
    if (!token || !contextId) return;
    
    try {
      const params = new URLSearchParams({
        token: token,
        limit: '50',
      });
      
      if (beforeId) {
        params.append('before_id', beforeId);
        setIsLoadingMore(true);
      }
      
      const response = await client(`/api/agent/contexts/${contextId}/messages?${params}`, {
        method: 'GET',
      });
      
      const result = await response.json();
      
      if (result.status === 200 && result.data) {
        const messageData = result.data;
        
        // Exact same processing as WebSocket fetch_context_messages
        if (Array.isArray(messageData.data)) {
          const pastMessages = messageData.data
            .filter((msg: any) => {
              // Parse content if needed
              let parsedContent = msg.content;
              if (typeof msg.content === 'string') {
                try {
                  parsedContent = JSON.parse(msg.content);
                } catch {
                  parsedContent = { message: msg.content };
                }
              }
              
              // Get message_type from metadata or parsed content
              const message_type = msg.metadata?.message_type || parsedContent?.message_type;
              
              // Include same message types as WebSocket
              return (
                message_type === "user_message" ||
                message_type === "agent_response" ||
                message_type === "assistant_acknowledgment" ||
                message_type === "user_input_request" ||
                message_type === "system_decision" ||
                message_type === "action_execution_result" ||
                message_type === "assistant_task_breakdown" ||
                message_type === "assistant_validation" ||
                message_type === "assistant_action_planning" ||
                message_type === "context_results"
              );
            })
            .map((msg: any) => {
              let content = "";
              let images = undefined;
              let metadata = undefined;
              
              // Parse content if needed
              let parsedContent = msg.content;
              if (typeof msg.content === 'string') {
                try {
                  parsedContent = JSON.parse(msg.content);
                } catch {
                  parsedContent = msg.content;
                }
              }
              
              // Get message_type from metadata or parsed content
              const message_type = msg.metadata?.message_type || parsedContent?.message_type;
              
              // Exact same content extraction logic
              if (message_type === "user_message") {
                content = parsedContent?.message || "";
                images = parsedContent?.images || undefined;
              } else if (message_type === "agent_response") {
                content = parsedContent?.response || "";
              } else if (message_type === "assistant_acknowledgment") {
                content = parsedContent?.acknowledgment_message || "";
              } else if (message_type === "user_input_request") {
                content = parsedContent?.question || "";
                metadata = {
                  type: "user_input_request",
                  userInputRequest: {
                    question: parsedContent?.question || "",
                    context: parsedContent?.context || "",
                    input_type: parsedContent?.input_type || "text",
                    options: parsedContent?.options || parsedContent?.suggestions || [],
                    default_value: parsedContent?.default_value || "",
                    placeholder: parsedContent?.placeholder || "",
                  },
                };
              }
              
              // Handle system/log messages - exact same logic
              if (
                message_type === "system_decision" ||
                message_type === "action_execution_result" ||
                message_type === "assistant_task_breakdown" ||
                message_type === "assistant_validation" ||
                message_type === "assistant_action_planning" ||
                message_type === "context_results"
              ) {
                let logContent = "";
                
                if (message_type === "system_decision") {
                  const step = parsedContent?.step;
                  const reasoning = parsedContent?.reasoning;
                  
                  if (step === "gathercontext") {
                    if (reasoning && reasoning.length > 0) {
                      const maxLength = 60;
                      logContent = reasoning.length > maxLength
                        ? `${reasoning.substring(0, maxLength)}...`
                        : reasoning;
                    } else {
                      logContent = "Gathering context...";
                    }
                  } else if (step === "executeaction") {
                    logContent = "Executing action";
                  } else if (step === "deliverresponse") {
                    logContent = "Preparing response";
                  } else if (step === "taskplanning") {
                    logContent = "Planning approach";
                  } else if (step === "validateprogress") {
                    logContent = "Validating progress";
                  } else if (step === "acknowledge") {
                    logContent = "Processing request";
                  } else if (step === "finishplanning") {
                    logContent = "Finalizing plan";
                  } else if (step === "executetasks") {
                    logContent = "Executing tasks";
                  } else if (step === "requestuserinput") {
                    logContent = "Waiting for input";
                  } else if (step === "complete") {
                    logContent = "Completed";
                  } else if (step === "examinetool") {
                    logContent = "Examining tool";
                  } else if (step === "examineworkflow") {
                    logContent = "Examining workflow";
                  } else {
                    const confidence = parsedContent?.confidence || 0.5;
                    if (confidence > 0.8) {
                      logContent = "Analyzing";
                    } else if (confidence > 0.6) {
                      logContent = "Thinking";
                    } else {
                      logContent = "Reasoning";
                    }
                  }
                } else if (message_type === "action_execution_result") {
                  if (parsedContent?.task_execution?.status === "completed") {
                    logContent = "Task execution completed";
                  } else if (parsedContent?.task_execution?.approach) {
                    logContent = parsedContent.task_execution.approach;
                  } else {
                    logContent = "Executing task";
                  }
                } else if (message_type === "assistant_task_breakdown") {
                  if (parsedContent?.task_breakdown?.total_tasks) {
                    logContent = `Identified ${parsedContent.task_breakdown.total_tasks} tasks`;
                  } else {
                    logContent = "Planning tasks";
                  }
                } else if (message_type === "assistant_validation") {
                  logContent = "Validated results";
                } else if (message_type === "assistant_action_planning") {
                  if (parsedContent?.task_execution?.total_tasks) {
                    logContent = `Planned ${parsedContent.task_execution.total_tasks} tasks`;
                  } else if (parsedContent?.task_execution?.tasks?.length) {
                    logContent = `Planned ${parsedContent.task_execution.tasks.length} tasks`;
                  } else {
                    logContent = "Planning actions";
                  }
                } else if (message_type === "context_results") {
                  const query = parsedContent?.query;
                  const resultCount = parsedContent?.result_count || 0;
                  if (query && query !== "General context gathering") {
                    logContent = `${query}: Found ${resultCount} results`;
                  } else {
                    logContent = `Found ${resultCount} results`;
                  }
                }
                
                content = logContent;
                metadata = { type: "log", messageType: message_type };
              }
              
              return {
                id: msg.id,
                role:
                  message_type === "user_message"
                    ? "user"
                    : message_type === "user_input_request"
                      ? "system"
                      : "assistant",
                content,
                images,
                timestamp: new Date(msg.timestamp || msg.created_at || Date.now()),
                metadata,
              };
            })
            .filter((msg: any) => msg.content || msg.metadata)
            .sort((a: any, b: any) => {
              // Sort by snowflake ID (ascending order - oldest first)
              const aId = BigInt(a.id);
              const bId = BigInt(b.id);
              return aId < bId ? -1 : aId > bId ? 1 : 0;
            });
          
          // Update oldest message ID for pagination
          if (pastMessages.length > 0) {
            oldestMessageIdRef.current = pastMessages[0].id;
          }
          
          // If this is pagination (beforeId provided), prepend to existing messages
          if (beforeId) {
            setMessages((prev) => [...pastMessages, ...prev]);
            setHasMoreMessages(pastMessages.length >= 50);
          } else {
            // Initial load
            setMessages(pastMessages);
            
            // Check if the last message is a user_input_request to restore waiting state
            if (pastMessages.length > 0) {
              const lastMessage = pastMessages[pastMessages.length - 1];
              if (lastMessage.metadata?.type === "user_input_request") {
                setExecutionStatus(FRONTEND_STATUS.WAITING_FOR_INPUT);
              }
            }
          }
          
          setIsLoadingMore(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setIsLoadingMore(false);
    }
  }, [token, contextId, client]);

  // Load messages immediately on mount (don't wait for WebSocket)
  useEffect(() => {
    if (contextId && token) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextId, token]); // fetchMessages excluded to prevent infinite loop

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (
      isLoadingMore ||
      !hasMoreMessages ||
      !oldestMessageIdRef.current
    )
      return;

    setIsLoadingMore(true);

    try {
      await fetchMessages(oldestMessageIdRef.current);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, fetchMessages]);

  // Cancel current execution
  const cancelExecution = useCallback(() => {
    if (!isConnected || !isExecuting) return;

    wsManager.send({
      message_type: { cancel_execution: null },
      data: {},
    });

    // Optimistically update state
    setIsExecuting(false);
    setExecutionStatus("idle");
  }, [isConnected, isExecuting]);

  return {
    messages,
    pendingMessage,
    pendingImages,
    connectionState,
    isConnected,
    isExecuting,
    executionStatus,
    isWaitingForInput: executionStatus === "waiting_for_input",
    hasMoreMessages,
    isLoadingMore,
    sendMessage,
    submitUserInput,
    clearMessages,
    loadMoreMessages,
    cancelExecution,
    connect,
    disconnect: () => wsManager.disconnect(),
  };
}
