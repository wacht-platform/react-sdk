import { useState, useRef, useMemo } from "react";
import { Mail, Trash2 } from "lucide-react";
import useSWR from "swr";
import { Organization, OrganizationInvitation, OrganizationRole } from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
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
    IconButton,
    DesktopTableContainer,
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
} from "./shared";

export const InvitationsSection = ({ organization }: { organization: Organization }) => {
    const {
        getOrganizationInvitations: getInvitations,
        getOrganizationRoles: getRoles,
        discardOrganizationInvitation: discardInvitation,
        resendOrganizationInvitation: resendInvitation,
    } = useOrganizationList();
    const { toast } = useScreenContext();
    const [isInviting, setIsInviting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const inviteMemberButtonRef = useRef<HTMLButtonElement>(null);

    const {
        data: invitations = [],
        isLoading: invitationsLoading,
        mutate: reloadInvitations,
    } = useSWR(
        organization ? `wacht-api-organizations:${organization.id}:invitations` : null,
        () => getInvitations?.(organization) || [],
    );

    const { data: rolesData = [], isLoading: rolesLoading } = useSWR(
        organization ? `wacht-api-organizations:${organization.id}:roles` : null,
        () => getRoles?.(organization) || [],
    );
    const roles = rolesData as OrganizationRole[];

    const filteredInvitations = useMemo(() => {
        if (!searchQuery) return invitations;
        const lower = searchQuery.toLowerCase();
        return invitations.filter((inv) => inv.email.toLowerCase().includes(lower));
    }, [invitations, searchQuery]);

    const handleCancelInvitation = async (invitation: OrganizationInvitation) => {
        try {
            await discardInvitation(organization, invitation);
            reloadInvitations();
            toast("Invitation cancelled", "info");
        } catch (error: any) {
            toast(error.message || "Failed to cancel invitation", "error");
        }
    };

    const handleResendInvitation = async (invitation: OrganizationInvitation) => {
        try {
            await resendInvitation(organization, invitation);
            toast("Invitation resent", "info");
        } catch (error: any) {
            toast(error.message || "Failed to resend invitation", "error");
        }
    };

    if (invitationsLoading || rolesLoading) return <Spinner />;

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
                    ref={inviteMemberButtonRef}
                    onClick={() => setIsInviting(true)}
                >
                    Invite
                </Button>
            </HeaderCTAContainer>

            {isInviting && (
                <InviteMemberPopover
                    onClose={() => setIsInviting(false)}
                    onSuccess={() => { reloadInvitations(); setIsInviting(false); }}
                    roles={roles}
                    triggerRef={inviteMemberButtonRef}
                />
            )}

            {filteredInvitations.length === 0 ? (
                <EmptyState
                    title={searchQuery ? "No invitations match" : "No pending invitations"}
                    description="Invite members to collaborate."
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
                                        <TableCell>{inv.initial_organization_role?.name || "No role"}</TableCell>
                                        <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                                        <ActionsCell>
                                            <InvitationActions
                                                invitation={inv}
                                                onResend={handleResendInvitation}
                                                onCancel={handleCancelInvitation}
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
                                            {inv.initial_organization_role?.name || "No role"} • {new Date(inv.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: "auto" }}>
                                        <InvitationActions
                                            invitation={inv}
                                            onResend={handleResendInvitation}
                                            onCancel={handleCancelInvitation}
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

const InvitationActions = ({ invitation, onResend, onCancel }: any) => (
    <Dropdown>
        <DropdownTrigger>
            <IconButton>•••</IconButton>
        </DropdownTrigger>
        <DropdownItems>
            <DropdownItem onClick={() => onResend(invitation)}>
                <Mail size={16} /> Resend
            </DropdownItem>
            <DropdownItem $destructive onClick={() => onCancel(invitation)}>
                <Trash2 size={16} /> Cancel
            </DropdownItem>
        </DropdownItems>
    </Dropdown>
);
