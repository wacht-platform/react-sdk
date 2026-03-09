import { useEffect, useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/utility/input";
import { PhoneNumberInput } from "../utility/phone";
import { Form, FormGroup, Label } from "../utility/form";
import type { SignInParams } from "@/types";
import type { DeploymentSocialConnection } from "@/types";
import { useDeployment } from "@/hooks/use-deployment";
import { useNavigation } from "@/hooks/use-navigation";
import { Button } from "@/components/utility";
import { AuthFormImage } from "./auth-image";
import { ChevronRight, Fingerprint, Users } from "lucide-react";
import { getStoredDevSession } from "@/utils/dev-session";

const spin = keyframes`
  from {
  transform: rotate(0deg);
}
  to {
  transform: rotate(360deg);
}
`;

const Container = styled.div`
    max-width: calc(calc(var(--size-50u) * 4) - var(--size-10u));
    width: calc(calc(var(--size-50u) * 4) - var(--size-10u));
    padding: var(--space-12u);
    background: var(--color-card);
    color: var(--color-card-foreground);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: var(--border-width-thin) solid var(--color-border);
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(var(--size-50u) * 2);

    svg {
        animation: ${spin} 1s linear infinite;
        color: var(--color-primary);
    }
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: var(--space-8u);
    position: relative;
`;

const Title = styled.h1`
    font-size: var(--font-size-xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin-bottom: var(--space-2u);
    margin-top: 0;
`;

const Subtitle = styled.p`
    color: var(--color-secondary-text);
    font-size: var(--font-size-md);
`;

const Divider = styled.div`
    position: relative;
    text-align: center;
    margin: var(--space-8u) 0;

    &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: var(--border-width-thin);
        background: var(--color-border);
    }
`;

const DividerText = styled.span`
    position: relative;
    background: var(--color-card);
    padding: 0 var(--space-6u);
    color: var(--color-muted);
    font-size: var(--font-size-md);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const PasswordGroup = styled.div`
    position: relative;
`;

const ErrorMessage = styled.p`
    font-size: var(--font-size-xs);
    color: var(--color-error);
    margin: 0;
    margin-top: var(--space-1u);
`;

const SubmitButton = styled(Button).withConfig({
    shouldForwardProp: (prop) => !["$fullWidth", "$size"].includes(prop),
})<{ $fullWidth?: boolean; $size?: "sm" | "md" | "lg" }>`
    margin-top: var(--space-6u);
    height: var(--size-18u);
    min-height: var(--size-18u);
    padding-top: 0;
    padding-bottom: 0;
    line-height: 1;
`;

const ButtonSpinner = styled(Loader2)`
    animation: ${spin} 1s linear infinite;
`;

const PasskeyButton = styled(Button).withConfig({
    shouldForwardProp: (prop) => !["$fullWidth", "$size", "$outline"].includes(prop),
})<{ $fullWidth?: boolean; $size?: "sm" | "md" | "lg"; $outline?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-4u);
    margin-top: var(--space-4u);
    height: var(--size-18u);
    min-height: var(--size-18u);
    padding-top: 0;
    padding-bottom: 0;
    line-height: 1;
    color: var(--color-foreground);

    svg {
        color: var(--color-primary);
    }
`;

const Footer = styled.div`
    margin-top: var(--space-6u);
    text-align: center;
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
`;

const ExistingAccountsCard = styled.div`
    display: flex;
    gap: var(--space-4u);
    flex-wrap: wrap;
    margin-bottom: var(--space-6u);
`;

const ExistingAccountsActions = styled.div`
    display: flex;
    gap: var(--space-4u);
    flex-wrap: wrap;
    width: 100%;
`;

const ExistingAccountButton = styled(Button).withConfig({
    shouldForwardProp: (prop) => !["$size", "$secondary"].includes(prop),
})<{ $size?: "sm" | "md" | "lg"; $secondary?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: var(--space-4u);
    width: 100%;
    justify-content: flex-start;
    height: var(--size-18u);
    min-height: var(--size-18u);
    padding-top: 0;
    padding-bottom: 0;
    line-height: 1;
    background: transparent;
    color: var(--color-card-foreground);
    border: var(--border-width-thin) solid var(--color-border);
    box-shadow: none;

    &:hover:not(:disabled) {
        background: var(--color-accent);
        border-color: var(--color-border-hover);
        color: var(--color-accent-foreground);
    }
`;

const ExistingAccountAvatar = styled.div`
    width: var(--size-10u);
    height: var(--size-10u);
    border-radius: var(--radius-full);
    overflow: hidden;
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    font-size: var(--font-size-2xs);
    line-height: var(--size-10u);
    text-align: center;
    flex-shrink: 0;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const ExistingAccountAvatarOutline = styled(ExistingAccountAvatar)`
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    border: var(--border-width-thin) solid var(--color-border);

    @media (prefers-color-scheme: dark) {
        border: var(--border-width-thin) solid var(--color-border);
    }
`;

const ExistingAccountsIcon = styled(ExistingAccountAvatarOutline)`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        width: var(--size-8u);
        height: var(--size-8u);
        color: var(--color-secondary-text);
    }
`;

const ExistingAccountText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ExistingAccountArrow = styled(ChevronRight)`
    margin-left: auto;
    width: var(--space-7u);
    height: var(--space-7u);
    color: var(--color-secondary-text);
`;

const Link = styled.span`
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 400;
    transition: color 0.2s;
    cursor: pointer;

    &:hover {
        color: var(--color-primary-hover);
    }
`;

const SsoErrorBanner = styled.div`
    background: var(--color-error-background);
    border: var(--border-width-thin) solid var(--color-error);
    border-radius: var(--radius-md);
    padding: var(--space-6u);
    margin-bottom: var(--space-8u);
    text-align: center;
`;

const SsoErrorTitle = styled.div`
    font-weight: 600;
    font-size: var(--font-size-lg);
    color: var(--color-error);
    margin-bottom: var(--space-2u);
`;

const SsoErrorMessage = styled.div`
    font-size: var(--font-size-md);
    color: var(--color-card-foreground);
    margin-bottom: var(--space-4u);
`;

const SsoErrorLink = styled.span`
    font-size: var(--font-size-md);
    color: var(--color-primary);
    cursor: pointer;
    text-decoration: underline;

    &:hover {
        color: var(--color-primary-hover);
    }
`;

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
        if (
            !sessionLoading &&
            session?.active_signin &&
            !isMultiSessionEnabled &&
            !isRedirecting &&
            !showPasskeyPrompt
        ) {
            let redirectUri = new URLSearchParams(window.location.search).get(
                "redirect_uri",
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
                    searchParams.get("redirect_uri") || undefined;
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
                        searchParams.get("redirect_uri") || undefined;
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
        } catch (err) {
            setErrors({ submit: (err as Error).message });
        } finally {
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
            const redirectUri = searchParams.get("redirect_uri") || undefined;
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

                let redirectUri = new URLSearchParams(
                    window.location.search,
                ).get("redirect_uri");
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
                getStoredDevSession() || "",
            );
        }

        return uri.toString();
    };

    const resolveFrontendHostUrl = () => {
        if (!deployment?.frontend_host) return null;
        const uri = new URL(`https://${deployment.frontend_host}`);
        if (deployment?.mode === "staging") {
            uri.searchParams.set(
                "__dev_session__",
                getStoredDevSession() || "",
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

    const handleMoreAccounts = () => {
        const frontendHostUrl = resolveFrontendHostUrl();
        if (!frontendHostUrl) return;
        setIsRedirecting(true);
        navigate(frontendHostUrl);
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
                    let redirectUri: string | null = new URLSearchParams(
                        window.location.search,
                    ).get("redirect_uri");

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
                                getStoredDevSession() || "",
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
                        getStoredDevSession() || "",
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
                setOtpSent(true);
            } catch (err) {
                console.error("Failed to prepare verification:", err);
                setErrors({
                    submit: "Failed to send verification. Please try again.",
                });
            } finally {
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
                <Container>
                    <AuthFormImage />
                    <PasskeyPrompt
                        onComplete={handlePasskeyComplete}
                        onSkip={handlePasskeySkip}
                    />
                </Container>
            </DefaultStylesProvider>
        );
    }

    if (sessionLoading) {
        return (
            <DefaultStylesProvider>
                <Container>
                    <AuthFormImage />
                    <LoadingContainer>
                        <Loader2 size={32} />
                    </LoadingContainer>
                </Container>
            </DefaultStylesProvider>
        );
    }

    if (isRedirecting) {
        return (
            <DefaultStylesProvider>
                <Container>
                    <AuthFormImage />
                    <LoadingContainer>
                        <Loader2 size={32} />
                    </LoadingContainer>
                </Container>
            </DefaultStylesProvider>
        );
    }

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
    const showExistingAccountHints =
        isMultiSessionEnabled && !showOtpForm && existingSignins.length > 0;

    return (
        <DefaultStylesProvider>
            <Container>
                <AuthFormImage />

                {showOtpForm ? (
                    <>
                        <Header>
                            <Title>
                                {firstFactor === "phone_otp"
                                    ? "Check your phone"
                                    : "Check your email"}
                            </Title>
                            <Subtitle>
                                {firstFactor === "email_magic_link"
                                    ? `If ${formData.email} exists in our records, you will receive a magic link. Click the link to sign in.`
                                    : firstFactor === "phone_otp"
                                      ? `If ${formData.phone} exists in our records, you will receive a verification code via SMS. Enter it below to continue.`
                                      : `If ${formData.email} exists in our records, you will receive a verification code. Enter it below to continue.`}
                            </Subtitle>
                        </Header>
                    </>
                ) : (
                    <Header>
                        <Title>Sign in to your account</Title>
                        <Subtitle>
                            Please enter your details to continue to{" "}
                            {deployment?.ui_settings.app_name || "App"}!
                        </Subtitle>
                    </Header>
                )}

                {ssoError && (
                    <SsoErrorBanner>
                        <SsoErrorTitle>Access Denied</SsoErrorTitle>
                        <SsoErrorMessage>{ssoError}</SsoErrorMessage>
                        <SsoErrorLink onClick={() => setSsoError(null)}>
                            Try again
                        </SsoErrorLink>
                    </SsoErrorBanner>
                )}

                {showExistingAccountHints && (
                    <ExistingAccountsCard>
                        <ExistingAccountsActions>
                            <ExistingAccountButton
                                type="button"
                                $size="md"
                                $outline
                                onClick={() =>
                                    handleContinueAsSignIn(
                                        existingSignins[0].id,
                                    )
                                }
                                disabled={isSubmitting || loading}
                            >
                                <ExistingAccountAvatar>
                                    {existingSignins[0].user
                                        .has_profile_picture ? (
                                        <img
                                            src={
                                                existingSignins[0].user
                                                    .profile_picture_url
                                            }
                                            alt={
                                                existingSignins[0].user
                                                    .primary_email_address
                                                    ?.email || "account"
                                            }
                                        />
                                    ) : (
                                        getInitials(
                                            existingSignins[0].user.first_name,
                                            existingSignins[0].user.last_name,
                                        )
                                    )}
                                </ExistingAccountAvatar>
                                <ExistingAccountText>
                                    Continue as{" "}
                                    {existingSignins[0].user
                                        .primary_email_address?.email ||
                                        existingSignins[0].user.first_name ||
                                        "account"}
                                </ExistingAccountText>
                                <ExistingAccountArrow />
                            </ExistingAccountButton>
                            {existingSignins.length > 1 && (
                                <ExistingAccountButton
                                    type="button"
                                    $size="md"
                                    $outline
                                    onClick={handleMoreAccounts}
                                    disabled={isSubmitting || loading}
                                >
                                    <ExistingAccountsIcon as="div">
                                        <Users />
                                    </ExistingAccountsIcon>
                                    <ExistingAccountText>
                                        +{existingSignins.length - 1} existing
                                        signins
                                    </ExistingAccountText>
                                    <ExistingAccountArrow />
                                </ExistingAccountButton>
                            )}
                        </ExistingAccountsActions>
                    </ExistingAccountsCard>
                )}

                {!showOtpForm ? (
                    <>
                        {enabledSocialsProviders.length > 0 && (
                            <>
                                <SocialAuthButtons
                                    connections={enabledSocialsProviders}
                                    callback={initSocialAuthSignIn}
                                />
                            </>
                        )}

                        {/* Passkey Sign In */}
                        {deployment?.auth_settings?.passkey?.enabled && (
                            <PasskeyButton
                                type="button"
                                $fullWidth
                                $outline
                                $size="md"
                                onClick={handlePasskeySignIn}
                                disabled={isSubmitting}
                            >
                                <Fingerprint size={16} />
                                Sign in with Passkey
                                <ExistingAccountArrow />
                            </PasskeyButton>
                        )}

                        {(enabledSocialsProviders.length > 0 ||
                            deployment?.auth_settings?.passkey?.enabled) && (
                            <Divider>
                                <DividerText>or</DividerText>
                            </Divider>
                        )}

                        <Form onSubmit={createSignIn} noValidate>
                            {(firstFactor === "email_password" ||
                                firstFactor === "email_otp" ||
                                firstFactor === "email_magic_link") &&
                                deployment?.auth_settings?.email_address
                                    ?.enabled && (
                                    <FormGroup>
                                        <Label htmlFor="email">
                                            Email address
                                        </Label>
                                        <Input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email address"
                                            aria-invalid={!!errors.email}
                                        />
                                        {errors.email && (
                                            <ErrorMessage>
                                                {errors.email}
                                            </ErrorMessage>
                                        )}
                                    </FormGroup>
                                )}

                            {firstFactor === "username_password" &&
                                deployment?.auth_settings?.username
                                    ?.enabled && (
                                    <FormGroup>
                                        <Label htmlFor="username">
                                            Username
                                        </Label>
                                        <Input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            placeholder="Enter your username"
                                            aria-invalid={!!errors.username}
                                        />
                                        {errors.username && (
                                            <ErrorMessage>
                                                {errors.username}
                                            </ErrorMessage>
                                        )}
                                    </FormGroup>
                                )}

                            {firstFactor === "phone_otp" &&
                                deployment?.auth_settings?.phone_number
                                    ?.enabled && (
                                    <FormGroup>
                                        <Label htmlFor="phone">
                                            Phone number
                                        </Label>
                                        <PhoneNumberInput
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            error={errors.phone}
                                            countryCode={countryCode}
                                            setCountryCode={setCountryCode}
                                        />
                                        {errors.phone && (
                                            <ErrorMessage>
                                                {errors.phone}
                                            </ErrorMessage>
                                        )}
                                    </FormGroup>
                                )}

                            {signInStep === "password" &&
                                (firstFactor === "email_password" ||
                                    firstFactor === "username_password") &&
                                deployment?.auth_settings?.password
                                    ?.enabled && (
                                    <FormGroup>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Label htmlFor="password">
                                                Password
                                            </Label>
                                            <Link
                                                style={{ fontSize: "var(--font-size-sm)" }}
                                                onClick={() =>
                                                    setShowForgotPassword(true)
                                                }
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <PasswordGroup>
                                            <Input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter your password"
                                                aria-invalid={!!errors.password}
                                            />
                                        </PasswordGroup>
                                        {errors.password && (
                                            <ErrorMessage>
                                                {errors.password}
                                            </ErrorMessage>
                                        )}
                                    </FormGroup>
                                )}

                            <div>
                                {errors.submit && (
                                    <ErrorMessage>{errors.submit}</ErrorMessage>
                                )}

                                <SubmitButton
                                    type="submit"
                                    $fullWidth
                                    $size="md"
                                    disabled={isSubmitting || loading}
                                >
                                    {isSubmitting ? (
                                        <ButtonSpinner size={16} />
                                    ) : signInStep === "identifier" ? (
                                        "Continue"
                                    ) : (
                                        "Sign in"
                                    )}
                                </SubmitButton>
                            </div>

                            <Link
                                style={{
                                    fontSize: "var(--font-size-sm)",
                                    textAlign: "center",
                                }}
                                onClick={() => setShowOtherOptions(true)}
                            >
                                Use other methods
                            </Link>
                        </Form>
                        <Footer>
                            Don't have an account?{" "}
                            <Link>
                                <NavigationLink
                                    to={`${deployment!.ui_settings?.sign_up_page_url}${window.location.search}`}
                                >
                                    Sign up
                                </NavigationLink>
                            </Link>
                        </Footer>
                    </>
                ) : firstFactor === "email_magic_link" ? (
                    <Footer>
                        Having trouble?{" "}
                        <Link>
                            <NavigationLink
                                to={deployment!.ui_settings.support_page_url}
                            >
                                Get help
                            </NavigationLink>
                        </Link>
                        <div style={{ marginTop: "var(--space-4u)" }}>
                            <Link
                                onClick={() => {
                                    setOtpSent(false);
                                    discardSignInAttempt();
                                    resetFormData();
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                Back to login
                            </Link>
                        </div>
                    </Footer>
                ) : (
                    <>
                        <Form
                            style={{ gap: "var(--space-7u)" }}
                            onSubmit={completeVerification}
                            noValidate
                        >
                            <OTPInput
                                onComplete={async (code) => {
                                    setOtpCode(code);
                                    if (code && code.length === 6) {
                                        setIsSubmitting(true);
                                        setErrors({});
                                        try {
                                            await signIn.completeVerification(
                                                code,
                                            );
                                            // Clear OTP state after successful verification
                                            // This allows the component to transition to the next step
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
                                    await signIn.prepareVerification({
                                        strategy,
                                    });
                                }}
                                error={errors.otp}
                                isSubmitting={isSubmitting}
                            />

                            <SubmitButton
                                type="submit"
                                $fullWidth
                                $size="md"
                                disabled={isSubmitting || loading || !otpCode}
                                style={{ margin: 0 }}
                            >
                                {isSubmitting
                                    ? "Verifying..."
                                    : `Continue to ${deployment?.ui_settings?.app_name}`}
                            </SubmitButton>
                        </Form>
                        <Footer>
                            Having trouble?{" "}
                            <Link>
                                <NavigationLink
                                    to={
                                        deployment!.ui_settings.support_page_url
                                    }
                                >
                                    Get help
                                </NavigationLink>
                            </Link>
                            <div style={{ marginTop: "var(--space-4u)" }}>
                                <Link
                                    onClick={() => {
                                        setOtpSent(false);
                                        discardSignInAttempt();
                                        resetFormData();
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    Back to login
                                </Link>
                            </div>
                        </Footer>
                    </>
                )}
            </Container>
        </DefaultStylesProvider>
    );
}
