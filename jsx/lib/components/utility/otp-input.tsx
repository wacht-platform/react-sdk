import { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const InputGroup = styled.div`
  display: flex;
  gap: var(--space-xs);
  justify-content: center;
`;

const InputBox = styled.input`
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  color: var(--color-foreground);
  background: var(--color-input-background);
  text-align: center;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-input-focus-border);
    background: var(--color-background);
  }

  &::placeholder {
    color: var(--color-secondary-text);
  }
`;

const ErrorMessage = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-2xs);
  text-align: center;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-top: var(--space-2xs);
  text-align: center;
  width: 100%;

  &:hover:not(:disabled) {
    color: var(--color-primary-hover);
  }

  &:disabled {
    color: var(--color-secondary-text);
    cursor: not-allowed;
  }
`;

const Timer = styled.span`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  display: block;
  text-align: center;
`;

interface OTPInputProps {
	length?: number;
	onComplete: ((code: string) => Promise<void>) | ((code: string) => void);
	onResend: () => Promise<void>;
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
		if (!canResend || isSubmitting) return;
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

		const combinedOtp = newOtp.join("");
		if (combinedOtp.length === length) {
			onComplete(combinedOtp);
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

	return (
		<Container>
			<InputGroup>
				{otp.map((digit, index) => (
					<InputBox
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						type="text"
						maxLength={1}
						value={digit}
						onChange={(e) => handleChange(e.target, index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						ref={(ref: HTMLInputElement | null) => {
							inputRefs.current[index] = ref;
							return undefined;
						}}
						disabled={isSubmitting}
						autoFocus={index === 0}
					/>
				))}
			</InputGroup>
			{error && <ErrorMessage>{error}</ErrorMessage>}
			<div>
				{canResend ? (
					<ResendButton
						type="button"
						onClick={handleResend}
						disabled={isSubmitting}
					>
						Didn't receive a code? Resend
					</ResendButton>
				) : (
					<Timer>Resend code in {resendTimer}s</Timer>
				)}
			</div>
		</Container>
	);
}
