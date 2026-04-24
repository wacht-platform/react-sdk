import { useState, useEffect, useRef } from "react";
import { Check, CaretDown } from "@phosphor-icons/react";
import useSWR from "swr";
import styled from "styled-components";
import {
    Organization,
    OrganizationMembership,
    OrganizationRole,
} from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
import { useSession } from "@/hooks/use-session";
import { useScreenContext } from "../context";
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
import { InviteMemberPopover } from "../invite-member-popover";
import {
    HeaderCTAContainer,
    DesktopTableContainer,
    StatusPill,
} from "./shared";

const AvatarPlaceholder = styled.div`
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const InlineActions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: nowrap;
    white-space: nowrap;
`;

export const MembersSection = ({
    organization,
}: {
    organization: Organization;
}) => {
    const {
        getOrganizationMembers: getMembers,
        getOrganizationRoles: getRoles,
        addRoleToOrganizationMember: addMemberRole,
        removeRoleFromOrganizationMember: removeMemberRole,
        removeOrganizationMember: removeMember,
    } = useOrganizationList();
    const { session } = useSession();
    const { toast } = useScreenContext();

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isInviting, setIsInviting] = useState(false);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const inviteMemberButtonRef = useRef<HTMLButtonElement>(null);

    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const {
        data: membersResponse,
        mutate: reloadMembers,
    } = useSWR(
        organization
            ? `wacht-api-organizations:${organization.id}:members:${page}:${limit}:${debouncedSearchQuery}`
            : null,
        () =>
            getMembers?.(organization, {
                page,
                limit,
                search: debouncedSearchQuery,
            }),
        { keepPreviousData: true },
    );

    const members = membersResponse?.data || [];
    const meta = membersResponse?.meta || { total: 0, page: 1, limit: 10 };
    const totalPages = Math.ceil(meta.total / (meta.limit || 10));

    const { data: rolesData = [] } = useSWR(
        organization ? `wacht-api-organizations:${organization.id}:roles` : null,
        () => getRoles?.(organization) || [],
    );
    const roles = rolesData as OrganizationRole[];

    const markPending = (id: string, on: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const toggleRole = async (
        member: OrganizationMembership,
        role: OrganizationRole,
        hasRole: boolean,
    ) => {
        markPending(member.id, true);
        try {
            if (hasRole) {
                await removeMemberRole(organization, member, role);
                toast("Role removed", "info");
            } else {
                await addMemberRole(organization, member, role);
                toast("Role added", "info");
            }
            reloadMembers();
        } catch (error: any) {
            toast(error.message || "Failed to update role", "error");
        } finally {
            markPending(member.id, false);
        }
    };

    const handleRemoveMember = async (member: OrganizationMembership) => {
        markPending(member.id, true);
        try {
            await removeMember(organization, member);
            reloadMembers();
            toast("Member removed", "info");
        } catch (error: any) {
            toast(error.message || "Failed to remove member", "error");
        } finally {
            markPending(member.id, false);
        }
    };

    if (!membersResponse) return <Spinner />;

    return (
        <>
            <HeaderCTAContainer>
                <div style={{ flex: 1 }}>
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search members..."
                    />
                </div>
                <div style={{ display: "flex", gap: "var(--space-6u)", alignItems: "center" }}>
                    {meta.total > 0 && (
                        <div style={{ fontSize: 13, color: "var(--color-secondary-text)" }}>
                            {meta.total} member{meta.total !== 1 ? "s" : ""}
                        </div>
                    )}
                    <Button ref={inviteMemberButtonRef} onClick={() => setIsInviting(true)} $size="sm">
                        Invite
                    </Button>
                </div>
            </HeaderCTAContainer>

            {isInviting && (
                <InviteMemberPopover
                    onClose={() => setIsInviting(false)}
                    onSuccess={() => {
                        reloadMembers();
                        setIsInviting(false);
                    }}
                    roles={roles}
                    triggerRef={inviteMemberButtonRef}
                />
            )}

            {members.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "No members match" : "No members yet"}
                    description="Invite someone or connect a corporate domain to auto-join."
                />
            ) : (
                <DesktopTableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Member</TableHeader>
                                <TableHeader>Joined</TableHeader>
                                <TableHeader>Roles</TableHeader>
                                <TableHeader />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.map((member) => {
                                const isCurrentUser = member.user?.id === session?.active_signin?.user_id;
                                const isBusy = pendingIds.has(member.id);
                                return (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <UserIdentity member={member} isCurrentUser={isCurrentUser} />
                                        </TableCell>
                                        <TableCell style={{ color: "var(--color-secondary-text)" }}>
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <RolePicker
                                                member={member}
                                                roles={roles}
                                                onToggle={toggleRole}
                                                disabled={isBusy}
                                            />
                                        </TableCell>
                                        <ActionsCell>
                                            <InlineActions>
                                                <Button
                                                    $size="sm"
                                                    $outline
                                                    $destructive
                                                    disabled={isBusy || isCurrentUser}
                                                    onClick={() => handleRemoveMember(member)}
                                                    title={isCurrentUser ? "You cannot remove yourself" : "Remove member"}
                                                >
                                                    {isBusy ? <Spinner size={12} /> : "Remove"}
                                                </Button>
                                            </InlineActions>
                                        </ActionsCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </DesktopTableContainer>
            )}

            {totalPages > 1 && (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "var(--space-8u)",
                    marginTop: "var(--space-12u)",
                }}>
                    <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} $size="sm" $outline>
                        Previous
                    </Button>
                    <span style={{ fontSize: 13, color: "var(--color-secondary-text)" }}>
                        {page} / {totalPages}
                    </span>
                    <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} $size="sm" $outline>
                        Next
                    </Button>
                </div>
            )}
        </>
    );
};

const UserIdentity = ({ member, isCurrentUser }: { member: any; isCurrentUser: boolean }) => {
    const u = member.user;
    const getInitials = (f = "", l = "") =>
        `${f[0] || ""}${l[0] || ""}`.toUpperCase() || "?";
    const name = u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.primary_email_address?.email : "Unknown";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <AvatarPlaceholder>
                {u?.profile_picture_url
                    ? <img src={u.profile_picture_url} alt={name} />
                    : getInitials(u?.first_name, u?.last_name)
                }
            </AvatarPlaceholder>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-card-foreground)" }}>
                        {name}
                    </span>
                    {isCurrentUser && <StatusPill $variant="neutral">You</StatusPill>}
                </div>
                <span style={{ fontSize: 12, color: "var(--color-secondary-text)" }}>
                    {u?.primary_email_address?.email}
                </span>
            </div>
        </div>
    );
};

const RolePicker = ({
    member,
    roles,
    onToggle,
    disabled,
}: {
    member: OrganizationMembership;
    roles: OrganizationRole[];
    onToggle: (m: OrganizationMembership, r: OrganizationRole, has: boolean) => Promise<void>;
    disabled?: boolean;
}) => {
    const memberRoles = (member as any).roles || [];
    const memberHasRole = (roleId: string) => memberRoles.some((r: any) => r.id === roleId);

    const label = memberRoles.length === 0
        ? "No role"
        : memberRoles.length === 1
        ? memberRoles[0]?.name
        : `${memberRoles.length} roles`;

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    $size="sm"
                    $outline
                    disabled={disabled}
                    style={{ minWidth: 150, justifyContent: "space-between" }}
                >
                    {label}
                    <CaretDown size={12} style={{ marginLeft: 6 }} />
                </Button>
            </DropdownTrigger>
            <DropdownItems style={{ minWidth: 180 }}>
                {roles.length === 0 ? (
                    <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--color-secondary-text)" }}>
                        No roles configured
                    </div>
                ) : (
                    roles.map((role) => {
                        const active = memberHasRole(role.id);
                        return (
                            <DropdownItem
                                key={role.id}
                                onClick={() => onToggle(member, role, active)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 10 }}>
                                    <span>{role.name}</span>
                                    {active && <Check size={13} color="var(--color-primary)" />}
                                </div>
                            </DropdownItem>
                        );
                    })
                )}
            </DropdownItems>
        </Dropdown>
    );
};
