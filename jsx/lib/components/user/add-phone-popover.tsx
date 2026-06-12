import { useState, useRef, useEffect } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { OTPInput } from "../utility/otp-input";
import { PhoneNumberInput } from "../utility/phone";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

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
    contentRef: popoverRef,
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
    <div
      ref={popoverRef}
      className="w-pop"
      style={{
        position: "fixed",
        zIndex: 1001,
        maxWidth: "calc(100vw - 24px)",
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
          <div className="w-pop-body">
            <div className="w-pop-title">Add phone number</div>
            <label className="w-field">
              <span className="w-label">Phone number</span>
              <PhoneNumberInput
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={""}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
              />
            </label>
          </div>
          <div className="w-pop-foot">
            <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>Cancel</button>
            <button type="button" className="w-btn w-btn--primary w-btn--sm" onClick={handlePhoneSubmit} disabled={!phoneNumber || loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-pop-body">
            {!existingPhone && (
              <button
                type="button"
                className="w-link w-link--muted w-inline w-gap-1"
                style={{ alignSelf: "flex-start", background: "none", border: 0, cursor: "pointer" }}
                onClick={() => setStep("phone")}
              >
                <CaretLeft size={11} /> Back
              </button>
            )}
            <div className="w-flex-col w-gap-1">
              <div className="w-pop-title">Verify phone number</div>
              <p className="w-pop-sub">Enter the 6-digit code sent to <strong>{existingPhone || phoneNumber}</strong></p>
            </div>
            <OTPInput
              onComplete={(code) => setOtp(code)}
              onResend={async () => onPrepareVerification()}
              isSubmitting={loading}
            />
          </div>
          <div className="w-pop-foot">
            <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>Cancel</button>
            <button type="button" className="w-btn w-btn--primary w-btn--sm" onClick={handleOTPSubmit} disabled={otp.length !== 6 || loading}>
              {loading ? "Verifying…" : "Verify"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
