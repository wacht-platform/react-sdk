import { useState, useRef } from "react";
import styled from "styled-components";
import { useDeployment } from "@/hooks/use-deployment";
import { useUser } from "@/hooks/use-user";
import { useScreenContext } from "../context";
import { EmailAddPopover } from "@/components/user/add-email-popover";
import { Button, Spinner } from "@/components/utility";
import { EmptyState } from "@/components/utility/empty-state";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ActionsCell,
} from "@/components/utility/table";
import {
    ResponsiveHeaderContainer,
    DesktopTableContainer,
    StatusPill,
} from "./shared";

const InlineActions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: nowrap;
    white-space: nowrap;
    & > button { white-space: nowrap; }
`;

const MutedLabel = styled.span`
    font-size: 12px;
    color: var(--color-secondary-text);
`;

export const EmailManagementSection = () => {
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();
    const [newEmail, setNewEmail] = useState("");
    const [isAddingEmail, setIsAddingEmail] = useState(false);
    const [verifyingEmailId, setVerifyingEmailId] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const emailButtonRef = useRef<HTMLButtonElement>(null);
    const verifyButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
    const {
        user,
        createEmailAddress,
        deleteEmailAddress,
        prepareEmailVerification,
        attemptEmailVerification,
        makeEmailPrimary,
    } = useUser();

    if (!deployment?.auth_settings?.email_address?.enabled) return null;

    const markPending = (id: string, on: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleMakePrimary = async (id: string) => {
        markPending(id, true);
        try {
            await makeEmailPrimary(id);
            await user.refetch();
            toast("Primary email updated", "info");
        } catch (error: any) {
            toast(error.message || "Failed to update primary email", "error");
        } finally {
            markPending(id, false);
        }
    };

    const handleDeleteEmail = async (id: string) => {
        if (id === user?.primary_email_address_id) {
            toast(
                "Cannot delete primary email. Set another email as primary first.",
                "error",
            );
            return;
        }
        markPending(id, true);
        try {
            await deleteEmailAddress(id);
            await user.refetch();
            toast("Email removed", "info");
        } catch (error: any) {
            toast(
                error.message || "Failed to delete email address. Please try again.",
                "error",
            );
        } finally {
            markPending(id, false);
        }
    };

    const handleResend = async (id: string) => {
        markPending(id, true);
        try {
            await prepareEmailVerification(id);
            await user.refetch();
            setVerifyingEmailId(id);
        } catch (error: any) {
            toast(error.message || "Failed to send verification", "error");
        } finally {
            markPending(id, false);
        }
    };

    const emails = user?.user_email_addresses || [];

    const renderStatus = (email: { id: string; verified: boolean }) => {
        if (email.id === user?.primary_email_address_id) {
            return <StatusPill $variant="success">Primary</StatusPill>;
        }
        if (email.verified) {
            return <StatusPill $variant="neutral">Backup</StatusPill>;
        }
        return <StatusPill $variant="warning">Pending verification</StatusPill>;
    };

    const renderActions = (email: { id: string; verified: boolean }) => {
        const isPrimary = email.id === user?.primary_email_address_id;
        const isBusy = pendingIds.has(email.id);

        if (isPrimary) {
            return <MutedLabel>Cannot remove</MutedLabel>;
        }

        return (
            <InlineActions>
                {email.verified && (
                    <Button
                        $size="sm"
                        $outline
                        disabled={isBusy}
                        onClick={() => handleMakePrimary(email.id)}
                    >
                        Make primary
                    </Button>
                )}
                {!email.verified && (
                    <Button
                        ref={(r: HTMLButtonElement | null) => {
                            if (r) verifyButtonRefs.current[email.id] = r;
                        }}
                        $size="sm"
                        $outline
                        disabled={isBusy}
                        onClick={() => handleResend(email.id)}
                    >
                        Resend
                    </Button>
                )}
                <Button
                    $size="sm"
                    $destructive
                    disabled={isBusy}
                    onClick={() => handleDeleteEmail(email.id)}
                >
                    {isBusy ? <Spinner size={12} /> : "Remove"}
                </Button>
            </InlineActions>
        );
    };

    return (
        <>
            <ResponsiveHeaderContainer style={{ marginBottom: "var(--space-6u)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-card-foreground)" }}>
                        Email addresses
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-secondary-text)", marginTop: 2 }}>
                        Sign in and receive notifications at these addresses.
                    </div>
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <Button
                        ref={emailButtonRef}
                        $size="sm"
                        onClick={() => setIsAddingEmail(true)}
                    >
                        Add email
                    </Button>
                    {isAddingEmail && (
                        <EmailAddPopover
                            triggerRef={emailButtonRef}
                            onClose={() => setIsAddingEmail(false)}
                            onAddEmail={async (email) => {
                                const newEmailData = await createEmailAddress(email);
                                setNewEmail(newEmailData.data.id);
                                await prepareEmailVerification(newEmailData.data.id);
                                user.refetch();
                            }}
                            onPrepareVerification={async () => {
                                await prepareEmailVerification(newEmail);
                                user.refetch();
                            }}
                            onAttemptVerification={async (otp) => {
                                await attemptEmailVerification(newEmail, otp);
                                user.refetch();
                                setIsAddingEmail(false);
                                setNewEmail("");
                                toast("Email added and verified", "info");
                            }}
                        />
                    )}
                </div>
            </ResponsiveHeaderContainer>

            {!emails.length ? (
                <EmptyState
                    title="No email addresses"
                    description="Add an email address to get started."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Email address</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {emails.map((email) => (
                                    <TableRow key={email.id}>
                                        <TableCell>{email.email}</TableCell>
                                        <TableCell>{renderStatus(email)}</TableCell>
                                        <ActionsCell>{renderActions(email)}</ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>
                </>
            )}

            {verifyingEmailId && (
                <EmailAddPopover
                    existingEmail={
                        user?.user_email_addresses?.find((e) => e.id === verifyingEmailId)?.email
                    }
                    triggerRef={{ current: verifyButtonRefs.current[verifyingEmailId] }}
                    onClose={() => setVerifyingEmailId(null)}
                    onAddEmail={async () => { }}
                    onPrepareVerification={async () => {
                        await prepareEmailVerification(verifyingEmailId);
                        user.refetch();
                    }}
                    onAttemptVerification={async (otp) => {
                        await attemptEmailVerification(verifyingEmailId, otp);
                        user.refetch();
                        setVerifyingEmailId(null);
                        toast("Email verified", "info");
                    }}
                />
            )}
        </>
    );
};
