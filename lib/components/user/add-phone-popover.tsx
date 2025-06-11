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
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 24px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  z-index: 10;
`;

export const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 12px;
  background: ${(props) => (props.$primary ? "var(--color-primary)" : "var(--color-background)")};
  color: ${(props) => (props.$primary ? "white" : "var(--color-secondary-text)")};
  border: 1px solid ${(props) => (props.$primary ? "var(--color-primary)" : "var(--color-border)")};
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  gap: 2px;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$primary ? "var(--color-primary-hover)" : "var(--color-input-background)")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
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
