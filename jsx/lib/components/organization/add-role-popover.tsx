import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { Button, Spinner } from "../utility";
import { OrganizationRole } from "@/types";
import { useDeployment } from "@/hooks/use-deployment";
import { ComboBoxMulti } from "../utility/combo-box";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface CreateRoleData {
    id?: string;
    name: string;
    permissions: string[];
}

const PopoverContainer = styled.div`
    position: fixed;
    background: var(--color-popover);
    border-radius: 10px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-border);
    width: 400px;
    max-width: calc(100vw - 24px);
    z-index: 1001;
    overflow-y: auto;
    max-height: calc(100vh - 48px);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (max-width: 600px) {
        width: calc(100vw - 24px);
    }
`;

const Title = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: var(--color-popover-foreground);
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const FieldLabel = styled.label`
    font-size: 11px;
    font-weight: 500;
    color: var(--color-secondary-text);
`;

const Actions = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    & > button { width: 100%; }
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
    const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);
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
        deployment?.b2b_settings?.organization_permissions,
    )
        ? deployment.b2b_settings.organization_permissions.map((perm) => ({
              value: perm,
              label: perm,
          }))
        : [];

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose?.();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose?.();
        };
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const sanitizeRoleName = (n: string) => n.trim().replace(/[<>"'&]/g, "");
    const validateRoleName = (n: string) =>
        n.length >= 2 && n.length <= 50 && /^[a-zA-Z0-9\s_-]+$/.test(n);

    const handleSave = async () => {
        const sanitized = sanitizeRoleName(name);
        if (!sanitized) {
            toast("Please enter a role name", "error");
            return;
        }
        if (!validateRoleName(sanitized)) {
            toast("Role name must be 2–50 characters, letters/numbers/spaces only.", "error");
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
                name: sanitized,
                permissions,
            };
            onSuccess?.(roleData);
        } catch (error: any) {
            toast(
                error.message ||
                    `Failed to ${isEditing ? "update" : "create"} role. Please try again.`,
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <PopoverContainer
            ref={popoverRef}
            style={{
                top: position?.top !== undefined ? `${position.top}px` : undefined,
                bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
                left: position?.left !== undefined ? `${position.left}px` : undefined,
                right: position?.right !== undefined ? `${position.right}px` : undefined,
                visibility: position ? "visible" : "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="role-dialog-title"
            aria-modal="true"
        >
            <Title id="role-dialog-title">{isEditing ? "Edit role" : "New role"}</Title>
            <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                    type="text"
                    placeholder="e.g. Admin, Editor, Viewer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    aria-label="Role name"
                />
            </Field>
            <Field>
                <FieldLabel>Permissions</FieldLabel>
                <ComboBoxMulti
                    options={permissionOptions}
                    value={permissions}
                    onChange={setPermissions}
                    placeholder="Select permissions"
                    aria-label="Select permissions for role"
                />
            </Field>
            <Actions>
                <Button $size="sm" $outline onClick={onClose}>
                    Cancel
                </Button>
                <Button $size="sm" onClick={handleSave} disabled={!name || loading}>
                    {loading ? <Spinner size={12} /> : isEditing ? "Update" : "Create"}
                </Button>
            </Actions>
        </PopoverContainer>
    );
};
