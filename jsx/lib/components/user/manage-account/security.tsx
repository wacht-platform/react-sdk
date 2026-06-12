import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
    Shield,
    Warning,
    DownloadSimple,
    Check,
    CaretDown,
} from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { useDeployment } from "@/hooks/use-deployment";
import { useUser } from "@/hooks/use-user";
import { useScreenContext } from "../context";
import { Button, Spinner } from "@/components/utility";
import { Input } from "@/components/utility/input";
import { Switch } from "@/components/utility/switch";
import { ChangePasswordPopover } from "@/components/user/change-password-popover";
import { RemovePasswordPopover } from "@/components/user/remove-password-popover";
import { SetupTOTPPopover } from "@/components/user/setup-totp-popover";
import { BackupCodesPopover } from "@/components/user/backup-codes-popover";
import { AddPasskeyPopover } from "@/components/user/add-passkey-popover";
import { ConfirmationPopover } from "@/components/utility/confirmation-popover";
import { EmptyState } from "@/components/utility/empty-state";
import {
    HeaderCTAContainer,
    SecurityItemRow,
    SecurityItemContent,
    SecurityItemActions,
} from "./shared";

const SectionLabel = ({
    children,
}: {
    $first?: boolean;
    children: React.ReactNode;
}) => <div className="w-eyebrow">{children}</div>;

export const SecurityManagementSection = () => {
    const { deployment } = useDeployment();
    const {
        user,
        updatePassword,
        removePassword,
        setupAuthenticator,
        verifyAuthenticator,
        deleteAuthenticator,
        generateBackupCodes,
        regenerateBackupCodes,
        updateProfile,
        getPasskeys,
        registerPasskey,
        deletePasskey,
    } = useUser();
    const { toast } = useScreenContext();

    const [secondFactorPolicy, setSecondFactorPolicy] = useState(
        user?.second_factor_policy || "none",
    );

    const [showDeleteAuthPopover, setShowDeleteAuthPopover] = useState(false);

    const handleSecondFactorPolicyChange = async (
        policy: "none" | "enforced",
    ) => {
        try {
            await updateProfile({ second_factor_policy: policy });
            setSecondFactorPolicy(policy);
            toast("2FA requirement updated successfully", "info");
        } catch (error: any) {
            toast(error.message || "Failed to update 2FA requirement", "error");
        }
    };

    const [showTOTPPopover, setShowTOTPPopover] = useState(false);
    const [showPasswordPopover, setShowPasswordPopover] = useState(false);
    const [showRemovePasswordPopover, setShowRemovePasswordPopover] =
        useState(false);
    const [showBackupCodesPopover, setShowBackupCodesPopover] = useState(false);
    const totpButtonRef = useRef<HTMLButtonElement>(null);
    const passwordButtonRef = useRef<HTMLButtonElement>(null);
    const removePasswordButtonRef = useRef<HTMLButtonElement>(null);
    const backupCodesButtonRef = useRef<HTMLButtonElement>(null);

    // Passkey state
    const [passkeys, setPasskeys] = useState<any[]>([]);
    const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
    const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
    const [isPasskeyExpanded, setIsPasskeyExpanded] = useState(false);
    const [showAddPasskeyPopover, setShowAddPasskeyPopover] = useState(false);
    const [passkeyToDelete, setPasskeyToDelete] = useState<string | null>(null);
    const addPasskeyButtonRef = useRef<HTMLButtonElement>(null);

    const [setupStep, setSetupStep] = useState<
        "table" | "qr" | "verify" | "backup" | "success"
    >("table");
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [secretKey, setSecretKey] = useState<string>("");
    const [authenticatorId, setAuthenticatorId] = useState<string>("");
    const [verificationCodes, setVerificationCodes] = useState<string[]>([
        "",
        "",
    ]);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isLoadingQR] = useState(false);
    const [isRemovingAuth, setIsRemovingAuth] = useState(false);

    const authFactorsEnabled = deployment?.auth_settings?.auth_factors_enabled;
    const passwordEnabled = deployment?.auth_settings?.password?.enabled;

    if (
        !authFactorsEnabled?.authenticator &&
        !authFactorsEnabled?.backup_code &&
        !passwordEnabled
    ) {
        return null;
    }

    const handleChangePassword = async (
        currentPassword: string,
        newPassword: string,
    ) => {
        await updatePassword(currentPassword, newPassword);
        await user.refetch();
        toast("Password updated successfully", "info");
    };

    const handleRemovePassword = async (currentPassword: string) => {
        await removePassword(currentPassword);
        await user.refetch();
        toast("Password removed successfully", "info");
    };

    const canRemovePassword = () => {
        if (!user) return false;

        const hasVerifiedEmail = user.user_email_addresses?.some(
            (email) => email.verified,
        );

        const hasVerifiedPhone = user.user_phone_numbers?.some(
            (phone) => phone.verified,
        );

        const hasSocialConnection =
            user.social_connections && user.social_connections.length > 0;

        const authSettings = deployment?.auth_settings;

        const hasAlternativeAuth =
            (authSettings?.first_factor === "email_otp" && hasVerifiedEmail) ||
            (authSettings?.magic_link?.enabled && hasVerifiedEmail) ||
            authSettings?.passkey?.enabled ||
            (authSettings?.auth_factors_enabled?.phone_otp &&
                hasVerifiedPhone) ||
            (hasSocialConnection &&
                deployment?.social_connections?.some((sc) => sc.enabled));

        return hasAlternativeAuth;
    };

    const handleVerifyAuthenticator = async () => {
        if (verificationCodes.some((code) => code.length !== 6)) {
            toast("Please enter both 6-digit verification codes", "error");
            return;
        }

        try {
            setIsVerifying(true);
            await verifyAuthenticator(authenticatorId, verificationCodes);
            await user.refetch();

            if (authFactorsEnabled?.backup_code) {
                const codes = await generateBackupCodes();
                setBackupCodes(codes);
                await user.refetch();
                setSetupStep("backup");
            } else {
                setSetupStep("success");
            }
        } catch (error: any) {
            toast(error.message || "Invalid verification codes", "error");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCompleteSetup = () => {
        setSetupStep("table");
        setQrCodeUrl("");
        setSecretKey("");
        setAuthenticatorId("");
        setVerificationCodes(["", ""]);
        setBackupCodes([]);
        toast(
            "Two-factor authentication setup completed successfully!",
            "info",
        );
    };

    const handleRemoveAuthenticator = async () => {
        if (!user?.user_authenticator?.id) return;

        try {
            setIsRemovingAuth(true);
            await deleteAuthenticator(user.user_authenticator.id);
            await user.refetch();
            setShowDeleteAuthPopover(false);
            toast("Two-factor authentication removed successfully", "info");
        } catch (error: any) {
            toast(error.message || "Failed to remove authenticator", "error");
        } finally {
            setIsRemovingAuth(false);
        }
    };

    const handleGenerateNewBackupCodes = async () => {
        if (isGeneratingCodes) return;

        try {
            setIsGeneratingCodes(true);
            const codes = await regenerateBackupCodes();
            setBackupCodes(codes);
            await user.refetch();
            setShowBackupCodesPopover(true);
            toast("New backup codes generated", "info");
        } catch (error: any) {
            toast(error.message || "Failed to generate backup codes", "error");
        } finally {
            setIsGeneratingCodes(false);
        }
    };

    const copyBackupCodes = () => {
        const codesText = backupCodes.join("\n");
        navigator.clipboard
            .writeText(codesText)
            .then(() => {
                toast("Backup codes copied to clipboard", "info");
            })
            .catch(() => {
                toast("Failed to copy backup codes", "error");
            });
    };

    const downloadBackupCodes = () => {
        const codesText = backupCodes.join("\n");
        const blob = new Blob([codesText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wacht-backup-codes.txt";
        a.click();
        URL.revokeObjectURL(url);
        toast("Backup codes downloaded", "info");
    };

    // Passkey handlers
    const loadPasskeys = async () => {
        if (!deployment?.auth_settings?.passkey?.enabled) return;
        try {
            setIsLoadingPasskeys(true);
            const result = await getPasskeys();
            setPasskeys(result.data || []);
        } catch {
            toast("Failed to load passkeys", "error");
        } finally {
            setIsLoadingPasskeys(false);
        }
    };

    const handleRegisterPasskey = async (name: string) => {
        try {
            setIsRegisteringPasskey(true);
            await registerPasskey(name || undefined);
            await loadPasskeys();
            toast("Passkey registered successfully!", "info");
        } catch (error: any) {
            toast(error.message || "Failed to register passkey", "error");
            throw error; // Re-throw so popover can show error
        } finally {
            setIsRegisteringPasskey(false);
        }
    };

    const handleDeletePasskey = async (id: string) => {
        try {
            await deletePasskey(id);
            await loadPasskeys();
            toast("Passkey removed", "info");
        } catch (error: any) {
            toast(error.message || "Failed to remove passkey", "error");
        }
    };

    // Load passkeys on mount
    useEffect(() => {
        loadPasskeys();
    }, [deployment?.auth_settings?.passkey?.enabled]);

    // Create security items for table display
    type SecurityGroup = "sign-in" | "recovery";
    interface SecurityItem {
        id: string;
        name: string;
        description: string;
        status: string;
        actions: string[];
        group: SecurityGroup;
    }
    const securityItems: SecurityItem[] = [];

    if (passwordEnabled) {
        securityItems.push({
            id: "password",
            name: "Password",
            description: "Secure your account with a strong password",
            status: user?.has_password ? "Enabled" : "Disabled",
            actions: user?.has_password ? ["change"] : ["setup"],
            group: "sign-in",
        });
    }

    if (deployment?.auth_settings?.passkey?.enabled) {
        securityItems.push({
            id: "passkey",
            name: "Passkeys",
            description:
                "Sign in faster with fingerprint, face, or screen lock",
            status: passkeys.length > 0 ? `${passkeys.length} registered` : "",
            actions: passkeys.length > 0 ? ["manage", "add"] : ["add"],
            group: "sign-in",
        });
    }

    if (authFactorsEnabled?.authenticator) {
        securityItems.push({
            id: "authenticator",
            name: "Authenticator App",
            description: "Use an authenticator app for extra security",
            status: user?.user_authenticator ? "Enabled" : "Disabled",
            actions: user?.user_authenticator ? ["remove"] : ["setup"],
            group: "sign-in",
        });
    }

    if (user?.user_authenticator) {
        securityItems.push({
            id: "backup_codes",
            name: "Backup Codes",
            description: "Recovery codes if you lose your authenticator",
            status: user?.backup_codes_generated
                ? "Generated"
                : "Not Generated",
            actions: ["generate"],
            group: "recovery",
        });
    }

    if (user?.user_authenticator) {
        securityItems.push({
            id: "second_factor_policy",
            name: "Require 2FA",
            description: "Require a second factor for all sign-ins",
            status: secondFactorPolicy === "enforced" ? "Enforced" : "Optional",
            actions: ["toggle"],
            group: "recovery",
        });
    }

    if (setupStep !== "table") {
        return (
            <>
                <HeaderCTAContainer>
                    <div className="w-flex w-items-center w-gap-3">
                        <Shield size={16} />
                        <span className="w-sec">
                            {setupStep === "qr" &&
                                "Setup Two-Factor Authentication"}
                            {setupStep === "verify" &&
                                "Verify Your Authenticator"}
                            {setupStep === "backup" && "Save Your Backup Codes"}
                            {setupStep === "success" && "Setup Complete!"}
                        </span>
                    </div>
                    <Button $outline $size="sm" onClick={() => setSetupStep("table")}>
                        ← Back
                    </Button>
                </HeaderCTAContainer>

                <div
                    className="w-narrow w-flex-col w-items-center w-gap-5"
                    style={{ textAlign: "center" }}
                >
                    {setupStep === "qr" && (
                        <>
                            <p className="w-secsub">
                                Scan this QR code with your authenticator app
                                (Google Authenticator, Authy, etc.)
                            </p>

                            <div className="w-flex w-justify-center">
                                {isLoadingQR ? (
                                    <div className="w-qr w-flex-col w-items-center w-gap-3">
                                        <span className="w-spin" />
                                        <div className="w-secsub">
                                            Loading QR Code...
                                        </div>
                                    </div>
                                ) : qrCodeUrl ? (
                                    <div className="w-tile w-flex w-items-center w-justify-center">
                                        <QRCodeSVG
                                            value={qrCodeUrl}
                                            size={200}
                                            level="M"
                                            marginSize={0}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-qr w-text-error">
                                        QR Code Not Available
                                    </div>
                                )}
                            </div>

                            <div className="w-flex-col w-gap-2 w-full">
                                <p className="w-secsub">
                                    Or enter this code manually:
                                </p>
                                <div className="w-token">
                                    <code>{secretKey || "Loading..."}</code>
                                </div>
                            </div>

                            <Button
                                $fullWidth
                                onClick={() => setSetupStep("verify")}
                                disabled={!qrCodeUrl || !secretKey}
                            >
                                I've Scanned the Code
                            </Button>
                        </>
                    )}

                    {setupStep === "verify" && (
                        <>
                            <p className="w-secsub">
                                Enter two consecutive codes from your
                                authenticator app to verify setup
                            </p>

                            <div className="w-flex w-justify-center w-gap-3">
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={verificationCodes[0]}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        const value = e.target.value
                                            .replace(/[^0-9]/g, "")
                                            .substring(0, 6);
                                        setVerificationCodes([
                                            value,
                                            verificationCodes[1],
                                        ]);
                                    }}
                                    maxLength={6}
                                    style={{
                                        textAlign: "center",
                                        fontFamily: "monospace",
                                    }}
                                />
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={verificationCodes[1]}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => {
                                        const value = e.target.value
                                            .replace(/[^0-9]/g, "")
                                            .substring(0, 6);
                                        setVerificationCodes([
                                            verificationCodes[0],
                                            value,
                                        ]);
                                    }}
                                    maxLength={6}
                                    style={{
                                        textAlign: "center",
                                        fontFamily: "monospace",
                                    }}
                                />
                            </div>

                            <div className="w-flex w-justify-center w-gap-3">
                                <Button
                                    $outline
                                    $size="sm"
                                    onClick={() => setSetupStep("qr")}
                                >
                                    Back
                                </Button>
                                <Button
                                    $size="sm"
                                    onClick={handleVerifyAuthenticator}
                                    disabled={
                                        isVerifying ||
                                        verificationCodes.some(
                                            (code) => code.length !== 6,
                                        )
                                    }
                                >
                                    {isVerifying
                                        ? "Verifying..."
                                        : "Verify & Continue"}
                                </Button>
                            </div>
                        </>
                    )}

                    {setupStep === "backup" && (
                        <>
                            <div className="w-banner w-banner--warn" style={{ textAlign: "left" }}>
                                <Warning size={16} />
                                <div className="w-flex-col w-gap-1">
                                    <div className="w-sec">Important!</div>
                                    <div className="w-banner-txt">
                                        Store these codes safely. Each code can
                                        only be used once if you lose access to
                                        your authenticator device.
                                    </div>
                                </div>
                            </div>

                            <div className="w-codes w-full">
                                {backupCodes.map((code, index) => (
                                    <span
                                        key={index}
                                        onClick={() =>
                                            navigator.clipboard.writeText(code)
                                        }
                                        style={{ cursor: "pointer" }}
                                    >
                                        {code}
                                    </span>
                                ))}
                            </div>

                            <div className="w-flex w-justify-center w-gap-3">
                                <Button
                                    $outline
                                    $size="sm"
                                    onClick={copyBackupCodes}
                                >
                                    Copy All
                                </Button>
                                <Button
                                    $outline
                                    $size="sm"
                                    onClick={downloadBackupCodes}
                                >
                                    <DownloadSimple size={16} />
                                    DownloadSimple
                                </Button>
                            </div>

                            <Button $fullWidth onClick={handleCompleteSetup}>
                                Complete Setup
                            </Button>
                        </>
                    )}

                    {setupStep === "success" && (
                        <>
                            <div className="w-success">
                                <span className="ring" />
                                <span className="disc">
                                    <Check size={26} />
                                </span>
                            </div>
                            <div className="w-flex-col w-gap-1 w-items-center">
                                <h3 className="w-title">All Set!</h3>
                                <p className="w-secsub">
                                    Your account is now protected with
                                    two-factor authentication.
                                </p>
                            </div>

                            <Button $fullWidth onClick={handleCompleteSetup}>
                                Continue to Security
                            </Button>
                        </>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            {!securityItems.length ? (
                <EmptyState
                    title="No security features available"
                    description="Contact your administrator to enable security features."
                />
            ) : (
                <div>
                    {securityItems.map((item, index) => {
                        const prevGroup =
                            index > 0 ? securityItems[index - 1].group : null;
                        const showGroupLabel = item.group !== prevGroup;
                        const nextItem = securityItems[index + 1];
                        const nextSameGroup =
                            nextItem && nextItem.group === item.group;
                        return (
                            <div key={item.id}>
                                {showGroupLabel && (
                                    <SectionLabel $first={index === 0}>
                                        {item.group === "sign-in"
                                            ? "Sign-in methods"
                                            : "Recovery"}
                                    </SectionLabel>
                                )}
                                <SecurityItemRow>
                                    <SecurityItemContent>
                                        <div className="w-flex w-items-center w-wrap w-gap-2 w-sec">
                                            <span>{item.name}</span>
                                        </div>
                                        <div className="w-secsub">
                                            {item.description}
                                        </div>
                                    </SecurityItemContent>

                                    <SecurityItemActions>
                                        {/* Status badge - hide for passkeys since they have custom buttons */}
                                        <div className="w-relative">
                                            {item.id === "password" && (
                                                <>
                                                    {user?.has_password ? (
                                                        <div className="w-flex w-gap-2">
                                                            <div className="w-relative"
                                                            >
                                                                <Button
                                                                    $size="sm"
                                                                    ref={
                                                                        passwordButtonRef
                                                                    }
                                                                    onClick={() =>
                                                                        setShowPasswordPopover(
                                                                            true,
                                                                        )
                                                                    }
                                                                >
                                                                    Change
                                                                </Button>

                                                                {showPasswordPopover && (
                                                                    <ChangePasswordPopover
                                                                        triggerRef={
                                                                            passwordButtonRef
                                                                        }
                                                                        onClose={() =>
                                                                            setShowPasswordPopover(
                                                                                false,
                                                                            )
                                                                        }
                                                                        onChangePassword={
                                                                            handleChangePassword
                                                                        }
                                                                    />
                                                                )}
                                                            </div>

                                                            {canRemovePassword() && (
                                                                <div className="w-relative"
                                                                >
                                                                    <Button
                                                                        $destructive
                                                                        $size="sm"
                                                                        ref={
                                                                            removePasswordButtonRef
                                                                        }
                                                                        onClick={() =>
                                                                            setShowRemovePasswordPopover(
                                                                                true,
                                                                            )
                                                                        }
                                                                    >
                                                                        Remove
                                                                    </Button>

                                                                    {showRemovePasswordPopover && (
                                                                        <RemovePasswordPopover
                                                                            triggerRef={
                                                                                removePasswordButtonRef
                                                                            }
                                                                            onClose={() =>
                                                                                setShowRemovePasswordPopover(
                                                                                    false,
                                                                                )
                                                                            }
                                                                            onRemovePassword={
                                                                                handleRemovePassword
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-relative"
                                                        >
                                                            <Button
                                                                $size="sm"
                                                                ref={
                                                                    passwordButtonRef
                                                                }
                                                                onClick={() =>
                                                                    setShowPasswordPopover(
                                                                        true,
                                                                    )
                                                                }
                                                            >
                                                                Setup
                                                            </Button>

                                                            {showPasswordPopover && (
                                                                <ChangePasswordPopover
                                                                    triggerRef={
                                                                        passwordButtonRef
                                                                    }
                                                                    onClose={() =>
                                                                        setShowPasswordPopover(
                                                                            false,
                                                                        )
                                                                    }
                                                                    onChangePassword={
                                                                        handleChangePassword
                                                                    }
                                                                    isSetup={
                                                                        true
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {item.id === "authenticator" &&
                                                !user?.user_authenticator && (
                                                    <>
                                                        <div className="w-relative"
                                                        >
                                                            <Button
                                                                $size="sm"
                                                                ref={
                                                                    totpButtonRef
                                                                }
                                                                onClick={() =>
                                                                    setShowTOTPPopover(
                                                                        true,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isLoadingQR
                                                                }
                                                            >
                                                                {isLoadingQR
                                                                    ? "Setting up..."
                                                                    : "Setup"}
                                                            </Button>

                                                            {showTOTPPopover && (
                                                                <SetupTOTPPopover
                                                                    triggerRef={
                                                                        totpButtonRef
                                                                    }
                                                                    onClose={() =>
                                                                        setShowTOTPPopover(
                                                                            false,
                                                                        )
                                                                    }
                                                                    onSetupTOTP={async () => {
                                                                        const result =
                                                                            await setupAuthenticator();
                                                                        setAuthenticatorId(
                                                                            result.id,
                                                                        );
                                                                        return result;
                                                                    }}
                                                                    onVerifyTOTP={async (
                                                                        codes,
                                                                    ) => {
                                                                        await verifyAuthenticator(
                                                                            authenticatorId,
                                                                            codes,
                                                                        );
                                                                        await user.refetch();
                                                                        toast(
                                                                            "Two-factor authentication enabled successfully!",
                                                                            "info",
                                                                        );
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                            {item.id === "authenticator" &&
                                                user?.user_authenticator && (
                                                    <div className="w-relative"
                                                    >
                                                        <Button
                                                            $destructive
                                                            $size="sm"
                                                            onClick={() =>
                                                                setShowDeleteAuthPopover(
                                                                    true,
                                                                )
                                                            }
                                                            disabled={
                                                                isRemovingAuth
                                                            }
                                                        >
                                                            {isRemovingAuth
                                                                ? "Removing..."
                                                                : "Remove"}
                                                        </Button>
                                                        {showDeleteAuthPopover && (
                                                            <ConfirmationPopover
                                                                title="Remove MFA and reset policy to default?"
                                                                onConfirm={
                                                                    handleRemoveAuthenticator
                                                                }
                                                                onCancel={() =>
                                                                    setShowDeleteAuthPopover(
                                                                        false,
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                            {item.id === "backup_codes" && (
                                                <>
                                                    <div className="w-relative"
                                                    >
                                                        <Button
                                                            $size="sm"
                                                            ref={
                                                                backupCodesButtonRef
                                                            }
                                                            onClick={
                                                                handleGenerateNewBackupCodes
                                                            }
                                                            disabled={
                                                                isGeneratingCodes
                                                            }
                                                        >
                                                            {isGeneratingCodes
                                                                ? "Generating..."
                                                                : user?.backup_codes_generated
                                                                  ? "Regenerate"
                                                                  : "Generate"}
                                                        </Button>

                                                        {showBackupCodesPopover && (
                                                            <BackupCodesPopover
                                                                triggerRef={
                                                                    backupCodesButtonRef
                                                                }
                                                                codes={
                                                                    backupCodes
                                                                }
                                                                onClose={() =>
                                                                    setShowBackupCodesPopover(
                                                                        false,
                                                                    )
                                                                }
                                                                onCopy={
                                                                    copyBackupCodes
                                                                }
                                                                onDownload={
                                                                    downloadBackupCodes
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {item.id ===
                                                "second_factor_policy" && (
                                                <Switch
                                                    checked={
                                                        secondFactorPolicy ===
                                                        "enforced"
                                                    }
                                                    onChange={(checked) => {
                                                        handleSecondFactorPolicyChange(
                                                            checked
                                                                ? "enforced"
                                                                : "none",
                                                        );
                                                    }}
                                                />
                                            )}

                                            {item.id === "passkey" && (
                                                <div className="w-flex w-items-center w-gap-2">
                                                    <Button
                                                        $outline
                                                        $size="sm"
                                                        onClick={() =>
                                                            setIsPasskeyExpanded(
                                                                !isPasskeyExpanded,
                                                            )
                                                        }
                                                    >
                                                        {isPasskeyExpanded
                                                            ? "Hide"
                                                            : "Manage"}{" "}
                                                        ({passkeys.length})
                                                        <CaretDown
                                                            size={14}
                                                            style={{
                                                                transform:
                                                                    isPasskeyExpanded
                                                                        ? "rotate(180deg)"
                                                                        : "rotate(0deg)",
                                                                transition:
                                                                    "transform 0.2s ease",
                                                            }}
                                                        />
                                                    </Button>
                                                    <div className="w-relative"
                                                    >
                                                        <Button
                                                            $size="sm"
                                                            ref={
                                                                addPasskeyButtonRef
                                                            }
                                                            onClick={() =>
                                                                setShowAddPasskeyPopover(
                                                                    true,
                                                                )
                                                            }
                                                            disabled={
                                                                isRegisteringPasskey
                                                            }
                                                        >
                                                            {isRegisteringPasskey
                                                                ? "Adding..."
                                                                : "Add"}
                                                        </Button>

                                                        {showAddPasskeyPopover && (
                                                            <AddPasskeyPopover
                                                                triggerRef={
                                                                    addPasskeyButtonRef
                                                                }
                                                                onClose={() =>
                                                                    setShowAddPasskeyPopover(
                                                                        false,
                                                                    )
                                                                }
                                                                onAddPasskey={
                                                                    handleRegisterPasskey
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </SecurityItemActions>
                                </SecurityItemRow>

                                {/* Passkey Accordion Content */}
                                {item.id === "passkey" && isPasskeyExpanded && (
                                    <div className="w-flex-col w-gap-2">
                                        {isLoadingPasskeys ? (
                                            <div className="w-loading">
                                                <Spinner />
                                            </div>
                                        ) : passkeys.length === 0 ? (
                                            <div className="w-empty">
                                                <p>No passkeys registered yet</p>
                                            </div>
                                        ) : (
                                            <div className="w-flex-col w-gap-2">
                                                {passkeys.map(
                                                    (passkey: any) => (
                                                        <div
                                                            key={passkey.id}
                                                            className="w-locked w-flex w-items-center w-justify-between"
                                                            style={{ height: "auto", padding: "10px 12px" }}
                                                        >
                                                            <div className="w-flex-col w-gap-1">
                                                                <span className="w-sec">
                                                                    {passkey.name ||
                                                                        "Unnamed Passkey"}
                                                                </span>
                                                                <span className="w-secsub">
                                                                    {passkey.device_type ===
                                                                    "platform"
                                                                        ? "This device"
                                                                        : "Security key"}
                                                                    {passkey.last_used_at &&
                                                                        ` • Last used ${new Date(passkey.last_used_at).toLocaleDateString()}`}
                                                                </span>
                                                            </div>
                                                            <div className="w-relative"
                                                            >
                                                                <Button
                                                                    $destructive
                                                                    $size="sm"
                                                                    onClick={() =>
                                                                        setPasskeyToDelete(
                                                                            passkey.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </Button>

                                                                {passkeyToDelete ===
                                                                    passkey.id && (
                                                                    <ConfirmationPopover
                                                                        title={`Remove "${passkey.name || "Unnamed Passkey"}"?`}
                                                                        onConfirm={() => {
                                                                            handleDeletePasskey(
                                                                                passkey.id,
                                                                            );
                                                                            setPasskeyToDelete(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        onCancel={() =>
                                                                            setPasskeyToDelete(
                                                                                null,
                                                                            )
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {nextSameGroup && <div className="w-hr" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};
