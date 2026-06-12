import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import type { WorkspaceRole } from "@/types";
import { useScreenContext } from "../organization/context";
import { Button, Input, Label, FormGroup } from "@/components/utility";
import { useDeployment } from "@/hooks/use-deployment";
import { ComboBoxMulti } from "@/components/utility/combo-box";

interface AddWorkspaceRolePopoverProps {
  onClose?: () => void;
  onSuccess?: (role: { id?: string; name: string; permissions?: string[] }) => void;
  role?: WorkspaceRole;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const AddWorkspaceRolePopover = ({
  onClose,
  onSuccess,
  role,
  triggerRef,
}: AddWorkspaceRolePopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(role?.name || "");
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions || []
  );
  const [loading, setLoading] = useState(false);
  const { deployment } = useDeployment();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { toast } = useScreenContext();
  const isEditing = !!role;

  const permissionOptions = (deployment?.b2b_settings?.workspace_permissions || []).map((perm) => ({
    value: perm,
    label: perm,
  }));

  useEffect(() => {
    setMounted(true);

    // Calculate position after a short delay
    const timer = setTimeout(() => {
      if (!popoverRef.current || !triggerRef?.current) return;

      const triggerButton = triggerRef.current;

      if (triggerButton) {
        const rect = triggerButton.getBoundingClientRect();
        const popoverWidth = 360;
        const popoverHeight = 250; // Approximate height
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
      clearTimeout(timer);
      clearTimeout(listenerTimer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, triggerRef]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const roleData = {
        id: role?.id,
        name: name.trim(),
        permissions: permissions,
      };

      onSuccess?.(roleData);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save role. Please try again.";
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
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: position.top > 0 ? 'visible' : 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-dialog-head">
        <h3 className="w-dialog-title">{isEditing ? "Edit Role" : "Add Role"}</h3>
        <button className="w-kebab" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="w-pop-body">
        <FormGroup>
          <Label>Role Name</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter role name"
            autoFocus
          />
        </FormGroup>

        <FormGroup>
          <Label>Permissions</Label>
          <ComboBoxMulti
            options={permissionOptions}
            value={permissions}
            onChange={setPermissions}
            placeholder="Select permissions"
          />
        </FormGroup>
      </div>

      <div className="w-pop-foot">
        <Button $outline onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim() || loading}>
          {loading ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
};
