import { useState, useRef } from "react";
import { Warning } from "@phosphor-icons/react";
import useSWR from "swr";
import styled from "styled-components";
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

const MessageBanner = styled.div<{ $type: "success" | "error" }>`
    margin-bottom: var(--space-8u);
    padding: var(--space-4u) var(--space-6u);
    background: ${(p) =>
        p.$type === "success"
            ? "color-mix(in srgb, var(--color-success, #10b981) 12%, transparent)"
            : "color-mix(in srgb, var(--color-error) 12%, transparent)"};
    color: ${(p) =>
        p.$type === "success"
            ? "var(--color-success, #10b981)"
            : "var(--color-error)"};
    border: 1px solid currentColor;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: var(--space-3u);
    font-size: 13px;
`;

const RoleName = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: var(--color-card-foreground);
    display: inline-flex;
    align-items: center;
    gap: 8px;
`;

const InlineActions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: nowrap;
    white-space: nowrap;
`;

const PermissionText = styled.div`
    color: var(--color-secondary-text);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 340px;
`;

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
                    <RoleName>
                        {role.name}
                        {!editable && (
                            <StatusPill $variant="neutral">Default</StatusPill>
                        )}
                    </RoleName>
                </TableCell>
                <TableCell>
                    {permCount === 0 ? (
                        <StatusPill $variant="neutral">
                            No permissions
                        </StatusPill>
                    ) : (
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <StatusPill $variant="primary">
                                {permCount}{" "}
                                {permCount === 1 ? "permission" : "permissions"}
                            </StatusPill>
                            <PermissionText>
                                {role.permissions.join(", ")}
                            </PermissionText>
                        </div>
                    )}
                </TableCell>
                <ActionsCell>
                    {editable ? (
                        <InlineActions>
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
                        </InlineActions>
                    ) : (
                        <span
                            style={{
                                fontSize: 12,
                                color: "var(--color-secondary-text)",
                            }}
                        >
                            Read-only
                        </span>
                    )}
                </ActionsCell>
            </TableRow>
        );
    };

    return (
        <>
            {message && (
                <MessageBanner $type={message.type}>
                    {message.type === "success" ? "✓" : <Warning size={13} />}
                    {message.text}
                </MessageBanner>
            )}

            <HeaderCTAContainer style={{ marginBottom: "var(--space-6u)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--color-card-foreground)",
                        }}
                    >
                        Roles
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "var(--color-secondary-text)",
                            marginTop: 2,
                        }}
                    >
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
