export interface AgentIntegration {
    id: string;
    name: string;
    integration_type: string;
    agent_id: string;
    is_active: boolean;
    connection_metadata?: Record<string, any>;
}

export interface LinkCodeResponse {
    code: string;
    expires_at: string;
}

export interface ConsentURLResponse {
    consent_url: string;
    state: string;
    expires_in: number;
}

// ============================================================================
// Conversation Content Types (matches Rust ConversationContent enum)
// ============================================================================

export interface ImageData {
    mime_type: string;
    url?: string;
    data?: string;
    size_bytes?: number;
}

export interface FileData {
    filename: string;
    mime_type: string;
    data: string; // base64 encoded
}

export interface UserMessageContent {
    type: "user_message";
    message: string;
    sender_name?: string;
    images?: ImageData[];
    files?: FileData[];
}

export interface AgentResponseContent {
    type: "agent_response";
    response: string;
    context_used: string[];
    thought_signature?: string;
}

export interface AssistantAcknowledgmentContent {
    type: "assistant_acknowledgment";
    acknowledgment_message: string;
    further_action_required: boolean;
    reasoning: string;
    thought_signature?: string;
}

export interface ActionResult {
    action: string;
    status: "success" | "error";
    result?: any;
    error?: string;
}

export interface ExecutionAction {
    type: "tool_call" | "workflow_call";
    details: any;
    purpose: string;
    context_messages?: number;
    clear_actionable_id?: string;
}

export interface TaskExecution {
    approach: string;
    actions: { action: ExecutionAction[] };
    expected_result: string;
    actual_result?: ActionResult[];
}

export interface ActionExecutionResultContent {
    type: "action_execution_result";
    task_execution: TaskExecution;
    execution_status: "pending" | "completed" | "failed";
    blocking_reason?: string;
}

export interface SystemDecisionContent {
    type: "system_decision";
    step: string;
    reasoning: string;
    confidence: number;
    thought_signature?: string;
}

export interface ContextResultsContent {
    type: "context_results";
    query: string;
    results: any;
    result_count: number;
    timestamp: string;
}

export interface UserInputRequestContent {
    type: "user_input_request";
    question: string;
    context: string;
    input_type: "text" | "number" | "select" | "multiselect" | "boolean" | "date";
    options?: string[];
    default_value?: string;
    placeholder?: string;
}

export interface ExecutionSummaryContent {
    type: "execution_summary";
    user_message: string;
    agent_execution: string;
    token_count: number;
}

export interface PlatformFunctionResultContent {
    type: "platform_function_result";
    execution_id: string;
    result: string;
}

export type ConversationContent =
    | UserMessageContent
    | AgentResponseContent
    | AssistantAcknowledgmentContent
    | ActionExecutionResultContent
    | SystemDecisionContent
    | ContextResultsContent
    | UserInputRequestContent
    | ExecutionSummaryContent
    | PlatformFunctionResultContent;

export type MessageType = ConversationContent["type"];

// ============================================================================
// Conversation Message (what the API returns)
// ============================================================================

export interface ConversationMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: ConversationContent;
    timestamp: string;
    metadata?: {
        message_type: MessageType;
    };
}

export interface ListMessagesResponse {
    data: ConversationMessage[];
    has_more: boolean;
}

// ============================================================================
// Agent Context Types
// ============================================================================

export interface AgentContext {
    id: string;
    title: string;
    status: 'idle' | 'running' | 'waiting_for_input' | 'interrupted' | 'completed' | 'failed';
    last_activity_at: string;
    context_group?: string;
    created_at: string;
    agent_id?: string;
}

export interface CreateContextRequest {
    title: string;
    system_instructions?: string;
}

export interface ListContextsOptions {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
}

export interface ListContextsResponse {
    data: AgentContext[];
    has_more: boolean;
}

export interface AgentWithIntegrations {
    id: string;
    name: string;
    description: string;
    integrations: AgentIntegration[];
}

export type ListAgentsResponse = {
    agents: AgentWithIntegrations[];
};

export interface AgentSessionData {
    session_id: string;
    context_group: string;
    agents: AgentWithIntegrations[];
}
