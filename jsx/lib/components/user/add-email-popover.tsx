import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { Input } from "@/components/utility/input";
import { Button } from "@/components/utility/button";
import { FormGroup } from "../utility/form";
import { OTPInput } from "../utility/otp-input";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-popover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--space-8u);
  width: calc(calc(var(--size-50u) * 3) + var(--size-40u));
  max-width: calc(100vw - var(--space-24u));
  z-index: 1001;

  @media (max-width: 600px) {
    width: calc(100vw - var(--space-24u));
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-4u);
  justify-content: flex-end;
  margin-top: var(--space-8u);
`;

const Title = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-popover-foreground);
  margin-bottom: var(--space-6u);
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4u);
`;

const IconWrapper = styled.div`
  width: var(--size-20u);
  height: calc(var(--size-18u) + var(--space-1u));
  border-radius: var(--radius-2xs);
  background: var(--color-background, var(--color-background));
  border: var(--border-width-thin) solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  flex-shrink: 0;
`;

interface EmailAddPopoverProps {
  existingEmail?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
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
  triggerRef,
}: EmailAddPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 380,
    defaultMaxHeight: 360,
  });

  useEffect(() => {
    setMounted(true);

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Add escape key listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);
  const [step, setStep] = useState<"email" | "otp">(
    existingEmail ? "otp" : "email",
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
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to add email address. Please try again.";
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    setLoading(true);
    try {
      await onAttemptVerification(otp);
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.message ||
        "Failed to verify email. Please check the code and try again.";
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <PopoverContainer
      ref={popoverRef}
      style={{
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {step === "email" ? (
        <>
          <Title>Add email address</Title>
          <FormGroup>
            <InputWrapper>
              <IconWrapper>
                <EnvelopeSimple size={16} />
              </IconWrapper>
              <Input
                id="email-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ flex: 1 }}
              />
            </InputWrapper>
          </FormGroup>
          <ButtonGroup>
            <Button
              $outline
              onClick={onClose}
              style={{ width: 'auto', padding: '0 var(--space-6u)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmailSubmit}
              disabled={!email || loading}
              style={{ width: 'auto', padding: '0 var(--space-6u)' }}
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
              fontSize: "var(--font-size-lg)",
              color: "var(--color-muted)",
              marginBottom: "var(--space-8u)",
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
              $outline
              onClick={() => setStep("email")}
              style={{ width: 'auto', padding: '0 var(--space-6u)' }}
            >
              Back
            </Button>
            <Button
              onClick={handleOTPSubmit}
              disabled={otp.length < 6 || loading}
              style={{ width: 'auto', padding: '0 var(--space-6u)' }}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
