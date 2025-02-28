import { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const InputBox = styled.input`
  width: 40px;
  height: 40px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 18px;
  color: #111827;
  background: #F9FAFB;
  text-align: center;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: white;
  }

  &::placeholder {
    color: #9CA3AF;
  }
`;

const ErrorMessage = styled.p`
  font-size: 12px;
  color: #EF4444;
  margin: 0;
  margin-top: 2px;
  text-align: center;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #6366F1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
  text-align: center;
  width: 100%;

  &:hover:not(:disabled) {
    color: #4F46E5;
  }

  &:disabled {
    color: #9CA3AF;
    cursor: not-allowed;
  }
`;

const Timer = styled.span`
  color: #6B7280;
  font-size: 14px;
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
