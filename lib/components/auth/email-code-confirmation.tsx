import { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  text-align: left;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 8px 12px;
  width: 100%;
  height: 35px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #F9FAFB;
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
  text-align: left;

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
`;

interface EmailCodeConfirmationProps {
	onSubmit: (code: string) => Promise<void>;
	onResend: () => Promise<void>;
	error?: string;
	isSubmitting?: boolean;
}

export function EmailCodeConfirmation({
	onSubmit,
	onResend,
	error,
	isSubmitting = false,
}: EmailCodeConfirmationProps) {
	const [code, setCode] = useState("");
	const [resendTimer, setResendTimer] = useState(60);
	const [canResend, setCanResend] = useState(false);

	// Start countdown timer when component mounts
	useState(() => {
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

		return () => clearInterval(timer);
	});

	const handleResend = async () => {
		if (!canResend || isSubmitting) return;

		try {
			await onResend();
			setCanResend(false);
			setResendTimer(60);
		} catch (err) {
			// Error handling is done by parent component
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || !code) return;

		try {
			await onSubmit(code);
		} catch (err) {
			// Error handling is done by parent component
		}
	};

	return (
		<Container>
			<form onSubmit={handleSubmit}>
				<FormGroup>
					<Label htmlFor="code">Verification code</Label>
					<Input
						type="text"
						id="code"
						name="code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="Enter verification code"
						aria-invalid={!!error}
						disabled={isSubmitting}
					/>
					{error && <ErrorMessage>{error}</ErrorMessage>}
				</FormGroup>
			</form>

			<div>
				{canResend ? (
					<ResendButton
						type="button"
						onClick={handleResend}
						disabled={isSubmitting}
					>
						Resend code
					</ResendButton>
				) : (
					<Timer>Resend code in {resendTimer}s</Timer>
				)}
			</div>
		</Container>
	);
}
