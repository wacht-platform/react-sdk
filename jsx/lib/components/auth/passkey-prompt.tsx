import { useState } from "react";
import { Fingerprint } from "@phosphor-icons/react";
import { useUser } from "../../hooks/use-user";
import { useDeployment } from "../../hooks/use-deployment";
import { Spin } from "./auth-card";

interface PasskeyPromptProps {
    onComplete?: () => void;
    onSkip?: () => void;
}

export function PasskeyPrompt({ onComplete, onSkip }: PasskeyPromptProps) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { registerPasskey } = useUser();
    const { deployment } = useDeployment();

    const handleRegister = async () => {
        setIsRegistering(true);
        setError(null);

        try {
            await registerPasskey();
            onComplete?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to register passkey",
            );
        } finally {
            setIsRegistering(false);
        }
    };

    const appName = deployment?.ui_settings?.app_name || "this app";

    return (
        <div className="w-flex w-flex-col w-items-center w-text-center">
            <div className="w-feature-badge">
                <Fingerprint size={26} />
            </div>
            <h1 className="w-title-lg">Add a passkey</h1>
            <p className="w-sub" style={{ marginTop: 6, maxWidth: 320 }}>
                Sign in faster and more securely with a passkey. Use your
                fingerprint, face, or screen lock to access {appName}.
            </p>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    width: "100%",
                    marginTop: 24,
                }}
            >
                <button
                    type="button"
                    className="w-btn w-btn--primary w-btn--block"
                    onClick={handleRegister}
                    disabled={isRegistering}
                >
                    {isRegistering ? (
                        <>
                            <Spin size={15} onAccent />
                            Registering…
                        </>
                    ) : (
                        <>
                            <Fingerprint />
                            Add passkey
                        </>
                    )}
                </button>
                <button
                    type="button"
                    className="w-social"
                    onClick={onSkip}
                >
                    Maybe later
                </button>
            </div>

            {error && (
                <p className="w-input-err" style={{ marginTop: 14 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
