"use client";

import { useEffect, useRef, useState } from "react";
import { solveWachtChallenge } from "@/utils/challenge";

interface WachtChallengeProps {
    apiHost: string;
    onSolve: (token: string) => void;
    onError?: (error: string) => void;
}

export function WachtChallenge({ apiHost, onSolve, onError }: WachtChallengeProps) {
    const [error, setError] = useState<string | null>(null);
    const onSolveRef = useRef(onSolve);
    const onErrorRef = useRef(onError);
    const startedRef = useRef(false);

    onSolveRef.current = onSolve;
    onErrorRef.current = onError;

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let cancelled = false;

        (async () => {
            try {
                const token = await solveWachtChallenge(apiHost);
                if (cancelled) return;
                onSolveRef.current(token);
            } catch (err) {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : "Challenge failed";
                setError(message);
                onErrorRef.current?.("challenge_failed");
            }
        })();

        return () => {
            cancelled = true;
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
