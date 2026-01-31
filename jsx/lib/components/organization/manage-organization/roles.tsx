import { useState, useRef, useMemo } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import useSWR from "swr";
import { Organization, OrganizationRole } from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks/use-deployment";
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
import { AddRolePopover } from "../add-role-popover";
import { ConfirmationPopover } from "../../utility/confirmation-popover";
import {
    HeaderCTAContainer,
    IconButton,
    DesktopTableContainer,
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
} from "./shared";

export const RolesSection = ({ organization }: { organization: Organization }) => {
    const { getOrganizationRoles: getRoles, removeOrganizationRoles: removeRole } =
        useOrganizationList();
    const { deployment } = useDeployment();

    const [rolePopover, setRolePopover] = useState<{
        isOpen: boolean;
        role?: OrganizationRole;
    }>({ isOpen: false });

    const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [roleForDeletion, setRoleForDeletion] = useState<string | null>(null);
    const addRoleButtonRef = useRef<HTMLButtonElement>(null);

    const {
        data: roles = [],
        isLoading: rolesLoading,
        mutate: reloadRoles,
    } = useSWR(
        organization ? `wacht-api-organizations:${organization.id}:roles` : null,
        () => getRoles?.(organization) || [],
    );

    const filteredRoles = useMemo(() => {
        if (!searchQuery) return roles;
        return roles.filter((role) =>
            role.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [roles, searchQuery]);

    const handleRoleSaved = async (role: {
        id?: string;
        name: string;
        description?: string;
    }) => {
        try {
            // Mock delay as found in original code
            await new Promise((resolve) => setTimeout(resolve, 500));

            setMessage({
                text: `Role ${role.id ? "updated" : "created"} successfully`,
                type: "success",
            });

            setRolePopover({ isOpen: false });
            reloadRoles();
        } catch (error: any) {
            setMessage({
                text: error.message || "Failed to save role",
                type: "error",
            });
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteRole = async (role: OrganizationRole) => {
        try {
            await removeRole(organization, role);
            reloadRoles();
            setRoleForDeletion(null);
        } catch (error) {
            // handled by caller or generic error
        }
    };

    if (rolesLoading && roles.length === 0) return <Spinner />;

    return (
        <>
            {message && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "12px 16px",
                        background: message.type === "success" ? "var(--color-success-background)" : "var(--color-error-background)",
                        color: message.type === "success" ? "var(--color-success)" : "var(--color-error)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px"
                    }}
                >
                    {message.type === "success" ? "✓" : <AlertTriangle size={16} />}
                    {message.text}
                </div>
            )}

            <HeaderCTAContainer>
                <SearchInput
                    placeholder="Search roles..."
                    onChange={setSearchQuery}
                    value={searchQuery}
                />
                {deployment?.b2b_settings?.custom_org_role_enabled && (
                    <Button
                        $size="sm"
                        ref={addRoleButtonRef}
                        onClick={() => setRolePopover({ isOpen: true })}
                    >
                        Add Role
                    </Button>
                )}
            </HeaderCTAContainer>

            {rolePopover.isOpen && !rolePopover.role && (
                <AddRolePopover
                    onClose={() => setRolePopover({ isOpen: false })}
                    onSuccess={handleRoleSaved}
                    triggerRef={addRoleButtonRef}
                />
            )}

            {filteredRoles.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "No roles match" : "No roles yet"}
                    description="Define custom roles to manage granular permissions."
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
                                            {role.permissions.join(", ")}
                                        </TableCell>
                                        <ActionsCell>
                                            <RoleActions
                                                role={role}
                                                onEdit={() => setRolePopover({ isOpen: true, role })}
                                                onDelete={() => setRoleForDeletion(role.id)}
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
                                        <div style={{ fontSize: "12px", color: "var(--color-secondary-text)", lineHeight: 1.4 }}>
                                            {role.permissions.join(", ")}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: "auto" }}>
                                        <RoleActions
                                            role={role}
                                            onEdit={() => setRolePopover({ isOpen: true, role })}
                                            onDelete={() => setRoleForDeletion(role.id)}
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
                    description="This action cannot be undone. Users with this role might lose access to certain features."
                    onConfirm={() => {
                        const role = roles.find(r => r.id === roleForDeletion);
                        if (role) handleDeleteRole(role);
                    }}
                    onCancel={() => setRoleForDeletion(null)}
                />
            )}

            {rolePopover.isOpen && rolePopover.role && (
                <AddRolePopover
                    role={rolePopover.role}
                    onClose={() => setRolePopover({ isOpen: false })}
                    onSuccess={handleRoleSaved}
                />
            )}
        </>
    );
};

const RoleActions = ({ role, onEdit, onDelete }: any) => (
    <Dropdown>
        <DropdownTrigger>
            <IconButton disabled={!role.organization_id}>•••</IconButton>
        </DropdownTrigger>
        <DropdownItems>
            <DropdownItem onClick={onEdit}>Edit Role</DropdownItem>
            <DropdownItem $destructive onClick={onDelete}>
                <Trash2 size={16} /> Remove Role
            </DropdownItem>
        </DropdownItems>
    </Dropdown>
);
