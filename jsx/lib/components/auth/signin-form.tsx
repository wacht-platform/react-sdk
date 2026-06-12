import { useEffect, useState, useRef, type ReactNode } from "react";
import { useSignInWithStrategy } from "../../hooks/use-signin";
import type { OAuthProvider } from "../../hooks/use-signin";
import { useSession } from "../../hooks/use-session";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";
import { SocialAuthButtons } from "./social-buttons";
import { ForgotPassword } from "./forgot-password";
import { OtherSignInOptions } from "./other-signin-options";
import { TwoFactorVerification } from "./two-factor-verification";
import { ProfileCompletion } from "./profile-completion";
import { PasskeyPrompt } from "./passkey-prompt";
import {
    useSignInContext,
    SignInProvider,
} from "../../context/signin-provider";
import { NavigationLink } from "../utility/navigation";
import { NoPrefillInput } from "../utility/no-prefill-input";
import { PhoneNumberInput } from "../utility/phone";
import type { SignInParams } from "@/types";
import type { DeploymentSocialConnection } from "@/types";
import { useDeployment } from "@/hooks/use-deployment";
import { useNavigation } from "@/hooks/use-navigation";
import { AuthCard, AuthHead, Spin, AuthCardLoader } from "./auth-card";
import {
    CaretRight,
    Fingerprint,
    Hash,
    Lock,
    UserCirclePlus,
    PencilSimple,
    Warning,
} from "@phosphor-icons/react";

import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

export function SignInForm() {
    return (
        <SignInProvider>
            <SignInFormContent />
        </SignInProvider>
    );
}

function SignInFormContent() {
    const { deployment } = useDeployment();
    const { navigate } = useNavigation();
    const {
        session,
        loading: sessionLoading,
        refetch: refetchSession,
        exchangeTicket,
        switchSignIn,
    } = useSession();
    const isMultiSessionEnabled =
        deployment?.auth_settings?.multi_session_support?.enabled ?? false;

    const {
        setEmail,
        otpSent,
        setOtpSent,
        showForgotPassword,
        setShowForgotPassword,
        showOtherOptions,
        setShowOtherOptions,
        enabledSocialsProviders,
        firstFactor,
        setFirstFactor,
        signInStep,
        setSignInStep,
    } = useSignInContext();
    const {
        loading,
        signIn,
        signinAttempt,
        discardSignInAttempt,
        setSignInAttempt,
    } = useSignInWithStrategy("generic");
    const { signIn: oauthSignIn } = useSignInWithStrategy("oauth");
    const { signIn: passkeySignIn } = useSignInWithStrategy("passkey");
    const [formData, setFormData] = useState<SignInParams>({
        email: "",
        username: "",
        password: "",
        phone: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [countryCode, setCountryCode] = useState<string | undefined>("US");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [ssoError, setSsoError] = useState<string | null>(null);
    const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [dismissedWelcomeBack, setDismissedWelcomeBack] = useState(false);
    const [magicLinkTimer, setMagicLinkTimer] = useState(60);
    const [magicLinkCanResend, setMagicLinkCanResend] = useState(false);
    const [pendingRedirectUri, setPendingRedirectUri] = useState<string | null>(
        null,
    );

    const existingSignins = [...(session?.signins || [])].sort((a, b) =>
        a.id === session?.active_signin?.id
            ? -1
            : b.id === session?.active_signin?.id
              ? 1
              : 0,
    );

    // Check for SSO error params in URL (e.g., from JIT provisioning disabled)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (error === "access_denied" && errorDescription) {
            setSsoError(errorDescription);
            // Clear error params from URL
            urlParams.delete("error");
            urlParams.delete("error_description");
            const newUrl = urlParams.toString()
                ? `${window.location.pathname}?${urlParams.toString()}`
                : window.location.pathname;
            window.history.replaceState({}, "", newUrl);
        }
    }, []);

    useEffect(() => {
        if (firstFactor !== "email_magic_link" || !otpSent) return;
        setMagicLinkTimer(60);
        setMagicLinkCanResend(false);
        const interval = setInterval(() => {
            setMagicLinkTimer((prev) => {
                if (prev <= 1) {
                    setMagicLinkCanResend(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [firstFactor, otpSent]);

    useEffect(() => {
        if (
            !sessionLoading &&
            session?.active_signin &&
            !isMultiSessionEnabled &&
            !isRedirecting &&
            !showPasskeyPrompt
        ) {
            let redirectUri = sanitizeRedirectUri(
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

            const passkeySettings = deployment?.auth_settings?.passkey;
            const shouldPrompt =
                passkeySettings?.enabled &&
                passkeySettings?.prompt_registration_on_auth &&
                !session.active_signin?.user?.has_passkeys;

            if (shouldPrompt) {
                setPendingRedirectUri(redirectUri);
                setShowPasskeyPrompt(true);
            } else if (redirectUri) {
                setIsRedirecting(true);
                navigate(redirectUri);
            }
        }
    }, [
        session,
        sessionLoading,
        isMultiSessionEnabled,
        deployment,
        navigate,
        isRedirecting,
    ]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === "phone") {
            value = value.replace(/[^0-9]/g, "");
        } else if (name === "email") {
            setEmail(value);
            value = value.toLowerCase();
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const resetFormData = () => {
        setFormData({
            email: "",
            username: "",
            password: "",
            phone: "",
        });
        setErrors({});
        setCountryCode("US");
        setSignInStep("identifier");
    };

    const handleIdentify = async (email: string) => {
        if (!email) {
            setErrors({ email: "Email address is required" });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const result = await signIn.identify(email);

            if (result.strategy === "sso" && result.connection_id) {
                const searchParams = new URLSearchParams(
                    window.location.search,
                );
                const redirectUri =
                    sanitizeRedirectUri(
                        deployment,
                        searchParams.get("redirect_uri"),
                    ) || undefined;
                const response = await signIn.initEnterpriseSso(
                    result.connection_id,
                    redirectUri,
                );
                if (response && response.sso_url) {
                    setIsRedirecting(true);
                    window.location.href = response.sso_url;
                    return;
                }
            } else if (result.strategy === "social" && result.provider) {
                const socialConnection = enabledSocialsProviders.find(
                    (conn) => conn.provider === result.provider,
                );
                if (socialConnection) {
                    const searchParams = new URLSearchParams(
                        window.location.search,
                    );
                    const redirectUri =
                        sanitizeRedirectUri(
                            deployment,
                            searchParams.get("redirect_uri"),
                        ) || undefined;
                    const { data } = await oauthSignIn.create({
                        provider: socialConnection.provider as OAuthProvider,
                        redirectUri,
                    });
                    if (
                        data &&
                        typeof data === "object" &&
                        "oauth_url" in data
                    ) {
                        setIsRedirecting(true);
                        window.location.href = data.oauth_url as string;
                        return;
                    }
                } else {
                    setSignInStep("password");
                }
            } else {
                setSignInStep("password");
            }
        } catch (err) {
            setErrors({ submit: (err as Error).message });
        } finally {
            if (!isRedirecting) {
                setIsSubmitting(false);
            }
        }
    };

    const createSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || isSubmitting) return;
        discardSignInAttempt();

        const newErrors: Record<string, string> = {};

        if (signInStep === "identifier" && firstFactor === "email_password") {
            if (!formData.email) {
                setErrors({ email: "Email address is required" });
                return;
            }
            await handleIdentify(formData.email);
            return;
        }

        if (
            signInStep === "identifier" &&
            firstFactor === "username_password"
        ) {
            if (!formData.username) {
                setErrors({ username: "Username is required" });
                return;
            }
            setErrors({});
            setSignInStep("password");
            return;
        }

        if (firstFactor === "email_password") {
            if (!formData.email) {
                newErrors.email = "Email address is required";
            }
            if (!formData.password) {
                newErrors.password = "Password is required";
            }
        } else if (firstFactor === "username_password") {
            if (!formData.username) {
                newErrors.username = "Username is required";
            }
            if (!formData.password) {
                newErrors.password = "Password is required";
            }
        } else if (firstFactor === "email_otp") {
            if (!formData.email) {
                newErrors.email = "Email address is required";
            }
        } else if (firstFactor === "email_magic_link") {
            if (!formData.email) {
                newErrors.email = "Email address is required";
            }
        } else if (firstFactor === "phone_otp") {
            if (!formData.phone) {
                newErrors.phone = "Phone number is required";
            } else {
                // Validate phone number format like in signup
                const phonePattern = /^\d{7,15}$/;
                if (!phonePattern.test(formData.phone)) {
                    newErrors.phone = "Phone number must contain 7-15 digits";
                }
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        let strategy = "";
        switch (firstFactor) {
            case "email_password":
                strategy = "plain_email";
                break;
            case "username_password":
                strategy = "plain_username";
                break;
            case "email_otp":
                strategy = "email_otp";
                break;
            case "email_magic_link":
                strategy = "magic_link";
                break;
            case "phone_otp":
                strategy = "phone_otp";
                break;
        }

        const isVerificationStrategy =
            firstFactor === "email_otp" ||
            firstFactor === "email_magic_link" ||
            firstFactor === "phone_otp";

        setIsSubmitting(true);
        try {
            const submitData: any = {
                ...formData,
                strategy,
            };

            if (firstFactor === "phone_otp" && countryCode) {
                submitData.phone_country_code = countryCode;
            }

            await signIn.create(submitData);
            if (!isVerificationStrategy) setIsSubmitting(false);
        } catch (err) {
            setErrors({ submit: (err as Error).message });
            setIsSubmitting(false);
        }
    };

    const completeVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || isSubmitting) return;

        const newErrors: Record<string, string> = {};
        if (!otpCode) {
            newErrors.otp = "OTP code is required";
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            await signIn.completeVerification(otpCode);
            setOtpSent(false);
            setOtpCode("");
        } catch (err) {
            setErrors({ otp: (err as Error).message || "Verification failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const initSocialAuthSignIn = async (
        connection: DeploymentSocialConnection,
    ) => {
        if (loading || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const redirectUri =
                sanitizeRedirectUri(
                    deployment,
                    searchParams.get("redirect_uri"),
                ) || undefined;
            const { data } = await oauthSignIn.create({
                provider: connection.provider as OAuthProvider,
                redirectUri,
            });
            if (data && typeof data === "object" && "oauth_url" in data) {
                window.location.href = data.oauth_url as string;
            }
        } catch (err) {
            setErrors({ submit: (err as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasskeySignIn = async () => {
        if (loading || isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});
        try {
            const result = await passkeySignIn.create();
            if ("data" in result && result.data) {
                await refetchSession();

                let redirectUri = sanitizeRedirectUri(
                    deployment,
                    new URLSearchParams(window.location.search).get(
                        "redirect_uri",
                    ),
                );
                if (!redirectUri) {
                    redirectUri =
                        deployment?.ui_settings?.after_signin_redirect_url ||
                        null;
                }
                if (!redirectUri && deployment?.frontend_host) {
                    redirectUri = `https://${deployment.frontend_host}`;
                }

                setIsRedirecting(true);
                if (redirectUri) {
                    navigate(redirectUri);
                }
            }
        } catch (err) {
            setErrors({
                submit: (err as Error).message || "Passkey sign-in failed",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolveRedirectUri = () => {
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

        if (!redirectUri) return null;

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

        return uri.toString();
    };

    const handleContinueAsSignIn = async (signInId: string) => {
        if (loading || isSubmitting) return;
        setErrors({});
        setIsSubmitting(true);

        try {
            await switchSignIn(signInId);
            const redirectUri = resolveRedirectUri();
            if (redirectUri) {
                setIsRedirecting(true);
                navigate(redirectUri);
            }
        } catch (err) {
            setErrors({
                submit:
                    (err as Error).message ||
                    "Failed to continue with selected account",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (firstName?: string | null, lastName?: string | null) =>
        `${firstName || ""} ${lastName || ""}`
            .trim()
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";

    const ticketExchangeInitiatedRef = useRef(false);

    useEffect(() => {
        if (sessionLoading) return;

        const urlParams = new URLSearchParams(window.location.search);
        const ticket = urlParams.get("ticket");

        // Handle session ticket exchange for impersonation
        if (ticket && !ticketExchangeInitiatedRef.current && !loading) {
            ticketExchangeInitiatedRef.current = true;

            urlParams.delete("ticket");
            const newUrl = urlParams.toString()
                ? `${window.location.pathname}?${urlParams.toString()}`
                : window.location.pathname;
            window.history.replaceState({}, "", newUrl);

            const handleTicketExchange = async () => {
                try {
                    setIsSubmitting(true);
                    await exchangeTicket(ticket);
                    setIsRedirecting(true);
                    let redirectUri: string | null = sanitizeRedirectUri(
                        deployment,
                        new URLSearchParams(window.location.search).get(
                            "redirect_uri",
                        ),
                    );

                    if (!redirectUri) {
                        redirectUri =
                            deployment?.ui_settings
                                ?.after_signin_redirect_url || null;
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
                                getStoredDevSession(deployment.backend_host) ||
                                    "",
                            );
                        }

                        navigate(uri.toString());
                    }
                    return;
                } catch (err) {
                    setErrors({
                        submit:
                            (err as Error).message ||
                            "Failed to exchange ticket",
                    });
                    ticketExchangeInitiatedRef.current = false;
                } finally {
                    setIsSubmitting(false);
                }
            };

            handleTicketExchange();
            return;
        }

        const attemptId = urlParams.get("signin_attempt_id");

        if (attemptId && session?.signin_attempts && !signinAttempt) {
            const attempt = session.signin_attempts.find(
                (a) => a.id === attemptId,
            );
            if (attempt) {
                setSignInAttempt(attempt);

                urlParams.delete("signin_attempt_id");
                const newUrl = urlParams.toString()
                    ? `${window.location.pathname}?${urlParams.toString()}`
                    : window.location.pathname;
                window.history.replaceState({}, "", newUrl);
            }
        }
    }, [session, sessionLoading, signinAttempt, setSignInAttempt, loading]);

    useEffect(() => {
        if (!signinAttempt) return;

        if (signinAttempt.completed) {
            setIsRedirecting(true);
            let redirectUri: string | null = new URLSearchParams(
                window.location.search,
            ).get("redirect_uri");

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

        if (!signIn || otpSent) return;

        const strategyMap: Record<
            string,
            "phone_otp" | "email_otp" | "magic_link"
        > = {
            verify_email: "email_otp",
            verify_email_otp: "email_otp",
            verify_email_link: "magic_link",
            verify_phone: "phone_otp",
            verify_phone_otp: "phone_otp",
        };

        const strategy = strategyMap[signinAttempt.current_step];
        if (!strategy) return;

        const prepareVerificationAsync = async () => {
            try {
                await signIn.prepareVerification({ strategy });
                setIsSubmitting(false);
                setOtpSent(true);
            } catch {
                setErrors({
                    submit: "Failed to send verification. Please try again.",
                });
                setIsSubmitting(false);
            }
        };

        prepareVerificationAsync();
    }, [signinAttempt, signIn, otpSent, setOtpSent, navigate, deployment]);

    if (showOtherOptions) {
        return <OtherSignInOptions onBack={() => setShowOtherOptions(false)} />;
    }

    if (showForgotPassword) {
        return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
    }

    if (signinAttempt?.current_step === "verify_second_factor") {
        return (
            <TwoFactorVerification
                attempt={signinAttempt}
                completeVerification={signIn.completeVerification}
                prepareVerification={signIn.prepareVerification}
                onBack={() => {
                    discardSignInAttempt();
                    resetFormData();
                    setOtpSent(false);
                }}
            />
        );
    }

    if (signinAttempt?.current_step === "complete_profile") {
        return (
            <ProfileCompletion
                attempt={signinAttempt}
                completeProfile={signIn.completeProfile}
                completeVerification={signIn.completeVerification}
                prepareVerification={signIn.prepareVerification}
                onBack={() => {
                    discardSignInAttempt();
                    resetFormData();
                    setOtpSent(false);
                }}
            />
        );
    }

    if (showPasskeyPrompt) {
        const handlePasskeyComplete = () => {
            setShowPasskeyPrompt(false);
            if (pendingRedirectUri) {
                setIsRedirecting(true);
                navigate(pendingRedirectUri);
            }
        };

        const handlePasskeySkip = () => {
            setShowPasskeyPrompt(false);
            if (pendingRedirectUri) {
                setIsRedirecting(true);
                navigate(pendingRedirectUri);
            }
        };

        return (
            <DefaultStylesProvider>
                <AuthCard>
                    <PasskeyPrompt
                        onComplete={handlePasskeyComplete}
                        onSkip={handlePasskeySkip}
                    />
                </AuthCard>
            </DefaultStylesProvider>
        );
    }

    if (sessionLoading || isRedirecting) {
        return <AuthCardLoader />;
    }

    const appName = deployment?.ui_settings?.app_name || "App";

    const isVerificationStep =
        signinAttempt?.current_step &&
        [
            "verify_email",
            "verify_email_otp",
            "verify_email_link",
            "verify_phone",
            "verify_phone_otp",
        ].includes(signinAttempt.current_step);

    const showOtpForm = isVerificationStep && otpSent;
    const isMagicLink = firstFactor === "email_magic_link";
    const showExistingAccountHints =
        isMultiSessionEnabled &&
        !showOtpForm &&
        existingSignins.length > 0 &&
        !dismissedWelcomeBack;

    const editAddress = () => {
        setOtpSent(false);
        discardSignInAttempt();
        resetFormData();
    };

    /* ---------- header ---------- */
    let head: ReactNode;
    if (showOtpForm) {
        const title =
            firstFactor === "phone_otp"
                ? "Check your phone"
                : isMagicLink
                  ? "Check your inbox"
                  : "Enter the code";
        const sub = isMagicLink
            ? "We sent a magic link to your email — click it to sign in instantly."
            : firstFactor === "phone_otp"
              ? "We sent a verification code via SMS."
              : "We sent a 6-digit code to your email.";
        const address =
            (firstFactor === "email_otp" || isMagicLink) && formData.email
                ? formData.email
                : firstFactor === "phone_otp" && formData.phone
                  ? `+${formData.phone}`
                  : null;
        head = (
            <AuthHead title={title} sub={sub}>
                {address && (
                    <button
                        type="button"
                        className="w-addr-badge"
                        onClick={editAddress}
                    >
                        <PencilSimple weight="bold" />
                        {address}
                    </button>
                )}
            </AuthHead>
        );
    } else {
        head = (
            <AuthHead
                title="Sign in to your account"
                sub={`Please enter your details to continue to ${appName}.`}
            />
        );
    }

    /* ---------- footer (recessed) ---------- */
    let footer: ReactNode;
    if (showOtpForm) {
        footer = (
            <span className="w-auth-foot">
                Having trouble?{" "}
                <NavigationLink
                    className="w-link"
                    to={deployment?.ui_settings?.support_page_url || "#"}
                >
                    Get help
                </NavigationLink>
            </span>
        );
    } else {
        footer = (
            <span className="w-auth-foot">
                Don't have an account?{" "}
                <NavigationLink
                    className="w-link"
                    to={`${deployment?.ui_settings?.sign_up_page_url ?? ""}${window.location.search}`}
                >
                    Sign up
                </NavigationLink>
            </span>
        );
    }

    /* ---------- body ---------- */
    let body: ReactNode;

    if (showOtpForm && isMagicLink) {
        body = (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 0 4px",
                }}
            >
                {magicLinkCanResend ? (
                    <button
                        type="button"
                        className="w-link w-linkbtn"
                        onClick={async () => {
                            setMagicLinkCanResend(false);
                            setMagicLinkTimer(60);
                            try {
                                await signIn.prepareVerification({
                                    strategy: "magic_link",
                                });
                            } catch {}
                        }}
                    >
                        Resend magic link
                    </button>
                ) : (
                    <span className="w-secsub">Resend in {magicLinkTimer}s</span>
                )}
            </div>
        );
    } else if (showOtpForm) {
        body = (
            <form
                onSubmit={completeVerification}
                noValidate
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    alignItems: "center",
                }}
            >
                <OTPInput
                    onComplete={async (code) => {
                        setOtpCode(code);
                        if (code && code.length === 6) {
                            setIsSubmitting(true);
                            setErrors({});
                            try {
                                await signIn.completeVerification(code);
                                setOtpSent(false);
                            } catch (err) {
                                setErrors({
                                    otp:
                                        (err as Error).message ||
                                        "Verification failed",
                                });
                            } finally {
                                setIsSubmitting(false);
                            }
                        }
                    }}
                    onResend={async () => {
                        const strategy =
                            firstFactor === "email_otp"
                                ? "email_otp"
                                : "phone_otp";
                        await signIn.prepareVerification({ strategy });
                    }}
                    error={errors.otp}
                    isSubmitting={isSubmitting}
                />

                <button
                    type="submit"
                    className="w-btn w-btn--primary w-btn--block"
                    disabled={isSubmitting || loading || !otpCode}
                >
                    {isSubmitting && otpCode ? (
                        <Spin size={15} onAccent />
                    ) : (
                        `Continue to ${appName}`
                    )}
                </button>
            </form>
        );
    } else {
        const showEmailField =
            (firstFactor === "email_password" ||
                firstFactor === "email_otp" ||
                firstFactor === "email_magic_link") &&
            deployment?.auth_settings?.email_address?.enabled;
        const showUsernameField =
            firstFactor === "username_password" &&
            deployment?.auth_settings?.username?.enabled;
        const showPhoneField =
            firstFactor === "phone_otp" &&
            deployment?.auth_settings?.phone_number?.enabled;
        const showPasswordField =
            signInStep === "password" &&
            (firstFactor === "email_password" ||
                firstFactor === "username_password") &&
            deployment?.auth_settings?.password?.enabled;

        body = (
            <>
                {enabledSocialsProviders.length > 0 && (
                    <SocialAuthButtons
                        connections={enabledSocialsProviders}
                        callback={initSocialAuthSignIn}
                    />
                )}

                {deployment?.auth_settings?.passkey?.enabled && (
                    <button
                        type="button"
                        className="w-social"
                        style={{
                            marginTop:
                                enabledSocialsProviders.length > 0 ? 10 : 0,
                        }}
                        onClick={handlePasskeySignIn}
                        disabled={isSubmitting}
                    >
                        <Fingerprint />
                        <span>Sign in with a passkey</span>
                    </button>
                )}

                {(enabledSocialsProviders.length > 0 ||
                    deployment?.auth_settings?.passkey?.enabled) && (
                    <div className="w-or">
                        <span>OR</span>
                    </div>
                )}

                <form
                    onSubmit={createSignIn}
                    noValidate
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 13,
                    }}
                >
                    {showEmailField && (
                        <label className="w-field">
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span className="w-label">Email address</span>
                                {signInStep === "identifier" && (
                                    <span
                                        className="w-link w-link--muted w-link--sm"
                                        onClick={() => setShowOtherOptions(true)}
                                    >
                                        Other methods
                                    </span>
                                )}
                            </div>
                            {signInStep === "password" &&
                            firstFactor === "email_password" &&
                            formData.email ? (
                                <div className="w-locked">
                                    <span className="w-locked-ic">
                                        <Lock />
                                    </span>
                                    <span className="w-locked-val">
                                        {formData.email}
                                    </span>
                                    <button
                                        type="button"
                                        className="w-link w-link--muted"
                                        style={{
                                            fontSize: 12,
                                            cursor: "pointer",
                                            background: "none",
                                            border: 0,
                                        }}
                                        onClick={() =>
                                            setSignInStep("identifier")
                                        }
                                    >
                                        Edit
                                    </button>
                                </div>
                            ) : (
                                <NoPrefillInput
                                    className="w-input"
                                    type="email"
                                    id="email"
                                    name="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="you@company.com"
                                    aria-invalid={!!errors.email}
                                />
                            )}
                            {errors.email && (
                                <span className="w-input-err">
                                    {errors.email}
                                </span>
                            )}
                        </label>
                    )}

                    {showUsernameField && (
                        <label className="w-field">
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span className="w-label">Username</span>
                                {signInStep === "identifier" && (
                                    <span
                                        className="w-link w-link--muted w-link--sm"
                                        onClick={() => setShowOtherOptions(true)}
                                    >
                                        Other methods
                                    </span>
                                )}
                            </div>
                            {signInStep === "password" && formData.username ? (
                                <div className="w-locked">
                                    <span className="w-locked-ic">
                                        <Lock />
                                    </span>
                                    <span className="w-locked-val">
                                        {formData.username}
                                    </span>
                                    <button
                                        type="button"
                                        className="w-link w-link--muted"
                                        style={{
                                            fontSize: 12,
                                            cursor: "pointer",
                                            background: "none",
                                            border: 0,
                                        }}
                                        onClick={() => {
                                            setSignInStep("identifier");
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: "",
                                            }));
                                        }}
                                    >
                                        Edit
                                    </button>
                                </div>
                            ) : (
                                <NoPrefillInput
                                    className="w-input"
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="yourname"
                                    aria-invalid={!!errors.username}
                                    autoComplete="username"
                                />
                            )}
                            {errors.username && (
                                <span className="w-input-err">
                                    {errors.username}
                                </span>
                            )}
                        </label>
                    )}

                    {showPhoneField && (
                        <label className="w-field">
                            <span className="w-label">Phone number</span>
                            <PhoneNumberInput
                                value={formData.phone}
                                onChange={handleInputChange}
                                error={errors.phone}
                                countryCode={countryCode}
                                setCountryCode={setCountryCode}
                            />
                            {errors.phone && (
                                <span className="w-input-err">
                                    {errors.phone}
                                </span>
                            )}
                        </label>
                    )}

                    {showPasswordField && (
                        <label className="w-field">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span className="w-label">Password</span>
                                <span
                                    className="w-link w-link--muted"
                                    style={{ fontSize: 12, cursor: "pointer" }}
                                    onClick={() => setShowForgotPassword(true)}
                                >
                                    Forgot?
                                </span>
                            </div>
                            <NoPrefillInput
                                className="w-input"
                                type="password"
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                aria-invalid={!!errors.password}
                            />
                            {errors.password && (
                                <span className="w-input-err">
                                    {errors.password}
                                </span>
                            )}
                        </label>
                    )}

                    {errors.submit && (
                        <span className="w-input-err">{errors.submit}</span>
                    )}

                    <button
                        type="submit"
                        className="w-btn w-btn--primary w-btn--block"
                        disabled={isSubmitting || loading}
                    >
                        {isSubmitting ? (
                            <Spin size={15} onAccent />
                        ) : (
                            <>
                                {signInStep === "identifier"
                                    ? "Continue"
                                    : "Sign in"}
                                <CaretRight weight="bold" />
                            </>
                        )}
                    </button>

                    {signInStep === "password" &&
                        deployment?.auth_settings?.auth_factors_enabled
                            ?.email_otp && (
                            <>
                                <div className="w-or" style={{ margin: "5px 0" }}>
                                    <span>OR</span>
                                </div>
                                <button
                                    type="button"
                                    className="w-method"
                                    disabled={isSubmitting}
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        setErrors({});
                                        try {
                                            await signIn.create({
                                                email: formData.email,
                                                strategy: "email_otp",
                                            });
                                            setFirstFactor("email_otp");
                                        } catch (err) {
                                            setErrors({
                                                submit: (err as Error).message,
                                            });
                                            setIsSubmitting(false);
                                        }
                                    }}
                                >
                                    <span className="w-method-ic">
                                        <Hash />
                                    </span>
                                    <span className="w-method-body">
                                        <span className="w-method-title">
                                            Sign in with a code
                                        </span>
                                        <span className="w-method-desc">
                                            We'll send a 6-digit code to your
                                            email
                                        </span>
                                    </span>
                                    <span className="w-method-go">
                                        <CaretRight />
                                    </span>
                                </button>
                            </>
                        )}
                </form>
            </>
        );
    }

    return (
        <DefaultStylesProvider>
            <AuthCard footer={footer}>
                {head}

                {ssoError && (
                    <div
                        className="w-banner w-banner--error"
                        style={{ marginBottom: 18 }}
                    >
                        <Warning weight="fill" />
                        <span className="w-banner-txt">
                            <strong>Access denied.</strong> {ssoError}{" "}
                            <span
                                className="w-link"
                                onClick={() => setSsoError(null)}
                            >
                                Try again
                            </span>
                        </span>
                    </div>
                )}

                {showExistingAccountHints &&
                    (showSwitcher ? (
                        <div className="w-acct-list">
                            <div className="w-secsub w-acct-list-head">
                                Choose an account
                            </div>
                            <div className="w-acct-list-body">
                                {existingSignins.map((signin) => (
                                    <button
                                        key={signin.id}
                                        type="button"
                                        className="w-acct"
                                        onClick={() =>
                                            handleContinueAsSignIn(signin.id)
                                        }
                                        disabled={isSubmitting || loading}
                                    >
                                        <span className="w-avatar">
                                            {signin.user.has_profile_picture ? (
                                                <img
                                                    src={
                                                        signin.user
                                                            .profile_picture_url
                                                    }
                                                    alt={
                                                        signin.user
                                                            .primary_email_address
                                                            ?.email || "account"
                                                    }
                                                />
                                            ) : (
                                                getInitials(
                                                    signin.user.first_name,
                                                    signin.user.last_name,
                                                )
                                            )}
                                        </span>
                                        <span className="w-acct-text">
                                            <span className="w-acct-name">
                                                {signin.user.first_name &&
                                                signin.user.last_name
                                                    ? `${signin.user.first_name} ${signin.user.last_name}`
                                                    : signin.user.first_name ||
                                                      signin.user.primary_email_address?.email?.split(
                                                          "@",
                                                      )[0] ||
                                                      "Account"}
                                            </span>
                                            <span className="w-secsub">
                                                {
                                                    signin.user
                                                        .primary_email_address
                                                        ?.email
                                                }
                                            </span>
                                        </span>
                                        <CaretRight className="w-acct-go" />
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="w-acct"
                                    onClick={() => {
                                        setShowSwitcher(false);
                                        setDismissedWelcomeBack(true);
                                        resetFormData();
                                    }}
                                >
                                    <span
                                        className="w-avatar"
                                        style={{
                                            background: "var(--wa-surface-subtle)",
                                            color: "var(--wa-text-muted)",
                                        }}
                                    >
                                        <UserCirclePlus size={16} />
                                    </span>
                                    <span className="w-acct-text w-acct-name">
                                        Use a different account
                                    </span>
                                    <CaretRight className="w-acct-go" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="w-acct"
                            data-active
                            style={{ marginBottom: 18 }}
                            onClick={() =>
                                handleContinueAsSignIn(existingSignins[0].id)
                            }
                            disabled={isSubmitting || loading}
                        >
                            <span className="w-avatar">
                                {existingSignins[0].user.has_profile_picture ? (
                                    <img
                                        src={
                                            existingSignins[0].user
                                                .profile_picture_url
                                        }
                                        alt={
                                            existingSignins[0].user
                                                .primary_email_address?.email ||
                                            "account"
                                        }
                                    />
                                ) : (
                                    getInitials(
                                        existingSignins[0].user.first_name,
                                        existingSignins[0].user.last_name,
                                    )
                                )}
                            </span>
                            <span className="w-acct-text">
                                <span className="w-acct-name">
                                    Welcome back,{" "}
                                    {existingSignins[0].user.first_name ||
                                        existingSignins[0].user.primary_email_address?.email?.split(
                                            "@",
                                        )[0] ||
                                        "back"}
                                </span>
                                <span className="w-secsub">
                                    {
                                        existingSignins[0].user
                                            .primary_email_address?.email
                                    }
                                </span>
                            </span>
                            <span
                                className="w-link w-link--muted w-link--sm"
                                style={{ flex: "none" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (existingSignins.length > 1) {
                                        setShowSwitcher(true);
                                    } else {
                                        setDismissedWelcomeBack(true);
                                        resetFormData();
                                    }
                                }}
                            >
                                Not you?
                            </span>
                        </button>
                    ))}

                {body}
            </AuthCard>
        </DefaultStylesProvider>
    );
}
