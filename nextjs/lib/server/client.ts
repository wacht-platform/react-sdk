import {
    WachtClient as BackendWachtClient,
    type WachtConfig as BackendWachtConfig,
} from "@wacht/backend";

export type WachtServerClient = BackendWachtClient;

export interface WachtServerClientOptions {
    apiKey?: string;
    apiUrl?: string;
    timeout?: number;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
    name?: string;
}

let cachedClient: BackendWachtClient | null = null;

function readEnv(name: string): string | undefined {
    if (typeof process === "undefined" || !process.env) return undefined;
    return process.env[name];
}

function resolveApiKey(options: WachtServerClientOptions = {}): string {
    const value = options.apiKey || readEnv("WACHT_API_KEY");
    if (!value) {
        throw new Error(
            "Missing WACHT_API_KEY. Set WACHT_API_KEY or pass { apiKey } to createWachtServerClient().",
        );
    }
    return value;
}

function toBackendConfig(
    options: WachtServerClientOptions = {},
): BackendWachtConfig {
    return {
        apiKey: resolveApiKey(options),
        baseUrl: options.apiUrl,
        timeout: options.timeout,
        headers: options.headers,
        fetch: options.fetch,
        name: options.name,
    };
}

export function createWachtServerClient(
    options: WachtServerClientOptions = {},
): BackendWachtClient {
    return new BackendWachtClient(toBackendConfig(options));
}

export async function wachtClient(
    options: WachtServerClientOptions = {},
): Promise<BackendWachtClient> {
    if (Object.keys(options).length > 0) {
        return createWachtServerClient(options);
    }

    if (!cachedClient) {
        cachedClient = createWachtServerClient();
    }

    return cachedClient;
}
