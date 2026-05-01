export interface ImageData {
    mime_type: string;
    url?: string;
    data?: string;
    size_bytes?: number;
}

export interface FileData {
    filename: string;
    mime_type: string;
    url: string;
    size_bytes?: number;
}

export interface ConversationAttachment {
    path: string;
    type: "file" | "folder";
}

export interface UserMessageContent {
    type: "user_message";
    message: string;
    sender_name?: string;
    files?: FileData[];
}

export interface SteerContent {
    type: "steer";
    message: string;
    further_actions_required: boolean;
    reasoning: string;
    attachments?: ConversationAttachment[];
    thought_signature?: string;
}

export interface ToolResultContent {
    type: "tool_result";
    tool_name: string;
    status: string;
    input: any;
    output?: any;
    error?: string;
}

export interface SystemDecisionContent {
    type: "system_decision";
    step: string;
    reasoning: string;
    confidence: number;
    thought_signature?: string;
}

export interface RequestedToolApproval {
    tool_id: string;
    tool_name: string;
    tool_description?: string;
}

export interface ApprovalRequestContent {
    type: "approval_request";
    description: string;
    tools: RequestedToolApproval[];
}

export interface ToolApprovalDecision {
    tool_name: string;
    mode: "allow_once" | "allow_always";
}

export interface ApprovalResponseContent {
    type: "approval_response";
    request_message_id?: string;
    approvals: ToolApprovalDecision[];
}

export interface ExecutionSummaryContent {
    type: "execution_summary";
    user_message: string;
    agent_execution: string;
    token_count: number;
}

export interface ClarificationRequestContent {
    type: "clarification_request";
    questions: Question[];
    context?: string;
}

export interface ClarificationResponseContent {
    type: "clarification_response";
    request_message_id?: string;
    answers: QuestionAnswer[];
}

export type ConversationContent =
    | UserMessageContent
    | SteerContent
    | ToolResultContent
    | SystemDecisionContent
    | ApprovalRequestContent
    | ApprovalResponseContent
    | ExecutionSummaryContent
    | ClarificationRequestContent
    | ClarificationResponseContent;

export type MessageType = ConversationContent["type"];

// ============================================================================
// Conversation Message (what the API returns)
// ============================================================================

export interface ConversationMessage {
    id: string;
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

export interface ExecuteAgentResponse {
    status: string;
    conversation_id?: string;
}

export interface Actor {
    id: string;
    subject_type: string;
    external_key: string;
    display_name?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
    archived_at?: string;
}

export interface ActorProject {
    id: string;
    deployment_id: string;
    actor_id: string;
    name: string;
    description?: string;
    status: string;
    coordinator_thread_id?: string;
    review_thread_id?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    archived_at?: string;
}

export interface ActorProjectsResponse {
    data: ActorProject[];
    limit: number;
    has_more: boolean;
    next_cursor?: string;
}

export interface CreateActorProjectRequest {
    name: string;
    agent_id: string;
    description?: string;
    status?: string;
}

export interface UpdateActorProjectRequest {
    name?: string;
    description?: string;
    status?: string;
}

export interface AgentThread {
    id: string;
    deployment_id: string;
    actor_id: string;
    project_id: string;
    project_name?: string;
    agent_id?: string;
    title: string;
    thread_purpose: string;
    responsibility?: string;
    reusable: boolean;
    accepts_assignments: boolean;
    capability_tags: string[];
    status:
        | "idle"
        | "running"
        | "waiting_for_input"
        | "interrupted"
        | "completed"
        | "failed"
        | string;
    system_instructions?: string;
    last_activity_at: string;
    completed_at?: string;
    execution_state?: ThreadExecutionState;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    archived_at?: string;
}

export interface ProjectThreadsResponse {
    data: AgentThread[];
    limit: number;
    has_more: boolean;
    next_cursor?: string;
}

export interface CreateAgentThreadRequest {
    title: string;
    agent_id: string;
    system_instructions?: string;
    thread_purpose?: string;
    responsibility?: string;
    reusable?: boolean;
    accepts_assignments?: boolean;
    capability_tags?: string[];
    metadata?: Record<string, unknown>;
}

export interface UpdateAgentThreadRequest {
    title?: string;
    agent_id?: string;
    system_instructions?: string;
}

export interface RequestedToolApprovalState {
    tool_id: string;
    tool_name: string;
    tool_description?: string;
}

export interface ThreadPendingApprovalRequestState {
    request_message_id?: string;
    description: string;
    tools: RequestedToolApprovalState[];
}

export interface ThreadExecutionState {
    deep_think_mode_active?: boolean;
    deep_think_used?: number;
    approved_once_tool_ids?: string[];
    pending_approval_request?: ThreadPendingApprovalRequestState;
    pending_question?: PendingQuestion;
}

export interface ThreadPendingState {
    kind: "approval" | null;
    request_message_id?: string;
    approval_request?: ThreadPendingApprovalRequestState;
}

export interface ProjectTaskBoardAssignmentTarget {
    thread_id?: string;
    responsibility?: string;
    capability_tags?: string[];
}

export interface CreateProjectTaskBoardItemRequest {
    title: string;
    description?: string;
    status?: string;
    schedule_kind?: "once" | "interval";
    next_run_at?: string;
    interval_seconds?: number;
}

export interface UpdateProjectTaskBoardItemRequest {
    title?: string;
    description?: string;
    status?: string;
    schedule_kind?: "once" | "interval";
    next_run_at?: string;
    interval_seconds?: number;
    clear_schedule?: boolean;
}

export interface ScheduleTemplatePayload {
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
}

export interface ProjectTaskSchedule {
    id: string;
    board_id: string;
    task_key: string;
    template_payload: ScheduleTemplatePayload;
    state: Record<string, unknown>;
    state_version: number;
    status: string;
    schedule_kind: "once" | "interval" | string;
    interval_seconds?: number;
    next_run_at: string;
    last_fired_at?: string;
    overlap_policy: "skip" | "parallel" | string;
    created_at: string;
    updated_at: string;
}

export interface ProjectTaskBoardItem {
    id: string;
    board_id: string;
    task_key: string;
    title: string;
    description?: string;
    status: string;
    assigned_thread_id?: string;
    metadata?: Record<string, unknown>;
    schedule?: ProjectTaskSchedule;
    state_version: string;
    schedule_id?: string;
    scheduled_for?: string;
    fired_at?: string;
    completed_at?: string;
    archived_at?: string;
    created_at: string;
    updated_at: string;
    pending_question?: PendingQuestion;
}

export interface Choice {
    value: string;
    label: string;
    description?: string;
}

export type AnswerKind =
    | { kind: "free_text"; placeholder?: string; max_length?: number }
    | { kind: "single_choice"; choices: Choice[]; allow_other?: boolean }
    | { kind: "multi_choice"; choices: Choice[]; min_selected?: number; max_selected?: number }
    | { kind: "yes_no" }
    | { kind: "number"; min?: number; max?: number; unit?: string }
    | { kind: "date"; min_date?: string; max_date?: string }
    | { kind: "confirm"; confirm_label: string; cancel_label: string };

export interface Question {
    id: string;
    text: string;
    answer_kind: AnswerKind;
}

export interface PendingQuestion {
    questions: Question[];
    context?: string;
    asked_at: string;
    asked_by_thread_id: string;
    asked_by_assignment_id?: string;
}

export type AnswerValue =
    | { kind: "free_text"; value: string }
    | { kind: "single_choice"; value: string }
    | { kind: "multi_choice"; values: string[] }
    | { kind: "yes_no"; value: boolean }
    | { kind: "number"; value: number }
    | { kind: "date"; value: string }
    | { kind: "confirm"; accepted: boolean };

export interface QuestionAnswer {
    question_id: string;
    value: AnswerValue;
}

export interface AnswerSubmission {
    answers: QuestionAnswer[];
}

export interface ProjectTaskBoardItemsResponse {
    data: ProjectTaskBoardItem[];
    limit: number;
    has_more: boolean;
    next_cursor?: string;
}

export interface UploadedTaskWorkspaceFile {
    path: string;
    name: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
}


export interface ProjectTaskBoardItemAssignment {
    id: string;
    board_item_id: string;
    thread_id: string;
    assignment_role: string;
    status: string;
    instructions?: string;
    handoff_file_path?: string;
    metadata?: Record<string, unknown>;
    result_status?: string;
    result_summary?: string;
    result_payload?: Record<string, unknown>;
    claimed_at?: string;
    started_at?: string;
    completed_at?: string;
    rejected_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectTaskWorkspaceFileEntry {
    path: string;
    name: string;
    is_dir: boolean;
    size_bytes?: number;
    modified_at?: string;
}

export interface ProjectTaskWorkspaceListing {
    exists: boolean;
    files: ProjectTaskWorkspaceFileEntry[];
}

export interface ProjectTaskWorkspaceFileContent {
    path: string;
    name: string;
    mime_type: string;
    is_text: boolean;
    size_bytes: number;
    truncated: boolean;
    content?: string;
    content_base64?: string;
}

export interface ThreadTaskGraph {
    id: string;
    deployment_id: string;
    thread_id: string;
    board_item_id?: string;
    version: number;
    status: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface ThreadTaskNode {
    id: string;
    graph_id: string;
    board_item_id?: string;
    title: string;
    description?: string;
    status: string;
    priority: number;
    owner_agent_id?: string;
    assigned_thread_id?: string;
    retry_count: number;
    max_retries: number;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: Record<string, unknown>;
    lease_owner?: string;
    lease_until?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ThreadTaskEdge {
    graph_id: string;
    from_node_id: string;
    to_node_id: string;
    dependency_type: string;
    created_at: string;
}

export interface ThreadTaskGraphSummary {
    graph_id: string;
    graph_status: string;
    total_nodes: number;
    pending_nodes: number;
    ready_nodes: number;
    in_progress_nodes: number;
    completed_nodes: number;
    failed_nodes: number;
    cancelled_nodes: number;
    progress_percent: number;
}

export interface ThreadTaskGraphBundle {
    graph: ThreadTaskGraph;
    nodes: ThreadTaskNode[];
    edges: ThreadTaskEdge[];
    summary?: ThreadTaskGraphSummary | null;
}

export interface ThreadTaskGraphsResponse {
    data: ThreadTaskGraphBundle[];
    limit: number;
    has_more: boolean;
    next_cursor?: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    child_agents?: Agent[];
}

export type ListAgentsResponse = {
    agents: Agent[];
};

export interface AgentSessionData {
    session_id: string;
    actor: Actor;
    agents: Agent[];
}

export interface ActorMcpServerSummary {
    id: string;
    name: string;
    endpoint: string;
    auth_type: string;
    requires_user_connection: boolean;
    connection_status: "ready" | "connected" | "not_connected" | "expired";
    connected_at?: string;
    expires_at?: string;
}

export type ExternalAgentConnectionStatus =
    | "disconnected"
    | "pending"
    | "active"
    | "expired"
    | "failed";

export interface ExternalAgentConnection {
    provider: string;
    slug: string;
    display_name: string;
    logo_url?: string;
    status: ExternalAgentConnectionStatus;
    external_account_id?: string;
    connected_at?: string;
}
