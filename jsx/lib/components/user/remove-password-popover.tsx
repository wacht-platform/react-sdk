import { useState, useRef, useEffect } from "react";
import { Warning } from "@phosphor-icons/react";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface RemovePasswordPopoverProps {
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onRemovePassword: (currentPassword: string) => Promise<void>;
}

export const RemovePasswordPopover = ({
  onClose,
  onRemovePassword,
  triggerRef,
}: RemovePasswordPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
    contentRef: popoverRef,
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 400,
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

  const handleSubmit = async () => {
    if (!currentPassword || loading) return;

    setLoading(true);
    try {
      await onRemovePassword(currentPassword);
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to remove password. Please try again.";
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
      <div className="w-pop-body">
        <div className="w-pop-title">Remove Password</div>

        <div className="w-banner w-banner--warn">
          <Warning size={16} />
          <span className="w-banner-txt">
            You're about to remove password authentication from your account.
            Make sure you have another way to sign in (email, phone, social login, or passkey)
            before continuing.
          </span>
        </div>

        <FormGroup>
          <Label htmlFor="current-password">Confirm your current password</Label>
          <Input
            id="current-password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoFocus
          />
        </FormGroup>
      </div>

      <div className="w-pop-foot">
        <button className="w-btn w-btn--secondary w-btn--sm" onClick={onClose}>
          Cancel
        </button>
        <button
          className="w-btn w-btn--danger-solid w-btn--sm"
          onClick={handleSubmit}
          disabled={!currentPassword || loading}
        >
          {loading ? "Removing..." : "Remove Password"}
        </button>
      </div>
    </div>
  );
};
