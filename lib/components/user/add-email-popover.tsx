import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { OTPInput } from "../utility/otp-input";

const PopoverContainer = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  z-index: 10;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${(props) =>
    props.$primary ? "var(--color-primary)" : "var(--color-background)"};
  color: ${(props) =>
    props.$primary ? "white" : "var(--color-secondary-text)"};
  border: 1px solid
    ${(props) =>
      props.$primary ? "var(--color-primary)" : "var(--color-border)"};
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$primary
        ? "var(--color-primary-hover)"
        : "var(--color-input-background)"};
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
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

interface EmailAddPopoverProps {
  existingEmail?: string;
  onClose: () => void;
  onAddEmail: (email: string) => Promise<void>;
  onPrepareVerification: () => Promise<void>;
  onAttemptVerification: (otp: string) => Promise<void>;
}

export const EmailAddPopover = ({
  onClose,
  onAddEmail,
  onAttemptVerification,
  onPrepareVerification,
  existingEmail,
}: EmailAddPopoverProps) => {
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
  const [step, setStep] = useState<"email" | "otp">(
    existingEmail ? "otp" : "email"
  );
  const [email, setEmail] = useState(existingEmail || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email || loading) return;
    setLoading(true);
    try {
      await onAddEmail(email);
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
      {step === "email" ? (
        <>
          <Title>Add email address</Title>
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              marginBottom: "10px",
            }}
          >
            You will have to verify this email address before you can start
            using it.
          </div>

          <FormGroup>
            <Label>Email address</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormGroup>
          <ButtonGroup>
            <Button
              $primary
              onClick={handleEmailSubmit}
              disabled={!email || loading}
              style={{ width: "100%" }}
            >
              {loading ? "Adding..." : "Continue"}
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <Title>Verify your email</Title>
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              marginBottom: "16px",
            }}
          >
            Enter the 6-digit code sent to {email}
          </div>
          <OTPInput
            onComplete={async (code) => setOtp(code)}
            onResend={onPrepareVerification}
            isSubmitting={loading}
          />

          <ButtonGroup>
            <Button
              $primary
              onClick={handleOTPSubmit}
              disabled={otp.length < 6 || loading}
              style={{ width: "100%" }}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
