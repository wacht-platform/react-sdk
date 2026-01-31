import React, { useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { useDeployment } from "@/hooks/use-deployment";
import { useUser } from "@/hooks/use-user";
import { countries } from "@/constants/geo";
import { PhoneAddPopover } from "@/components/user/add-phone-popover";
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

export const PhoneManagementSection = () => {
    const { deployment } = useDeployment();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [newPhone, setNewPhone] = useState("");
    const [isAddingPhone, setIsAddingPhone] = useState(false);
    const [verifyingPhoneId, setVerifyingPhoneId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
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

    // Don't render if phone is disabled
    if (!deployment?.auth_settings?.phone_number?.enabled) {
        return null;
    }

    // Helper function to get country flag from dial code
    const getCountryFlag = (countryCode: string) => {
        const country = countries.find((c) => c.dialCode === countryCode);
        return country?.flag || "🌍";
    };

    // Filter phones based on search query
    const filteredPhones = React.useMemo(() => {
        if (!user?.user_phone_numbers) return [];
        if (!searchQuery.trim()) return user.user_phone_numbers;

        return user.user_phone_numbers.filter((phone) =>
            phone.phone_number.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [user?.user_phone_numbers, searchQuery]);

    return (
        <>
            <ResponsiveHeaderContainer>
                <div style={{ flex: 1, minWidth: "200px" }}>
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search Phone"
                    />
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <Button
                        ref={phoneButtonRef}
                        onClick={() => setIsAddingPhone(true)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            height: "36px",
                            width: "100%", // Needs media query for full width on mobile? Or handled by container wrapping?
                        }}
                    >
                        Add Phone
                    </Button>
                    {isAddingPhone && (
                        <PhoneAddPopover
                            triggerRef={phoneButtonRef}
                            onClose={() => setIsAddingPhone(false)}
                            onAddPhone={async (phone, countryCode) => {
                                const newPhoneData = await createPhoneNumber(
                                    phone,
                                    countryCode,
                                );
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
                            }}
                        />
                    )}
                    {verifyingPhoneId && (
                        <PhoneAddPopover
                            existingPhone={
                                user?.user_phone_numbers?.find((p) => p.id === verifyingPhoneId)
                                    ?.phone_number
                            }
                            triggerRef={{
                                current: phoneVerifyButtonRefs.current[verifyingPhoneId],
                            }}
                            onClose={() => setVerifyingPhoneId(null)}
                            onAddPhone={async () => {
                                // This won't be called since we're starting at OTP step
                            }}
                            onPrepareVerification={async () => {
                                await preparePhoneVerification(verifyingPhoneId);
                                user.refetch();
                            }}
                            onAttemptVerification={async (otp) => {
                                await attemptPhoneVerification(verifyingPhoneId, otp);
                                user.refetch();
                                setVerifyingPhoneId(null);
                            }}
                        />
                    )}
                </div>
            </ResponsiveHeaderContainer>

            {!filteredPhones?.length ? (
                <EmptyState
                    title={
                        searchQuery ? "No phones match your search" : "No phone numbers"
                    }
                    description="Add a phone number to get started."
                />
            ) : (
                <>
                    <DesktopTableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Phone Number</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader></TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPhones.map((phone) => (
                                    <TableRow key={phone.id}>
                                        <TableCell>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <span style={{ fontSize: "18px" }}>
                                                    {getCountryFlag(phone.country_code)}
                                                </span>
                                                <span>{phone.country_code}</span>
                                                <span>{phone.phone_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {phone.id === user?.primary_phone_number_id
                                                ? "Primary"
                                                : phone.verified
                                                    ? "Verified"
                                                    : "Not Verified"}
                                        </TableCell>
                                        <ActionsCell>
                                            <Dropdown
                                                open={activeDropdown === phone.id}
                                                openChange={(isOpen) =>
                                                    setActiveDropdown(isOpen ? phone.id : null)
                                                }
                                            >
                                                <DropdownTrigger>
                                                    <IconButton
                                                        ref={(ref: HTMLButtonElement | null) => {
                                                            if (ref) phoneVerifyButtonRefs.current[phone.id] = ref;
                                                        }}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </IconButton>
                                                </DropdownTrigger>
                                                <DropdownItems>
                                                    {phone.id !== user?.primary_phone_number_id &&
                                                        phone.verified && (
                                                            <DropdownItem
                                                                onClick={async () => {
                                                                    await makePhonePrimary(phone.id);
                                                                    user.refetch();
                                                                    setActiveDropdown(null);
                                                                }}
                                                            >
                                                                Make primary
                                                            </DropdownItem>
                                                        )}
                                                    {!phone.verified && (
                                                        <DropdownItem
                                                            onClick={async () => {
                                                                setActiveDropdown(null);
                                                                await preparePhoneVerification(phone.id);
                                                                setVerifyingPhoneId(phone.id);
                                                            }}
                                                        >
                                                            Verify phone
                                                        </DropdownItem>
                                                    )}
                                                    <DropdownItem
                                                        $destructive
                                                        onClick={() => {
                                                            deletePhoneNumber(phone.id);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        Remove
                                                    </DropdownItem>
                                                </DropdownItems>
                                            </Dropdown>
                                        </ActionsCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </DesktopTableContainer>

                    <MobileListContainer>
                        {filteredPhones.map((phone, index) => (
                            <div key={phone.id}>
                                <ConnectionItemRow>
                                    <ConnectionLeft>
                                        <span style={{ fontSize: "18px" }}>
                                            {getCountryFlag(phone.country_code)}
                                        </span>
                                        <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--color-foreground)" }}>
                                            {phone.country_code} {phone.phone_number}
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
                                            {phone.id === user?.primary_phone_number_id
                                                ? "Primary"
                                                : phone.verified
                                                    ? "Verified"
                                                    : "Not Verified"}
                                        </div>
                                        <div style={{ marginLeft: "auto" }}>
                                            <Dropdown
                                                open={activeDropdown === phone.id}
                                                openChange={(isOpen) =>
                                                    setActiveDropdown(isOpen ? phone.id : null)
                                                }
                                            >
                                                <DropdownTrigger>
                                                    <IconButton
                                                        ref={(ref: HTMLButtonElement | null) => {
                                                            if (ref) phoneVerifyButtonRefs.current[phone.id] = ref;
                                                        }}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </IconButton>
                                                </DropdownTrigger>
                                                <DropdownItems>
                                                    {phone.id !== user?.primary_phone_number_id &&
                                                        phone.verified && (
                                                            <DropdownItem
                                                                onClick={async () => {
                                                                    await makePhonePrimary(phone.id);
                                                                    user.refetch();
                                                                    setActiveDropdown(null);
                                                                }}
                                                            >
                                                                Make primary
                                                            </DropdownItem>
                                                        )}
                                                    {!phone.verified && (
                                                        <DropdownItem
                                                            onClick={async () => {
                                                                setActiveDropdown(null);
                                                                await preparePhoneVerification(phone.id);
                                                                setVerifyingPhoneId(phone.id);
                                                            }}
                                                        >
                                                            Verify phone
                                                        </DropdownItem>
                                                    )}
                                                    <DropdownItem
                                                        $destructive
                                                        onClick={() => {
                                                            deletePhoneNumber(phone.id);
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        Remove
                                                    </DropdownItem>
                                                </DropdownItems>
                                            </Dropdown>
                                        </div>
                                    </ConnectionLeft>
                                </ConnectionItemRow>
                                {index < filteredPhones.length - 1 && (
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

        </>
    );
};
