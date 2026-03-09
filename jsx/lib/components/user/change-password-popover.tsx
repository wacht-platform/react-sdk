import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { Button } from "@/components/utility/button";
import { Label } from "../utility/form";
import { Eye, EyeOff } from "lucide-react";
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

const StyledFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2u);
  margin-bottom: var(--space-6u);
`;

const PasswordInput = styled.div`
  position: relative;
  
  button {
    position: absolute;
    right: var(--space-6u);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--color-secondary-text);
    
    &:hover {
      color: var(--color-foreground);
    }
  }
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--space-2u);
`;

interface ChangePasswordPopoverProps {
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isSetup?: boolean;
}

export const ChangePasswordPopover = ({
  onClose,
  onChangePassword,
  triggerRef,
  isSetup = false,
}: ChangePasswordPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const position = usePopoverPosition({
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 380,
    defaultMaxHeight: 420,
  });

  useEffect(() => {
    setMounted(true);

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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

  const handleSubmit = async () => {
    if (loading) return;

    const newErrors: Record<string, string> = {};

    if (!isSetup && !currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onChangePassword(isSetup ? "" : currentPassword, newPassword);
      onClose();
    } catch (error: any) {
      setErrors({ form: error.message || "Failed to update password" });
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
        visibility: position ? "visible" : "hidden"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Title>{isSetup ? "Set Password" : "Change Password"}</Title>
      <div
        style={{
          fontSize: "var(--font-size-lg)",
          color: "var(--color-muted)",
          marginBottom: "var(--space-8u)",
        }}
      >
        {isSetup ? "Set a password for your account to enable password authentication." : "Update your account password to keep it secure."}
      </div>

      {!isSetup && (
        <StyledFormGroup>
          <Label>Current Password</Label>
          <PasswordInput>
            <Input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ paddingRight: "var(--size-20u)" }}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </PasswordInput>
          {errors.currentPassword && (
            <ErrorMessage>{errors.currentPassword}</ErrorMessage>
          )}
        </StyledFormGroup>
      )}

      <StyledFormGroup>
        <Label>{isSetup ? "Password" : "New Password"}</Label>
        <PasswordInput>
          <Input
            type={showNewPassword ? "text" : "password"}
            placeholder={isSetup ? "Enter your password" : "Enter your new password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ paddingRight: "var(--size-20u)" }}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </PasswordInput>
        {errors.newPassword && (
          <ErrorMessage>{errors.newPassword}</ErrorMessage>
        )}
      </StyledFormGroup>

      <StyledFormGroup>
        <Label>Confirm New Password</Label>
        <PasswordInput>
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ paddingRight: "var(--size-20u)" }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </PasswordInput>
        {errors.confirmPassword && (
          <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
        )}
      </StyledFormGroup>

      {errors.form && <ErrorMessage>{errors.form}</ErrorMessage>}

      <ButtonGroup>
        <Button $outline onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (isSetup ? "Setting..." : "Updating...") : (isSetup ? "Set Password" : "Update Password")}
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};
