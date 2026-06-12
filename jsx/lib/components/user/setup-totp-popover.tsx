import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/utility/input";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface SetupTOTPPopoverProps {
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onSetupTOTP: () => Promise<{
    otp_url?: string;
    totp_secret?: string;
    id: string;
  }>;
  onVerifyTOTP: (codes: string[]) => Promise<void>;
}

export const SetupTOTPPopover = ({
  onClose,
  onSetupTOTP,
  onVerifyTOTP,
  triggerRef,
}: SetupTOTPPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"qr" | "verify">("qr");
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
    contentRef: popoverRef,
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 380,
    defaultMaxHeight: 460,
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

  useEffect(() => {
    const setupTOTP = async () => {
      setLoading(true);
      try {
        const result = await onSetupTOTP();
        setQrUrl(result.otp_url || "");
        setSecret(result.totp_secret || "");
      } catch (error: any) {
        const errorMessage =
          error.message ||
          "Failed to setup two-factor authentication. Please try again.";
        toast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    };
    setupTOTP();
  }, []);

  const handleVerify = async () => {
    if (codes.some((code) => code.length !== 6)) return;

    setLoading(true);
    try {
      await onVerifyTOTP(codes);
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.message ||
        "Failed to verify codes. Please check your authenticator app and try again.";
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className="w-pop"
      style={{
        position: "fixed",
        zIndex: 1001,
        width: 340,
        maxWidth: "calc(100vw - 24px)",
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {step === "qr" ? (
        <>
          <div className="w-pop-body">
            <div className="w-flex-col w-gap-1">
              <div className="w-pop-title">Setup Two-Factor Authentication</div>
              <p className="w-pop-sub">
                Scan this QR code with your authenticator app (Google Authenticator,
                Authy, etc.)
              </p>
            </div>

            <div className="w-flex w-justify-center">
              {loading ? (
                <div className="w-qr w-text-muted">Loading...</div>
              ) : qrUrl ? (
                <div className="w-qr" style={{ background: "#fff", padding: 8 }}>
                  <QRCodeSVG
                    value={qrUrl}
                    size={130}
                    title="QR Code for Two-Factor Authentication Setup"
                    aria-label="Scan this QR code with your authenticator app to set up two-factor authentication"
                  />
                </div>
              ) : (
                <div className="w-qr w-text-error">QR Code Not Available</div>
              )}
            </div>

            {secret && (
              <div className="w-flex-col w-gap-1">
                <span className="w-secsub">Or enter manually:</span>
                <div className="w-token">
                  <code style={{ wordBreak: "break-all" }}>{secret}</code>
                </div>
              </div>
            )}
          </div>

          <div className="w-pop-foot">
            <button
              className="w-btn w-btn--primary w-btn--sm"
              style={{ width: "auto" }}
              onClick={() => setStep("verify")}
              disabled={loading || !qrUrl}
            >
              I've Scanned the Code
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-pop-body">
            <div className="w-flex-col w-gap-1">
              <div className="w-pop-title">Verify Your Authenticator</div>
              <p className="w-pop-sub">
                Enter two consecutive codes from your authenticator app
              </p>
            </div>

            <div className="w-flex w-gap-2">
              <Input
                id="totp-code-1"
                type="text"
                placeholder="000000"
                value={codes[0]}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .substring(0, 6);
                  setCodes([value, codes[1]]);
                }}
                maxLength={6}
                style={{ textAlign: "center", fontFamily: "var(--wa-font-mono)" }}
                aria-label="First verification code from authenticator app"
              />
              <Input
                id="totp-code-2"
                type="text"
                placeholder="000000"
                value={codes[1]}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .substring(0, 6);
                  setCodes([codes[0], value]);
                }}
                maxLength={6}
                style={{ textAlign: "center", fontFamily: "var(--wa-font-mono)" }}
                aria-label="Second verification code from authenticator app"
              />
            </div>
          </div>

          <div className="w-pop-foot">
            <button className="w-btn w-btn--secondary w-btn--sm" onClick={() => setStep("qr")}>Back</button>
            <button
              className="w-btn w-btn--primary w-btn--sm"
              style={{ width: "auto" }}
              onClick={handleVerify}
              disabled={loading || codes.some((code) => code.length !== 6)}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
