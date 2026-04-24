import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { CaretLeft } from "@phosphor-icons/react";
import { Button } from "@/components/utility/button";
import { OTPInput } from "../utility/otp-input";
import { PhoneNumberInput } from "../utility/phone";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-popover);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  width: 340px;
  max-width: calc(100vw - 24px);
  z-index: 1001;
  overflow: hidden;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 600px) {
    width: calc(100vw - 24px);
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-popover-foreground);
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  padding: 2px 4px 2px 2px;
  margin-left: -4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-secondary-text);
  cursor: pointer;
  border-radius: 4px;
  &:hover { color: var(--color-popover-foreground); }
`;

const Hint = styled.div`
  font-size: 12px;
  color: var(--color-secondary-text);
  line-height: 1.4;
  strong {
    color: var(--color-popover-foreground);
    font-weight: 500;
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  & > button { width: 100%; }
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
    minWidth: 340,
    defaultMaxHeight: 360,
  });

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const [step, setStep] = useState<"phone" | "otp">(existingPhone ? "otp" : "phone");
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
      toast(error.message || "Failed to add phone number. Please try again.", "error");
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
      toast(error.message || "Failed to verify phone. Check the code and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <PopoverContainer
      ref={popoverRef}
      style={{
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        visibility: position ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {step === "phone" ? (
        <>
          <TitleRow>
            <Title>Add phone number</Title>
          </TitleRow>
          <PhoneNumberInput
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            error={""}
            countryCode={countryCode}
            setCountryCode={setCountryCode}
          />
          <Actions>
            <Button $size="sm" $outline onClick={onClose}>Cancel</Button>
            <Button $size="sm" onClick={handlePhoneSubmit} disabled={!phoneNumber || loading}>
              {loading ? "Sending…" : "Send code"}
            </Button>
          </Actions>
        </>
      ) : (
        <>
          <TitleRow>
            {!existingPhone ? (
              <BackBtn onClick={() => setStep("phone")}>
                <CaretLeft size={11} /> Back
              </BackBtn>
            ) : <span />}
          </TitleRow>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Title>Verify phone number</Title>
            <Hint>Enter the 6-digit code sent to <strong>{existingPhone || phoneNumber}</strong></Hint>
          </div>
          <OTPInput
            onComplete={(code) => setOtp(code)}
            onResend={async () => onPrepareVerification()}
            isSubmitting={loading}
          />
          <Actions>
            <Button $size="sm" $outline onClick={onClose}>Cancel</Button>
            <Button $size="sm" onClick={handleOTPSubmit} disabled={otp.length !== 6 || loading}>
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </Actions>
        </>
      )}
    </PopoverContainer>
  );
};
