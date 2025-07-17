import { EventEmitter } from "../utils/event-emitter";
import { wsManager } from "./websocket-manager";
import {
  CONNECTION_STATES,
  MESSAGE_TYPES,
  WS_MESSAGE_TYPES,
} from "../constants/ai-agent";

export interface AIAgentMessage {
  id: string | number; // Backend snowflake ID or temporary frontend ID for user messages
  type: (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
  content: string;
  timestamp: Date;
  metadata?: {
    executionId?: number;
    taskUpdate?: { taskCount: number; completedTasks: number };
    toolExecution?: { name: string; status: string };
    workflowExecution?: { stage: string };
    platformEvent?: { label: string; data: any };
    platformFunction?: {
      name: string;
      result?: any;
      parameters?: any;
      error?: string;
    };
    hasError?: boolean;
    agentMessageType?: string;
  };
}

export interface AgentSession {
  contextId: string;
  agentName: string;
  messages: AIAgentMessage[];
  messageIdMap: Map<string | number, number>; // Maps backend ID to array index
  tempMessageMap: Map<string, string | number>; // Maps temp content hash to temp ID for matching
  isTyping: boolean;
  connectionState: {
    status: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
    error?: string;
    lastConnected?: Date;
  };
  currentStreamingMessageId?: string | number;
  currentStreamingContent?: string;
}

interface WebSocketMessage {
  message_id?: number;
  message_type: string | Record<string, any>;
  data: any;
}

type PlatformFunction = (params: any) => Promise<any> | any;

class AIAgentManager extends EventEmitter {
  private static instance: AIAgentManager;
  private sessions: Map<string, AgentSession> = new Map();
  private activeSessionKey: string | null = null;
  private messageIdCounter = 0;
  private platformFunctions: Map<string, PlatformFunction> = new Map();
  private wsUnsubscribers: Map<string, (() => void)[]> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): AIAgentManager {
    if (!AIAgentManager.instance) {
      AIAgentManager.instance = new AIAgentManager();
    }
    return AIAgentManager.instance;
  }

  // Session Management
  createSession(contextId: string, agentName: string): string {
    const sessionKey = `${contextId}-${agentName}`;

    if (!this.sessions.has(sessionKey)) {
      this.sessions.set(sessionKey, {
        contextId,
        agentName,
        messages: [],
        messageIdMap: new Map(),
        tempMessageMap: new Map(),
        isTyping: false,
        connectionState: {
          status: CONNECTION_STATES.DISCONNECTED,
        },
      });
    }

    return sessionKey;
  }

  getSession(sessionKey: string): AgentSession | null {
    return this.sessions.get(sessionKey) || null;
  }

  setActiveSession(sessionKey: string) {
    this.activeSessionKey = sessionKey;
    wsManager.setCurrentSession(sessionKey);
  }

  // Connection Management
  async connect(sessionKey: string, wsUrl: string): Promise<void> {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      throw new Error(`Session ${sessionKey} not found`);
    }

    // Set this as the active session
    this.setActiveSession(sessionKey);

    // Set up WebSocket subscriptions for this session
    const unsubscribers: (() => void)[] = [];

    // Subscribe to messages
    const unsubMessage = wsManager.onMessage((message) => {
      if (this.activeSessionKey === sessionKey) {
        this.handleWebSocketMessage(sessionKey, message);
      }
    });
    unsubscribers.push(unsubMessage);

    // Subscribe to connection state
    const unsubConnection = wsManager.onConnectionStateChange((state) => {
      console.log(
        "Connection state changed:",
        state,
        "activeSessionKey:",
        this.activeSessionKey,
        "sessionKey:",
        sessionKey,
      );

      if (this.activeSessionKey === sessionKey) {
        // Get current session state, not the stale one from closure
        const currentSession = this.sessions.get(sessionKey);
        if (!currentSession) return;

        const wasConnected =
          currentSession.connectionState.status === CONNECTION_STATES.CONNECTED;

        this.updateSessionConnectionState(sessionKey, {
          status: state.isConnected
            ? CONNECTION_STATES.CONNECTED
            : CONNECTION_STATES.DISCONNECTED,
          error: state.error,
        });

        if (state.isConnected && !wasConnected) {
          console.log("Newly connected, sending session connect");
          // Send session connect message
          this.sendSessionConnect(sessionKey);
        }
      } else {
        console.log("Skipping connection state change - not active session");
      }
    });
    unsubscribers.push(unsubConnection);

    this.wsUnsubscribers.set(sessionKey, unsubscribers);

    // Update connection state
    this.updateSessionConnectionState(sessionKey, {
      status: CONNECTION_STATES.CONNECTING,
    });

    // Connect WebSocket
    console.log("Connecting WebSocket for session:", sessionKey, "url:", wsUrl);
    wsManager.connect(wsUrl);

    // If already connected, send session connect
    if (wsManager.isConnected()) {
      console.log(
        "WebSocket already connected, sending session connect immediately",
      );
      this.sendSessionConnect(sessionKey);
    } else {
      console.log(
        "WebSocket not yet connected, will send session connect on connection",
      );
    }
  }

  disconnect(sessionKey: string) {
    // Clean up subscriptions
    const unsubscribers = this.wsUnsubscribers.get(sessionKey);
    if (unsubscribers) {
      unsubscribers.forEach((unsub) => unsub());
      this.wsUnsubscribers.delete(sessionKey);
    }

    // Update session state
    this.updateSessionConnectionState(sessionKey, {
      status: CONNECTION_STATES.DISCONNECTED,
    });
  }

  // Message Handling
  sendMessage(sessionKey: string, content: string) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    if (!wsManager.isConnected()) {
      throw new Error("Not connected to agent");
    }

    // Add user message with temporary ID
    const tempMessage = this.addMessage(sessionKey, {
      type: MESSAGE_TYPES.USER,
      content,
    });

    // Store a mapping from content to temp ID for later matching
    // We'll use content as key since it's unique enough for user messages
    const contentKey = `user:${content}`;
    session.tempMessageMap.set(contentKey, tempMessage.id);

    // Start typing indicator
    this.updateSession(sessionKey, { isTyping: true });

    // Send to agent
    const message: WebSocketMessage = {
      message_id: ++this.messageIdCounter,
      message_type: { message_input: content },
      data: {},
    };

    wsManager.send(message);
  }

  // Platform Functions
  registerPlatformFunction(name: string, fn: PlatformFunction) {
    this.platformFunctions.set(name, fn);
  }

  unregisterPlatformFunction(name: string) {
    this.platformFunctions.delete(name);
  }

  // Private Methods
  private sendSessionConnect(sessionKey: string) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    console.log(
      "Sending session connect:",
      session.contextId,
      session.agentName,
    );

    const message: WebSocketMessage = {
      message_id: ++this.messageIdCounter,
      message_type: {
        session_connect: [session.contextId, session.agentName],
      },
      data: {},
    };

    wsManager.send(message);
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addMessage(
    sessionKey: string,
    message: Omit<AIAgentMessage, "id" | "timestamp"> & {
      id?: string | number;
    },
  ): AIAgentMessage {
    const session = this.sessions.get(sessionKey);
    if (!session) throw new Error(`Session ${sessionKey} not found`);

    const messageId = message.id || this.generateMessageId();

    // Check if message already exists using the ID map
    if (session.messageIdMap.has(messageId)) {
      const existingIndex = session.messageIdMap.get(messageId)!;

      // Update the existing message
      const updatedMessage = {
        ...session.messages[existingIndex],
        ...message,
        id: messageId,
        timestamp: new Date(),
      };

      session.messages[existingIndex] = updatedMessage;

      console.log(`Updated existing message with ID ${messageId}`);
      this.emit(`session:${sessionKey}:messageUpdate`, {
        id: messageId,
        updates: updatedMessage,
      });
      this.emit(`session:${sessionKey}:update`, session);

      return updatedMessage;
    }

    // Create new message
    const newMessage: AIAgentMessage = {
      timestamp: new Date(),
      ...message,
      id: messageId,
    };

    // Add to messages array and update the ID map
    const newIndex = session.messages.length;
    session.messages.push(newMessage);
    session.messageIdMap.set(messageId, newIndex);

    this.emit(`session:${sessionKey}:message`, newMessage);
    this.emit(`session:${sessionKey}:update`, session);

    return newMessage;
  }

  private updateMessage(
    sessionKey: string,
    messageId: string | number,
    updates: Partial<AIAgentMessage>,
  ) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    const messageIndex = session.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    session.messages[messageIndex] = {
      ...session.messages[messageIndex],
      ...updates,
    };

    this.emit(`session:${sessionKey}:messageUpdate`, {
      id: messageId,
      updates,
    });
    this.emit(`session:${sessionKey}:update`, session);
  }

  private updateSession(sessionKey: string, updates: Partial<AgentSession>) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    Object.assign(session, updates);
    this.emit(`session:${sessionKey}:update`, session);
  }

  private updateSessionConnectionState(
    sessionKey: string,
    updates: Partial<AgentSession["connectionState"]>,
  ) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    session.connectionState = {
      ...session.connectionState,
      ...updates,
      lastConnected:
        updates.status === CONNECTION_STATES.CONNECTED
          ? new Date()
          : session.connectionState.lastConnected,
    };

    this.emit(
      `session:${sessionKey}:connectionChange`,
      session.connectionState,
    );
    this.emit(`session:${sessionKey}:update`, session);
  }

  private handleWebSocketMessage(
    sessionKey: string,
    message: WebSocketMessage,
  ) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    console.log("Handling WebSocket message:", message.message_type, message);

    try {
      switch (message.message_type) {
        case WS_MESSAGE_TYPES.SESSION_CONNECTED:
          this.handleSessionConnected(sessionKey);
          break;
        case WS_MESSAGE_TYPES.FETCH_CONTEXT_MESSAGES:
          this.handleContextMessages(sessionKey, message.data);
          break;
        case WS_MESSAGE_TYPES.CONVERSATION_MESSAGE:
          this.handleConversationMessage(sessionKey, message.data);
          break;
        case WS_MESSAGE_TYPES.NEW_MESSAGE_CHUNK:
          if (message.data.chunk) {
            this.handleMessageChunk(sessionKey, message.data.chunk);
          }
          break;
        case WS_MESSAGE_TYPES.EXECUTION_COMPLETE:
          this.handleExecutionComplete(sessionKey);
          break;
        case WS_MESSAGE_TYPES.TASK_UPDATE:
          this.handleMetadataUpdate(sessionKey, "task", message.data);
          break;
        case WS_MESSAGE_TYPES.TOOL_EXECUTION:
          this.handleMetadataUpdate(sessionKey, "tool", message.data);
          break;
        case WS_MESSAGE_TYPES.WORKFLOW_EXECUTION:
          this.handleMetadataUpdate(sessionKey, "workflow", message.data);
          break;
        case WS_MESSAGE_TYPES.EXECUTION_ERROR:
          this.handleExecutionError(sessionKey, message.data.error);
          break;
        case WS_MESSAGE_TYPES.CLOSE_CONNECTION:
          this.handleCloseConnection(sessionKey, message.data.error);
          break;
        case WS_MESSAGE_TYPES.PLATFORM_EVENT:
          this.handlePlatformEvent(sessionKey, message.data);
          break;
        case WS_MESSAGE_TYPES.PLATFORM_FUNCTION:
          this.handlePlatformFunction(sessionKey, message.data);
          break;
        case WS_MESSAGE_TYPES.AGENT_MESSAGE:
          this.handleAgentMessage(sessionKey, message.data);
          break;
      }
    } catch (error) {
      console.error("Failed to handle WebSocket message:", error);
      this.emit(`session:${sessionKey}:error`, error);
    }
  }

  private handleSessionConnected(sessionKey: string) {
    this.updateSessionConnectionState(sessionKey, {
      status: CONNECTION_STATES.CONNECTED,
    });

    // Fetch existing context messages
    const message: WebSocketMessage = {
      message_id: ++this.messageIdCounter,
      message_type: "fetch_context_messages",
      data: {},
    };
    wsManager.send(message);
  }

  private handleContextMessages(sessionKey: string, data: any) {
    if (!Array.isArray(data)) return;

    const session = this.sessions.get(sessionKey);
    if (!session) return;

    // Sort messages by ID
    const sortedMessages = [...data].sort((a, b) => {
      const aId = typeof a.id === "string" ? parseInt(a.id) || 0 : a.id;
      const bId = typeof b.id === "string" ? parseInt(b.id) || 0 : b.id;
      return aId - bId;
    });

    // Process each message - the ID map will handle deduplication
    sortedMessages.forEach((msg) =>
      this.handleConversationMessage(sessionKey, msg),
    );

    this.emit(`session:${sessionKey}:contextLoaded`, data);
  }

  private handleConversationMessage(sessionKey: string, data: any) {
    const { id, message_type, content } = data;
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    // Turn off typing indicator
    this.updateSession(sessionKey, { isTyping: false });

    switch (message_type) {
      case "user_message":
        const userContent = content.message || "";
        const contentKey = `user:${userContent}`;

        // Check if this is a user message we sent from frontend
        if (session.tempMessageMap.has(contentKey)) {
          const tempId = session.tempMessageMap.get(contentKey)!;
          const tempIndex = session.messageIdMap.get(tempId);

          if (tempIndex !== undefined) {
            // Update the existing message with the backend ID
            const existingMessage = session.messages[tempIndex];
            session.messages[tempIndex] = {
              ...existingMessage,
              id: id, // Replace temp ID with backend ID
            };

            // Update the ID map
            session.messageIdMap.delete(tempId);
            session.messageIdMap.set(id, tempIndex);

            // Clean up temp map
            session.tempMessageMap.delete(contentKey);

            console.log(`Replaced temp ID ${tempId} with backend ID ${id}`);
            this.emit(`session:${sessionKey}:messageUpdate`, {
              id: id,
              updates: session.messages[tempIndex],
            });
            this.emit(`session:${sessionKey}:update`, session);
          }
        } else {
          // This is a message from backend we haven't seen
          this.addMessage(sessionKey, {
            id,
            type: MESSAGE_TYPES.USER,
            content: userContent,
          });
        }
        break;

      case "assistant_acknowledgment":
        this.addMessage(sessionKey, {
          id,
          type: MESSAGE_TYPES.AGENT,
          content: content.acknowledgment_message || "",
        });
        break;

      case "assistant_ideation":
        let ideationMessage =
          content.reasoning_summary || "Planning approach...";
        let ideationType: (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES] =
          MESSAGE_TYPES.REASONING;
          
        if (content.requires_user_input && content.user_input_request) {
          ideationMessage = `❓ Need your input: ${content.user_input_request}`;
          ideationType = MESSAGE_TYPES.SYSTEM;
        } else if (content.context_search_request) {
          ideationMessage = `🔍 Searching: "${content.context_search_request}"`;
          ideationType = MESSAGE_TYPES.CONTEXT;
        } else {
          ideationMessage = `🤔 Reasoning: ${ideationMessage}`;
        }
        
        this.addMessage(sessionKey, {
          id,
          type: ideationType,
          content: ideationMessage,
        });
        break;

      case "assistant_action_planning":
        let planningMessage = "Planning actions...";
        let planningType: (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES] =
          MESSAGE_TYPES.PLANNING;

        if (content.task_execution && content.task_execution.approach) {
          planningMessage = `📋 Planning: ${content.task_execution.approach}`;
          
          // Show just the number of actions planned
          if (content.task_execution.actions?.action?.length > 0) {
            const actionCount = content.task_execution.actions.action.length;
            planningMessage += ` (${actionCount} step${actionCount > 1 ? 's' : ''})`;
          }
        } else if (content.execution_status === "blocked") {
          planningMessage = `⏸️ Planning blocked: ${content.blocking_reason || "waiting for input"}`;
          planningType = MESSAGE_TYPES.SYSTEM;
        } else if (content.execution_status === "cannot_execute") {
          planningMessage = "❌ Cannot plan execution";
          planningType = MESSAGE_TYPES.ERROR;
        }

        this.addMessage(sessionKey, {
          id,
          type: planningType,
          content: planningMessage,
        });
        break;

      case "assistant_task_execution":
        let statusMessage = "Running task...";
        let executionType: (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES] =
          MESSAGE_TYPES.EXECUTING;

        if (content.task_execution && content.task_execution.approach) {
          // Check if it's a task breakdown message
          if (content.task_execution.approach.includes("Breaking down tasks")) {
            statusMessage = `🔨 Breaking down into executable steps...`;
            executionType = MESSAGE_TYPES.PLANNING;
          } else {
            // Extract meaningful content from the approach/action
            const taskExec = content.task_execution;
            
            // If we have an action with details, show what we're doing
            if (taskExec.action?.details?.description) {
              statusMessage = `⚡ Working: ${taskExec.action.details.description}`;
              executionType = MESSAGE_TYPES.EXECUTING;
            } else if (taskExec.approach) {
              // Extract key action from approach (first sentence or key phrase)
              const approachParts = taskExec.approach.split(/[.!]/);
              const keyAction = approachParts[0].trim();
              if (keyAction.length > 0 && keyAction.length < 100) {
                statusMessage = `⚡ Working: ${keyAction}`;
              } else {
                statusMessage = `⚡ Working on your request`;
              }
              executionType = MESSAGE_TYPES.EXECUTING;
            } else {
              statusMessage = `⚡ Working on your request`;
              executionType = MESSAGE_TYPES.EXECUTING;
            }
          }
          
          // Show action result if it's an actual execution result
          if (content.task_execution.action && content.task_execution.result) {
            const action = content.task_execution.action;
            const result = content.task_execution.result;
            
            // Check for errors first
            if (typeof result === 'object' && result !== null && result.error) {
              statusMessage = `❌ ${result.error}`;
              executionType = MESSAGE_TYPES.ERROR;
            } else if (action.details?.description) {
              // Show what was completed
              statusMessage = `✅ ${action.details.description}`;
              executionType = MESSAGE_TYPES.COMPLETED;
              
              // Add brief result info if available
              if (typeof result === 'object' && result !== null) {
                // Look for key result data (IP address, location, etc)
                if (result.ip) {
                  statusMessage += ` - Found: ${result.ip}`;
                } else if (result.data?.ip) {
                  statusMessage += ` - Found: ${result.data.ip}`;
                } else if (result.location) {
                  statusMessage += ` - ${result.location}`;
                }
              }
            }
          }
        } else if (content.execution_status === "blocked") {
          statusMessage = `⏸️ Blocked: ${content.blocking_reason || "waiting for input"}`;
          executionType = MESSAGE_TYPES.SYSTEM;
        } else if (content.execution_status === "cannot_execute") {
          statusMessage = "❌ Cannot execute task";
          executionType = MESSAGE_TYPES.ERROR;
        } else {
          statusMessage = "⚡ Working on your request";
        }

        this.addMessage(sessionKey, {
          id,
          type: executionType,
          content: statusMessage,
        });
        break;

      case "assistant_validation":
        // Always show validation as a system message
        let validationMessage = "Validating results...";
        let validationType: (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES] =
          MESSAGE_TYPES.VALIDATING;

        if (content.loop_decision === "continue") {
          validationMessage = "🔄 Validating: Need to retry";
          
          // Show brief next focus
          if (content.next_iteration_focus) {
            validationMessage += ` - ${content.next_iteration_focus}`;
          }
        } else if (content.loop_decision === "complete") {
          validationMessage = "✅ Task completed successfully";
          validationType = MESSAGE_TYPES.COMPLETED;
          // Don't show the summary here - it will be sent as a separate agent_response message
        } else if (content.loop_decision === "abortunresolvable" || content.loop_decision === "abort_unresolvable") {
          validationMessage = "⚠️ Cannot proceed";
          validationType = MESSAGE_TYPES.ERROR;
          
          // Show brief reason
          if (content.unresolvable_error_details) {
            validationMessage += ` - ${content.unresolvable_error_details}`;
          }
        } else {
          validationMessage = "🔍 Validating...";
        }

        this.addMessage(sessionKey, {
          id,
          type: validationType,
          content: validationMessage,
        });
        break;

      case "agent_response":
        this.addMessage(sessionKey, {
          id,
          type: MESSAGE_TYPES.AGENT,
          content: content.response || "",
        });
        break;

      case "assistant_context_gathering":
        let contextMessage = "Gathering context...";
        if (content.strategic_synthesis) {
          contextMessage = `📚 Context: ${content.strategic_synthesis}`;
        } else {
          contextMessage = "📚 Context: Gathering relevant information...";
        }
        this.addMessage(sessionKey, {
          id,
          type: MESSAGE_TYPES.CONTEXT,
          content: contextMessage,
        });
        break;

      case "assistant_task_breakdown":
        let breakdownMessage = "Breaking down tasks...";
        if (content.task_breakdown && content.task_breakdown.total_tasks) {
          breakdownMessage = `📋 Planning: ${content.task_breakdown.total_tasks} tasks identified`;
        } else {
          breakdownMessage = "📋 Planning: Breaking down into tasks...";
        }
        this.addMessage(sessionKey, {
          id,
          type: MESSAGE_TYPES.PLANNING,
          content: breakdownMessage,
        });
        break;

      case "context_results":
        let contextResultsMessage = "Found relevant information...";
        if (content.result_count !== undefined) {
          if (content.result_count === 0) {
            contextResultsMessage = `🔍 No results found for "${content.query}"`;
          } else {
            contextResultsMessage = `🔍 Found ${content.result_count} result${content.result_count === 1 ? '' : 's'} for "${content.query}"`;
          }
        } else {
          contextResultsMessage = `🔍 Searched for "${content.query}"`;
        }
        this.addMessage(sessionKey, {
          id,
          type: MESSAGE_TYPES.CONTEXT,
          content: contextResultsMessage,
        });
        break;

      case "system_decision":
        // Internal system decision - don't show to user
        console.log("System decision:", content);
        // Don't add this as a message
        return;

      default:
        console.warn("Unknown conversation message type:", message_type);
        // Try to extract meaningful content
        let defaultMessage = `[${message_type}]`;
        if (content) {
          if (typeof content === "string") {
            defaultMessage = content;
          } else if (content.message) {
            defaultMessage = content.message;
          } else if (content.summary) {
            defaultMessage = content.summary;
          } else if (content.description) {
            defaultMessage = content.description;
          } else {
            defaultMessage = `[${message_type}] ${JSON.stringify(content, null, 2)}`;
          }
        }
        this.addMessage(sessionKey, {
          id,
          type: MESSAGE_TYPES.AGENT,
          content: defaultMessage,
        });
    }
  }

  private handleMessageChunk(sessionKey: string, chunk: string) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    this.updateSession(sessionKey, { isTyping: false });

    if (!session.currentStreamingMessageId) {
      // Start new streaming message
      const newMsg = this.addMessage(sessionKey, {
        type: MESSAGE_TYPES.AGENT,
        content: chunk,
      });
      session.currentStreamingMessageId = newMsg.id;
      session.currentStreamingContent = chunk;
    } else {
      // Update existing streaming message
      const newContent = (session.currentStreamingContent || "") + chunk;
      session.currentStreamingContent = newContent;
      this.updateMessage(sessionKey, session.currentStreamingMessageId, {
        content: newContent,
      });
    }
  }

  private handleMetadataUpdate(
    sessionKey: string,
    type: "task" | "tool" | "workflow",
    data: any,
  ) {
    const session = this.sessions.get(sessionKey);
    if (!session || !session.currentStreamingMessageId) return;

    const metadata: AIAgentMessage["metadata"] = {};
    switch (type) {
      case "task":
        metadata.taskUpdate = data;
        break;
      case "tool":
        metadata.toolExecution = data;
        break;
      case "workflow":
        metadata.workflowExecution = data;
        break;
    }

    this.updateMessage(sessionKey, session.currentStreamingMessageId, {
      metadata,
    });
  }

  private handleExecutionComplete(sessionKey: string) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    session.currentStreamingMessageId = undefined;
    session.currentStreamingContent = undefined;
    this.emit(`session:${sessionKey}:update`, session);
  }

  private handleExecutionError(sessionKey: string, error: string) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    const errorMessage = error || "An error occurred during execution";
    this.addMessage(sessionKey, {
      type: MESSAGE_TYPES.ERROR,
      content: errorMessage,
    });

    session.currentStreamingMessageId = undefined;
    session.currentStreamingContent = undefined;
    this.emit(`session:${sessionKey}:error`, new Error(errorMessage));
  }

  private handleCloseConnection(sessionKey: string, error?: string) {
    if (error) {
      this.addMessage(sessionKey, {
        type: MESSAGE_TYPES.ERROR,
        content: error,
      });
      this.emit(`session:${sessionKey}:error`, new Error(error));
    }
  }

  private handlePlatformEvent(sessionKey: string, data: any) {
    const { event_label, event_data } = data;

    this.addMessage(sessionKey, {
      type: MESSAGE_TYPES.SYSTEM,
      content: `Platform Event: ${event_label}`,
      metadata: { platformEvent: { label: event_label, data: event_data } },
    });

    this.emit(`session:${sessionKey}:platformEvent`, {
      eventLabel: event_label,
      eventData: event_data,
    });
  }

  private handleAgentMessage(sessionKey: string, data: any) {
    const { message_type, content, metadata } = data;

    const messageTypeMapping: Record<
      string,
      (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES]
    > = {
      acknowledgment: MESSAGE_TYPES.AGENT,
      user_input_request: MESSAGE_TYPES.AGENT,
      reasoning: MESSAGE_TYPES.AGENT,
      context_retrieval: MESSAGE_TYPES.AGENT,
      task_execution: MESSAGE_TYPES.AGENT,
      tool_execution: MESSAGE_TYPES.AGENT,
      workflow_execution: MESSAGE_TYPES.AGENT,
      validation: MESSAGE_TYPES.AGENT,
      error: MESSAGE_TYPES.ERROR,
      summary: MESSAGE_TYPES.AGENT,
      progress: MESSAGE_TYPES.SYSTEM,
    };

    const displayType = messageTypeMapping[message_type] || MESSAGE_TYPES.AGENT;

    this.updateSession(sessionKey, { isTyping: false });

    this.addMessage(sessionKey, {
      type: displayType,
      content: content,
      metadata: {
        ...metadata,
        agentMessageType: message_type,
      },
    });
  }

  private async handlePlatformFunction(sessionKey: string, data: any) {
    const { function_name, parameters, execution_id } = data;
    const platformFunction = this.platformFunctions.get(function_name);

    if (!platformFunction) {
      this.emit(`session:${sessionKey}:platformFunctionNotFound`, {
        functionName: function_name,
        parameters,
      });

      // Send error result back
      const errorResult = {
        error: `Platform function '${function_name}' not found`,
        functionName: function_name,
      };

      const message: WebSocketMessage = {
        message_id: ++this.messageIdCounter,
        message_type: {
          platform_function_result: [execution_id, errorResult],
        },
        data: {},
      };
      wsManager.send(message);
      return;
    }

    this.addMessage(sessionKey, {
      type: MESSAGE_TYPES.SYSTEM,
      content: `Executing platform function: ${function_name}`,
      metadata: { platformFunction: { name: function_name, parameters } },
    });

    try {
      const result = await platformFunction(parameters);

      const message: WebSocketMessage = {
        message_id: ++this.messageIdCounter,
        message_type: {
          platform_function_result: [
            execution_id,
            { success: true, result, functionName: function_name },
          ],
        },
        data: {},
      };
      wsManager.send(message);

      this.emit(`session:${sessionKey}:platformFunctionExecuted`, {
        functionName: function_name,
        parameters,
        result,
      });

      this.addMessage(sessionKey, {
        type: MESSAGE_TYPES.SYSTEM,
        content: `Platform function '${function_name}' executed successfully`,
        metadata: { platformFunction: { name: function_name, result } },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const errorResult = {
        error: errorMessage,
        functionName: function_name,
      };

      const message: WebSocketMessage = {
        message_id: ++this.messageIdCounter,
        message_type: {
          platform_function_result: [execution_id, errorResult],
        },
        data: {},
      };
      wsManager.send(message);

      this.emit(`session:${sessionKey}:platformFunctionError`, {
        functionName: function_name,
        parameters,
        error: errorMessage,
      });

      this.addMessage(sessionKey, {
        type: MESSAGE_TYPES.ERROR,
        content: `Platform function '${function_name}' failed: ${errorMessage}`,
        metadata: {
          platformFunction: { name: function_name, error: errorMessage },
        },
      });
    }
  }

  // Clear a session's messages
  clearSession(sessionKey: string) {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    session.messages = [];
    session.messageIdMap.clear();
    session.tempMessageMap.clear();
    this.emit(`session:${sessionKey}:update`, session);
  }

  // Remove a session entirely
  removeSession(sessionKey: string) {
    this.disconnect(sessionKey);
    this.sessions.delete(sessionKey);
  }
}

export const aiAgentManager = AIAgentManager.getInstance();
