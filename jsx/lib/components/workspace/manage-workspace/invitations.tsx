import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Trash2 } from "lucide-react";
import { useActiveWorkspace } from "@/hooks/use-workspace";
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
import { InviteMemberPopover } from "./invite-member-popover";
import {
    HeaderCTAContainer,
    IconButton,
    DesktopTableContainer,
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
} from "./shared";

export const InvitationsSection = () => {
    const {
        activeWorkspace,
        loading,
        getRoles,
        getInvitations,
        inviteMember,
        discardInvitation,
        resendInvitation,
    } = useActiveWorkspace();
    const { toast } = useScreenContext();

    const [rolesLoading, setRolesLoading] = useState(true);
    const [invitationsLoading, setInvitationsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [invitations, setInvitations] = useState<any[]>([]);
    const [roles, setRoles] = useState<WorkspaceRole[]>([]);
    const [showInvitePopover, setShowInvitePopover] = useState(false);
    const inviteButtonRef = useRef<HTMLButtonElement>(null);

    const fetchData = async () => {
        if (!activeWorkspace) return;
        setRolesLoading(true);
        setInvitationsLoading(true);
        try {
            const [rolesData, invitationsData] = await Promise.all([
                getRoles(),
                getInvitations(),
            ]);
            setRoles(rolesData);
            setInvitations(invitationsData);
        } catch (error) {
            // error handling
        } finally {
            setRolesLoading(false);
            setInvitationsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace?.id]);

    const handleCancelInvitation = async (id: string) => {
        try {
            await discardInvitation(id);
            fetchData();
            toast("Invitation cancelled", "info");
        } catch (error) {
            toast("Failed to cancel invitation", "error");
        }
    };

    const handleResendInvitation = async (id: string) => {
        try {
            await resendInvitation(id);
            fetchData();
            toast("Invitation resent", "info");
        } catch (error) {
            toast("Failed to resend invitation", "error");
        }
    };

    const filteredInvitations = useMemo(() => {
        if (!searchQuery) return invitations;
        const lower = searchQuery.toLowerCase();
        return invitations.filter((inv) => inv.email?.toLowerCase().includes(lower));
    }, [invitations, searchQuery]);

    if (loading || rolesLoading || invitationsLoading) return <Spinner />;

    return (
        <>
            <HeaderCTAContainer>
                <div style={{ flex: 1 }}>
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search invitations..."
                    />
                </div>
                <Button
                    $size="sm"
                    ref={inviteButtonRef}
                    onClick={() => setShowInvitePopover(true)}
                >
                    Invite
                </Button>
            </HeaderCTAContainer>

            {showInvitePopover && (
                <InviteMemberPopover
                    onClose={() => setShowInvitePopover(false)}
                    onSuccess={() => { fetchData(); setShowInvitePopover(false); toast("Invitation sent", "info"); }}
                    roles={roles}
                    createInvitation={(payload: { email: string; role_id: string }) => inviteMember({ email: payload.email, workspaceRoleId: payload.role_id })}
                    triggerRef={inviteButtonRef}
                />
            )}

            {filteredInvitations.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "No invitations match" : "No pending invitations"}
                    description="Invite members to your workspace."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Email</TableHeader>
                                    <TableHeader>Role</TableHeader>
                                    <TableHeader>Invited</TableHeader>
                                    <TableHeader></TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredInvitations.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{inv.email}</TableCell>
                                        <TableCell>
                                            {inv.initial_workspace_role?.name ||
                                                inv.initial_organization_role?.name ||
                                                "No role"}
                                        </TableCell>
                                        <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                                        <ActionsCell>
                                            <InvitationActions
                                                onResend={() => handleResendInvitation(inv.id)}
                                                onCancel={() => handleCancelInvitation(inv.id)}
                                            />
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>

                    <MobileListContainer>
                        {filteredInvitations.map((inv) => (
                            <ConnectionItemRow key={inv.id}>
                                <ConnectionLeft>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{inv.email}</div>
                                        <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                                            {inv.initial_workspace_role?.name || "No role"} • {new Date(inv.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: "auto" }}>
                                        <InvitationActions
                                            onResend={() => handleResendInvitation(inv.id)}
                                            onCancel={() => handleCancelInvitation(inv.id)}
                                        />
                                    </div>
                                </ConnectionLeft>
                            </ConnectionItemRow>
                        ))}
                    </MobileListContainer>
                </>
            )}
        </>
    );
};

const InvitationActions = ({ onResend, onCancel }: any) => (
    <Dropdown>
        <DropdownTrigger>
            <IconButton>•••</IconButton>
        </DropdownTrigger>
        <DropdownItems>
            <DropdownItem onClick={onResend}>
                <Send size={16} /> Resend
            </DropdownItem>
            <DropdownItem $destructive onClick={onCancel}>
                <Trash2 size={16} /> Cancel
            </DropdownItem>
        </DropdownItems>
    </Dropdown>
);
