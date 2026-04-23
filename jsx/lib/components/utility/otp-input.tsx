import { useState, useRef, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
`;

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8u);
    animation: ${fadeSlideIn} 0.25s ease both;
`;

const DigitRow = styled.div<{ $shake: boolean }>`
    display: flex;
    align-items: center;
    gap: var(--space-2u);
    ${({ $shake }) =>
        $shake &&
        css`
            animation: ${shake} 0.4s ease;
        `}
`;

const GroupDash = styled.span`
    width: var(--space-6u);
    height: 1px;
    background: var(--color-border);
    border-radius: 9999px;
    flex-shrink: 0;
    margin: 0 var(--space-1u);
`;

const InputBox = styled.input<{ $hasError: boolean }>`
    width: var(--size-20u);
    height: var(--size-20u);
    border: var(--border-width-thin) solid
        ${({ $hasError }) => $hasError ? "var(--color-error)" : "var(--color-border)"};
    border-radius: var(--radius-md);
    font-size: var(--font-size-xl);
    color: var(--color-card-foreground);
    background: var(--color-input-background);
    text-align: center;
    caret-color: transparent;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
        outline: none;
        border-color: ${({ $hasError }) =>
            $hasError ? "var(--color-error)" : "var(--color-primary)"};
        box-shadow: 0 0 0 3px var(--color-input-focus-border);
        background: var(--color-background);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const BottomArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2u);
    width: 100%;
`;

const ErrorMessage = styled.p`
    font-size: var(--font-size-xs);
    color: var(--color-error);
    margin: 0;
    text-align: center;
`;

const TimerText = styled.span`
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
`;

const ResendButton = styled.button`
    background: none;
    border: none;
    color: var(--color-card-foreground);
    font-size: var(--font-size-sm);
    font-weight: 400;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s ease;

    &:hover:not(:disabled) {
        color: var(--color-primary);
    }

    &:disabled {
        color: var(--color-secondary-text);
        cursor: not-allowed;
    }
`;

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
    const [shaking, setShaking] = useState(false);
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

    useEffect(() => {
        if (error) {
            setShaking(true);
            const t = setTimeout(() => setShaking(false), 450);
            return () => clearTimeout(t);
        }
    }, [error]);

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

    const mid = Math.floor(length / 2);

    return (
        <Container>
            <DigitRow $shake={shaking}>
                {otp.slice(0, mid).map((digit, i) => (
                    <InputBox
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        $hasError={!!error}
                        onChange={(e) => handleChange(e.target, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        onPaste={(e) => handlePaste(e, i)}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        disabled={isSubmitting}
                        autoFocus={i === 0}
                    />
                ))}
                <GroupDash />
                {otp.slice(mid).map((digit, j) => {
                    const i = mid + j;
                    return (
                        <InputBox
                            key={i}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            $hasError={!!error}
                            onChange={(e) => handleChange(e.target, i)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            onPaste={(e) => handlePaste(e, i)}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            disabled={isSubmitting}
                        />
                    );
                })}
            </DigitRow>

            <BottomArea>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                {onResend && (
                    canResend ? (
                        <ResendButton
                            type="button"
                            onClick={handleResend}
                            disabled={isSubmitting}
                        >
                            Didn't receive a code? Resend
                        </ResendButton>
                    ) : (
                        <TimerText>Resend code in {resendTimer}s</TimerText>
                    )
                )}
            </BottomArea>
        </Container>
    );
}
