import { useState } from "react";
import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead, Spin } from "./auth-card";

interface PhoneVerificationProps {
    onVerify: (lastFourDigits: string) => void;
    onBack: () => void;
    loading?: boolean;
}

export function PhoneVerification({
    onVerify,
    onBack,
    loading,
}: PhoneVerificationProps) {
    const [lastFourDigits, setLastFourDigits] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (lastFourDigits.length !== 4) {
            setError("Please enter the last 4 digits of your phone number");
            return;
        }

        onVerify(lastFourDigits);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
        setLastFourDigits(value);
        setError("");
    };

    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    <span className="w-auth-foot">
                        <button
                            type="button"
                            className="w-link"
                            onClick={onBack}
                        >
                            Choose a different method
                        </button>
                    </span>
                }
            >
                <AuthHead
                    title="Verify phone"
                    sub="Enter the last 4 digits of your phone number."
                />

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <div className="w-field">
                        <label className="w-label" htmlFor="lastDigits">
                            Last 4 digits
                        </label>
                        <input
                            className={`w-input${error ? " w-input--invalid" : ""}`}
                            type="text"
                            id="lastDigits"
                            name="lastDigits"
                            value={lastFourDigits}
                            onChange={handleInputChange}
                            placeholder="0000"
                            maxLength={4}
                            autoComplete="off"
                            aria-invalid={!!error}
                            autoFocus
                        />
                        {error && <span className="w-input-err">{error}</span>}
                    </div>

                    <button
                        type="submit"
                        className="w-btn w-btn--primary w-btn--block"
                        disabled={loading || lastFourDigits.length !== 4}
                    >
                        {loading ? <Spin onAccent /> : "Send code"}
                    </button>
                </form>
            </AuthCard>
        </DefaultStylesProvider>
    );
}
