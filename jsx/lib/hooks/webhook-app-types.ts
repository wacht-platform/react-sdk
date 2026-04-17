import type {
    ApiResult,
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
    UpdateWebhookSettingsOptions,
    UpdateEndpointOptions,
    WebhookAppInfo,
    WebhookDeliveryDetail,
    WebhookSettingsResponse,
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
    ) => Promise<ApiResult<EndpointWithSubscriptions>>;
    updateEndpoint: (
        endpointId: string,
        options: UpdateEndpointOptions,
    ) => Promise<ApiResult<EndpointWithSubscriptions>>;
    deleteEndpoint: (endpointId: string) => Promise<ApiResult<DeleteEndpointResponse>>;
    testEndpoint: (
        endpointId: string,
        options: TestEndpointOptions,
    ) => Promise<ApiResult<TestEndpointResponse>>;
    rotateSecret: () => Promise<ApiResult<WebhookAppInfo>>;
    updateSettings: (
        options: UpdateWebhookSettingsOptions,
    ) => Promise<ApiResult<WebhookSettingsResponse>>;
    replayDelivery: (
        options: ReplayWebhookDeliveryOptions,
    ) => Promise<ApiResult<ReplayWebhookDeliveryResponse>>;
    fetchReplayTaskStatus: (
        options: ReplayTaskStatusOptions,
    ) => Promise<ApiResult<ReplayTaskStatusResponse>>;
    fetchReplayTasks: (
        options?: ReplayTaskListOptions,
    ) => Promise<ApiResult<ReplayTaskListResponse>>;
    cancelReplayTask: (
        options: CancelReplayTaskOptions,
    ) => Promise<ApiResult<CancelReplayTaskResponse>>;
    fetchDeliveryDetail: (deliveryId: string) => Promise<ApiResult<WebhookDeliveryDetail[]>>;
}
