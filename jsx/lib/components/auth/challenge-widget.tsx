"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface WachtChallengeProps {
    apiHost: string;
    onSolve: (token: string) => void;
    onError?: (error: string) => void;
}

const WIDGET_URL = "https://cdn.wacht.services/captcha/wacht-challenge.min.js";

const SCRIPT_ID = "wacht-challenge-script";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    const init = useCallback(async () => {
        if (!apiHost) return;
        try {
            await loadScript();
        } catch {
            setError("Failed to load challenge");
            onError?.("script_load_failed");
            return;
        }

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        const widget = document.createElement("wacht-challenge");
        widget.setAttribute("data-wacht-api-endpoint", `${apiHost}/captcha/challenge`);

        widget.addEventListener("solve", ((e: CustomEvent<{ token: string }>) => {
            onSolve(e.detail.token);
        }) as EventListener);

        widget.addEventListener("error", ((e: CustomEvent<{ code: string; message: string }>) => {
            const msg = e.detail.message || e.detail.code || "Captcha failed";
            setError(msg);
            onError?.(e.detail.code);
        }) as EventListener);

        containerRef.current.appendChild(widget);
    }, [apiHost, onSolve, onError]);

    useEffect(() => {
        init();
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [init]);

    if (error) {
        return (
            <div style={{ fontSize: 12, color: "var(--wa-error)", marginBottom: 12 }}>
                {error}
            </div>
        );
    }

    return <div ref={containerRef} style={{ minHeight: 60 }} />;
}
