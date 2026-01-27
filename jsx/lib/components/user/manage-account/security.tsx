import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
    Shield,
    AlertTriangle,
    Download,
    Check,
    ChevronDown,
} from "lucide-react";
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
    spin,
} from "./shared";

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

    // Don't render if nothing is enabled
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
            (authSettings?.auth_factors_enabled?.phone_otp && hasVerifiedPhone) ||
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
        toast("Two-factor authentication setup completed successfully!", "info");
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
        } catch (error) {
            console.error("Failed to load passkeys:", error);
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
    const securityItems = [];

    if (passwordEnabled) {
        securityItems.push({
            id: "password",
            name: "Password",
            description: "Secure your account with a strong password",
            status: user?.has_password ? "Enabled" : "Disabled",
            actions: user?.has_password ? ["change"] : ["setup"],
        });
    }

    if (deployment?.auth_settings?.passkey?.enabled) {
        securityItems.push({
            id: "passkey",
            name: "Passkeys",
            description: "Sign in faster with fingerprint, face, or screen lock",
            status: passkeys.length > 0 ? `${passkeys.length} registered` : "",
            actions: passkeys.length > 0 ? ["manage", "add"] : ["add"],
        });
    }

    if (authFactorsEnabled?.authenticator) {
        securityItems.push({
            id: "authenticator",
            name: "Authenticator App",
            description: "Use an authenticator app for extra security",
            status: user?.user_authenticator ? "Enabled" : "Disabled",
            actions: user?.user_authenticator ? ["remove"] : ["setup"],
        });
    }

    if (user?.user_authenticator) {
        securityItems.push({
            id: "backup_codes",
            name: "Backup Codes",
            description: "Recovery codes if you lose your authenticator",
            status: user?.backup_codes_generated ? "Generated" : "Not Generated",
            actions: ["generate"],
        });
    }

    if (user?.user_authenticator) {
        securityItems.push({
            id: "second_factor_policy",
            name: "Require 2FA",
            description: "Require a second factor for all sign-ins",
            status: secondFactorPolicy === "enforced" ? "Enforced" : "Optional",
            actions: ["toggle"],
        });
    }

    if (setupStep !== "table") {
        return (
            <>
                <HeaderCTAContainer>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Shield size={16} />
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "var(--color-foreground)",
                            }}
                        >
                            {setupStep === "qr" && "Setup Two-Factor Authentication"}
                            {setupStep === "verify" && "Verify Your Authenticator"}
                            {setupStep === "backup" && "Save Your Backup Codes"}
                            {setupStep === "success" && "Setup Complete!"}
                        </span>
                    </div>
                    <Button
                        onClick={() => setSetupStep("table")}
                        style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            background: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--color-foreground)",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        ← Back
                    </Button>
                </HeaderCTAContainer>

                <div
                    style={{
                        maxWidth: "500px",
                        margin: "0 auto",
                        textAlign: "center",
                        padding: "24px",
                    }}
                >
                    {setupStep === "qr" && (
                        <>
                            <p
                                style={{
                                    color: "var(--color-secondary-text)",
                                    marginBottom: "24px",
                                }}
                            >
                                Scan this QR code with your authenticator app (Google
                                Authenticator, Authy, etc.)
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginBottom: "24px",
                                }}
                            >
                                {isLoadingQR ? (
                                    <div
                                        style={{
                                            width: "200px",
                                            height: "200px",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "var(--color-input-background)",
                                        }}
                                    >
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    border: "2px solid var(--color-border)",
                                                    borderTop: "2px solid var(--color-primary)",
                                                    borderRadius: "50%",
                                                    animation: `${spin} 1s linear infinite`,
                                                    margin: "0 auto 8px",
                                                }}
                                            ></div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "var(--color-secondary-text)",
                                                }}
                                            >
                                                Loading QR Code...
                                            </div>
                                        </div>
                                    </div>
                                ) : qrCodeUrl ? (
                                    <div
                                        style={{
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            padding: "16px",
                                            background: "white",
                                        }}
                                    >
                                        <QRCodeSVG
                                            value={qrCodeUrl}
                                            size={200}
                                            level="M"
                                            marginSize={0}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            width: "200px",
                                            height: "200px",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "var(--color-input-background)",
                                            color: "var(--color-error)",
                                            fontSize: "14px",
                                            textAlign: "center",
                                        }}
                                    >
                                        QR Code Not Available
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    background: "var(--color-input-background)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "12px",
                                    marginBottom: "24px",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "var(--color-secondary-text)",
                                        margin: "0 0 8px 0",
                                    }}
                                >
                                    Or enter this code manually:
                                </p>
                                <code
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: "14px",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {secretKey || "Loading..."}
                                </code>
                            </div>

                            <Button
                                onClick={() => setSetupStep("verify")}
                                disabled={!qrCodeUrl || !secretKey}
                                style={{
                                    padding: "10px 20px",
                                    background:
                                        !qrCodeUrl || !secretKey
                                            ? "var(--color-border)"
                                            : "var(--color-primary)",
                                    color:
                                        !qrCodeUrl || !secretKey
                                            ? "var(--color-secondary-text)"
                                            : "white",
                                    border: `1px solid ${!qrCodeUrl || !secretKey ? "var(--color-border)" : "var(--color-primary)"}`,
                                    cursor: !qrCodeUrl || !secretKey ? "not-allowed" : "pointer",
                                }}
                            >
                                I've Scanned the Code
                            </Button>
                        </>
                    )}

                    {setupStep === "verify" && (
                        <>
                            <p
                                style={{
                                    color: "var(--color-secondary-text)",
                                    marginBottom: "24px",
                                }}
                            >
                                Enter two consecutive codes from your authenticator app to
                                verify setup
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    justifyContent: "center",
                                    marginBottom: "24px",
                                }}
                            >
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={verificationCodes[0]}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        const value = e.target.value
                                            .replace(/[^0-9]/g, "")
                                            .substring(0, 6);
                                        setVerificationCodes([value, verificationCodes[1]]);
                                    }}
                                    maxLength={6}
                                    style={{
                                        width: "100px",
                                        textAlign: "center",
                                        fontFamily: "monospace",
                                    }}
                                />
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={verificationCodes[1]}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        const value = e.target.value
                                            .replace(/[^0-9]/g, "")
                                            .substring(0, 6);
                                        setVerificationCodes([verificationCodes[0], value]);
                                    }}
                                    maxLength={6}
                                    style={{
                                        width: "100px",
                                        textAlign: "center",
                                        fontFamily: "monospace",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    justifyContent: "center",
                                }}
                            >
                                <Button
                                    onClick={() => setSetupStep("qr")}
                                    style={{
                                        padding: "8px 16px",
                                        background: "var(--color-background)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleVerifyAuthenticator}
                                    disabled={
                                        isVerifying ||
                                        verificationCodes.some((code) => code.length !== 6)
                                    }
                                    style={{
                                        padding: "8px 16px",
                                        background: "var(--color-primary)",
                                        color: "white",
                                        border: "1px solid var(--color-primary)",
                                    }}
                                >
                                    {isVerifying ? "Verifying..." : "Verify & Continue"}
                                </Button>
                            </div>
                        </>
                    )}

                    {setupStep === "backup" && (
                        <>
                            <div
                                style={{
                                    background: "var(--color-warning-background)",
                                    border: "1px solid var(--color-warning-border)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "16px",
                                    marginBottom: "24px",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                    textAlign: "left",
                                }}
                            >
                                <AlertTriangle
                                    size={16}
                                    style={{ color: "var(--color-warning)", marginTop: "2px" }}
                                />
                                <div>
                                    <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                                        Important!
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "var(--color-secondary-text)",
                                        }}
                                    >
                                        Store these codes safely. Each code can only be used once if
                                        you lose access to your authenticator device.
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "8px",
                                    marginBottom: "24px",
                                    maxWidth: "300px",
                                    margin: "0 auto 24px auto",
                                }}
                            >
                                {backupCodes.map((code, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            background: "var(--color-input-background)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            padding: "8px",
                                            fontFamily: "monospace",
                                            fontSize: "12px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => navigator.clipboard.writeText(code)}
                                    >
                                        {code}
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    justifyContent: "center",
                                    marginBottom: "24px",
                                }}
                            >
                                <Button
                                    onClick={copyBackupCodes}
                                    style={{
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        background: "var(--color-background)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    Copy All
                                </Button>
                                <Button
                                    onClick={downloadBackupCodes}
                                    style={{
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        background: "var(--color-background)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    <Download size={16} style={{ marginRight: "4px" }} />
                                    Download
                                </Button>
                            </div>

                            <Button
                                onClick={handleCompleteSetup}
                                style={{
                                    padding: "10px 20px",
                                    background: "var(--color-primary)",
                                    color: "white",
                                    border: "1px solid var(--color-primary)",
                                }}
                            >
                                Complete Setup
                            </Button>
                        </>
                    )}

                    {setupStep === "success" && (
                        <>
                            <div style={{ marginBottom: "24px" }}>
                                <Check
                                    size={48}
                                    style={{
                                        color: "var(--color-success)",
                                        marginBottom: "16px",
                                    }}
                                />
                                <h3
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: 600,
                                        margin: "0 0 8px 0",
                                    }}
                                >
                                    All Set!
                                </h3>
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "var(--color-secondary-text)",
                                        margin: 0,
                                    }}
                                >
                                    Your account is now protected with two-factor authentication.
                                </p>
                            </div>

                            <Button
                                onClick={handleCompleteSetup}
                                style={{
                                    padding: "10px 20px",
                                    background: "var(--color-primary)",
                                    color: "white",
                                    border: "1px solid var(--color-primary)",
                                }}
                            >
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
            <HeaderCTAContainer>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "var(--color-foreground)",
                        }}
                    >
                        Security Settings
                    </span>
                </div>
            </HeaderCTAContainer>

            {!securityItems.length ? (
                <EmptyState
                    title="No security features available"
                    description="Contact your administrator to enable security features."
                />
            ) : (
                <div>
                    {securityItems.map((item, index) => (
                        <div key={item.id}>
                            <SecurityItemRow>
                                <SecurityItemContent>
                                    <div
                                        style={{
                                            fontWeight: 400,
                                            color: "var(--color-foreground)",
                                        }}
                                    >
                                        {item.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "var(--color-secondary-text)",
                                        }}
                                    >
                                        {item.description}
                                    </div>
                                </SecurityItemContent>

                                <SecurityItemActions>
                                    {/* Status badge - hide for passkeys since they have custom buttons */}
                                    <div style={{ position: "relative" }}>
                                        {item.id === "password" && (
                                            <>
                                                {user?.has_password ? (
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <div style={{ position: "relative" }}>
                                                            <Button
                                                                ref={passwordButtonRef}
                                                                onClick={() => setShowPasswordPopover(true)}
                                                                style={{
                                                                    padding: "6px 12px",
                                                                    fontSize: "12px",
                                                                    background: "var(--color-primary)",
                                                                    color: "white",
                                                                    border: "1px solid var(--color-primary)",
                                                                    borderRadius: "var(--radius-md)",
                                                                    fontWeight: "400",
                                                                }}
                                                            >
                                                                Change
                                                            </Button>

                                                            {showPasswordPopover && (
                                                                <ChangePasswordPopover
                                                                    triggerRef={passwordButtonRef}
                                                                    onClose={() => setShowPasswordPopover(false)}
                                                                    onChangePassword={handleChangePassword}
                                                                />
                                                            )}
                                                        </div>

                                                        {canRemovePassword() && (
                                                            <div style={{ position: "relative" }}>
                                                                <Button
                                                                    ref={removePasswordButtonRef}
                                                                    onClick={() =>
                                                                        setShowRemovePasswordPopover(true)
                                                                    }
                                                                    style={{
                                                                        padding: "6px 12px",
                                                                        fontSize: "12px",
                                                                        background: "transparent",
                                                                        color: "var(--color-error)",
                                                                        border: "1px solid var(--color-error)",
                                                                        borderRadius: "var(--radius-md)",
                                                                        fontWeight: "400",
                                                                    }}
                                                                >
                                                                    Remove
                                                                </Button>

                                                                {showRemovePasswordPopover && (
                                                                    <RemovePasswordPopover
                                                                        triggerRef={removePasswordButtonRef}
                                                                        onClose={() =>
                                                                            setShowRemovePasswordPopover(false)
                                                                        }
                                                                        onRemovePassword={handleRemovePassword}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ position: "relative" }}>
                                                        <Button
                                                            ref={passwordButtonRef}
                                                            onClick={() => setShowPasswordPopover(true)}
                                                            style={{
                                                                padding: "6px 12px",
                                                                fontSize: "12px",
                                                                background: "var(--color-primary)",
                                                                color: "white",
                                                                border: "1px solid var(--color-primary)",
                                                                borderRadius: "var(--radius-md)",
                                                                fontWeight: "400",
                                                            }}
                                                        >
                                                            Setup
                                                        </Button>

                                                        {showPasswordPopover && (
                                                            <ChangePasswordPopover
                                                                triggerRef={passwordButtonRef}
                                                                onClose={() => setShowPasswordPopover(false)}
                                                                onChangePassword={handleChangePassword}
                                                                isSetup={true}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {item.id === "authenticator" &&
                                            !user?.user_authenticator && (
                                                <>
                                                    <div style={{ position: "relative" }}>
                                                        <Button
                                                            ref={totpButtonRef}
                                                            onClick={() => setShowTOTPPopover(true)}
                                                            disabled={isLoadingQR}
                                                            style={{
                                                                padding: "6px 12px",
                                                                fontSize: "12px",
                                                                background: "var(--color-primary)",
                                                                color: "white",
                                                                border: "1px solid var(--color-primary)",
                                                                borderRadius: "var(--radius-md)",
                                                                fontWeight: "400",
                                                            }}
                                                        >
                                                            {isLoadingQR ? "Setting up..." : "Setup"}
                                                        </Button>

                                                        {showTOTPPopover && (
                                                            <SetupTOTPPopover
                                                                triggerRef={totpButtonRef}
                                                                onClose={() => setShowTOTPPopover(false)}
                                                                onSetupTOTP={async () => {
                                                                    const result = await setupAuthenticator();
                                                                    setAuthenticatorId(result.id);
                                                                    return result;
                                                                }}
                                                                onVerifyTOTP={async (codes) => {
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
                                                <div style={{ position: "relative" }}>
                                                    <Button
                                                        onClick={() => setShowDeleteAuthPopover(true)}
                                                        disabled={isRemovingAuth}
                                                        style={{
                                                            padding: "6px 16px",
                                                            fontSize: "13px",
                                                            background: "var(--color-error)",
                                                            border: "1px solid var(--color-error)",
                                                            color: "white",
                                                            cursor: isRemovingAuth ? "not-allowed" : "pointer",
                                                            opacity: isRemovingAuth ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {isRemovingAuth ? "Removing..." : "Remove"}
                                                    </Button>
                                                    {showDeleteAuthPopover && (
                                                        <ConfirmationPopover
                                                            title="Remove MFA and reset policy to default?"
                                                            onConfirm={handleRemoveAuthenticator}
                                                            onCancel={() => setShowDeleteAuthPopover(false)}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                        {item.id === "backup_codes" && (
                                            <>
                                                <div style={{ position: "relative" }}>
                                                    <Button
                                                        ref={backupCodesButtonRef}
                                                        onClick={handleGenerateNewBackupCodes}
                                                        disabled={isGeneratingCodes}
                                                        style={{
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            background: "var(--color-primary)",
                                                            color: "white",
                                                            border: "1px solid var(--color-primary)",
                                                            borderRadius: "var(--radius-md)",
                                                            fontWeight: "400",
                                                        }}
                                                    >
                                                        {isGeneratingCodes
                                                            ? "Generating..."
                                                            : user?.backup_codes_generated
                                                                ? "Regenerate"
                                                                : "Generate"}
                                                    </Button>

                                                    {showBackupCodesPopover && (
                                                        <BackupCodesPopover
                                                            triggerRef={backupCodesButtonRef}
                                                            codes={backupCodes}
                                                            onClose={() => setShowBackupCodesPopover(false)}
                                                            onCopy={copyBackupCodes}
                                                            onDownload={downloadBackupCodes}
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {item.id === "second_factor_policy" && (
                                            <Switch
                                                checked={secondFactorPolicy === "enforced"}
                                                onChange={(checked) => {
                                                    handleSecondFactorPolicyChange(
                                                        checked ? "enforced" : "none",
                                                    );
                                                }}
                                            />
                                        )}

                                        {item.id === "passkey" && (
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <Button
                                                    onClick={() => setIsPasskeyExpanded(!isPasskeyExpanded)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        background: "var(--color-background)",
                                                        border: "1px solid var(--color-border)",
                                                        borderRadius: "var(--radius-md)",
                                                        fontWeight: "400",
                                                        color: "var(--color-foreground)",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        whiteSpace: "nowrap",
                                                        flexShrink: 0,
                                                        width: "110px",
                                                        height: "36px",
                                                    }}
                                                >
                                                    {isPasskeyExpanded ? "Hide" : "Manage"} ({passkeys.length})
                                                    <ChevronDown
                                                        size={14}
                                                        style={{
                                                            transform: isPasskeyExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                                            transition: "transform 0.2s ease",
                                                        }}
                                                    />
                                                </Button>
                                                <div style={{ position: "relative" }}>
                                                    <Button
                                                        ref={addPasskeyButtonRef}
                                                        onClick={() => setShowAddPasskeyPopover(true)}
                                                        disabled={isRegisteringPasskey}
                                                        style={{
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            background: "var(--color-primary)",
                                                            color: "white",
                                                            border: "1px solid var(--color-primary)",
                                                            borderRadius: "var(--radius-md)",
                                                            fontWeight: "400",
                                                            cursor: isRegisteringPasskey ? "not-allowed" : "pointer",
                                                            opacity: isRegisteringPasskey ? 0.7 : 1,
                                                            whiteSpace: "nowrap",
                                                            minWidth: "80px",
                                                            width: "auto",
                                                            height: "36px",
                                                        }}
                                                    >
                                                        {isRegisteringPasskey ? "Adding..." : "Add"}
                                                    </Button>

                                                    {showAddPasskeyPopover && (
                                                        <AddPasskeyPopover
                                                            triggerRef={addPasskeyButtonRef}
                                                            onClose={() => setShowAddPasskeyPopover(false)}
                                                            onAddPasskey={handleRegisterPasskey}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </SecurityItemActions>
                            </SecurityItemRow>

                            {/* Passkey Accordion Content */}
                            {
                                item.id === "passkey" && isPasskeyExpanded && (
                                    <div
                                        style={{
                                            padding: "12px 0",
                                            borderTop: "1px solid var(--color-border)",
                                            marginTop: "8px",
                                        }}
                                    >
                                        {isLoadingPasskeys ? (
                                            <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                                                <Spinner />
                                            </div>
                                        ) : passkeys.length === 0 ? (
                                            <div
                                                style={{
                                                    textAlign: "center",
                                                    padding: "16px",
                                                    color: "var(--color-secondary-text)",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                No passkeys registered yet
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                {passkeys.map((passkey: any) => (
                                                    <div
                                                        key={passkey.id}
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            padding: "10px 12px",
                                                            background: "var(--color-input-background)",
                                                            borderRadius: "var(--radius-md)",
                                                            border: "1px solid var(--color-border)",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                            <span
                                                                style={{
                                                                    fontWeight: 500,
                                                                    fontSize: "13px",
                                                                    color: "var(--color-foreground)",
                                                                }}
                                                            >
                                                                {passkey.name || "Unnamed Passkey"}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: "11px",
                                                                    color: "var(--color-secondary-text)",
                                                                }}
                                                            >
                                                                {passkey.device_type === "platform" ? "This device" : "Security key"}
                                                                {passkey.last_used_at && ` • Last used ${new Date(passkey.last_used_at).toLocaleDateString()}`}
                                                            </span>
                                                        </div>
                                                        <div style={{ position: "relative" }}>
                                                            <Button
                                                                onClick={() => setPasskeyToDelete(passkey.id)}
                                                                style={{
                                                                    padding: "4px 10px",
                                                                    fontSize: "12px",
                                                                    background: "transparent",
                                                                    border: "1px solid var(--color-error)",
                                                                    borderRadius: "var(--radius-md)",
                                                                    color: "var(--color-error)",
                                                                    cursor: "pointer",
                                                                    flexShrink: 0,
                                                                    width: "auto",
                                                                }}
                                                            >
                                                                Remove
                                                            </Button>

                                                            {passkeyToDelete === passkey.id && (
                                                                <ConfirmationPopover
                                                                    title={`Remove "${passkey.name || "Unnamed Passkey"}"?`}
                                                                    onConfirm={() => {
                                                                        handleDeletePasskey(passkey.id);
                                                                        setPasskeyToDelete(null);
                                                                    }}
                                                                    onCancel={() => setPasskeyToDelete(null)}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            {
                                index < securityItems.length - 1 && (
                                    <div
                                        style={{
                                            height: "1px",
                                            background: "var(--color-border)",
                                            margin: "0",
                                        }}
                                    />
                                )
                            }
                        </div>
                    ))}
                </div >
            )}
        </>
    );
};
