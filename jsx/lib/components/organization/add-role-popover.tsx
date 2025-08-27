import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
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

const PopoverContainer = styled.div<{ $isInTable?: boolean }>`
  position: fixed;
  width: 400px;
  max-width: calc(100vw - 48px);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 1001;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  
  @media (max-width: 600px) {
    width: calc(100vw - 48px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-foreground);
`;

const Content = styled.div`
  padding: var(--space-md);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background-alt);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: var(--space-xs);
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.15s ease;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--color-foreground);
    background: var(--color-input-background);
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
  const {} = useActiveOrganization();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { deployment } = useDeployment();
  const { toast } = useScreenContext();

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
    
    // Calculate position after a short delay
    const timer = setTimeout(() => {
      if (!popoverRef.current) return;
      
      // Use triggerRef if available, otherwise fall back to existing logic
      let triggerButton: HTMLElement | null = null;
      
      if (triggerRef?.current) {
        triggerButton = triggerRef.current;
      } else if (isEditing) {
        // For edit popover, find the button with the role's data attribute
        const buttons = document.querySelectorAll('[data-role-dropdown-trigger]');
        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i] as HTMLElement;
          if (btn.offsetParent !== null) {
            triggerButton = btn;
            break;
          }
        }
      } else {
        // For add popover, find the "Add role" button
        const buttons = document.querySelectorAll('button');
        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i] as HTMLElement;
          if (btn.textContent === 'Add role' && btn.offsetParent !== null) {
            triggerButton = btn;
            break;
          }
        }
      }
      
      if (triggerButton) {
        const rect = triggerButton.getBoundingClientRect();
        const popoverWidth = 400;
        
        // Position below and aligned to right edge of trigger
        let top = rect.bottom + 8;
        let left = rect.right - popoverWidth;
        
        // Ensure it doesn't go off screen
        if (left < 10) {
          left = rect.left;
        }
        
        // If not enough space below, position above
        if (top + 300 > window.innerHeight) {
          top = rect.top - 300 - 8;
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
    
    // Delay adding the listeners to prevent immediate closure
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
  }, [onClose, isEditing, triggerRef]);

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
          top: `${position.top}px`,
          left: `${position.left}px`,
          visibility: position.top > 0 ? 'visible' : 'hidden'
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
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
