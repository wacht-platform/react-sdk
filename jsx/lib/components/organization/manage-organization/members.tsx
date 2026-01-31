import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import useSWR from "swr";
import styled from "styled-components";
import { Organization, OrganizationMembership, OrganizationRole } from "@/types";
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
    DropdownDivider,
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
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
} from "./shared";

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-input-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-weight: 400;
  font-size: 14px;
  overflow: hidden;
`;

export const MembersSection = ({ organization }: { organization: Organization }) => {
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
        isLoading: membersLoading,
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
            })
    );

    const members = membersResponse?.data || [];
    const meta = membersResponse?.meta || { total: 0, page: 1, limit: 10 };
    const totalPages = Math.ceil(meta.total / (meta.limit || 10));

    const { data: rolesData = [], isLoading: rolesLoading } = useSWR(
        organization ? `wacht-api-organizations:${organization.id}:roles` : null,
        () => getRoles?.(organization) || [],
    );
    const roles = rolesData as OrganizationRole[];

    const toggleRole = async (
        member: OrganizationMembership,
        role: OrganizationRole,
        hasRole: boolean,
    ) => {
        try {
            if (hasRole) {
                await removeMemberRole(organization, member, role);
                toast("Role removed successfully", "info");
            } else {
                await addMemberRole(organization, member, role);
                toast("Role added successfully", "info");
            }
            reloadMembers();
        } catch (error: any) {
            toast(error.message || "Failed to update role", "error");
        }
    };

    const handleRemoveMember = async (member: OrganizationMembership) => {
        try {
            await removeMember(organization, member);
            reloadMembers();
            toast("Member removed successfully", "info");
        } catch (error: any) {
            toast(error.message || "Failed to remove member", "error");
        }
    };

    if (membersLoading || rolesLoading) return <Spinner />;

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
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {meta.total > 0 && (
                        <div style={{ fontSize: "14px", color: "var(--color-muted)" }}>
                            {meta.total} member{meta.total !== 1 ? "s" : ""}
                        </div>
                    )}
                    <Button
                        $size="sm"
                        ref={inviteMemberButtonRef}
                        onClick={() => setIsInviting(true)}
                    >
                        Invite
                    </Button>
                </div>
            </HeaderCTAContainer>

            {isInviting && (
                <InviteMemberPopover
                    onClose={() => setIsInviting(false)}
                    onSuccess={() => { reloadMembers(); setIsInviting(false); }}
                    roles={roles}
                    triggerRef={inviteMemberButtonRef}
                />
            )}

            {members.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "No members match" : "No members yet"}
                    description="Members with corporate domains will automatically join."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Member</TableHeader>
                                    <TableHeader>Joined</TableHeader>
                                    <TableHeader>Roles</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <UserIdentity member={member} session={session} />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <ActionsCell>
                                            <RoleSelector
                                                member={member}
                                                roles={roles}
                                                onToggle={toggleRole}
                                                onRemove={handleRemoveMember}
                                            />
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>

                    <MobileListContainer>
                        {members.map((member) => (
                            <ConnectionItemRow key={member.id}>
                                <ConnectionLeft>
                                    <UserIdentity
                                        member={member}
                                        session={session}
                                        subtitle={`Joined ${new Date(member.created_at).toLocaleDateString()}`}
                                    />
                                    <div style={{ marginLeft: "auto" }}>
                                        <RoleSelector
                                            member={member}
                                            roles={roles}
                                            onToggle={toggleRole}
                                            onRemove={handleRemoveMember}
                                        />
                                    </div>
                                </ConnectionLeft>
                            </ConnectionItemRow>
                        ))}
                    </MobileListContainer>
                </>
            )}

            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" }}>
                    <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} $size="sm">Previous</Button>
                    <span style={{ fontSize: "13px" }}>{page} / {totalPages}</span>
                    <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} $size="sm">Next</Button>
                </div>
            )}
        </>
    );
};

const UserIdentity = ({ member, session, subtitle }: any) => {
    const userData = member.user;
    const isCurrentUser = userData?.id === session?.active_signin?.user_id;

    const getInitials = (f = "", l = "") => `${f[0] || ""}${l[0] || ""}`.toUpperCase();

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AvatarPlaceholder>
                {userData?.profile_picture_url ? (
                    <img
                        src={userData.profile_picture_url}
                        alt="Avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    getInitials(userData?.first_name, userData?.last_name) || "?"
                )}
            </AvatarPlaceholder>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "400" }}>
                        {userData ? `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.primary_email_address?.email : "Unknown"}
                    </span>
                    {isCurrentUser && (
                        <span style={{ fontSize: "10px", padding: "1px 4px", background: "var(--color-background-alt)", color: "var(--color-muted)", borderRadius: "3px", fontWeight: "400" }}>You</span>
                    )}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-secondary-text)", fontWeight: "400", display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
                    <span>{userData?.primary_email_address?.email}</span>
                    {subtitle && <span style={{ color: "var(--color-muted)" }}>• {subtitle}</span>}
                </div>
            </div>
        </div>
    );
};

const RoleSelector = ({ member, roles, onToggle, onRemove }: any) => {
    const memberRoles = member.roles || [];
    const memberHasRole = (roleId: string) => memberRoles.some((r: any) => r.id === roleId);

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button $outline $size="sm" style={{ color: "var(--color-foreground)" }}>
                    {memberRoles.length > 0 ? memberRoles[0].name : "No role"} <ChevronDown size={14} style={{ marginLeft: "4px" }} />
                </Button>
            </DropdownTrigger>
            <DropdownItems>
                {roles.map((role: any) => {
                    const active = memberHasRole(role.id);
                    return (
                        <DropdownItem key={role.id} onClick={() => onToggle(member, role, active)}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "12px" }}>
                                <span>{role.name}</span>
                                {active && <Check size={14} color="var(--color-success)" />}
                            </div>
                        </DropdownItem>
                    );
                })}
                <DropdownDivider />
                <DropdownItem $destructive onClick={() => onRemove(member)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Trash2 size={14} /> Remove Member
                    </div>
                </DropdownItem>
            </DropdownItems>
        </Dropdown>
    );
};
