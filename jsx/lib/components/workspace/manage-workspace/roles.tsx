import { useState, useRef, useMemo } from "react";
import { Trash2 } from "lucide-react";
import useSWR from "swr";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import { useDeployment } from "@/hooks/use-deployment";
import { useScreenContext } from "../../organization/context";
import { WorkspaceRole } from "@/types";
import {
    Button,
    SearchInput,
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
import {
    HeaderCTAContainer,
    IconButton,
    DesktopTableContainer,
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
} from "./shared";

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

    const [searchQuery, setSearchQuery] = useState("");
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

    const filteredRoles = useMemo(() => {
        if (!searchQuery) return roles;
        return roles.filter((role) =>
            role.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [roles, searchQuery]);

    const handleRoleSaved = async (role: any) => {
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
            <HeaderCTAContainer>
                <div style={{ flex: 1 }}>
                    <SearchInput
                        placeholder="Search roles..."
                        onChange={setSearchQuery}
                        value={searchQuery}
                    />
                </div>
                {deployment?.b2b_settings?.custom_workspace_role_enabled && (
                    <Button
                        $size="sm"
                        ref={addRoleButtonRef}
                        onClick={() => setRolePopover({ isOpen: true, triggerElement: addRoleButtonRef.current })}
                    >
                        Add Role
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

            {filteredRoles.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "No roles match" : "No roles yet"}
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
                                {filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div style={{ fontWeight: 500 }}>{role.name}</div>
                                        </TableCell>
                                        <TableCell style={{ color: "var(--color-secondary-text)" }}>
                                            {role.permissions?.join(", ")}
                                        </TableCell>
                                        <ActionsCell>
                                            <RoleActions
                                                role={role}
                                                onEdit={(el: any) => setRolePopover({ isOpen: true, role, triggerElement: el })}
                                                onDelete={() => setRoleForDeletion(role.id)}
                                                open={roleForOptionPopover === role.id}
                                                onOpenChange={(v: any) => setRoleForOptionPopover(v ? role.id : null)}
                                                dropdownButtonRefs={dropdownButtonRefs}
                                            />
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>

                    <MobileListContainer>
                        {filteredRoles.map((role) => (
                            <ConnectionItemRow key={role.id}>
                                <ConnectionLeft>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{role.name}</div>
                                        <div style={{ fontSize: "12px", color: "var(--color-secondary-text)" }}>
                                            {role.permissions?.join(", ")}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: "auto" }}>
                                        <RoleActions
                                            role={role}
                                            onEdit={(el: any) => setRolePopover({ isOpen: true, role, triggerElement: el })}
                                            onDelete={() => setRoleForDeletion(role.id)}
                                            open={roleForOptionPopover === role.id}
                                            onOpenChange={(v: any) => setRoleForOptionPopover(v ? role.id : null)}
                                            dropdownButtonRefs={dropdownButtonRefs}
                                        />
                                    </div>
                                </ConnectionLeft>
                            </ConnectionItemRow>
                        ))}
                    </MobileListContainer>
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

const RoleActions = ({ role, onEdit, onDelete, open, onOpenChange, dropdownButtonRefs }: any) => (
    <Dropdown open={open} openChange={onOpenChange}>
        <DropdownTrigger>
            <IconButton
                ref={(el) => { if (el) dropdownButtonRefs.current.set(role.id, el); }}
                disabled={!(role as any).workspace_id}
            >
                •••
            </IconButton>
        </DropdownTrigger>
        <DropdownItems>
            <DropdownItem onClick={() => onEdit(dropdownButtonRefs.current.get(role.id))}>Edit Role</DropdownItem>
            <DropdownItem $destructive onClick={onDelete}>
                <Trash2 size={16} /> Remove Role
            </DropdownItem>
        </DropdownItems>
    </Dropdown>
);
