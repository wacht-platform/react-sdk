"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface WachtChallengeProps {
    apiHost: string;
    onSolve: (token: string) => void;
    onError?: (error: string) => void;
}

type CapInstance = {
    solve: () => Promise<{ token: string }>;
    reset: () => void;
};

declare global {
    interface Window {
        Cap?: new (options: { apiEndpoint: string }) => CapInstance;
    }
}

const WIDGET_URL = "https://cdn.wacht.services/captcha/wacht-challenge.min.js";

const SCRIPT_ID = "wacht-challenge-script";

function normalizeApiHost(apiHost: string): string {
    const trimmed = apiHost.trim().replace(/\/$/, "");
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function loadScript(): Promise<void> {
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

export function WachtChallenge({ apiHost, onSolve, onError }: WachtChallengeProps) {
    const capRef = useRef<CapInstance | null>(null);
    const [error, setError] = useState<string | null>(null);

    const init = useCallback(async () => {
        if (!apiHost) return;
        try {
            await loadScript();
            if (!window.Cap) throw new Error("Challenge script did not expose Cap");

            const base = normalizeApiHost(apiHost);
            if (!base) return;
            const cap = new window.Cap({ apiEndpoint: `${base}/captcha/` });
            capRef.current = cap;
            const result = await cap.solve();
            onSolve(result.token);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Challenge failed";
            setError(message);
            onError?.("challenge_failed");
        }
    }, [apiHost, onSolve, onError]);

    useEffect(() => {
        init();
        return () => {
            capRef.current?.reset();
            capRef.current = null;
        };
    }, [init]);

    if (error) {
        return (
            <div style={{ fontSize: 12, color: "var(--wa-error)", marginBottom: 12 }}>
                {error}
            </div>
        );
    }

    return null;
}
