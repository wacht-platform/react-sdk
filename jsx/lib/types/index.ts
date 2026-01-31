export * from "@wacht/types";
export * from "./platform-adapter";
export * from "./deployment-context";

export interface PaginatedResponse<T> {
    data: T;
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}
