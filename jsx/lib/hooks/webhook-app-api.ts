import { responseMapper } from "../utils/response-mapper";
import type {
    CancelReplayTaskResponse,
    DeleteEndpointResponse,
    EndpointWithSubscriptions,
    ReplayTaskListResponse,
    ReplayTaskStatusResponse,
    ReplayWebhookDeliveryResponse,
    TestEndpointResponse,
    WebhookAppInfo,
    WebhookAppSessionData,
    WebhookDeliveryDetail,
} from "@wacht/types";
import {
    buildCreateEndpointFormData,
    buildReplayFormData,
    buildTestEndpointFormData,
    buildUpdateEndpointFormData,
} from "./webhook-app-form-data";
import type {
    CancelReplayTaskOptions,
    CreateEndpointOptions,
    ReplayTaskListOptions,
    ReplayTaskStatusOptions,
    ReplayWebhookDeliveryOptions,
    TestEndpointOptions,
    UpdateEndpointOptions,
} from "@wacht/types";

type HttpClient = (url: URL | string, options?: RequestInit) => Promise<Response>;

const URLENCODED_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
};

async function parseResponseData<T>(response: Response, errorMessage: string): Promise<T> {
    const parsed = await responseMapper<T>(response);
    if (!parsed || !("data" in parsed)) {
        throw new Error(errorMessage);
    }
    return parsed.data;
}

export async function fetchWebhookAppSession(client: HttpClient): Promise<WebhookAppSessionData> {
    const response = await client("/webhook/session", { method: "GET" });
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error("NO_SESSION");
        }
        throw new Error("Failed to fetch webhook app session");
    }
    return parseResponseData<WebhookAppSessionData>(
        response,
        "Failed to fetch webhook app session",
    );
}

export async function exchangeWebhookTicket(
    client: HttpClient,
    ticket: string,
): Promise<void> {
    const response = await client(
        `/session/ticket/exchange?ticket=${encodeURIComponent(ticket)}`,
        { method: "GET" },
    );
    if (!response.ok) {
        throw new Error("Failed to exchange ticket");
    }
}

export async function createWebhookEndpoint(
    client: HttpClient,
    options: CreateEndpointOptions,
): Promise<EndpointWithSubscriptions> {
    const formData = buildCreateEndpointFormData(options);
    const response = await client("/webhook/endpoints", {
        method: "POST",
        headers: URLENCODED_HEADERS,
        body: formData.toString(),
    });
    return parseResponseData<EndpointWithSubscriptions>(
        response,
        "Failed to create webhook endpoint",
    );
}

export async function updateWebhookEndpoint(
    client: HttpClient,
    endpointId: string,
    options: UpdateEndpointOptions,
): Promise<EndpointWithSubscriptions> {
    const formData = buildUpdateEndpointFormData(options);
    const response = await client(`/webhook/endpoints/${endpointId}`, {
        method: "PUT",
        headers: URLENCODED_HEADERS,
        body: formData.toString(),
    });
    return parseResponseData<EndpointWithSubscriptions>(
        response,
        "Failed to update webhook endpoint",
    );
}

export async function deleteWebhookEndpoint(
    client: HttpClient,
    endpointId: string,
): Promise<DeleteEndpointResponse> {
    const response = await client(`/webhook/endpoints/${endpointId}`, {
        method: "DELETE",
    });
    return parseResponseData<DeleteEndpointResponse>(
        response,
        "Failed to delete webhook endpoint",
    );
}

export async function testWebhookEndpoint(
    client: HttpClient,
    endpointId: string,
    options: TestEndpointOptions,
): Promise<TestEndpointResponse> {
    const formData = buildTestEndpointFormData(options);
    const response = await client(`/webhook/endpoints/${endpointId}/test`, {
        method: "POST",
        headers: URLENCODED_HEADERS,
        body: formData.toString(),
    });
    return parseResponseData<TestEndpointResponse>(
        response,
        "Failed to test webhook endpoint",
    );
}

export async function rotateWebhookSecret(client: HttpClient): Promise<WebhookAppInfo> {
    const response = await client("/webhook/rotate-secret", { method: "POST" });
    return parseResponseData<WebhookAppInfo>(
        response,
        "Failed to rotate signing secret",
    );
}

export async function replayWebhookDelivery(
    client: HttpClient,
    options: ReplayWebhookDeliveryOptions,
): Promise<ReplayWebhookDeliveryResponse> {
    const formData = buildReplayFormData(options);
    const response = await client("/webhook/deliveries/replay", {
        method: "POST",
        headers: URLENCODED_HEADERS,
        body: formData.toString(),
    });
    return parseResponseData<ReplayWebhookDeliveryResponse>(
        response,
        "Failed to replay webhook delivery",
    );
}

export async function fetchWebhookDeliveryDetail(
    client: HttpClient,
    deliveryId: string,
): Promise<WebhookDeliveryDetail[]> {
    const response = await client(`/webhook/deliveries/${deliveryId}`, {
        method: "GET",
    });
    return parseResponseData<WebhookDeliveryDetail[]>(
        response,
        "Failed to fetch delivery details",
    );
}

export async function fetchWebhookReplayTaskStatus(
    client: HttpClient,
    { taskId }: ReplayTaskStatusOptions,
): Promise<ReplayTaskStatusResponse> {
    const response = await client(`/webhook/deliveries/replay/${taskId}`, {
        method: "GET",
    });
    return parseResponseData<ReplayTaskStatusResponse>(
        response,
        "Failed to fetch replay task status",
    );
}

export async function fetchWebhookReplayTasks(
    client: HttpClient,
    options?: ReplayTaskListOptions,
): Promise<ReplayTaskListResponse> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const response = await client(
        `/webhook/deliveries/replay?limit=${limit}&offset=${offset}`,
        {
            method: "GET",
        },
    );
    return parseResponseData<ReplayTaskListResponse>(
        response,
        "Failed to fetch replay tasks",
    );
}

export async function cancelWebhookReplayTask(
    client: HttpClient,
    { taskId }: CancelReplayTaskOptions,
): Promise<CancelReplayTaskResponse> {
    const response = await client(`/webhook/deliveries/replay/${taskId}/cancel`, {
        method: "POST",
    });
    return parseResponseData<CancelReplayTaskResponse>(
        response,
        "Failed to cancel replay task",
    );
}
