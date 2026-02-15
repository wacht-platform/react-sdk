import type {
    CancelReplayTaskOptions,
    CancelReplayTaskResponse,
    CreateEndpointOptions,
    DeleteEndpointResponse,
    EndpointWithSubscriptions,
    ReplayTaskListOptions,
    ReplayTaskListResponse,
    ReplayTaskStatusOptions,
    ReplayTaskStatusResponse,
    ReplayWebhookDeliveryOptions,
    ReplayWebhookDeliveryResponse,
    TestEndpointOptions,
    TestEndpointResponse,
    UpdateEndpointOptions,
    WebhookAppInfo,
    WebhookDeliveryDetail,
} from "@wacht/types";

export interface UseWebhookAppSessionResult {
    hasSession: boolean;
    sessionLoading: boolean;
    sessionError: Error | null;
    sessionId: string | null;
    webhookApp: WebhookAppInfo | null;
    ticketExchanged: boolean;
    ticketLoading: boolean;
    refetch: () => Promise<void>;
    createEndpoint: (
        options: CreateEndpointOptions,
    ) => Promise<EndpointWithSubscriptions>;
    updateEndpoint: (
        endpointId: string,
        options: UpdateEndpointOptions,
    ) => Promise<EndpointWithSubscriptions>;
    deleteEndpoint: (endpointId: string) => Promise<DeleteEndpointResponse>;
    testEndpoint: (
        endpointId: string,
        options: TestEndpointOptions,
    ) => Promise<TestEndpointResponse>;
    rotateSecret: () => Promise<WebhookAppInfo>;
    replayDelivery: (
        options: ReplayWebhookDeliveryOptions,
    ) => Promise<ReplayWebhookDeliveryResponse>;
    fetchReplayTaskStatus: (
        options: ReplayTaskStatusOptions,
    ) => Promise<ReplayTaskStatusResponse>;
    fetchReplayTasks: (
        options?: ReplayTaskListOptions,
    ) => Promise<ReplayTaskListResponse>;
    cancelReplayTask: (
        options: CancelReplayTaskOptions,
    ) => Promise<CancelReplayTaskResponse>;
    fetchDeliveryDetail: (deliveryId: string) => Promise<WebhookDeliveryDetail[]>;
}
