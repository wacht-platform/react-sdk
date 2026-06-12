import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { Spinner } from "../utility";
import { ComboBox, ComboBoxOption } from "../utility/combo-box";
import { WorkspaceRole } from "@/types";
import { useScreenContext } from "../organization/context";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface InviteMemberPopoverProps {
  onClose?: () => void;
  onSuccess?: () => void;
  roles: WorkspaceRole[];
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const InviteMemberPopover = ({
  onClose,
  onSuccess,
  roles,
  triggerRef,
}: InviteMemberPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useScreenContext();
  const { inviteMember } = useActiveWorkspace();
  const position = usePopoverPosition({
    contentRef: popoverRef,
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 360,
    defaultMaxHeight: 320,
  });

  const roleOptions: ComboBoxOption[] = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  useEffect(() => {
    setMounted(true);

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    // Add escape key listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    // Delay adding the listener to prevent immediate closure
    const listenerTimer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(listenerTimer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !selectedRole) return;

    // Validate email format
    if (!validateEmail(trimmedEmail)) {
      toast("Please enter a valid email address", "error");
      return;
    }

    // Sanitize and validate email length
    if (trimmedEmail.length > 320) { // RFC 5321 limit
      toast("Email address is too long", "error");
      return;
    }

    setLoading(true);
    try {
      await inviteMember({ email: trimmedEmail, workspaceRoleId: selectedRole.id });
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send invitation. Please try again.";
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
      className="w-pop w-pop--wide"
      style={{
        position: "fixed",
        zIndex: 1001,
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="invite-workspace-member-title"
      aria-modal="true"
    >
      <div className="w-pop-body">
        <div className="w-pop-title" id="invite-workspace-member-title">Invite member</div>
        <FormGroup>
          <Label>Email Address</Label>
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            aria-label="Email address for workspace invitation"
            aria-describedby="workspace-email-help"
          />
        </FormGroup>

        <FormGroup>
          <Label>Role</Label>
          <ComboBox
            options={roleOptions}
            value={selectedRole?.id}
            onChange={(id) =>
              setSelectedRole(roles.find((role) => role.id === id)!)
            }
            placeholder="Select a role"
            aria-label="Select role for invited workspace member"
          />
        </FormGroup>
      </div>

      <div className="w-pop-foot">
        <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="w-btn w-btn--primary w-btn--sm"
          onClick={handleInvite}
          disabled={!email || !selectedRole || loading}
        >
          {loading ? <Spinner size={14} /> : "Send invite"}
        </button>
      </div>
    </div>
  );
};
