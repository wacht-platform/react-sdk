export * from "./platform-adapter";
export * from "./deployment-context";
export * from "@wacht/types";

export interface PaginatedResponse<T> {
    data: T;
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}
