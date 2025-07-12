import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useDeployment } from "./use-deployment";
import { 
  CONNECTION_STATES, 
  MESSAGE_TYPES, 
  WS_MESSAGE_TYPES, 
  DEFAULT_OPTIONS 
} from "../constants/ai-agent";

export interface AgentMessage {
  id: string;
  type: typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
  content: string;
  timestamp: Date;
  metadata?: {
    executionId?: number;
    taskUpdate?: { taskCount: number; completedTasks: number };
    toolExecution?: { name: string; status: string };
    workflowExecution?: { stage: string };
    platformEvent?: { label: string; data: any };
    platformFunction?: { name: string; result: any };
  };
}

export interface AgentConnectionState {
  status: typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];
  error?: string;
  lastConnected?: Date;
  reconnectAttempt?: number;
}

export interface UseAgentOptions {
  contextId: string;
  agentName: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enableExponentialBackoff?: boolean;
  onMessage?: (message: AgentMessage) => void;
  onConnectionChange?: (state: AgentConnectionState) => void;
  onError?: (error: Error) => void;
  messageHistory?: boolean;
  platformFunctions?: Record<string, (params: any) => Promise<any> | any>;
}

interface WebSocketMessage {
  message_id?: number;
  message_type: string;
  data: any;
}

type EventCallback = (data: any) => void;
type UnsubscribeFn = () => void;

export function useAIAgent(options: UseAgentOptions) {
  const {
    contextId,
    agentName,
    autoConnect = DEFAULT_OPTIONS.AUTO_CONNECT,
    reconnectInterval = DEFAULT_OPTIONS.RECONNECT_INTERVAL,
    maxReconnectAttempts = DEFAULT_OPTIONS.MAX_RECONNECT_ATTEMPTS,
    enableExponentialBackoff = true,
    onMessage,
    onConnectionChange,
    onError,
    messageHistory = true,
    platformFunctions = {},
  } = options;

  const { deployment } = useDeployment();
  
  // State
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [connectionState, setConnectionState] = useState<AgentConnectionState>({
    status: CONNECTION_STATES.DISCONNECTED,
  });
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState("");

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageIdCounter = useRef(0);
  const streamingMessageIdRef = useRef<string | null>(null);
  const eventListenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const messageQueueRef = useRef<Array<() => void>>([]);

  // Event system for headless operation
  const emit = useCallback((event: string, data: any) => {
    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }, []);

  const on = useCallback((event: string, callback: EventCallback): UnsubscribeFn => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    };
  }, []);

  // Message utilities
  const generateMessageId = () => 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const createMessage = (
    type: AgentMessage["type"], 
    content: string, 
    metadata?: AgentMessage["metadata"]
  ): AgentMessage => ({
    id: generateMessageId(),
    type,
    content,
    timestamp: new Date(),
    metadata,
  });

  const addMessage = useCallback((message: Omit<AgentMessage, "id" | "timestamp">) => {
    const newMessage = createMessage(message.type, message.content, message.metadata);
    
    if (messageHistory) {
      setMessages(prev => [...prev, newMessage]);
    }
    
    // Emit events for headless operation
    emit("message", newMessage);
    onMessage?.(newMessage);
    
    return newMessage;
  }, [messageHistory, emit, onMessage]);

  const updateMessage = useCallback((id: string, updates: Partial<AgentMessage>) => {
    if (messageHistory) {
      setMessages(prev =>
        prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg)
      );
    }
    
    // Emit update event
    emit("messageUpdate", { id, updates });
  }, [messageHistory, emit]);

  // Connection state management
  const updateConnectionState = useCallback((updates: Partial<AgentConnectionState>) => {
    setConnectionState(prev => {
      const newState = { ...prev, ...updates };
      onConnectionChange?.(newState);
      emit("connectionChange", newState);
      return newState;
    });
  }, [onConnectionChange, emit]);

  // WebSocket message handlers
  const handleSessionConnected = () => {
    updateConnectionState({ 
      status: CONNECTION_STATES.CONNECTED,
      lastConnected: new Date(),
      reconnectAttempt: 0,
    });
    
    addMessage({
      type: MESSAGE_TYPES.SYSTEM,
      content: "Connected to agent successfully",
    });

    // Process queued messages
    while (messageQueueRef.current.length > 0) {
      const sendFn = messageQueueRef.current.shift();
      sendFn?.();
    }

    // Fetch existing context messages
    const fetchMessage: WebSocketMessage = {
      message_id: ++messageIdCounter.current,
      message_type: WS_MESSAGE_TYPES.FETCH_CONTEXT_MESSAGES,
      data: {},
    };
    wsRef.current?.send(JSON.stringify(fetchMessage));
  };

  const handleContextMessages = (data: any) => {
    if (!Array.isArray(data)) return;
    
    data.forEach((msg: any) => {
      addMessage({
        type: msg.role === "user" ? MESSAGE_TYPES.USER : MESSAGE_TYPES.AGENT,
        content: msg.content,
        metadata: { executionId: msg.execution_id },
      });
    });
    
    emit("contextMessagesLoaded", data);
  };

  const handleMessageChunk = (chunk: string) => {
    setIsAgentTyping(false);
    
    if (!streamingMessageIdRef.current) {
      // Start new streaming message
      const newMsg = addMessage({
        type: MESSAGE_TYPES.AGENT,
        content: chunk,
      });
      streamingMessageIdRef.current = newMsg.id;
      setCurrentStreamingContent(chunk);
      emit("streamStart", { messageId: newMsg.id, chunk });
    } else {
      // Update existing streaming message
      const newContent = currentStreamingContent + chunk;
      setCurrentStreamingContent(newContent);
      updateMessage(streamingMessageIdRef.current, { content: newContent });
      emit("streamChunk", { messageId: streamingMessageIdRef.current, chunk, fullContent: newContent });
    }
  };

  const handleMetadataUpdate = (
    type: "task" | "tool" | "workflow", 
    data: any
  ) => {
    if (!streamingMessageIdRef.current) return;

    const metadata: AgentMessage["metadata"] = {};
    
    switch (type) {
      case "task":
        metadata.taskUpdate = data;
        emit("taskUpdate", data);
        break;
      case "tool":
        metadata.toolExecution = data;
        emit("toolExecution", data);
        break;
      case "workflow":
        metadata.workflowExecution = data;
        emit("workflowExecution", data);
        break;
    }

    updateMessage(streamingMessageIdRef.current, { metadata });
  };

  const handleExecutionComplete = () => {
    const messageId = streamingMessageIdRef.current;
    streamingMessageIdRef.current = null;
    setCurrentStreamingContent("");
    emit("streamEnd", { messageId });
  };

  const handleExecutionError = (error: string) => {
    const errorMessage = error || "An error occurred during execution";
    addMessage({
      type: MESSAGE_TYPES.ERROR,
      content: errorMessage,
    });
    streamingMessageIdRef.current = null;
    setCurrentStreamingContent("");
    onError?.(new Error(errorMessage));
    emit("executionError", { error: errorMessage });
  };

  const handleCloseConnection = (error?: string) => {
    if (error) {
      addMessage({
        type: MESSAGE_TYPES.ERROR,
        content: error,
      });
      onError?.(new Error(error));
    }
    wsRef.current?.close();
  };

  const handlePlatformEvent = (data: any) => {
    const { event_label, event_data } = data;
    
    // Emit platform event for external handlers
    emit("platformEvent", { eventLabel: event_label, eventData: event_data });
    
    // Add a system message about the platform event
    if (messageHistory) {
      addMessage({
        type: MESSAGE_TYPES.SYSTEM,
        content: `Platform Event: ${event_label}`,
        metadata: { platformEvent: { label: event_label, data: event_data } },
      });
    }
  };

  const handlePlatformFunction = async (data: any) => {
    const { function_name, parameters, execution_id } = data;
    
    // Check if we have a registered function
    const platformFunction = platformFunctions[function_name];
    
    if (!platformFunction) {
      // Emit event for unregistered function
      emit("platformFunctionNotFound", { functionName: function_name, parameters });
      
      // Send error result back to agent
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const errorResult = {
          error: `Platform function '${function_name}' not found`,
          functionName: function_name,
        };
        
        const message: WebSocketMessage = {
          message_id: ++messageIdCounter.current,
          message_type: WS_MESSAGE_TYPES.PLATFORM_FUNCTION_RESULT,
          data: [execution_id, errorResult],
        };
        wsRef.current.send(JSON.stringify(message));
      }
      return;
    }
    
    // Show that we're executing a platform function
    if (messageHistory) {
      addMessage({
        type: MESSAGE_TYPES.SYSTEM,
        content: `Executing platform function: ${function_name}`,
        metadata: { platformFunction: { name: function_name, parameters } },
      });
    }
    
    try {
      // Execute the client-side function
      const result = await platformFunction(parameters);
      
      // Send result back to agent
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          message_id: ++messageIdCounter.current,
          message_type: WS_MESSAGE_TYPES.PLATFORM_FUNCTION_RESULT,
          data: [execution_id, { success: true, result, functionName: function_name }],
        };
        wsRef.current.send(JSON.stringify(message));
      }
      
      // Emit success event
      emit("platformFunctionExecuted", { 
        functionName: function_name, 
        parameters, 
        result 
      });
      
      // Add success message
      if (messageHistory) {
        addMessage({
          type: MESSAGE_TYPES.SYSTEM,
          content: `Platform function '${function_name}' executed successfully`,
          metadata: { platformFunction: { name: function_name, result } },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Send error result back to agent
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const errorResult = {
          error: errorMessage,
          functionName: function_name,
        };
        
        const message: WebSocketMessage = {
          message_id: ++messageIdCounter.current,
          message_type: WS_MESSAGE_TYPES.PLATFORM_FUNCTION_RESULT,
          data: [execution_id, errorResult],
        };
        wsRef.current.send(JSON.stringify(message));
      }
      
      // Emit error event
      emit("platformFunctionError", { 
        functionName: function_name, 
        parameters, 
        error: errorMessage 
      });
      
      // Add error message
      if (messageHistory) {
        addMessage({
          type: MESSAGE_TYPES.ERROR,
          content: `Platform function '${function_name}' failed: ${errorMessage}`,
          metadata: { platformFunction: { name: function_name, error: errorMessage } },
        });
      }
    }
  };

  // WebSocket message router
  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Emit raw message event
      emit("rawMessage", message);
      
      switch (message.message_type) {
        case WS_MESSAGE_TYPES.SESSION_CONNECTED:
          handleSessionConnected();
          break;
        case WS_MESSAGE_TYPES.FETCH_CONTEXT_MESSAGES:
          handleContextMessages(message.data);
          break;
        case WS_MESSAGE_TYPES.NEW_MESSAGE_CHUNK:
          if (message.data.chunk) {
            handleMessageChunk(message.data.chunk);
          }
          break;
        case WS_MESSAGE_TYPES.EXECUTION_COMPLETE:
          handleExecutionComplete();
          break;
        case WS_MESSAGE_TYPES.TASK_UPDATE:
          handleMetadataUpdate("task", message.data);
          break;
        case WS_MESSAGE_TYPES.TOOL_EXECUTION:
          handleMetadataUpdate("tool", message.data);
          break;
        case WS_MESSAGE_TYPES.WORKFLOW_EXECUTION:
          handleMetadataUpdate("workflow", message.data);
          break;
        case WS_MESSAGE_TYPES.EXECUTION_ERROR:
          handleExecutionError(message.data.error);
          break;
        case WS_MESSAGE_TYPES.CLOSE_CONNECTION:
          handleCloseConnection(message.data.error);
          break;
        case WS_MESSAGE_TYPES.PLATFORM_EVENT:
          handlePlatformEvent(message.data);
          break;
        case WS_MESSAGE_TYPES.PLATFORM_FUNCTION:
          handlePlatformFunction(message.data);
          break;
      }
    } catch (error) {
      console.error("Failed to parse agent message:", error);
      onError?.(error as Error);
    }
  };

  // Connection management
  const getWebSocketUrl = () => {
    if (!deployment?.backend_host) return null;
    const protocol = deployment.backend_host.includes("localhost") ? "ws" : "wss";
    return `${protocol}://${deployment.backend_host}/realtime/agent`;
  };

  const sendConnectMessage = () => {
    const connectMessage: WebSocketMessage = {
      message_id: ++messageIdCounter.current,
      message_type: WS_MESSAGE_TYPES.SESSION_CONNECT,
      data: [contextId, agentName],
    };
    wsRef.current?.send(JSON.stringify(connectMessage));
  };

  const calculateReconnectDelay = () => {
    if (!enableExponentialBackoff) {
      return reconnectInterval;
    }
    // Exponential backoff: 3s, 6s, 12s, 24s, 48s...
    return Math.min(
      reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
      60000 // Max 60 seconds
    );
  };

  const scheduleReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      updateConnectionState({
        status: CONNECTION_STATES.ERROR,
        error: "Max reconnection attempts reached",
      });
      addMessage({
        type: MESSAGE_TYPES.ERROR,
        content: "Unable to connect to agent. Please refresh the page.",
      });
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = calculateReconnectDelay();
    
    updateConnectionState({
      status: CONNECTION_STATES.DISCONNECTED,
      reconnectAttempt: reconnectAttemptsRef.current,
    });
    
    addMessage({
      type: MESSAGE_TYPES.SYSTEM,
      content: `Disconnected. Reconnecting in ${delay / 1000}s... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  };

  const connect = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.error("No deployment backend host available");
      updateConnectionState({
        status: CONNECTION_STATES.ERROR,
        error: "No backend host configured",
      });
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    updateConnectionState({ status: CONNECTION_STATES.CONNECTING });

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        sendConnectMessage();
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        updateConnectionState({
          status: CONNECTION_STATES.ERROR,
          error: "Connection error occurred",
        });
        onError?.(new Error("WebSocket connection error"));
      };

      ws.onclose = () => {
        updateConnectionState({ status: CONNECTION_STATES.DISCONNECTED });
        wsRef.current = null;
        setIsAgentTyping(false);
        streamingMessageIdRef.current = null;
        setCurrentStreamingContent("");

        if (autoConnect) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      updateConnectionState({
        status: CONNECTION_STATES.ERROR,
        error: error instanceof Error ? error.message : "Failed to connect",
      });
      onError?.(error as Error);
    }
  }, [deployment, contextId, agentName, autoConnect, updateConnectionState, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateConnectionState({ status: CONNECTION_STATES.DISCONNECTED });
    reconnectAttemptsRef.current = 0;
    streamingMessageIdRef.current = null;
    setCurrentStreamingContent("");
    messageQueueRef.current = [];
  }, [updateConnectionState]);

  const sendMessage = useCallback((content: string) => {
    const send = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return false;
      }

      // Add user message
      addMessage({
        type: MESSAGE_TYPES.USER,
        content,
      });

      // Start typing indicator
      setIsAgentTyping(true);

      // Send to agent
      const message: WebSocketMessage = {
        message_id: ++messageIdCounter.current,
        message_type: WS_MESSAGE_TYPES.MESSAGE_INPUT,
        data: content,
      };
      wsRef.current.send(JSON.stringify(message));
      return true;
    };

    // If not connected, queue the message
    if (connectionState.status !== CONNECTION_STATES.CONNECTED) {
      if (connectionState.status === CONNECTION_STATES.CONNECTING) {
        // Queue message to be sent when connected
        messageQueueRef.current.push(() => send());
        addMessage({
          type: MESSAGE_TYPES.SYSTEM,
          content: "Message queued. Will be sent when connected.",
        });
      } else {
        addMessage({
          type: MESSAGE_TYPES.ERROR,
          content: "Not connected to agent. Please connect first.",
        });
      }
      return;
    }

    send();
  }, [addMessage, connectionState.status]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    emit("messagesCleared", {});
  }, [emit]);

  // Computed values
  const isConnected = connectionState.status === CONNECTION_STATES.CONNECTED;
  const isConnecting = connectionState.status === CONNECTION_STATES.CONNECTING;
  const hasError = connectionState.status === CONNECTION_STATES.ERROR;

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && deployment) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, deployment, connect, disconnect]);

  // Public API
  return {
    // State
    messages,
    connectionState,
    isAgentTyping,
    isConnected,
    isConnecting,
    hasError,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    
    // Event system for headless operation
    on,
    emit,
    
    // Utility
    queuedMessageCount: messageQueueRef.current.length,
  };
}