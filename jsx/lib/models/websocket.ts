export interface WebsocketMessage<T = any> {
  message_id?: number;
  message_type: string | Record<string, any>;
  data: T;
}

export const WebsocketMessageType = {
  SESSION_CONNECT: "session_connect",
  SESSION_CONNECTED: "session_connected",
  FETCH_CONTEXT_MESSAGES: "fetch_context_messages",
  MESSAGE_INPUT: "message_input",
  NEW_MESSAGE_CHUNK: "new_message_chunk",
  EXECUTION_COMPLETE: "execution_complete",
  TASK_UPDATE: "task_update",
  TOOL_EXECUTION: "tool_execution",
  WORKFLOW_EXECUTION: "workflow_execution",
  EXECUTION_ERROR: "execution_error",
  CLOSE_CONNECTION: "close_connection",
  PLATFORM_EVENT: "platform_event",
  PLATFORM_FUNCTION: "platform_function",
  PLATFORM_FUNCTION_RESULT: "platform_function_result",
  AGENT_MESSAGE: "agent_message",
  CONVERSATION_MESSAGE: "conversation_message",
} as const;