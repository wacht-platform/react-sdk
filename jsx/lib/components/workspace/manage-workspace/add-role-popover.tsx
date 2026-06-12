import { useState, useRef, useEffect, RefObject } from "react";
import { Input } from "@/components/utility/input";
import { Spinner } from "../../utility";
import { WorkspaceRole } from "@/types";
import { useDeployment } from "@/hooks/use-deployment";
import { ComboBoxMulti } from "../../utility/combo-box";
import { useScreenContext } from "../../organization/context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface CreateRoleData {
    id?: string;
    name: string;
    permissions: string[];
}

interface AddWorkspaceRolePopoverProps {
    onClose?: () => void;
    onSuccess?: (role: CreateRoleData) => void;
    role?: WorkspaceRole;
    triggerRef?: RefObject<HTMLElement | null>;
}

export const AddWorkspaceRolePopover = ({
    onClose,
    onSuccess,
    role,
    triggerRef,
}: AddWorkspaceRolePopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState(role?.name || "");
    const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();
    const position = usePopoverPosition({
        contentRef: popoverRef,
        triggerRef: triggerRef ?? { current: null },
        isOpen: mounted,
        minWidth: 400,
        defaultMaxHeight: 500,
    });

    const isEditing = !!role;

    const availablePermissions =
        deployment?.b2b_settings?.workspace_permissions ||
        deployment?.b2b_settings?.organization_permissions ||
        [];

    const permissionOptions = Array.isArray(availablePermissions)
        ? availablePermissions.map((perm: string) => ({ value: perm, label: perm }))
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
            toast(
                "Role name must be 2–50 characters, letters/numbers/spaces only.",
                "error",
            );
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
                visibility: position ? "visible" : "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="role-dialog-title"
            aria-modal="true"
        >
            <div className="w-pop-body">
                <div className="w-pop-title" id="role-dialog-title">
                    {isEditing ? "Edit role" : "New role"}
                </div>
                <label className="w-field">
                    <span className="w-label">Name</span>
                    <Input
                        type="text"
                        placeholder="e.g. Admin, Editor, Viewer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        aria-label="Role name"
                    />
                </label>
                <label className="w-field">
                    <span className="w-label">Permissions</span>
                    <ComboBoxMulti
                        options={permissionOptions}
                        value={permissions}
                        onChange={setPermissions}
                        placeholder="Select permissions"
                        aria-label="Select permissions for role"
                    />
                </label>
            </div>
            <div className="w-pop-foot">
                <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="w-btn w-btn--primary w-btn--sm"
                    onClick={handleSave}
                    disabled={!name || loading}
                >
                    {loading ? <Spinner size={12} /> : isEditing ? "Update" : "Create"}
                </button>
            </div>
        </div>
    );
};
