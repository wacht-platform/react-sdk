import { useState, useEffect } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { useSignUp } from "../../hooks/use-signup";
import {
    useSignInWithStrategy,
    type OAuthProvider,
} from "../../hooks/use-signin";
import { useDeployment } from "../../hooks/use-deployment";
import { useNavigation } from "../../hooks/use-navigation";
import { useSession } from "../../hooks/use-session";
import { DefaultStylesProvider } from "../utility/root";
import { OTPInput } from "@/components/utility/otp-input";
import { SocialAuthButtons } from "./social-buttons";
import { NavigationLink } from "../utility/navigation";
import { NoPrefillInput } from "../utility/no-prefill-input";
import { PhoneNumberInput } from "../utility/phone";
import type { SignUpParams } from "@/types";
import type { DeploymentSocialConnection } from "@/types";
import { AuthCard, AuthHead, Spin, AuthCardLoader } from "./auth-card";
import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";
import { WachtChallenge } from "./challenge-widget";

export function SignUpForm() {
    const { loading, signUp, signupAttempt, discardSignupAttempt } =
        useSignUp();
    const { signIn: oauthSignIn } = useSignInWithStrategy("oauth");
    const { deployment } = useDeployment();
    const { navigate } = useNavigation();
    const {
        session,
        refetch: refetchSession,
        loading: sessionLoading,
    } = useSession();
    const [formData, setFormData] = useState<SignUpParams>({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        username: "",
        phone_number: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countryCode, setCountryCode] = useState<string | undefined>(
        undefined,
    );
    const [inviteData, setInviteData] = useState<{
        valid: boolean;
        first_name?: string;
        last_name?: string;
        email?: string;
        message?: string;
    } | null>(null);
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [challengeToken, setChallengeToken] = useState<string>("");
    const isChallengeReady = Boolean(challengeToken);

    const isSignupRestricted =
        deployment?.restrictions?.sign_up_mode === "restricted";
    const isWaitlistMode =
        deployment?.restrictions?.sign_up_mode === "waitlist";
    const isMultiSessionEnabled =
        deployment?.auth_settings?.multi_session_support?.enabled ?? false;

    useEffect(() => {
        if (
            !sessionLoading &&
            session?.active_signin &&
            !isMultiSessionEnabled &&
            !isRedirecting
        ) {
            setIsRedirecting(true);
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

            if (redirectUri) {
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

    useEffect(() => {
        if (!deployment) return;

        const params = new URLSearchParams(window.location.search);
        const invitation_token = params.get("invite_token");

        if (isWaitlistMode && !invitation_token) {
            setIsRedirecting(true);
            const waitlistUrl =
                deployment.ui_settings?.waitlist_page_url ||
                `https://${deployment.frontend_host}/waitlist`;
            navigate(waitlistUrl);
            return;
        }

        if (invitation_token && !inviteData && signUp) {
            setInviteToken(invitation_token);
            signUp
                .validateDeploymentInvitation(invitation_token)
                .then((data) => {
                    setInviteData(data);
                    if (data.valid) {
                        setFormData((prev) => ({
                            ...prev,
                            first_name: data.first_name || prev.first_name,
                            last_name: data.last_name || prev.last_name,
                            email: data.email || prev.email,
                        }));
                    }
                })
                .catch(() => {
                    setErrors((prev) => ({
                        ...prev,
                        submit: "Failed to validate invitation.",
                    }));
                });
        }
    }, [deployment, isWaitlistMode, navigate, inviteData, signUp]);

    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === "phone_number") {
            value = value.replace(/[^0-9-]/g, "");
        } else if (name === "email") {
            value = value.toLowerCase();
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const resetFormData = () => {
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            username: "",
            phone_number: "",
        });
        setErrors({});
        setOtpSent(false);
        setOtpCode("");
        discardSignupAttempt();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || isSubmitting) return;

        const newErrors: Record<string, string> = {};
        if (!isChallengeReady) {
            newErrors.submit = "Challenge verification is still loading. Please try again.";
        }

        const namePattern = /^[a-zA-Z]{3,30}$/;
        const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phonePattern = /^\d{7,15}$/;
        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$/;

        // Only validate first_name if it's enabled
        if (authSettings?.first_name.enabled) {
            if (authSettings?.first_name.required && !formData.first_name) {
                newErrors.first_name = "First name is required";
            } else if (
                formData.first_name &&
                !namePattern.test(formData.first_name)
            ) {
                newErrors.first_name = "Invalid name";
            }
        }

        // Only validate last_name if it's enabled
        if (authSettings?.last_name.enabled) {
            if (authSettings?.last_name.required && !formData.last_name) {
                newErrors.last_name = "Last name is required";
            } else if (
                formData.last_name &&
                !namePattern.test(formData.last_name)
            ) {
                newErrors.last_name = "Invalid last name";
            }
        }

        if (authSettings?.username.enabled) {
            if (authSettings?.username.required && !formData.username) {
                newErrors.username = "Username is required";
            } else if (
                formData.username &&
                !usernamePattern.test(formData.username)
            ) {
                newErrors.username = "Username must be 3-20 characters";
            }
        }

        if (authSettings?.email_address.enabled) {
            if (authSettings?.email_address.required && !formData.email) {
                newErrors.email = "Email address is required";
            } else if (formData.email && !emailPattern.test(formData.email)) {
                newErrors.email = "Invalid email address";
            }
        }

        if (authSettings?.phone_number.enabled) {
            if (authSettings?.phone_number.required && !formData.phone_number) {
                newErrors.phone_number = "Phone number is required";
            } else if (
                formData.phone_number &&
                !phonePattern.test(formData.phone_number)
            ) {
                newErrors.phone_number =
                    "Phone number must contain 7-15 digits";
            }
        }

        if (authSettings?.password.enabled) {
            if (!formData.password) {
                newErrors.password = "Password is required";
            } else if (!passwordPattern.test(formData.password)) {
                newErrors.password =
                    "Password must be 8-125 characters and include uppercase, lowercase, number, and special character";
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (formData.phone_number && countryCode) {
                submitData.phone_country_code = countryCode;
            }
            if (inviteToken) {
                submitData.invite_token = inviteToken;
            }
            if (challengeToken) {
                submitData.challenge_token = challengeToken;
            }
            await signUp.create(submitData);
        } catch (err) {
            setErrors({ submit: (err as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialSignIn = async (
        connection: DeploymentSocialConnection,
    ) => {
        if (loading || isSubmitting || !isChallengeReady) return;

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
                challenge_token: challengeToken,
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

    const enabledSocialProviders =
        deployment?.social_connections.filter((conn) => conn.enabled) || [];

    const authSettings = deployment?.auth_settings;

    const isBothNamesEnabled = Boolean(
        authSettings?.first_name?.enabled && authSettings?.last_name?.enabled,
    );

    const completeVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || isSubmitting) return;
        setIsSubmitting(true);
        const newErrors: Record<string, string> = {};
        if (!otpCode) {
            newErrors.otp = "OTP code is required";
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }
        setErrors(newErrors);

        try {
            const result = await signUp.completeVerification(otpCode);
            if ("data" in result && result.data?.active_signin) {
                await refetchSession();
            }
        } catch {
            setErrors((prev) => ({
                ...prev,
                submit: "Verification failed. Please try again.",
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!signupAttempt) return;

        if (signupAttempt.completed) {
            let redirectUri: string | null = sanitizeRedirectUri(
                deployment,
                new URLSearchParams(window.location.search).get("redirect_uri"),
            );
            if (!redirectUri) {
                redirectUri =
                    deployment?.ui_settings?.after_signup_redirect_url || null;
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

        if (otpSent) {
            return;
        }

        switch (signupAttempt.current_step) {
            case "verify_email":
                signUp.prepareVerification({ strategy: "email_otp", challenge_token: challengeToken });
                break;
            case "verify_phone":
                signUp.prepareVerification({ strategy: "phone_otp", challenge_token: challengeToken });
                break;
        }

        setOtpSent(true);
    }, [signupAttempt, signUp, otpSent, deployment, session, navigate]);

    if (sessionLoading || isRedirecting) {
        return <AuthCardLoader />;
    }

    const appName = deployment?.ui_settings?.app_name || "App";

    // Sign-up restricted
    if (isSignupRestricted) {
        return (
            <DefaultStylesProvider>
                <AuthCard
                    footer={
                        <span className="w-auth-foot">
                            Need assistance?{" "}
                            <NavigationLink
                                className="w-link"
                                to={
                                    deployment?.ui_settings?.sign_in_page_url
                                        ? `${deployment.ui_settings.sign_in_page_url}?help=true`
                                        : "#"
                                }
                            >
                                Get help
                            </NavigationLink>
                        </span>
                    }
                >
                    <AuthHead
                        title="Sign-up restricted"
                        sub="This app isn't open for public sign-up right now."
                    />
                    <div className="w-banner w-banner--warn">
                        <span className="w-banner-txt">
                            New account registration is currently restricted.
                            Please check back later or contact your
                            administrator for an invitation.
                        </span>
                    </div>
                </AuthCard>
            </DefaultStylesProvider>
        );
    }

    // OTP verification step
    if (otpSent) {
        const isPhone = signupAttempt?.current_step === "verify_phone";
        return (
            <DefaultStylesProvider>
                <AuthCard
                    footer={
                        <span className="w-auth-foot">
                            Having trouble?{" "}
                            <NavigationLink
                                className="w-link"
                                to={
                                    deployment?.ui_settings?.support_page_url ||
                                    "#"
                                }
                            >
                                Get help
                            </NavigationLink>
                        </span>
                    }
                >
                    <AuthHead
                        title={isPhone ? "Check your phone" : "Enter the code"}
                        sub={
                            isPhone
                                ? "We sent a verification code via SMS."
                                : "We sent a 6-digit code to your email."
                        }
                    >
                        <button
                            type="button"
                            className="w-addr-badge"
                            onClick={resetFormData}
                        >
                            <PencilSimple weight="bold" />
                            {isPhone
                                ? `+${formData.phone_number}`
                                : formData.email}
                        </button>
                    </AuthHead>

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
                            }}
                            onResend={async () => {
                                const strategy = isPhone
                                    ? "phone_otp"
                                    : "email_otp";
                                await signUp.prepareVerification({ strategy, challenge_token: challengeToken });
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
                </AuthCard>
            </DefaultStylesProvider>
        );
    }

    // Main sign-up form
    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    <span className="w-auth-foot">
                        Already have an account?{" "}
                        <NavigationLink
                            className="w-link"
                            to={`${deployment?.ui_settings?.sign_in_page_url ?? ""}${window.location.search}`}
                        >
                            Sign in
                        </NavigationLink>
                    </span>
                }
            >
                <AuthHead
                    title="Create your account"
                    sub={
                        inviteData?.valid
                            ? "You've been invited — complete your registration below."
                            : "Get started in a few seconds."
                    }
                />

                {enabledSocialProviders.length > 0 && (
                    <>
                        <SocialAuthButtons
                            connections={enabledSocialProviders}
                            callback={handleSocialSignIn}
                        />
                        <div className="w-or">
                            <span>OR</span>
                        </div>
                    </>
                )}

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 13,
                    }}
                >
                    {(authSettings?.first_name?.enabled ||
                        authSettings?.last_name?.enabled) && (
                        <div className={isBothNamesEnabled ? "w-grid-2" : ""}>
                            {authSettings?.first_name?.enabled && (
                                <label className="w-field">
                                    <span className="w-label">
                                        First name
                                        {authSettings?.first_name?.required && (
                                            <span className="w-req">*</span>
                                        )}
                                    </span>
                                    <NoPrefillInput
                                        className="w-input"
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        autoComplete="given-name"
                                        required
                                        minLength={3}
                                        maxLength={30}
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        placeholder="Jane"
                                        aria-invalid={!!errors.first_name}
                                        pattern="^[a-zA-Z]{3,30}$"
                                    />
                                    {errors.first_name && (
                                        <span className="w-input-err">
                                            {errors.first_name}
                                        </span>
                                    )}
                                </label>
                            )}
                            {authSettings?.last_name?.enabled && (
                                <label className="w-field">
                                    <span className="w-label">
                                        Last name
                                        {authSettings?.last_name?.required && (
                                            <span className="w-req">*</span>
                                        )}
                                    </span>
                                    <NoPrefillInput
                                        className="w-input"
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        autoComplete="family-name"
                                        required
                                        minLength={3}
                                        maxLength={30}
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        placeholder="Doe"
                                        aria-invalid={!!errors.last_name}
                                        pattern="^[a-zA-Z]{3,30}$"
                                    />
                                    {errors.last_name && (
                                        <span className="w-input-err">
                                            {errors.last_name}
                                        </span>
                                    )}
                                </label>
                            )}
                        </div>
                    )}

                    {authSettings?.username.enabled && (
                        <label className="w-field">
                            <span className="w-label">
                                Username
                                {authSettings.username.required && (
                                    <span className="w-req">*</span>
                                )}
                            </span>
                            <NoPrefillInput
                                className="w-input"
                                type="text"
                                id="username"
                                name="username"
                                autoComplete="username"
                                minLength={3}
                                maxLength={20}
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="yourname"
                                aria-invalid={!!errors.username}
                                required
                                pattern="^[a-zA-Z][a-zA-Z0-9_.]{2,29}$"
                            />
                            {errors.username && (
                                <span className="w-input-err">
                                    {errors.username}
                                </span>
                            )}
                        </label>
                    )}

                    {authSettings?.email_address.enabled && (
                        <label className="w-field">
                            <span className="w-label">
                                Email address
                                {authSettings.email_address.required && (
                                    <span className="w-req">*</span>
                                )}
                            </span>
                            <NoPrefillInput
                                className="w-input"
                                type="email"
                                id="email"
                                name="email"
                                autoComplete="email"
                                maxLength={320}
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@company.com"
                                aria-invalid={!!errors.email}
                                required
                                readOnly={
                                    inviteData?.valid && !!inviteData?.email
                                }
                                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                            />
                            {errors.email && (
                                <span className="w-input-err">
                                    {errors.email}
                                </span>
                            )}
                        </label>
                    )}

                    {authSettings?.phone_number.enabled && (
                        <label className="w-field">
                            <span className="w-label">
                                Phone number
                                {authSettings.phone_number.required && (
                                    <span className="w-req">*</span>
                                )}
                            </span>
                            <PhoneNumberInput
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                error={errors.phone_number}
                                countryCode={countryCode}
                                setCountryCode={setCountryCode}
                            />
                            {errors.phone_number && (
                                <span className="w-input-err">
                                    {errors.phone_number}
                                </span>
                            )}
                        </label>
                    )}

                    {authSettings?.password.enabled && (
                        <label className="w-field">
                            <span className="w-label">
                                Password
                                {authSettings.password.required && (
                                    <span className="w-req">*</span>
                                )}
                            </span>
                            <NoPrefillInput
                                className="w-input"
                                type="password"
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Create a password"
                                aria-invalid={!!errors.password}
                                required
                                minLength={8}
                                maxLength={128}
                                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$"
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

                    <WachtChallenge
                        apiHost={deployment?.backend_host ?? ""}
                        onSolve={(token) => setChallengeToken(token)}
                        onError={() => setChallengeToken("")}
                    />

                    <button
                        type="submit"
                        className="w-btn w-btn--primary w-btn--block"
                        disabled={isSubmitting || loading || !isChallengeReady}
                    >
                        {isSubmitting ? <Spin size={15} onAccent /> : "Continue"}
                    </button>

                    {(() => {
                        const tosUrl = deployment?.ui_settings?.tos_page_url;
                        const privacyUrl =
                            deployment?.ui_settings?.privacy_policy_url;
                        if (!tosUrl && !privacyUrl) return null;
                        return (
                            <p className="w-fineprint">
                                By continuing you agree to our{" "}
                                {tosUrl && (
                                    <NavigationLink
                                        className="w-link w-link--muted"
                                        to={tosUrl}
                                    >
                                        Terms of Service
                                    </NavigationLink>
                                )}
                                {tosUrl && privacyUrl && " and "}
                                {privacyUrl && (
                                    <NavigationLink
                                        className="w-link w-link--muted"
                                        to={privacyUrl}
                                    >
                                        Privacy Policy
                                    </NavigationLink>
                                )}
                                .
                            </p>
                        );
                    })()}
                </form>
            </AuthCard>
        </DefaultStylesProvider>
    );
}
