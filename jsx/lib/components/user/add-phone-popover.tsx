import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Button } from "@/components/utility/button";
import { FormGroup } from "../utility/form";
import { OTPInput } from "../utility/otp-input";
import { PhoneNumberInput } from "../utility/phone";
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

interface PhoneAddPopoverProps {
  existingPhone?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onAddPhone: (phone: string, countryCode: string) => Promise<void>;
  onPrepareVerification: () => Promise<void>;
  onAttemptVerification: (otp: string) => Promise<void>;
}

export const PhoneAddPopover = ({
  onClose,
  onAddPhone,
  onAttemptVerification,
  existingPhone,
  onPrepareVerification,
  triggerRef,
}: PhoneAddPopoverProps) => {
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
      await onAddPhone(phoneNumber, countryCode || "");
      setStep("otp");
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to add phone number. Please try again.";
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
        "Failed to verify phone. Please check the code and try again.";
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
      {step === "phone" ? (
        <>
          <Title>Add phone number</Title>
          <FormGroup>
            <PhoneNumberInput
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={""}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
            />
          </FormGroup>
          <ButtonGroup>
            <Button
              $outline
              onClick={onClose}
              style={{ width: "auto", padding: "0 var(--space-6u)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhoneSubmit}
              disabled={!phoneNumber || loading}
              style={{ width: "auto", padding: "0 var(--space-6u)" }}
            >
              Continue
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <Title>Verify phone number</Title>
          <FormGroup>
            <OTPInput
              onComplete={(code) => setOtp(code)}
              onResend={async () => onPrepareVerification()}
            />
          </FormGroup>
          <ButtonGroup>
            <Button
              $outline
              onClick={onClose}
              style={{ width: "auto", padding: "0 var(--space-6u)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOTPSubmit}
              disabled={otp.length !== 6 || loading}
              style={{ width: "auto", padding: "0 var(--space-6u)" }}
            >
              Verify
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
