import { useEffect, useState } from "react";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";
import { AuthCard, AuthHead, AuthCardLoader, Spin } from "./auth-card";
import { useDeployment } from "@/hooks/use-deployment";
import { NavigationLink } from "../utility/navigation";
import {
    TwoFactorMethodSelector,
    type TwoFactorMethod,
} from "./two-factor-method-selector";
import { PhoneVerification } from "./phone-verification";
import { ShieldIcon } from "../icons/shield";
import { SmartphoneIcon } from "../icons/smartphone";
import { KeyIcon } from "../icons/key";
import { ProfileCompletionProps } from "@wacht/types";
import { useNavigation } from "@/hooks";
import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

export function TwoFactorVerification({
    onBack,
    attempt,
    completeVerification,
    prepareVerification,
}: Omit<ProfileCompletionProps, "completeProfile">) {
    const { deployment } = useDeployment();
    const [verificationCode, setVerificationCode] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [showMethodSelector, setShowMethodSelector] = useState(true);
    const [showPhoneVerification, setShowPhoneVerification] = useState(false);
    const [maskedPhone, setMaskedPhone] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);

    const { navigate } = useNavigation();

    const available2FAMethods = attempt?.available_2fa_methods || [];

    const availableMethods: TwoFactorMethod[] = [
        {
            id: "authenticator",
            name: "Authenticator app",
            description: "Use your authenticator app",
            icon: <ShieldIcon />,
            available: available2FAMethods.includes("authenticator"),
        },
        {
            id: "phone_otp",
            name: "Text message",
            description: "Get a code via SMS",
            icon: <SmartphoneIcon />,
            available: available2FAMethods.includes("phone_otp"),
            phoneNumber: maskedPhone,
        },
        {
            id: "backup_code",
            name: "Backup code",
            description: "Use one of your backup codes",
            icon: <KeyIcon />,
            available: available2FAMethods.includes("backup_code"),
        },
    ].filter((method) => method.available);

    const handleMethodSelect = async (methodId: string) => {
        setSelectedMethod(methodId);
        setShowMethodSelector(false);

        if (methodId === "phone_otp") {
            setShowPhoneVerification(true);
        }
    };

    const handlePhoneVerification = async (lastFourDigits: string) => {
        if (!attempt) return;

        setIsSubmitting(true);
        try {
            const response = await prepareVerification({
                strategy: "phone_otp",
                lastDigits: lastFourDigits,
            });

            if (response && "data" in response && response.data?.otp_sent) {
                if (response.data?.masked_phone) {
                    setMaskedPhone(response.data.masked_phone);
                }
                setShowPhoneVerification(false);
            } else {
                setErrors({ phone: "Phone number verification failed" });
            }
        } catch (err) {
            setErrors({ phone: (err as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent, codeOverride?: string) => {
        e.preventDefault();
        if (isSubmitting) return;

        const codeToVerify = codeOverride || verificationCode;
        const newErrors: Record<string, string> = {};

        if (!codeToVerify) {
            newErrors.code = "Verification code is required";
        } else if (
            selectedMethod === "authenticator" &&
            codeToVerify.length !== 6
        ) {
            newErrors.code = "Authentication code must be 6 digits";
        } else if (
            selectedMethod === "phone_otp" &&
            codeToVerify.length !== 6
        ) {
            newErrors.code = "SMS code must be 6 digits";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await completeVerification(codeToVerify);
        } catch (err) {
            setErrors({ submit: (err as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (selectedMethod !== "backup_code") {
            value = value.replace(/\D/g, "").slice(0, 6);
        }
        setVerificationCode(value);
        setErrors((prev) => ({ ...prev, code: "" }));
    };

    useEffect(() => {
        if (attempt.completed) {
            setIsRedirecting(true);
            let redirectUri: string | null = sanitizeRedirectUri(
                deployment,
                new URLSearchParams(window.location.search).get("redirect_uri"),
            );

            if (!redirectUri) {
                redirectUri =
                    deployment?.ui_settings?.after_signin_redirect_url || null;
            }

            if (!redirectUri && deployment?.frontend_host) {
                redirectUri = `https://${deployment.frontend_host}`;
            }

            if (redirectUri) {
                let uri: URL;
                try {
                    uri = new URL(redirectUri);
                } catch {
                    uri = new URL(redirectUri, window.location.origin);
                }

                if (deployment?.mode === "staging") {
                    uri.searchParams.set(
                        "__dev_session__",
                        getStoredDevSession(deployment.backend_host) || "",
                    );
                }

                navigate(uri.toString());
            }
            return;
        }
    }, [attempt, deployment]);

    if (isRedirecting) {
        return <AuthCardLoader />;
    }

    if (showMethodSelector) {
        if (availableMethods.length === 0) {
            return (
                <DefaultStylesProvider>
                    <AuthCard
                        footer={
                            <span className="w-auth-foot">
                                Having trouble?{" "}
                                <NavigationLink
                                    to={
                                        deployment?.ui_settings
                                            .support_page_url || "#"
                                    }
                                    className="w-link"
                                >
                                    Get help
                                </NavigationLink>
                            </span>
                        }
                    >
                        <AuthHead
                            title="Set up two-factor authentication"
                            sub="Your account requires two-factor authentication, but you haven't set up any methods yet. Please contact your administrator to set up 2FA."
                        />
                        {onBack && (
                            <div style={{ textAlign: "center" }}>
                                <button
                                    type="button"
                                    className="w-link"
                                    onClick={onBack}
                                >
                                    Back to login
                                </button>
                            </div>
                        )}
                    </AuthCard>
                </DefaultStylesProvider>
            );
        }

        return (
            <TwoFactorMethodSelector
                methods={availableMethods}
                onSelectMethod={handleMethodSelect}
                onBack={onBack}
            />
        );
    }

    if (showPhoneVerification && selectedMethod === "phone_otp") {
        return (
            <PhoneVerification
                onVerify={handlePhoneVerification}
                onBack={() => {
                    setShowPhoneVerification(false);
                    setShowMethodSelector(true);
                    setSelectedMethod(null);
                }}
                loading={isSubmitting}
            />
        );
    }

    const sub =
        selectedMethod === "authenticator"
            ? "Enter the 6-digit code from your authenticator app"
            : selectedMethod === "phone_otp"
              ? `Enter the 6-digit code sent to your phone ${maskedPhone}`
              : "Enter one of your backup codes";

    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    <span className="w-auth-foot">
                        Having trouble?{" "}
                        <NavigationLink
                            to={
                                deployment?.ui_settings.support_page_url || "#"
                            }
                            className="w-link"
                        >
                            Get help
                        </NavigationLink>
                    </span>
                }
            >
                <AuthHead title="Two-factor authentication" sub={sub} />

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {selectedMethod === "backup_code" ? (
                        <div className="w-field">
                            <label className="w-label" htmlFor="code">
                                Backup code
                            </label>
                            <input
                                className={`w-input${errors.code ? " w-input--invalid" : ""}`}
                                type="text"
                                id="code"
                                name="code"
                                value={verificationCode}
                                onChange={handleInputChange}
                                placeholder="Enter backup code"
                                maxLength={20}
                                autoComplete="one-time-code"
                                aria-invalid={!!errors.code}
                                autoFocus
                            />
                            {errors.code && (
                                <span className="w-input-err">
                                    {errors.code}
                                </span>
                            )}
                        </div>
                    ) : (
                        <OTPInput
                            onComplete={async (code) => {
                                setVerificationCode(code);
                                if (selectedMethod !== "backup_code") {
                                    const event = new Event("submit", {
                                        bubbles: true,
                                        cancelable: true,
                                    });
                                    await handleSubmit(event as any, code);
                                }
                            }}
                            onResend={
                                selectedMethod === "phone_otp"
                                    ? async () => {
                                          try {
                                              await prepareVerification({
                                                  strategy: "phone_otp",
                                                  lastDigits:
                                                      maskedPhone.slice(-4),
                                              });
                                          } catch (error) {
                                              setErrors({
                                                  submit: (error as Error)
                                                      .message,
                                              });
                                          }
                                      }
                                    : undefined
                            }
                            error={errors.code}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {errors.submit && (
                        <span className="w-input-err">{errors.submit}</span>
                    )}

                    <button
                        type="submit"
                        className="w-btn w-btn--primary w-btn--block"
                        disabled={isSubmitting || !verificationCode}
                    >
                        {isSubmitting ? <Spin onAccent /> : "Verify"}
                    </button>
                </form>

                <div
                    style={{
                        marginTop: 18,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    <button
                        type="button"
                        className="w-link"
                        onClick={() => {
                            setShowMethodSelector(true);
                            setSelectedMethod(null);
                            setVerificationCode("");
                            setErrors({});
                        }}
                    >
                        Try another method
                    </button>
                    {onBack && (
                        <button
                            type="button"
                            className="w-link w-link--muted"
                            onClick={onBack}
                        >
                            Back to login
                        </button>
                    )}
                </div>
            </AuthCard>
        </DefaultStylesProvider>
    );
}
