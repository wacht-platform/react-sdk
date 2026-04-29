import { getStoredDevSession } from "../utils/dev-session";
import type { Deployment } from "@/types";
import type {
    ConversationMessage,
    FileData,
    ToolApprovalDecision,
} from "@wacht/types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
    return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function asString(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

export function unwrapConversationEvent(data: unknown): unknown {
    const record = asRecord(data);
    return record?.ConversationMessage ?? data;
}

export function normalizeConversationMessage(
    data: unknown,
): ConversationMessage | null {
    const record = asRecord(data);
    if (!record) return null;

    const content = asRecord(record.content);
    const metadata = asRecord(record.metadata);
    const messageType =
        asString(record.message_type) ||
        asString(metadata?.message_type) ||
        asString(content?.type);

    return {
        ...record,
        metadata: {
            ...(metadata || {}),
            message_type: messageType,
        },
    } as ConversationMessage;
}

export function getConversationMessageType(
    message: ConversationMessage,
): string | null {
    const metadata = asRecord(message.metadata);
    const content = asRecord(message.content);
    return asString(metadata?.message_type) || asString(content?.type);
}

export function getExecutionStatus(message: ConversationMessage): string | null {
    const content = asRecord(message.content);
    return asString(content?.status);
}

export function isTerminalSystemDecision(
    message: ConversationMessage,
): boolean {
    const content = asRecord(message.content);
    const step = asString(content?.step);
    return step === "execution_cancelled" || step === "abort";
}

export function isFinalSteerMessage(message: ConversationMessage): boolean {
    const content = asRecord(message.content);
    return content?.further_actions_required === false;
}

export function sortConversationMessages(
    messages: ConversationMessage[],
): ConversationMessage[] {
    return [...messages].sort(
        (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime(),
    );
}

export function createConfirmedUserMessage(
    conversationId: string,
    message: string,
): ConversationMessage {
    return {
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
}

export function buildMessageRunFormData(
    message: string,
    files?: File[],
): FormData {
    const formData = new FormData();
    formData.append("message", message);

    for (const file of files ?? []) {
        formData.append("files", file);
    }

    return formData;
}

export function buildApprovalRunFormData(
    requestMessageId: string,
    approvals: ToolApprovalDecision[],
): FormData {
    const formData = new FormData();
    formData.append("request_message_id", requestMessageId);

    for (const approval of approvals) {
        formData.append("approval_tool_name", approval.tool_name);
        formData.append("approval_mode", approval.mode);
    }

    return formData;
}

export function buildCancelRunFormData(): FormData {
    const formData = new FormData();
    formData.append("cancel", "true");
    return formData;
}

export function resolveThreadFileUrl({
    deployment,
    threadId,
    file,
}: {
    deployment: Deployment;
    threadId: string;
    file: FileData;
}): string | null {
    const raw = file.url || file.filename;
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;

    const backendHost = deployment.backend_host.replace(/\/$/, "");
    let fileUrl: URL;

    if (raw.startsWith("/ai/threads/")) {
        fileUrl = new URL(raw, `${backendHost}/`);
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
}
