import { useState, useRef, useEffect } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { Input } from "@/components/utility/input";
import { OTPInput } from "../utility/otp-input";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

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

  const [step, setStep] = useState<"email" | "otp">(existingEmail ? "otp" : "email");
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
      toast(error.message || "Failed to add email. Please try again.", "error");
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
      toast(error.message || "Failed to verify email. Check the code and try again.", "error");
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
      {step === "email" ? (
        <>
          <div className="w-pop-body">
            <div className="w-pop-title">Add email address</div>
            <label className="w-field">
              <span className="w-label">Email address</span>
              <Input
                id="email-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEmailSubmit(); }}
                autoFocus
              />
            </label>
          </div>
          <div className="w-pop-foot">
            <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>Cancel</button>
            <button type="button" className="w-btn w-btn--primary w-btn--sm" onClick={handleEmailSubmit} disabled={!email || loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-pop-body">
            {!existingEmail && (
              <button
                type="button"
                className="w-link w-link--muted w-inline w-gap-1"
                style={{ alignSelf: "flex-start", background: "none", border: 0, cursor: "pointer" }}
                onClick={() => setStep("email")}
              >
                <CaretLeft size={11} /> Back
              </button>
            )}
            <div className="w-flex-col w-gap-1">
              <div className="w-pop-title">Verify your email</div>
              <p className="w-pop-sub">Enter the 6-digit code sent to <strong>{email}</strong></p>
            </div>
            <OTPInput
              onComplete={async (code) => setOtp(code)}
              onResend={onPrepareVerification}
              isSubmitting={loading}
            />
          </div>
          <div className="w-pop-foot">
            <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>Cancel</button>
            <button type="button" className="w-btn w-btn--primary w-btn--sm" onClick={handleOTPSubmit} disabled={otp.length < 6 || loading}>
              {loading ? "Verifying…" : "Verify"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
