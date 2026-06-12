import { useState, useRef, useEffect, useCallback } from "react";

interface OTPInputProps {
    length?: number;
    onComplete: ((code: string) => Promise<void>) | ((code: string) => void);
    onResend?: () => Promise<void>;
    error?: string;
    isSubmitting?: boolean;
}

export function OTPInput({
    length = 6,
    onComplete,
    onResend,
    error,
    isSubmitting = false,
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const startTimer = useCallback(() => {
        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return timer;
    }, []);

    useEffect(() => {
        const timer = startTimer();
        return () => clearInterval(timer);
    }, [startTimer]);

    const handleResend = async () => {
        if (!canResend || isSubmitting || !onResend) return;
        await onResend();
        setCanResend(false);
        setResendTimer(60);
        setOtp(new Array(length).fill(""));
        inputRefs.current[0]?.focus();
        startTimer();
    };

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isSubmitting) return;

        const value = element.value;
        const newOtp = [...otp];
        newOtp[index] = value.replace(/[^0-9]/g, "");
        setOtp(newOtp);

        const combined = newOtp.join("");
        if (combined.length === length) {
            onComplete(combined);
        }

        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number,
    ) => {
        if (isSubmitting) return;
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        index: number,
    ) => {
        if (isSubmitting) return;
        e.preventDefault();

        const digits = e.clipboardData
            .getData("text/plain")
            .replace(/[^0-9]/g, "")
            .slice(0, length);

        if (!digits.length) return;

        const newOtp = [...otp];
        for (let i = 0; i < digits.length && index + i < length; i++) {
            newOtp[index + i] = digits[i];
        }
        if (index === 0 && digits.length === length) {
            for (let i = 0; i < length; i++) newOtp[i] = digits[i];
        }

        setOtp(newOtp);

        const combined = newOtp.join("");
        if (combined.length === length) {
            onComplete(combined);
            inputRefs.current[length - 1]?.focus();
        } else {
            const next = newOtp.findIndex((v, i) => i >= index && !v);
            if (next !== -1) inputRefs.current[next]?.focus();
        }
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
            }}
        >
            <div className="w-otp" data-error={error ? "" : undefined}>
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        className="w-otp-cell"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        data-filled={digit ? "" : undefined}
                        onChange={(e) => handleChange(e.target, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        onPaste={(e) => handlePaste(e, i)}
                        ref={(el) => {
                            inputRefs.current[i] = el;
                        }}
                        disabled={isSubmitting}
                        autoFocus={i === 0}
                    />
                ))}
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                }}
            >
                {error && <span className="w-input-err">{error}</span>}
                {onResend &&
                    (canResend ? (
                        <button
                            type="button"
                            className="w-link"
                            style={{
                                background: "none",
                                border: 0,
                                cursor: "pointer",
                                fontSize: 12.5,
                            }}
                            onClick={handleResend}
                            disabled={isSubmitting}
                        >
                            Didn't receive a code? Resend
                        </button>
                    ) : (
                        <span className="w-secsub">
                            Resend code in {resendTimer}s
                        </span>
                    ))}
            </div>
        </div>
    );
}
