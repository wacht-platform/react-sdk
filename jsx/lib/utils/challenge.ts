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

let challengeScriptPromise: Promise<void> | undefined;

function configureChallenge() {
    window.CAP_SILENT = true;
    window.CAP_DISABLE_WIDGET_REF = true;
    window.CAP_CUSTOM_WASM_URL = WASM_URL;
}

function loadChallengeScript(): Promise<void> {
    if (window.Cap) return Promise.resolve();
    if (challengeScriptPromise) return challengeScriptPromise;

    challengeScriptPromise = new Promise((resolve, reject) => {
        const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (script) {
            script.addEventListener("load", () => resolve(), { once: true });
            script.addEventListener(
                "error",
                () => reject(new Error("Failed to load challenge script")),
                { once: true },
            );
            return;
        }

        const newScript = document.createElement("script");
        newScript.id = SCRIPT_ID;
        newScript.src = WIDGET_URL;
        newScript.async = true;
        newScript.onload = () => resolve();
        newScript.onerror = () => reject(new Error("Failed to load challenge script"));
        document.head.appendChild(newScript);
    });

    return challengeScriptPromise;
}

export async function solveWachtChallenge(apiHost: string): Promise<string> {
    const base = normalizeApiHost(apiHost);
    if (!base) throw new Error("Challenge API host is missing");

    configureChallenge();
    await loadChallengeScript();
    if (!window.Cap) throw new Error("Challenge script did not initialize");

    const cap = new window.Cap({ apiEndpoint: `${base}/captcha/` });
    try {
        const result = await cap.solve();
        return result.token;
    } finally {
        cap.reset();
    }
}

