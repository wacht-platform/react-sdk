"use client";

import { useEffect, useRef, useState } from "react";

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
        CAP_SILENT?: boolean;
        CAP_DISABLE_WIDGET_REF?: boolean;
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
    const onSolveRef = useRef(onSolve);
    const onErrorRef = useRef(onError);
    const startedRef = useRef(false);

    onSolveRef.current = onSolve;
    onErrorRef.current = onError;

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const base = normalizeApiHost(apiHost);
        if (!base) return;

        let cancelled = false;

        (async () => {
            try {
                await loadScript();
                if (cancelled || !window.Cap) return;

                window.CAP_SILENT = true;
                window.CAP_DISABLE_WIDGET_REF = true;

                const cap = new window.Cap({ apiEndpoint: `${base}/captcha/` });
                capRef.current = cap;
                const result = await cap.solve();
                if (cancelled) return;
                onSolveRef.current(result.token);
            } catch (err) {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : "Challenge failed";
                setError(message);
                onErrorRef.current?.("challenge_failed");
            }
        })();

        return () => {
            cancelled = true;
            capRef.current?.reset();
            capRef.current = null;
        };
    }, [apiHost]);

    if (error) {
        return (
            <div style={{ fontSize: 12, color: "var(--wa-error)", marginBottom: 12 }}>
                {error}
            </div>
        );
    }

    return null;
}
