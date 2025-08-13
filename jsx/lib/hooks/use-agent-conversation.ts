import { useState, useRef, useCallback, useEffect } from 'react';
import { wsManager } from '../services/websocket-manager';
import { CONNECTION_STATES } from '../constants/ai-agent';
import { 
  FrontendStatus, 
  mapBackendToFrontendStatus, 
  isExecutionActive,
  FRONTEND_STATUS 
} from '../constants/execution-status';
import { useDeployment } from './use-deployment';

export interface UserInputRequest {
  question: string;
  context: string;
  input_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  options?: string[];
  default_value?: string;
  placeholder?: string;
}

export interface ConversationMessage {
  id: string | number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    type?: 'user_input_request' | 'log';
    userInputRequest?: UserInputRequest;
    messageType?: string;
  };
}

interface UseAgentConversationProps {
  contextId: string;
  agentName: string;
  platformAdapter?: {
    onPlatformEvent?: (eventName: string, eventData: unknown) => void;
    onPlatformFunction?: (functionName: string, parameters: unknown, executionId: string) => Promise<unknown>;
  };
  onUserInputRequest?: (request: UserInputRequest) => Promise<string>;
  autoConnect?: boolean;
}

export function useAgentConversation({
  contextId,
  agentName,
  platformAdapter,
  autoConnect = true,
}: UseAgentConversationProps) {
  const { deployment } = useDeployment();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<FrontendStatus>(FRONTEND_STATUS.IDLE);
  const [connectionState, setConnectionState] = useState<{ status: typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES] }>({ status: CONNECTION_STATES.DISCONNECTED });
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const oldestMessageIdRef = useRef<string | null>(null);
  
  const streamingMessageRef = useRef<{id: number, content: string} | null>(null);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.message_type) {
      case 'session_connected':
        setIsConnected(true);
        setConnectionState({ status: CONNECTION_STATES.CONNECTED });
        
        // Update execution state from backend if provided
        if (message.data?.execution_status) {
          const backendStatus = message.data.execution_status;
          const frontendStatus = mapBackendToFrontendStatus(backendStatus);
          setExecutionStatus(frontendStatus);
          setIsExecuting(isExecutionActive(frontendStatus));
        }
        
        // Request conversation history
        wsManager.send({
          message_type: { fetch_context_messages: null },
          data: {}
        });
        break;

      case 'conversation_message':
        handleConversationMessage(message.data);
        break;

      case 'user_input_request':
        handleUserInputRequest(message.data);
        break;

      case 'platform_event':
        handlePlatformEvent(message.data);
        break;

      case 'platform_function':
        console.log('[Platform Function] Received:', message.data);
        handlePlatformFunction(message.data);
        break;

      case 'execution_complete':
        setIsExecuting(false);
        setExecutionStatus(FRONTEND_STATUS.IDLE);
        streamingMessageRef.current = null;
        break;

      case 'execution_error':
        setIsExecuting(false);
        setExecutionStatus(FRONTEND_STATUS.FAILED);
        streamingMessageRef.current = null;
        break;
        
      case 'execution_cancelled':
        setIsExecuting(false);
        setExecutionStatus(FRONTEND_STATUS.IDLE);
        streamingMessageRef.current = null;
        break;
        
      case 'execution_status':
        // Handle execution status updates from backend
        const status = message.data?.status;
        if (status) {
          const frontendStatus = mapBackendToFrontendStatus(status);
          setExecutionStatus(frontendStatus);
          setIsExecuting(isExecutionActive(frontendStatus));
        }
        break;
        
      case 'fetch_context_messages':
        // Handle past conversation messages
        if (Array.isArray(message.data)) {
          const pastMessages = message.data
            .filter((msg: any) => {
              // Include user messages, agent responses, acknowledgments, user input requests, and system messages
              return msg.message_type === 'user_message' || 
                     msg.message_type === 'agent_response' ||
                     msg.message_type === 'assistant_acknowledgment' ||
                     msg.message_type === 'user_input_request' ||
                     msg.message_type === 'system_decision' ||
                     msg.message_type === 'assistant_task_execution' ||
                     msg.message_type === 'assistant_task_breakdown' ||
                     msg.message_type === 'assistant_validation' ||
                     msg.message_type === 'assistant_action_planning' ||
                     msg.message_type === 'context_results';
            })
            .map((msg: any) => {
              let content = '';
              let metadata = undefined;
              
              if (msg.message_type === 'user_message') {
                content = msg.content?.message || '';
              } else if (msg.message_type === 'agent_response') {
                content = msg.content?.response || '';
              } else if (msg.message_type === 'assistant_acknowledgment') {
                content = msg.content?.acknowledgment_message || '';
              } else if (msg.message_type === 'user_input_request') {
                content = msg.content?.question || '';
                metadata = {
                  type: 'user_input_request',
                  userInputRequest: {
                    question: msg.content?.question || '',
                    context: msg.content?.context || '',
                    input_type: msg.content?.input_type || 'text',
                    options: msg.content?.options || msg.content?.suggestions || [],
                    default_value: msg.content?.default_value || '',
                    placeholder: msg.content?.placeholder || ''
                  }
                };
              }
              
              // Handle system/log messages
              if (msg.message_type === 'system_decision' ||
                  msg.message_type === 'assistant_task_execution' ||
                  msg.message_type === 'assistant_task_breakdown' ||
                  msg.message_type === 'assistant_validation' ||
                  msg.message_type === 'assistant_action_planning' ||
                  msg.message_type === 'context_results') {
                
                let logContent = '';
                
                if (msg.message_type === 'system_decision') {
                  logContent = 'Reasoning';
                } else if (msg.message_type === 'assistant_task_execution') {
                  if (msg.content?.task_execution?.status === 'completed') {
                    logContent = 'Task execution completed';
                  } else if (msg.content?.task_execution?.approach) {
                    logContent = msg.content.task_execution.approach;
                  } else {
                    logContent = 'Executing task';
                  }
                } else if (msg.message_type === 'assistant_task_breakdown') {
                  if (msg.content?.task_breakdown?.total_tasks) {
                    logContent = `Identified ${msg.content.task_breakdown.total_tasks} tasks`;
                  } else {
                    logContent = 'Planning tasks';
                  }
                } else if (msg.message_type === 'assistant_validation') {
                  logContent = 'Validated results';
                } else if (msg.message_type === 'assistant_action_planning') {
                  if (msg.content?.task_execution?.total_tasks) {
                    logContent = `Planned ${msg.content.task_execution.total_tasks} tasks`;
                  } else if (msg.content?.task_execution?.tasks?.length) {
                    logContent = `Planned ${msg.content.task_execution.tasks.length} tasks`;
                  } else {
                    logContent = 'Planning actions';
                  }
                } else if (msg.message_type === 'context_results') {
                  logContent = `Found ${msg.content?.result_count || 0} results`;
                }
                
                content = logContent;
                metadata = { type: 'log', messageType: msg.message_type };
              }
              
              return {
                id: msg.id,
                role: msg.message_type === 'user_message' ? 'user' : msg.message_type === 'user_input_request' ? 'system' : 'assistant',
                content,
                timestamp: new Date(msg.created_at || Date.now()),
                metadata
              };
            })
            .filter((msg: any) => msg.content || msg.metadata) // Include messages with content or metadata
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
          
          // If this is a paginated response, prepend to existing messages
          if (message.data.is_paginated) {
            setMessages(prev => [...pastMessages, ...prev]);
            setHasMoreMessages(pastMessages.length >= 50); // Assuming 50 messages per page
          } else {
            setMessages(pastMessages);
            
            // Check if the last message is a user_input_request to restore waiting state
            if (pastMessages.length > 0) {
              const lastMessage = pastMessages[pastMessages.length - 1];
              if (lastMessage.metadata?.type === 'user_input_request') {
                setExecutionStatus(FRONTEND_STATUS.WAITING_FOR_INPUT);
              }
            }
          }
          
          setIsLoadingMore(false);
        }
        break;
    }
  }, [pendingMessage]);

  // Handle conversation messages
  const handleConversationMessage = useCallback((data: any) => {
    const { id, message_type, content } = data;

    // Handle system/log messages
    if (message_type === 'system_decision' ||
        message_type === 'assistant_task_execution' ||
        message_type === 'assistant_task_breakdown' ||
        message_type === 'assistant_validation' ||
        message_type === 'assistant_action_planning' ||
        message_type === 'context_results') {
      
      // Clear pending message when system starts processing
      setPendingMessage(null);
      
      let logContent = '';
      
      if (message_type === 'system_decision') {
        logContent = 'Reasoning';
      } else if (message_type === 'assistant_task_execution') {
        if (content.task_execution?.status === 'completed') {
          logContent = 'Task execution completed';
        } else if (content.task_execution?.approach) {
          logContent = content.task_execution.approach;
        } else {
          logContent = 'Executing task';
        }
      } else if (message_type === 'assistant_task_breakdown') {
        if (content.task_breakdown?.total_tasks) {
          logContent = `Identified ${content.task_breakdown.total_tasks} tasks`;
        } else {
          logContent = 'Planning tasks';
        }
      } else if (message_type === 'assistant_validation') {
        logContent = 'Validated results';
      } else if (message_type === 'assistant_action_planning') {
        if (content.task_execution?.total_tasks) {
          logContent = `Planned ${content.task_execution.total_tasks} tasks`;
        } else if (content.task_execution?.tasks?.length) {
          logContent = `Planned ${content.task_execution.tasks.length} tasks`;
        } else {
          logContent = 'Planning actions';
        }
      } else if (message_type === 'context_results') {
        logContent = `Found ${content.result_count || 0} results`;
      }
      
      if (logContent) {
        setMessages(prev => [...prev, {
          id,
          role: 'system',
          content: logContent,
          timestamp: new Date(),
          metadata: {
            type: 'log',
            messageType: message_type
          }
        }]);
      }
      return;
    }

    if (message_type === 'user_message') {
      // Clear pending message when we receive user message from backend
      setPendingMessage(null);
      setMessages(prev => [...prev, {
        id,
        role: 'user',
        content: content.message || '',
        timestamp: new Date(),
      }]);
    } else if (message_type === 'agent_response') {
      // Agent response indicates execution is complete
      setPendingMessage(null); // Clear any pending message
      setIsExecuting(false);
      setExecutionStatus(FRONTEND_STATUS.IDLE);
      streamingMessageRef.current = null;
      
      // Add the final response message
      setMessages(prev => [...prev, {
        id,
        role: 'assistant',
        content: content.response || '',
        timestamp: new Date(),
        isStreaming: false,
      }]);
    } else if (message_type === 'assistant_acknowledgment') {
      // Clear pending message when agent acknowledges
      setPendingMessage(null);
      // Handle acknowledgment messages
      setMessages(prev => [...prev, {
        id,
        role: 'assistant',
        content: content.acknowledgment_message || 'I understand your request.',
        timestamp: new Date(),
      }]);
    } else if (message_type === 'assistant_ideation' || 
               message_type === 'assistant_action_planning' ||
               message_type === 'assistant_task_execution' ||
               message_type === 'assistant_validation' ||
               message_type === 'assistant_context_gathering' ||
               message_type === 'assistant_task_breakdown') {
      // Handle various assistant message types
      let messageContent = '';
      
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
      
      setMessages(prev => [...prev, {
        id,
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
      }]);
    } else if (message_type === 'user_input_request') {
      // Handle user input request from conversation messages
      const inputRequest = {
        question: content.question || "Please provide additional information",
        context: content.context || "",
        input_type: content.input_type || 'text',
        options: content.options || content.suggestions || [],
        default_value: content.default_value || "",
        placeholder: content.placeholder || ""
      };
      
      setExecutionStatus('waiting_for_input');
      
      // Add as a system message with metadata for the component
      setMessages(prev => [...prev, {
        id,
        role: 'system',
        content: inputRequest.question,
        timestamp: new Date(),
        metadata: {
          type: 'user_input_request',
          userInputRequest: inputRequest
        }
      }]);
    }
  }, [setPendingMessage]);

  // Handle user input requests
  const handleUserInputRequest = useCallback(async (data: UserInputRequest) => {
    setExecutionStatus('waiting_for_input');
    
    // Add the user input request as a system message
    const requestId = `input-request-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: requestId,
      role: 'system',
      content: data.question,
      timestamp: new Date(),
      metadata: {
        type: 'user_input_request',
        userInputRequest: data
      }
    }]);
  }, []);

  // Handle platform events
  const handlePlatformEvent = useCallback((data: any) => {
    const { event_label, event_data } = data;
    if (platformAdapter?.onPlatformEvent) {
      platformAdapter.onPlatformEvent(event_label, event_data);
    }
  }, [platformAdapter]);

  // Handle platform function calls
  const handlePlatformFunction = useCallback(async (data: any) => {
    const { function_name, function_data } = data;
    const { parameters, execution_id } = function_data;
    
    console.log('[Platform Function] Processing:', {
      function_name,
      execution_id,
      parameters
    });
    
    if (!platformAdapter?.onPlatformFunction) {
      console.log('[Platform Function] No handler registered, sending error');
      wsManager.send({
        message_type: {
          platform_function_result: [execution_id, {
            error: `No platform function handler registered`
          }]
        },
        data: {}
      });
      return;
    }

    try {
      console.log('[Platform Function] Calling handler...');
      const result = await platformAdapter.onPlatformFunction(function_name, parameters, execution_id);
      console.log('[Platform Function] Handler result:', result);
      
      const message = {
        message_type: {
          platform_function_result: [execution_id, result]
        },
        data: {}
      };
      console.log('[Platform Function] Sending result back:', message);
      wsManager.send(message);
    } catch (error) {
      console.error('[Platform Function] Handler error:', error);
      wsManager.send({
        message_type: {
          platform_function_result: [execution_id, {
            error: error instanceof Error ? error.message : 'Function execution failed',
            stack: error instanceof Error ? error.stack : undefined
          }]
        },
        data: {}
      });
    }
  }, [platformAdapter]);

  // Connection management
  const connect = useCallback(() => {
    // Parse the backend host URL and construct WebSocket URL
    if (!deployment) throw new Error("deployment nor loaded");
    const backendUrl = new URL(deployment.backend_host);
    const wsUrl = `wss://${backendUrl.host}/realtime/agent`;
    
    setConnectionState({ status: CONNECTION_STATES.CONNECTING });
    
    // Subscribe to messages
    const unsubscribe = wsManager.onMessage(handleWebSocketMessage);
    
    // Subscribe to connection state
    const unsubConnection = wsManager.onConnectionStateChange((state) => {
      setConnectionState({
        status: state.isConnected 
          ? CONNECTION_STATES.CONNECTED 
          : state.error 
            ? CONNECTION_STATES.ERROR 
            : CONNECTION_STATES.DISCONNECTED
      });
      
      if (state.isConnected && !isConnected) {
        // Send session connect
        wsManager.send({
          message_type: { session_connect: [contextId, agentName] },
          data: {}
        });
      }
    });

    wsManager.connect(wsUrl);

    return () => {
      unsubscribe();
      unsubConnection();
      // Don't disconnect the shared WebSocket connection
      // wsManager.disconnect();
    };
  }, [contextId, agentName, isConnected, handleWebSocketMessage, deployment]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      const cleanup = connect();
      return cleanup;
    }
  }, [autoConnect, connect]);

  // Send user message
  const sendMessage = useCallback((content: string) => {
    if (!isConnected) return;

    // Set pending message to show immediately
    setPendingMessage(content);
    setIsExecuting(true);
    setExecutionStatus(FRONTEND_STATUS.STARTING);
    
    wsManager.send({
      message_type: { message_input: content },
      data: {}
    });
  }, [isConnected]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    streamingMessageRef.current = null;
  }, []);

  // Submit user input response
  const submitUserInput = useCallback((value: string) => {
    if (!isConnected || executionStatus !== FRONTEND_STATUS.WAITING_FOR_INPUT) return;
    
    // Send the response using the dedicated user input response type
    wsManager.send({
      message_type: { user_input_response: value },
      data: {}
    });
    
    // Update status back to running
    setExecutionStatus(FRONTEND_STATUS.RUNNING);
  }, [isConnected, executionStatus]);
  
  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!isConnected || isLoadingMore || !hasMoreMessages || !oldestMessageIdRef.current) return;
    
    setIsLoadingMore(true);
    
    // Request more messages before the oldest one
    wsManager.send({
      message_type: { 
        fetch_context_messages: {
          before_id: oldestMessageIdRef.current,
          limit: 50
        }
      },
      data: { is_paginated: true }
    });
  }, [isConnected, isLoadingMore, hasMoreMessages]);
  
  // Cancel current execution
  const cancelExecution = useCallback(() => {
    if (!isConnected || !isExecuting) return;
    
    wsManager.send({
      message_type: { cancel_execution: null },
      data: {}
    });
    
    // Optimistically update state
    setIsExecuting(false);
    setExecutionStatus('idle');
  }, [isConnected, isExecuting]);

  return {
    messages,
    pendingMessage,
    connectionState,
    isConnected,
    isExecuting,
    executionStatus,
    isWaitingForInput: executionStatus === 'waiting_for_input',
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