import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { X } from "@phosphor-icons/react";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { Button, Spinner } from "../utility";
import { OrganizationRole } from "@/types";

interface CreateRoleData {
  id?: string;
  name: string;
  permissions: string[];
}
import { useDeployment } from "@/hooks/use-deployment";
import { ComboBoxMulti } from "../utility/combo-box";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div<{ $isInTable?: boolean }>`
  position: fixed;
  width: calc(var(--size-50u) * 4);
  max-width: calc(100vw - var(--space-24u));
  background: var(--color-popover);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 1001;
  max-height: calc(100vh - var(--size-50u));
  overflow-y: auto;
  
  @media (max-width: 600px) {
    width: calc(100vw - var(--space-24u));
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4u) var(--space-6u);
  border-bottom: var(--border-width-thin) solid var(--color-border);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--color-popover-foreground);
`;

const Content = styled.div`
  padding: var(--space-6u);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-2u);
  justify-content: flex-end;
  padding: var(--space-4u) var(--space-6u);
  border-top: var(--border-width-thin) solid var(--color-border);
  background: var(--color-secondary);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: var(--space-2u);
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.15s ease;
  border-radius: var(--radius-2xs);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--color-accent-foreground);
    background: var(--color-accent);
  }
`;

interface AddRolePopoverProps {
  onClose?: () => void;
  onSuccess?: (role: CreateRoleData) => void;
  role?: OrganizationRole;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const AddRolePopover = ({
  onClose,
  onSuccess,
  role,
  triggerRef,
}: AddRolePopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(role?.name || "");
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions || []
  );
  const { } = useActiveOrganization();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { deployment } = useDeployment();
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 400,
    defaultMaxHeight: 500,
  });

  const isEditing = !!role;

  const permissionOptions = Array.isArray(
    deployment?.b2b_settings?.organization_permissions
  )
    ? deployment.b2b_settings.organization_permissions.map((perm) => ({
      value: perm,
      label: perm,
    }))
    : [];

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

    // Delay adding the listeners to prevent immediate closure
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

  const sanitizeRoleName = (name: string): string => {
    return name.trim().replace(/[<>\"'&]/g, ''); // Remove potentially dangerous characters
  };

  const validateRoleName = (name: string): boolean => {
    return name.length >= 2 && name.length <= 50 && /^[a-zA-Z0-9\s_-]+$/.test(name);
  };

  const handleSave = async () => {
    const sanitizedName = sanitizeRoleName(name);

    if (!sanitizedName) {
      toast("Please enter a role name", "error");
      return;
    }

    if (!validateRoleName(sanitizedName)) {
      toast("Role name must be 2-50 characters and contain only letters, numbers, spaces, underscores, and hyphens", "error");
      return;
    }

    if (permissions.length === 0) {
      toast("Please select at least one permission", "error");
      return;
    }

    setLoading(true);
    try {
      const roleData: CreateRoleData = {
        id: role?.id,
        name: sanitizedName,
        permissions: permissions || [],
      };
      onSuccess?.(roleData);
    } catch (error: any) {
      const errorMessage = error.message || `Failed to ${isEditing ? 'update' : 'create'} role. Please try again.`;
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
      $isInTable={isEditing}
      style={{
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden"
      }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="role-dialog-title"
      aria-modal="true"
    >
      <Header>
        <Title id="role-dialog-title">{isEditing ? "Edit Role" : "Create New Role"}</Title>
        <CloseButton onClick={onClose} aria-label={`Close ${isEditing ? 'edit' : 'create'} role dialog`}>
          <X size={16} />
        </CloseButton>
      </Header>

      <Content>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4u)" }}>
          <FormGroup>
            <Label>Role Name</Label>
            <Input
              type="text"
              placeholder="e.g. Admin, Editor, Viewer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              aria-label="Role name"
              aria-describedby="role-name-help"
            />
          </FormGroup>

          <FormGroup>
            <Label>Permissions</Label>
            <ComboBoxMulti
              options={permissionOptions}
              value={permissions}
              onChange={setPermissions}
              placeholder="Select permissions"
              aria-label="Select permissions for role"
            />
          </FormGroup>
        </div>
      </Content>

      <ButtonGroup>
        <Button
          $outline
          onClick={onClose}
          style={{
            width: "auto",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name || loading}
          style={{
            width: "auto",
          }}
        >
          {loading ? (
            <>
              <Spinner size={14} /> {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Role"
          ) : (
            "Create Role"
          )}
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};
