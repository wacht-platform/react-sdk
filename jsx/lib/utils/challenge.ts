type CapInstance = {
    solve: () => Promise<{ token: string }>;
    reset: () => void;
};

declare global {
    interface Window {
        Cap?: new (options: { apiEndpoint: string }) => CapInstance;
        CAP_SILENT?: boolean;
        CAP_DISABLE_WIDGET_REF?: boolean;
        CAP_CUSTOM_WASM_URL?: string;
    }
}

const WIDGET_URL = "https://cdn.wacht.services/captcha/wacht-challenge.min.js";
const WASM_URL = "https://cdn.wacht.services/captcha/cap_wasm_bg.wasm";
const SCRIPT_ID = "wacht-challenge-script";

export function normalizeApiHost(apiHost: string): string {
    const trimmed = apiHost.trim().replace(/\/$/, "");
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function loadChallengeScript(): Promise<void> {
    if (document.getElementById(SCRIPT_ID)) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = WIDGET_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load challenge script"));
        document.head.appendChild(script);
    });
}

export async function solveWachtChallenge(apiHost: string): Promise<string> {
    const base = normalizeApiHost(apiHost);
    if (!base) throw new Error("Challenge API host is missing");

    await loadChallengeScript();
    if (!window.Cap) throw new Error("Challenge script did not initialize");

    window.CAP_SILENT = true;
    window.CAP_DISABLE_WIDGET_REF = true;
    window.CAP_CUSTOM_WASM_URL = WASM_URL;

    const cap = new window.Cap({ apiEndpoint: `${base}/captcha/` });
    try {
        const result = await cap.solve();
        return result.token;
    } finally {
        cap.reset();
    }
}

export async function resolveChallengeToken(
    apiHost: string,
    challengeToken?: string,
): Promise<string> {
    return challengeToken || solveWachtChallenge(apiHost);
}
