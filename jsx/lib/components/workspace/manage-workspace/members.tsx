import { useState, useEffect, useRef } from "react";
import { Check, CaretDown, Trash } from "@phosphor-icons/react";
import useSWR from "swr";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import { useSession } from "@/hooks/use-session";
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
import { DesktopTableContainer } from "./shared";

export const MembersSection = () => {
    const {
        activeWorkspace,
        getMembers,
        getRoles,
        removeMember,
        addMemberRole,
        removeMemberRole,
    } = useActiveWorkspace();
    const { session } = useSession();
    const { toast } = useScreenContext();

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const inviteMemberButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data: membersResponse, mutate: reloadMembers } = useSWR(
        activeWorkspace
            ? `wacht-api-workspaces:${activeWorkspace.id}:members:${page}:${limit}:${debouncedSearchQuery}`
            : null,
        () => getMembers?.({ page, limit, search: debouncedSearchQuery }),
        { keepPreviousData: true },
    );

    const members = membersResponse?.data || [];
    const meta = membersResponse?.meta || { total: 0, page: 1, limit: 10 };
    const totalPages = Math.ceil(meta.total / (meta.limit || 10));

    const { data: rolesData = [] } = useSWR(
        activeWorkspace
            ? `wacht-api-workspaces:${activeWorkspace.id}:roles`
            : null,
        () => getRoles() || [],
    );
    const roles = rolesData as WorkspaceRole[];

    const handleToggleRole = async (
        membershipId: string,
        roleId: string,
        hasRole: boolean,
    ) => {
        try {
            if (hasRole) {
                await removeMemberRole(membershipId, roleId);
                toast("Role removed", "info");
            } else {
                await addMemberRole(membershipId, roleId);
                toast("Role added", "info");
            }
            reloadMembers();
        } catch (error) {
            toast("Failed to update role", "error");
        }
    };

    const handleRemoveMember = async (membershipId: string) => {
        try {
            await removeMember(membershipId);
            toast("Member removed", "info");
            reloadMembers();
        } catch (error) {
            toast("Failed to remove member", "error");
        }
    };

    if (!membersResponse) return <Spinner />;

    return (
        <>
            <div className="w-toolbar">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search members..."
                />
                <div className="w-flex w-items-center w-gap-3">
                    {meta.total > 0 && (
                        <div className="w-text-muted w-secsub">
                            {meta.total} member{meta.total !== 1 ? "s" : ""}
                        </div>
                    )}
                    <Button
                        ref={inviteMemberButtonRef}
                        onClick={() => setIsInviting(true)}
                        $size="sm"
                    >
                        Invite
                    </Button>
                </div>
            </div>

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
                    description="Members added to the organization can be invited here."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Member</TableHeader>
                                    <TableHeader>Joined</TableHeader>
                                    <TableHeader>Role</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map((member: any) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <UserIdentity
                                                member={member}
                                                session={session}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                member.created_at,
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <ActionsCell>
                                            <RoleSelector
                                                member={member}
                                                roles={roles}
                                                onToggle={(
                                                    roleId: string,
                                                    active: boolean,
                                                ) =>
                                                    handleToggleRole(
                                                        member.id,
                                                        roleId,
                                                        active,
                                                    )
                                                }
                                                onRemove={() =>
                                                    handleRemoveMember(
                                                        member.id,
                                                    )
                                                }
                                            />
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>
                </>
            )}

            {totalPages > 1 && (
                <div className="w-flex w-items-center w-justify-center w-gap-4">
                    <Button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        $size="sm"
                    >
                        Previous
                    </Button>
                    <span className="w-secsub">
                        {page} / {totalPages}
                    </span>
                    <Button
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        $size="sm"
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
};

const UserIdentity = ({ member, session, subtitle }: any) => {
    const userData = member.public_user_data || member.user;
    const isCurrentUser = userData?.id === session?.active_signin?.user_id;

    const getInitials = (f = "", l = "") =>
        `${f[0] || ""}${l[0] || ""} `.toUpperCase();

    return (
        <div className="w-flex w-items-center w-gap-3">
            <div className="w-avatar">
                {userData?.profile_picture_url ? (
                    <img src={userData.profile_picture_url} alt="Avatar" />
                ) : (
                    getInitials(userData?.first_name, userData?.last_name) ||
                    "?"
                )}
            </div>
            <div>
                <div className="w-flex w-items-center w-gap-2">
                    <span className="w-sec">
                        {userData
                            ? `${userData.first_name || ""} ${userData.last_name || ""} `.trim() ||
                              userData.primary_email_address?.email
                            : "Unknown"}
                    </span>
                    {isCurrentUser && <span className="w-pill">You</span>}
                </div>
                <div className="w-flex w-wrap w-gap-2 w-secsub">
                    <span>{userData?.primary_email_address?.email}</span>
                    {subtitle && (
                        <span className="w-text-muted">• {subtitle}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

const RoleSelector = ({ member, roles, onToggle, onRemove }: any) => {
    const memberRoles = member.roles || [];
    const memberHasRole = (roleId: string) =>
        memberRoles.some((r: any) => r.id === roleId);

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    $outline
                    $size="sm"
                    className="w-justify-between w-rolepick-btn"
                >
                    {memberRoles.length > 0
                        ? memberRoles?.[0]?.name
                        : "No role"}{" "}
                    <CaretDown size={14} />
                </Button>
            </DropdownTrigger>
            <DropdownItems>
                {roles.map((role: any) => {
                    const active = memberHasRole(role.id);
                    return (
                        <DropdownItem
                            key={role.id}
                            onClick={() => onToggle(role.id, active)}
                        >
                            <div className="w-flex w-justify-between w-full w-gap-3">
                                <span>{role.name}</span>
                                {active && (
                                    <Check size={14} className="w-text-success" />
                                )}
                            </div>
                        </DropdownItem>
                    );
                })}
                <DropdownDivider />
                <DropdownItem $destructive onClick={onRemove}>
                    <div className="w-flex w-items-center w-gap-2">
                        <Trash size={14} /> Remove Member
                    </div>
                </DropdownItem>
            </DropdownItems>
        </Dropdown>
    );
};
