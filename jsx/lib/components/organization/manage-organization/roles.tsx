import { useState, useRef } from "react";
import { Warning, Check } from "@phosphor-icons/react";
import useSWR from "swr";
import { Organization, OrganizationRole } from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks/use-deployment";
import { Button, Spinner } from "@/components/utility";
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
    DesktopTableContainer,
    StatusPill,
} from "./shared";

export const RolesSection = ({
    organization,
}: {
    organization: Organization;
}) => {
    const {
        getOrganizationRoles: getRoles,
        removeOrganizationRoles: removeRole,
    } = useOrganizationList();
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

    const [roleForDeletion, setRoleForDeletion] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const addRoleButtonRef = useRef<HTMLButtonElement>(null);
    const editButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const {
        data: roles = [],
        isLoading: rolesLoading,
        mutate: reloadRoles,
    } = useSWR(
        organization
            ? `wacht-api-organizations:${organization.id}:roles`
            : null,
        () => getRoles?.(organization) || [],
    );

    const markPending = (id: string, on: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleRoleSaved = async (role: {
        id?: string;
        name: string;
        description?: string;
    }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setMessage({
                text: `Role ${role.id ? "updated" : "created"} successfully`,
                type: "success",
            });
            setRolePopover({ isOpen: false });
            reloadRoles();
        } catch (error: unknown) {
            const text =
                error instanceof Error ? error.message : "Failed to save role";
            setMessage({ text, type: "error" });
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteRole = async (role: OrganizationRole) => {
        markPending(role.id, true);
        try {
            await removeRole(organization, role);
            reloadRoles();
        } finally {
            markPending(role.id, false);
            setRoleForDeletion(null);
        }
    };

    if (rolesLoading && roles.length === 0) return <Spinner />;

    const renderRow = (role: OrganizationRole) => {
        const editable = canEditOrganizationRole(role);
        const isBusy = pendingIds.has(role.id);
        const permCount = role.permissions.length;
        return (
            <TableRow key={role.id}>
                <TableCell>
                    <span className="w-inline w-gap-2 w-sec">
                        {role.name}
                        {!editable && (
                            <StatusPill $variant="neutral">Default</StatusPill>
                        )}
                    </span>
                </TableCell>
                <TableCell>
                    {permCount === 0 ? (
                        <StatusPill $variant="neutral">
                            No permissions
                        </StatusPill>
                    ) : (
                        <div className="w-inline w-items-center w-gap-2">
                            <StatusPill $variant="primary">
                                {permCount}{" "}
                                {permCount === 1 ? "permission" : "permissions"}
                            </StatusPill>
                            <span className="w-truncate w-text-secondary w-maxw-sm">
                                {role.permissions.join(", ")}
                            </span>
                        </div>
                    )}
                </TableCell>
                <ActionsCell>
                    {editable ? (
                        <div className="w-actions">
                            <Button
                                ref={(el: HTMLButtonElement | null) => {
                                    if (el)
                                        editButtonRefs.current.set(role.id, el);
                                }}
                                $size="sm"
                                $outline
                                disabled={isBusy}
                                onClick={() =>
                                    setRolePopover({
                                        isOpen: true,
                                        role,
                                        triggerElement:
                                            editButtonRefs.current.get(
                                                role.id,
                                            ) ?? null,
                                    })
                                }
                            >
                                Edit
                            </Button>
                            <Button
                                $size="sm"
                                $outline
                                $destructive
                                disabled={isBusy}
                                onClick={() => setRoleForDeletion(role.id)}
                            >
                                {isBusy ? <Spinner size={12} /> : "Delete"}
                            </Button>
                        </div>
                    ) : (
                        <span className="w-secsub">Read-only</span>
                    )}
                </ActionsCell>
            </TableRow>
        );
    };

    return (
        <>
            {message && (
                <div
                    className={`w-banner ${message.type === "success" ? "w-banner--success" : "w-banner--error"} w-mb-4`}
                >
                    {message.type === "success" ? <Check size={16} /> : <Warning size={16} />}
                    <span className="w-banner-txt">{message.text}</span>
                </div>
            )}

            <HeaderCTAContainer>
                <div className="w-grow w-flex-col w-gap-1">
                    <div className="w-sec">Roles</div>
                    <div className="w-secsub">
                        Define granular permissions for members.
                    </div>
                </div>
                {deployment?.b2b_settings?.custom_org_role_enabled && (
                    <Button
                        ref={addRoleButtonRef}
                        onClick={() =>
                            setRolePopover({
                                isOpen: true,
                                triggerElement: addRoleButtonRef.current,
                            })
                        }
                        $size="sm"
                    >
                        Add role
                    </Button>
                )}
            </HeaderCTAContainer>

            {rolePopover.isOpen && !rolePopover.role && (
                <AddRolePopover
                    onClose={() => setRolePopover({ isOpen: false })}
                    onSuccess={handleRoleSaved}
                    triggerRef={{
                        current:
                            rolePopover.triggerElement ||
                            addRoleButtonRef.current,
                    }}
                />
            )}

            {roles.length === 0 ? (
                <EmptyState
                    title="No roles yet"
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
                                    <TableHeader />
                                </TableRow>
                            </TableHead>
                            <TableBody>{roles.map(renderRow)}</TableBody>
                        </Table>
                    </DesktopTableContainer>
                </>
            )}

            {roleForDeletion && (
                <ConfirmationPopover
                    title="Delete role?"
                    description="This action cannot be undone. Users with this role might lose access to certain features."
                    onConfirm={() => {
                        const role = roles.find(
                            (r) => r.id === roleForDeletion,
                        );
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
