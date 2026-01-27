import React, { useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { useDeployment } from "@/hooks/use-deployment";
import { useUser } from "@/hooks/use-user";
import { useScreenContext } from "../context";
import { EmailAddPopover } from "@/components/user/add-email-popover";
import { Button, SearchInput } from "@/components/utility";
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
    Dropdown,
    DropdownItem,
    DropdownItems,
    DropdownTrigger,
} from "@/components/utility/dropdown";
import {
    ResponsiveHeaderContainer,
    DesktopTableContainer,
    MobileListContainer,
    ConnectionItemRow,
    ConnectionLeft,
    IconButton,
} from "./shared";

export const EmailManagementSection = () => {
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState("");
    const [isAddingEmail, setIsAddingEmail] = useState(false);
    const [verifyingEmailId, setVerifyingEmailId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const emailButtonRef = useRef<HTMLButtonElement>(null);
    const verifyButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>(
        {},
    );
    const {
        user,
        createEmailAddress,
        deleteEmailAddress,
        prepareEmailVerification,
        attemptEmailVerification,
        makeEmailPrimary,
    } = useUser();

    // Don't render if email is disabled
    if (!deployment?.auth_settings?.email_address?.enabled) {
        return null;
    }

    const handleDeleteEmail = async (emailId: string) => {
        try {
            // Check if this is the primary email
            if (emailId === user?.primary_email_address_id) {
                toast(
                    "Cannot delete primary email address. Please set another email as primary first.",
                    "error",
                );
                return;
            }

            await deleteEmailAddress(emailId);
            user.refetch();
            toast("Email address deleted successfully", "info");
        } catch (error: any) {
            toast(
                error.message || "Failed to delete email address. Please try again.",
                "error",
            );
        }
    };

    // Filter emails based on search query
    const filteredEmails = React.useMemo(() => {
        if (!user?.user_email_addresses) return [];
        if (!searchQuery.trim()) return user.user_email_addresses;

        return user.user_email_addresses.filter((email) =>
            email.email.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [user?.user_email_addresses, searchQuery]);

    return (
        <>
            <ResponsiveHeaderContainer>
                <div style={{ flex: 1, minWidth: "200px" }}>
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search Email"
                    />
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <Button
                        ref={emailButtonRef}
                        onClick={() => setIsAddingEmail(true)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            height: "36px",
                            width: "100%",
                        }}
                    >
                        Add Email
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
                                // Don't close the popover - let it transition to OTP step
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
                                toast("Email added and verified successfully!", "info");
                            }}
                        />
                    )}
                </div>
            </ResponsiveHeaderContainer>

            {!filteredEmails?.length ? (
                <EmptyState
                    title={
                        searchQuery ? "No emails match your search" : "No email addresses"
                    }
                    description="Add an email address to get started."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Email Address</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader></TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEmails.map((email) => (
                                    <TableRow key={email.id}>
                                        <TableCell>{email.email}</TableCell>
                                        <TableCell>
                                            {email.id === user?.primary_email_address_id
                                                ? "Primary"
                                                : email.verified
                                                    ? "Verified"
                                                    : "Not Verified"}
                                        </TableCell>
                                        <ActionsCell>
                                            {/* Only show dropdown if there are actions available (not primary or not verified) */}
                                            {email.id !== user?.primary_email_address_id ||
                                                !email.verified ? (
                                                <Dropdown
                                                    open={activeDropdown === email.id}
                                                    openChange={(isOpen) =>
                                                        setActiveDropdown(isOpen ? email.id : null)
                                                    }
                                                >
                                                    <DropdownTrigger>
                                                        <IconButton
                                                            ref={(ref: HTMLButtonElement | null) => {
                                                                if (ref) verifyButtonRefs.current[email.id] = ref;
                                                            }}
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </IconButton>
                                                    </DropdownTrigger>
                                                    <DropdownItems>
                                                        {email.id !== user?.primary_email_address_id &&
                                                            email.verified && (
                                                                <DropdownItem
                                                                    onClick={async () => {
                                                                        try {
                                                                            await makeEmailPrimary(email.id);
                                                                            user.refetch();
                                                                            setActiveDropdown(null);
                                                                            toast(
                                                                                "Primary email updated successfully",
                                                                                "info",
                                                                            );
                                                                        } catch (error: any) {
                                                                            toast(
                                                                                error.message ||
                                                                                "Failed to update primary email",
                                                                                "error",
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    Make primary
                                                                </DropdownItem>
                                                            )}
                                                        {!email.verified && (
                                                            <DropdownItem
                                                                onClick={async () => {
                                                                    setActiveDropdown(null);
                                                                    await prepareEmailVerification(email.id);
                                                                    setVerifyingEmailId(email.id);
                                                                }}
                                                            >
                                                                Verify email
                                                            </DropdownItem>
                                                        )}
                                                        {email.id !== user?.primary_email_address_id && (
                                                            <DropdownItem
                                                                $destructive
                                                                onClick={() => {
                                                                    handleDeleteEmail(email.id);
                                                                    setActiveDropdown(null);
                                                                }}
                                                            >
                                                                Remove
                                                            </DropdownItem>
                                                        )}
                                                    </DropdownItems>
                                                </Dropdown>
                                            ) : null}
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>

                    <MobileListContainer>
                        {filteredEmails.map((email, index) => (
                            <div key={email.id}>
                                <ConnectionItemRow>
                                    <ConnectionLeft>
                                        <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--color-foreground)" }}>
                                            {email.email}
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "var(--color-muted)",
                                                background: "var(--color-input-background)",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                border: "1px solid var(--color-border)",
                                            }}
                                        >
                                            {email.id === user?.primary_email_address_id
                                                ? "Primary"
                                                : email.verified
                                                    ? "Verified"
                                                    : "Not Verified"}
                                        </div>

                                        {/* Menu on first line */}
                                        <div style={{ marginLeft: "auto" }}>
                                            {(email.id !== user?.primary_email_address_id || !email.verified) && (
                                                <Dropdown
                                                    open={activeDropdown === email.id}
                                                    openChange={(isOpen) =>
                                                        setActiveDropdown(isOpen ? email.id : null)
                                                    }
                                                >
                                                    <DropdownTrigger>
                                                        <IconButton
                                                            ref={(ref: HTMLButtonElement | null) => {
                                                                if (ref) verifyButtonRefs.current[email.id] = ref;
                                                            }}
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </IconButton>
                                                    </DropdownTrigger>
                                                    <DropdownItems>
                                                        {email.id !== user?.primary_email_address_id &&
                                                            email.verified && (
                                                                <DropdownItem
                                                                    onClick={async () => {
                                                                        try {
                                                                            await makeEmailPrimary(email.id);
                                                                            user.refetch();
                                                                            setActiveDropdown(null);
                                                                            toast(
                                                                                "Primary email updated successfully",
                                                                                "info",
                                                                            );
                                                                        } catch (error: any) {
                                                                            toast(
                                                                                error.message ||
                                                                                "Failed to update primary email",
                                                                                "error",
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    Make primary
                                                                </DropdownItem>
                                                            )}
                                                        {!email.verified && (
                                                            <DropdownItem
                                                                onClick={async () => {
                                                                    setActiveDropdown(null);
                                                                    await prepareEmailVerification(email.id);
                                                                    setVerifyingEmailId(email.id);
                                                                }}
                                                            >
                                                                Verify email
                                                            </DropdownItem>
                                                        )}
                                                        {email.id !== user?.primary_email_address_id && (
                                                            <DropdownItem
                                                                $destructive
                                                                onClick={() => {
                                                                    handleDeleteEmail(email.id);
                                                                    setActiveDropdown(null);
                                                                }}
                                                            >
                                                                Remove
                                                            </DropdownItem>
                                                        )}
                                                    </DropdownItems>
                                                </Dropdown>
                                            )}
                                        </div>
                                    </ConnectionLeft>
                                </ConnectionItemRow>
                                {index < filteredEmails.length - 1 && (
                                    <div
                                        style={{
                                            height: "1px",
                                            background: "var(--color-border)",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </MobileListContainer>
                </>
            )}
            {verifyingEmailId && (
                <EmailAddPopover
                    existingEmail={
                        user?.user_email_addresses?.find((e) => e.id === verifyingEmailId)
                            ?.email
                    }
                    triggerRef={{ current: verifyButtonRefs.current[verifyingEmailId] }}
                    onClose={() => setVerifyingEmailId(null)}
                    onAddEmail={async () => {
                        // This won't be called since we're starting at OTP step
                    }}
                    onPrepareVerification={async () => {
                        await prepareEmailVerification(verifyingEmailId);
                        user.refetch();
                    }}
                    onAttemptVerification={async (otp) => {
                        await attemptEmailVerification(verifyingEmailId, otp);
                        user.refetch();
                        setVerifyingEmailId(null);
                        toast("Email verified successfully!", "info");
                    }}
                />
            )}
        </>
    );
};
