import { useState, useRef, useMemo } from "react";
import { Warning, Trash } from "@phosphor-icons/react";
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
import { canEditOrganizationRole } from "@/utils/roles";
import {
    HeaderCTAContainer,
    IconButton,
    DesktopTableContainer,
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
} from "./shared";
import styled from "styled-components";

const MessageBanner = styled.div<{ $type: "success" | "error" }>`
  margin-bottom: var(--space-10u);
  padding: var(--space-6u) var(--space-8u);
  background: ${(props) =>
    props.$type === "success"
      ? "var(--color-success-background)"
      : "var(--color-error-background)"};
  color: ${(props) =>
    props.$type === "success" ? "var(--color-success)" : "var(--color-error)"};
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-4u);
  font-size: var(--font-size-lg);
`;

const RoleName = styled.div`
  font-weight: 500;
`;

const RoleNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4u);
  flex-wrap: wrap;
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

const MobileRoleName = styled.div`
  font-weight: 600;
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-2u);
`;

const MobileRolePermissions = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-secondary-text);
  line-height: 1.4;
`;

const MobileRoleActions = styled.div`
  margin-left: auto;
`;

export const RolesSection = ({ organization }: { organization: Organization }) => {
    const { getOrganizationRoles: getRoles, removeOrganizationRoles: removeRole } =
        useOrganizationList();
    const { deployment } = useDeployment();

    const [rolePopover, setRolePopover] = useState<{
        isOpen: boolean;
        role?: OrganizationRole;
        triggerElement?: HTMLElement | null;
    }>({ isOpen: false });

    const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [roleForDeletion, setRoleForDeletion] = useState<string | null>(null);
    const addRoleButtonRef = useRef<HTMLButtonElement>(null);
    const dropdownButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to save role";
            setMessage({
                text: message,
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
                <MessageBanner $type={message.type}>
                    {message.type === "success" ? "✓" : <Warning size={16} />}
                    {message.text}
                </MessageBanner>
            )}

            <HeaderCTAContainer>
                <SearchInput
                    placeholder="MagnifyingGlass roles..."
                    onChange={setSearchQuery}
                    value={searchQuery}
                />
                {deployment?.b2b_settings?.custom_org_role_enabled && (
                    <Button
                        ref={addRoleButtonRef}
                        onClick={() => setRolePopover({ isOpen: true, triggerElement: addRoleButtonRef.current })}
                    >
                        Add Role
                    </Button>
                )}
            </HeaderCTAContainer>

            {rolePopover.isOpen && !rolePopover.role && (
                <AddRolePopover
                    onClose={() => setRolePopover({ isOpen: false })}
                    onSuccess={handleRoleSaved}
                    triggerRef={{ current: rolePopover.triggerElement || addRoleButtonRef.current }}
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
                                            <RoleNameRow>
                                                <RoleName>{role.name}</RoleName>
                                                {!canEditOrganizationRole(role) && (
                                                    <RoleBadge>Default</RoleBadge>
                                                )}
                                            </RoleNameRow>
                                        </TableCell>
                                        <TableCell>
                                          <PermissionText>
                                            {role.permissions.join(", ")}
                                            {!canEditOrganizationRole(role) &&
                                                " • Cannot be edited or deleted"}
                                          </PermissionText>
                                        </TableCell>
                                        <ActionsCell>
                                            <RoleActions
                                                role={role}
                                                onEdit={(el) =>
                                                    setRolePopover({
                                                        isOpen: true,
                                                        role,
                                                        triggerElement: el,
                                                    })
                                                }
                                                onDelete={() => setRoleForDeletion(role.id)}
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
                                        <RoleNameRow>
                                            <MobileRoleName>{role.name}</MobileRoleName>
                                            {!canEditOrganizationRole(role) && (
                                                <RoleBadge>Default</RoleBadge>
                                            )}
                                        </RoleNameRow>
                                        <MobileRolePermissions>
                                            {role.permissions.join(", ")}
                                            {!canEditOrganizationRole(role) &&
                                                " • Cannot be edited or deleted"}
                                        </MobileRolePermissions>
                                    </div>
                                    <MobileRoleActions>
                                        <RoleActions
                                            role={role}
                                            onEdit={(el) =>
                                                setRolePopover({
                                                    isOpen: true,
                                                    role,
                                                    triggerElement: el,
                                                })
                                            }
                                            onDelete={() => setRoleForDeletion(role.id)}
                                            dropdownButtonRefs={dropdownButtonRefs}
                                        />
                                    </MobileRoleActions>
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
                    triggerRef={{ current: rolePopover.triggerElement || null }}
                />
            )}
        </>
    );
};

interface OrganizationRoleActionsProps {
    role: OrganizationRole;
    onEdit: (triggerElement: HTMLElement | null) => void;
    onDelete: () => void;
    dropdownButtonRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

const RoleActions = ({
    role,
    onEdit,
    onDelete,
    dropdownButtonRefs,
}: OrganizationRoleActionsProps) => {
    const editable = canEditOrganizationRole(role);

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
        <Dropdown>
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
