import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { Spinner } from "../utility";
import { OrganizationRole } from "@/types";
import { useDeployment } from "@/hooks/use-deployment";
import { ComboBoxMulti } from "../utility/combo-box";
import { useActiveOrganization } from "@/hooks/use-organization";

const PopoverContainer = styled.div`
  position: absolute;
  right: 0;
  margin-top: 8px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  z-index: 10;
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
  margin-bottom: 16px;
`;

interface AddRolePopoverProps {
  onClose?: () => void;
  onSuccess?: (role: OrganizationRole) => void;
  role?: OrganizationRole;
}

export const AddRolePopover = ({
  onClose,
  onSuccess,
  role,
}: AddRolePopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(role?.name || "");
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions || []
  );
  const {} = useActiveOrganization();
  const [loading, setLoading] = useState(false);
  const { deployment } = useDeployment();

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const roleData: any = {
        id: role?.id,
        name: name || "",
        permissions: permissions || [],
      };
      onSuccess?.(roleData);
    } catch (error) {
      console.error("Failed to save role", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PopoverContainer ref={popoverRef}>
      <Title>{isEditing ? "Edit role" : "Create new role"}</Title>
      <FormGroup>
        <Label>Role Name</Label>
        <Input
          type="text"
          placeholder="e.g. Admin, Editor, Viewer"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormGroup>
      <FormGroup style={{ marginTop: "12px" }}>
        <Label>Permissions</Label>
        <ComboBoxMulti
          options={permissionOptions}
          value={permissions}
          onChange={setPermissions}
          placeholder="Select permissions"
        />
      </FormGroup>
      <ButtonGroup>
        <Button onClick={onClose}>Cancel</Button>
        <Button $primary onClick={handleSave} disabled={!name || loading}>
          {loading ? (
            <>
              <Spinner /> {isEditing ? "Updating..." : "Creating..."}
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
