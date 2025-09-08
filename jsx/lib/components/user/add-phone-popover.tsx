import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Button } from "@/components/utility/button";
import { FormGroup, Label } from "../utility/form";
import { OTPInput } from "../utility/otp-input";
import { PhoneNumberInput } from "../utility/phone";
import { useScreenContext } from "./context";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  max-width: calc(100vw - 48px);
  z-index: 1001;

  @media (max-width: 600px) {
    width: calc(100vw - 48px);
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
  margin-bottom: 12px;
`;

interface PhoneAddPopoverProps {
  existingPhone?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
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
  triggerRef,
}: PhoneAddPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { toast } = useScreenContext();

  useEffect(() => {
    setMounted(true);

    // Calculate position after a short delay
    const timer = setTimeout(() => {
      if (!popoverRef.current || !triggerRef?.current) return;

      const triggerButton = triggerRef.current;

      if (triggerButton) {
        const rect = triggerButton.getBoundingClientRect();
        const popoverWidth = 380;
        const popoverHeight = 300; // Approximate height
        const spacing = 8;

        let top = 0;
        let left = 0;

        // Check available space
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceTop = rect.top;

        // Prefer to open below if there's space
        if (spaceBottom >= popoverHeight + spacing) {
          top = rect.bottom + spacing;
          // Align to right edge of button (bottom-right)
          left = rect.right - popoverWidth;

          // If it goes off left edge, align to left edge of button instead (bottom-left)
          if (left < spacing) {
            left = rect.left;

            // If that also goes off right edge, center it on screen
            if (left + popoverWidth > window.innerWidth - spacing) {
              left = (window.innerWidth - popoverWidth) / 2;
            }
          }
        }
        // Otherwise open above
        else if (spaceTop >= popoverHeight + spacing) {
          top = rect.top - popoverHeight - spacing;
          // Align to right edge of button (top-right)
          left = rect.right - popoverWidth;

          // If it goes off left edge, align to left edge of button instead (top-left)
          if (left < spacing) {
            left = rect.left;

            // If that also goes off right edge, center it on screen
            if (left + popoverWidth > window.innerWidth - spacing) {
              left = (window.innerWidth - popoverWidth) / 2;
            }
          }
        }
        // If no space above or below, position it at the best available spot
        else {
          // Position at bottom with scrolling if needed
          top = rect.bottom + spacing;
          left = rect.right - popoverWidth;

          if (left < spacing) {
            left = rect.left;
          }
        }

        setPosition({ top, left });
      }
    }, 10);

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
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, triggerRef]);

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
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: position.top > 0 ? "visible" : "hidden",
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
              style={{ width: 'auto', padding: '0 var(--space-md)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhoneSubmit}
              disabled={!phoneNumber || loading}
              style={{ width: 'auto', padding: '0 var(--space-md)' }}
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
            <Button 
              $outline
              onClick={onClose}
              style={{ width: 'auto', padding: '0 var(--space-md)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOTPSubmit}
              disabled={otp.length !== 6 || loading}
              style={{ width: 'auto', padding: '0 var(--space-md)' }}
            >
              Verify
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
