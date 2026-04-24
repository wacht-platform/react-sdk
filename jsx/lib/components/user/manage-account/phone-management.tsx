import { useState, useRef } from "react";
import styled from "styled-components";
import { useDeployment } from "@/hooks/use-deployment";
import { useUser } from "@/hooks/use-user";
import { useScreenContext } from "../context";
import { countries } from "@/constants/geo";
import { PhoneAddPopover } from "@/components/user/add-phone-popover";
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

const PhoneCell = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    & .flag { font-size: 14px; line-height: 1; }
    & .code { color: var(--color-secondary-text); }
`;

export const PhoneManagementSection = () => {
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();
    const [newPhone, setNewPhone] = useState("");
    const [isAddingPhone, setIsAddingPhone] = useState(false);
    const [verifyingPhoneId, setVerifyingPhoneId] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const phoneButtonRef = useRef<HTMLButtonElement>(null);
    const phoneVerifyButtonRefs = useRef<Record<string, HTMLButtonElement>>({});
    const {
        user,
        createPhoneNumber,
        deletePhoneNumber,
        preparePhoneVerification,
        attemptPhoneVerification,
        makePhonePrimary,
    } = useUser();

    if (!deployment?.auth_settings?.phone_number?.enabled) return null;

    const markPending = (id: string, on: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            on ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const getCountryFlag = (countryCode: string) => {
        const country = countries.find((c) => c.dialCode === countryCode);
        return country?.flag || "🌍";
    };

    const handleMakePrimary = async (id: string) => {
        markPending(id, true);
        try {
            await makePhonePrimary(id);
            await user.refetch();
            toast("Primary phone updated", "info");
        } catch (error: any) {
            toast(error.message || "Failed to update primary phone", "error");
        } finally {
            markPending(id, false);
        }
    };

    const handleDeletePhone = async (id: string) => {
        if (id === user?.primary_phone_number_id) {
            toast(
                "Cannot delete primary phone. Set another phone as primary first.",
                "error",
            );
            return;
        }
        markPending(id, true);
        try {
            await deletePhoneNumber(id);
            await user.refetch();
            toast("Phone removed", "info");
        } catch (error: any) {
            toast(error.message || "Failed to delete phone. Please try again.", "error");
        } finally {
            markPending(id, false);
        }
    };

    const handleResend = async (id: string) => {
        markPending(id, true);
        try {
            await preparePhoneVerification(id);
            await user.refetch();
            setVerifyingPhoneId(id);
        } catch (error: any) {
            toast(error.message || "Failed to send verification", "error");
        } finally {
            markPending(id, false);
        }
    };

    const phones = user?.user_phone_numbers || [];

    const renderStatus = (phone: { id: string; verified: boolean }) => {
        if (phone.id === user?.primary_phone_number_id) {
            return <StatusPill $variant="success">Primary</StatusPill>;
        }
        if (phone.verified) {
            return <StatusPill $variant="neutral">Backup</StatusPill>;
        }
        return <StatusPill $variant="warning">Pending verification</StatusPill>;
    };

    const renderActions = (phone: { id: string; verified: boolean }) => {
        const isPrimary = phone.id === user?.primary_phone_number_id;
        const isBusy = pendingIds.has(phone.id);

        if (isPrimary) return <MutedLabel>Cannot remove</MutedLabel>;

        return (
            <InlineActions>
                {phone.verified && (
                    <Button
                        $size="sm"
                        $outline
                        disabled={isBusy}
                        onClick={() => handleMakePrimary(phone.id)}
                    >
                        Make primary
                    </Button>
                )}
                {!phone.verified && (
                    <Button
                        ref={(r: HTMLButtonElement | null) => {
                            if (r) phoneVerifyButtonRefs.current[phone.id] = r;
                        }}
                        $size="sm"
                        $outline
                        disabled={isBusy}
                        onClick={() => handleResend(phone.id)}
                    >
                        Resend
                    </Button>
                )}
                <Button
                    $size="sm"
                    $destructive
                    disabled={isBusy}
                    onClick={() => handleDeletePhone(phone.id)}
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
                        Phone numbers
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-secondary-text)", marginTop: 2 }}>
                        Used for sign-in and two-factor authentication.
                    </div>
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <Button
                        ref={phoneButtonRef}
                        $size="sm"
                        onClick={() => setIsAddingPhone(true)}
                    >
                        Add phone
                    </Button>
                    {isAddingPhone && (
                        <PhoneAddPopover
                            triggerRef={phoneButtonRef}
                            onClose={() => setIsAddingPhone(false)}
                            onAddPhone={async (phone, countryCode) => {
                                const newPhoneData = await createPhoneNumber(phone, countryCode);
                                setNewPhone(newPhoneData.data.id);
                                await preparePhoneVerification(newPhoneData.data.id);
                            }}
                            onPrepareVerification={async () => {
                                await preparePhoneVerification(newPhone);
                                user.refetch();
                            }}
                            onAttemptVerification={async (otp) => {
                                await attemptPhoneVerification(newPhone, otp);
                                user.refetch();
                                setIsAddingPhone(false);
                                setNewPhone("");
                                toast("Phone added and verified", "info");
                            }}
                        />
                    )}
                    {verifyingPhoneId && (
                        <PhoneAddPopover
                            existingPhone={
                                user?.user_phone_numbers?.find((p) => p.id === verifyingPhoneId)?.phone_number
                            }
                            triggerRef={{ current: phoneVerifyButtonRefs.current[verifyingPhoneId] }}
                            onClose={() => setVerifyingPhoneId(null)}
                            onAddPhone={async () => { }}
                            onPrepareVerification={async () => {
                                await preparePhoneVerification(verifyingPhoneId);
                                user.refetch();
                            }}
                            onAttemptVerification={async (otp) => {
                                await attemptPhoneVerification(verifyingPhoneId, otp);
                                user.refetch();
                                setVerifyingPhoneId(null);
                                toast("Phone verified", "info");
                            }}
                        />
                    )}
                </div>
            </ResponsiveHeaderContainer>

            {!phones.length ? (
                <EmptyState
                    title="No phone numbers"
                    description="Add a phone number to get started."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Phone number</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {phones.map((phone) => (
                                    <TableRow key={phone.id}>
                                        <TableCell>
                                            <PhoneCell>
                                                <span className="flag">{getCountryFlag(phone.country_code)}</span>
                                                <span className="code">{phone.country_code}</span>
                                                <span>{phone.phone_number}</span>
                                            </PhoneCell>
                                        </TableCell>
                                        <TableCell>{renderStatus(phone)}</TableCell>
                                        <ActionsCell>{renderActions(phone)}</ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>
                </>
            )}
        </>
    );
};
