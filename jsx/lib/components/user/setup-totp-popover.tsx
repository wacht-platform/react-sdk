import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/utility/input";
import { Button } from "@/components/utility/button";
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
  margin-bottom: var(--space-4u);
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
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
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
      {step === "qr" ? (
        <>
          <Title>Setup Two-Factor Authentication</Title>
          <div
            style={{
              fontSize: "var(--font-size-lg)",
              color: "var(--color-muted)",
              marginBottom: "var(--space-8u)",
            }}
          >
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "var(--space-8u)",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "calc(var(--size-50u) + var(--space-24u) + var(--space-1u))",
                  height: "calc(var(--size-50u) + var(--space-24u) + var(--space-1u))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "var(--border-width-thin) solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-input-background)",
                }}
              >
                Loading...
              </div>
            ) : qrUrl ? (
              <div
                style={{
                  border: "var(--border-width-thin) solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4u)",
                  background: "var(--color-foreground-inverse)",
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
                  width: "calc(var(--size-50u) + var(--space-24u) + var(--space-1u))",
                  height: "calc(var(--size-50u) + var(--space-24u) + var(--space-1u))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "var(--border-width-thin) solid var(--color-border)",
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
                border: "var(--border-width-thin) solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4u)",
                marginBottom: "var(--space-8u)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <div
                style={{
                  color: "var(--color-secondary-text)",
                  marginBottom: "var(--space-2u)",
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
              fontSize: "var(--font-size-lg)",
              color: "var(--color-muted)",
              marginBottom: "var(--space-8u)",
            }}
          >
            Enter two consecutive codes from your authenticator app
          </div>

          <div style={{ display: "flex", gap: "var(--space-4u)", marginBottom: "var(--space-8u)" }}>
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
            <Button $outline onClick={() => setStep("qr")}>Back</Button>
            <Button
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
