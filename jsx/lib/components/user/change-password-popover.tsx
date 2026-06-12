import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/utility/input";
import { Label } from "../utility/form";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { usePopoverPosition } from "@/hooks/use-popover-position";

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
    contentRef: popoverRef,
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
    <div
      ref={popoverRef}
      className="w-pop"
      style={{
        position: "fixed",
        zIndex: 1001,
        width: 380,
        maxWidth: "calc(100vw - 24px)",
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-pop-body">
        <div className="w-flex-col w-gap-1">
          <div className="w-pop-title">{isSetup ? "Set Password" : "Change Password"}</div>
          <p className="w-pop-sub">
            {isSetup ? "Set a password for your account to enable password authentication." : "Update your account password to keep it secure."}
          </p>
        </div>

        {!isSetup && (
          <div className="w-field">
            <Label>Current Password</Label>
            <div className="w-input-wrap">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="w-input-eye"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
              >
                {showCurrentPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="w-input-err">{errors.currentPassword}</span>
            )}
          </div>
        )}

        <div className="w-field">
          <Label>{isSetup ? "Password" : "New Password"}</Label>
          <div className="w-input-wrap">
            <Input
              type={showNewPassword ? "text" : "password"}
              placeholder={isSetup ? "Enter your password" : "Enter your new password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="w-input-eye"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
            >
              {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <span className="w-input-err">{errors.newPassword}</span>
          )}
        </div>

        <div className="w-field">
          <Label>Confirm New Password</Label>
          <div className="w-input-wrap">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              className="w-input-eye"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="w-input-err">{errors.confirmPassword}</span>
          )}
        </div>

        {errors.form && <span className="w-input-err">{errors.form}</span>}
      </div>

      <div className="w-pop-foot">
        <button className="w-btn w-btn--secondary w-btn--sm" onClick={onClose}>Cancel</button>
        <button
          className="w-btn w-btn--primary w-btn--sm"
          style={{ width: "auto" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (isSetup ? "Setting..." : "Updating...") : (isSetup ? "Set Password" : "Update Password")}
        </button>
      </div>
    </div>
  );
};
