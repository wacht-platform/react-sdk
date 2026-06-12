import { useState, useRef } from "react";
import useSWR from "swr";
import { Organization, OrganizationInvitation, OrganizationRole } from "@/types";
import { useOrganizationList } from "@/hooks/use-organization";
import { useScreenContext } from "../context";
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
import { InviteMemberPopover } from "../invite-member-popover";
import {
    HeaderCTAContainer,
    DesktopTableContainer,
    StatusPill,
} from "./shared";

const isExpired = (inv: OrganizationInvitation) => {
    const exp = (inv as any).expires_at;
    if (!exp) return false;
    return new Date(exp).getTime() < Date.now();
};

export const InvitationsSection = ({ organization }: { organization: Organization }) => {
    const {
        getOrganizationInvitations: getInvitations,
        getOrganizationRoles: getRoles,
        discardOrganizationInvitation: discardInvitation,
        resendOrganizationInvitation: resendInvitation,
    } = useOrganizationList();
    const { toast } = useScreenContext();
    const [isInviting, setIsInviting] = useState(false);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
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

    const markPending = (id: string, on: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleCancel = async (invitation: OrganizationInvitation) => {
        markPending(invitation.id, true);
        try {
            await discardInvitation(organization, invitation);
            reloadInvitations();
            toast("Invitation cancelled", "info");
        } catch (error: any) {
            toast(error.message || "Failed to cancel invitation", "error");
        } finally {
            markPending(invitation.id, false);
        }
    };

    const handleResend = async (invitation: OrganizationInvitation) => {
        markPending(invitation.id, true);
        try {
            await resendInvitation(organization, invitation);
            toast("Invitation resent", "info");
        } catch (error: any) {
            toast(error.message || "Failed to resend invitation", "error");
        } finally {
            markPending(invitation.id, false);
        }
    };

    if (invitationsLoading || rolesLoading) return <Spinner />;

    return (
        <>
            <HeaderCTAContainer>
                <div className="w-grow w-flex-col w-gap-1">
                    <div className="w-sec">Invitations</div>
                    <div className="w-secsub">
                        Pending invites to join this organization.
                    </div>
                </div>
                <Button
                    ref={inviteMemberButtonRef}
                    onClick={() => setIsInviting(true)}
                    $size="sm"
                >
                    Invite
                </Button>
            </HeaderCTAContainer>

            {isInviting && (
                <InviteMemberPopover
                    onClose={() => setIsInviting(false)}
                    onSuccess={() => {
                        reloadInvitations();
                        setIsInviting(false);
                    }}
                    roles={roles}
                    triggerRef={inviteMemberButtonRef}
                />
            )}

            {invitations.length === 0 ? (
                <EmptyState
                    title="No pending invitations"
                    description="Invite members to collaborate."
                />
            ) : (
                <DesktopTableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Email</TableHeader>
                                <TableHeader>Role</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Invited</TableHeader>
                                <TableHeader />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invitations.map((inv) => {
                                const expired = isExpired(inv);
                                const isBusy = pendingIds.has(inv.id);
                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell>{inv.email}</TableCell>
                                        <TableCell>
                                            {inv.initial_organization_role?.name || "No role"}
                                        </TableCell>
                                        <TableCell>
                                            {expired
                                                ? <StatusPill $variant="danger">Expired</StatusPill>
                                                : <StatusPill $variant="warning">Pending</StatusPill>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {new Date(inv.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <ActionsCell>
                                            <div className="w-actions">
                                                <Button
                                                    $size="sm"
                                                    $outline
                                                    disabled={isBusy}
                                                    onClick={() => handleResend(inv)}
                                                >
                                                    Resend
                                                </Button>
                                                <Button
                                                    $size="sm"
                                                    $outline
                                                    $destructive
                                                    disabled={isBusy}
                                                    onClick={() => handleCancel(inv)}
                                                >
                                                    {isBusy ? <Spinner size={12} /> : "Cancel"}
                                                </Button>
                                            </div>
                                        </ActionsCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </DesktopTableContainer>
            )}
        </>
    );
};
