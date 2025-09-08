import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/utility/input";
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
        const popoverHeight = 400; // Approximate height for TOTP popover
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
    <PopoverContainer
      ref={popoverRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: position.top > 0 ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {step === "qr" ? (
        <>
          <Title>Setup Two-Factor Authentication</Title>
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              marginBottom: "16px",
            }}
          >
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-input-background)",
                }}
              >
                Loading...
              </div>
            ) : qrUrl ? (
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px",
                  background: "white",
                }}
              >
                <QRCodeSVG
                  value={qrUrl}
                  size={150}
                  title="QR Code for Two-Factor Authentication Setup"
                  aria-label="Scan this QR code with your authenticator app to set up two-factor authentication"
                />
              </div>
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-input-background)",
                  color: "var(--color-error)",
                }}
              >
                QR Code Not Available
              </div>
            )}
          </div>

          {secret && (
            <div
              style={{
                background: "var(--color-input-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "8px",
                marginBottom: "16px",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  color: "var(--color-secondary-text)",
                  marginBottom: "4px",
                }}
              >
                Or enter manually:
              </div>
              <code
                style={{
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  color: "var(--color-secondary-text)",
                }}
              >
                {secret}
              </code>
            </div>
          )}

          <ButtonGroup>
            <Button
              $primary
              onClick={() => setStep("verify")}
              disabled={loading || !qrUrl}
            >
              I've Scanned the Code
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <Title>Verify Your Authenticator</Title>
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              marginBottom: "16px",
            }}
          >
            Enter two consecutive codes from your authenticator app
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
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
              style={{ textAlign: "center", fontFamily: "monospace" }}
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
              style={{ textAlign: "center", fontFamily: "monospace" }}
              aria-label="Second verification code from authenticator app"
            />
          </div>

          <ButtonGroup>
            <Button onClick={() => setStep("qr")}>Back</Button>
            <Button
              $primary
              onClick={handleVerify}
              disabled={loading || codes.some((code) => code.length !== 6)}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
