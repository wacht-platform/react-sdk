import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FormGroup, Label } from "../utility/form";
import { OTPInput } from "../utility/otp-input";
import { PhoneNumberInput } from "../utility/phone";

const PopoverContainer = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid #e2e8f0;
  padding: 16px;
  width: 380px;
  z-index: 10;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${(props) => (props.$primary ? "#6366f1" : "white")};
  color: ${(props) => (props.$primary ? "white" : "#64748b")};
  border: 1px solid ${(props) => (props.$primary ? "#6366f1" : "#e2e8f0")};
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$primary ? "#4f46e5" : "#f8fafc")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8px;
`;

interface PhoneAddPopoverProps {
	existingPhone?: string;
	onClose: () => void;
	onAddPhone: (phone: string) => Promise<void>;
	onPrepareVerification: () => Promise<void>;
	onAttemptVerification: (otp: string) => Promise<void>;
}

export const PhoneAddPopover = ({
	onClose,
	onAddPhone,
	onAttemptVerification,
	existingPhone,
	onPrepareVerification,
}: PhoneAddPopoverProps) => {
	const popoverRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				popoverRef.current &&
				!popoverRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	const [step, setStep] = useState<"phone" | "otp">(
		existingPhone ? "otp" : "phone",
	);
	const [phoneNumber, setPhoneNumber] = useState(
		existingPhone?.replace(/^\+\d+/, "") || "",
	);
	const [countryCode, setCountryCode] = useState(
		Intl.DateTimeFormat().resolvedOptions().locale.split("-")?.pop(),
	);
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);

	const handlePhoneSubmit = async () => {
		if (!phoneNumber || loading) return;
		setLoading(true);
		try {
			await onAddPhone(`${countryCode}${phoneNumber}`);
			setStep("otp");
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	const handleOTPSubmit = async () => {
		setLoading(true);
		try {
			await onAttemptVerification(otp);
			onClose();
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	return (
		<PopoverContainer ref={popoverRef}>
			{step === "phone" ? (
				<>
					<Title>Add phone number</Title>
					<FormGroup>
						<Label>Phone Number</Label>
						<PhoneNumberInput
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							error={""}
							countryCode={countryCode}
							setCountryCode={setCountryCode}
						/>
					</FormGroup>
					<ButtonGroup>
						<Button onClick={onClose}>Cancel</Button>
						<Button
							$primary
							onClick={handlePhoneSubmit}
							disabled={!phoneNumber || loading}
						>
							Continue
						</Button>
					</ButtonGroup>
				</>
			) : (
				<>
					<Title>Verify phone number</Title>
					<FormGroup>
						<Label>Enter verification code</Label>
						<OTPInput
							onComplete={(code) => setOtp(code)}
							onResend={async () => onPrepareVerification()}
						/>
					</FormGroup>
					<ButtonGroup>
						<Button onClick={onClose}>Cancel</Button>
						<Button
							$primary
							onClick={handleOTPSubmit}
							disabled={otp.length !== 6 || loading}
						>
							Verify
						</Button>
					</ButtonGroup>
				</>
			)}
		</PopoverContainer>
	);
};
