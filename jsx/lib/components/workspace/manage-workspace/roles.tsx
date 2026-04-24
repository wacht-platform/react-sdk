import { useState, useRef } from "react";
import { Trash } from "@phosphor-icons/react";
import useSWR from "swr";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import { useDeployment } from "@/hooks/use-deployment";
import { useScreenContext } from "../../organization/context";
import { WorkspaceRole } from "@/types";
import {
    Button,
    Spinner,
    Dropdown,
    DropdownItems,
    DropdownItem,
    DropdownTrigger,
} from "@/components/utility";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ActionsCell,
} from "@/components/utility/table";
import { EmptyState } from "@/components/utility/empty-state";
import { AddWorkspaceRolePopover } from "./add-role-popover";
import { ConfirmationPopover } from "../../utility/confirmation-popover";
import { canEditWorkspaceRole } from "@/utils/roles";
import {
    HeaderCTAContainer,
    IconButton,
    DesktopTableContainer,
} from "./shared";
import styled from "styled-components";

const RoleNameRow = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    flex-wrap: wrap;
`;

const RoleName = styled.div`
    font-weight: 500;
`;

const RoleBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: var(--space-1u) var(--space-3u);
    border-radius: var(--radius-full);
    background: var(--color-secondary);
    color: var(--color-secondary-foreground);
    font-size: var(--font-size-sm);
    line-height: 1;
`;

const PermissionText = styled.div`
    color: var(--color-secondary-text);
`;

export const RolesSection = () => {
    const {
        activeWorkspace,
        loading,
        getRoles,
        createRole,
        deleteRole,
    } = useActiveWorkspace();
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();

    const [rolePopover, setRolePopover] = useState<{
        isOpen: boolean;
        role?: WorkspaceRole;
        triggerElement?: HTMLElement | null;
    }>({ isOpen: false });
    const [roleForDeletion, setRoleForDeletion] = useState<string | null>(null);
    const [roleForOptionPopover, setRoleForOptionPopover] = useState<string | null>(null);
    const addRoleButtonRef = useRef<HTMLButtonElement>(null);
    const dropdownButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const {
        data: roles = [],
        isLoading: rolesLoading,
        mutate: reloadRoles,
    } = useSWR(
        activeWorkspace ? `wacht-api-workspaces:${activeWorkspace.id}:roles` : null,
        () => getRoles() || [],
    );

    const handleRoleSaved = async (role: {
        id?: string;
        name: string;
        permissions?: string[];
    }) => {
        try {
            await createRole(role.name, role.permissions || []);
            toast("Role saved successfully", "info");
            setRolePopover({ isOpen: false });
            reloadRoles();
        } catch (error) {
            toast("Failed to save role", "error");
        }
    };

    const handleDeleteRole = async (role: WorkspaceRole) => {
        try {
            await deleteRole(role);
            toast("Role deleted", "info");
            setRoleForDeletion(null);
            reloadRoles();
        } catch (error) {
            toast("Failed to delete role", "error");
        }
    };

    if (loading || rolesLoading) return <Spinner />;

    return (
        <>
            <HeaderCTAContainer style={{ marginBottom: "var(--space-6u)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-card-foreground)" }}>
                        Roles
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-secondary-text)", marginTop: 2 }}>
                        Define granular permissions for this workspace.
                    </div>
                </div>
                {deployment?.b2b_settings?.custom_workspace_role_enabled && (
                    <Button
                        ref={addRoleButtonRef}
                        onClick={() => setRolePopover({ isOpen: true, triggerElement: addRoleButtonRef.current })}
                        $size="sm"
                    >
                        Add role
                    </Button>
                )}
            </HeaderCTAContainer>

            {rolePopover.isOpen && !rolePopover.role && (
                <AddWorkspaceRolePopover
                    triggerRef={{ current: rolePopover.triggerElement || null }}
                    onClose={() => setRolePopover({ isOpen: false })}
                    onSuccess={handleRoleSaved}
                />
            )}

            {roles.length === 0 ? (
                <EmptyState
                    title="No roles yet"
                    description="Create workspace-specific roles to manage access."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Role</TableHeader>
                                    <TableHeader>Permissions</TableHeader>
                                    <TableHeader></TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <RoleNameRow>
                                                <RoleName>{role.name}</RoleName>
                                                {!canEditWorkspaceRole(role) && (
                                                    <RoleBadge>Default</RoleBadge>
                                                )}
                                            </RoleNameRow>
                                        </TableCell>
                                        <TableCell>
                                            <PermissionText>
                                            {role.permissions?.join(", ")}
                                            {!canEditWorkspaceRole(role) &&
                                                " • Cannot be edited or deleted"}
                                            </PermissionText>
                                        </TableCell>
                                        <ActionsCell>
                                            <RoleActions
                                                role={role}
                                                onEdit={(el) => setRolePopover({ isOpen: true, role, triggerElement: el })}
                                                onDelete={() => setRoleForDeletion(role.id)}
                                                open={roleForOptionPopover === role.id}
                                                onOpenChange={(v) => setRoleForOptionPopover(v ? role.id : null)}
                                                dropdownButtonRefs={dropdownButtonRefs}
                                            />
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>
                </>
            )}

            {roleForDeletion && (
                <ConfirmationPopover
                    title="Delete role?"
                    description="Are you sure? This will remove the role from all workspace members."
                    onConfirm={() => {
                        const role = roles.find(r => r.id === roleForDeletion);
                        if (role) handleDeleteRole(role);
                    }}
                    onCancel={() => setRoleForDeletion(null)}
                />
            )}

            {rolePopover.isOpen && rolePopover.role && (
                <AddWorkspaceRolePopover
                    role={rolePopover.role}
                    triggerRef={{ current: rolePopover.triggerElement || null }}
                    onClose={() => setRolePopover({ isOpen: false })}
                    onSuccess={handleRoleSaved}
                />
            )}
        </>
    );
};

interface WorkspaceRoleActionsProps {
    role: WorkspaceRole;
    onEdit: (triggerElement: HTMLElement | null) => void;
    onDelete: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dropdownButtonRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

const RoleActions = ({
    role,
    onEdit,
    onDelete,
    open,
    onOpenChange,
    dropdownButtonRefs,
}: WorkspaceRoleActionsProps) => {
    const editable = canEditWorkspaceRole(role);

    if (!editable) {
        return (
            <IconButton
                disabled
                title="Deployment roles cannot be edited"
                aria-label="Deployment roles cannot be edited"
            >
                •••
            </IconButton>
        );
    }

    return (
        <Dropdown open={open} openChange={onOpenChange}>
            <DropdownTrigger>
                <IconButton
                    ref={(el) => {
                        if (el) dropdownButtonRefs.current.set(role.id, el);
                    }}
                >
                    •••
                </IconButton>
            </DropdownTrigger>
            <DropdownItems>
                <DropdownItem
                    onClick={() => onEdit(dropdownButtonRefs.current.get(role.id) ?? null)}
                >
                    Edit Role
                </DropdownItem>
                <DropdownItem $destructive onClick={onDelete}>
                    <Trash size={16} /> Remove Role
                </DropdownItem>
            </DropdownItems>
        </Dropdown>
    );
};
