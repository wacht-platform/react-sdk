"use client";

import { useState } from "react";
import { useDeployment } from "../../hooks/use-deployment";
import { useNavigation } from "../../hooks/use-navigation";
import { PhoneNumberInput } from "../utility/phone";
import { OTPInput } from "../utility/otp-input";
import { ProfileCompletionData, ProfileCompletionProps } from "@wacht/types";
import { NavigationLink } from "../utility/navigation";
import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead, AuthCardLoader, Spin } from "./auth-card";
import { getStoredDevSession } from "@/utils/dev-session";
import { sanitizeRedirectUri } from "@/utils/redirect-uri";

export function ProfileCompletion({
    attempt,
    onBack,
    completeProfile,
    completeVerification,
    prepareVerification,
}: ProfileCompletionProps) {
    const { deployment } = useDeployment();
    const { navigate } = useNavigation();

    const [formData, setFormData] = useState<ProfileCompletionData>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [countryCode, setCountryCode] = useState<string | undefined>("US");
    const [showVerification, setShowVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const displayError = error;
    const isLoading = loading;

    const redirectAfter = () => {
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
    };

    const handleComplete = async (data: ProfileCompletionData) => {
        setLoading(true);
        setError(null);

        try {
            const session = await completeProfile(data);
            if (session) redirectAfter();
        } catch (err) {
            const error = err as Error;
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationComplete = async (code: string) => {
        setLoading(true);
        setError(null);

        try {
            const session = await completeVerification(code);
            if (session) redirectAfter();
            return true;
        } catch (err) {
            const error = err as Error;
            setError(error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    if (isRedirecting || !attempt) {
        return <AuthCardLoader />;
    }

    const missingFields = attempt.missing_fields || [];

    const authSettings = deployment?.auth_settings;
    const isVerifying =
        attempt?.current_step === "verify_phone_otp" ||
        attempt?.current_step === "verify_email_otp" ||
        showVerification;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        missingFields.forEach((field: string) => {
            const fieldValue = formData[field as keyof ProfileCompletionData];
            let isFieldEnabled = false;

            switch (field) {
                case "first_name":
                    isFieldEnabled = authSettings?.first_name?.enabled || false;
                    break;
                case "last_name":
                    isFieldEnabled = authSettings?.last_name?.enabled || false;
                    break;
                case "username":
                    isFieldEnabled = authSettings?.username?.enabled || false;
                    break;
                case "phone_number":
                    isFieldEnabled =
                        authSettings?.phone_number?.enabled || false;
                    break;
                case "email_address":
                    isFieldEnabled =
                        authSettings?.email_address?.enabled || false;
                    break;
                default:
                    isFieldEnabled = true;
            }

            if (isFieldEnabled && (!fieldValue || fieldValue.trim() === "")) {
                const fieldName = field
                    .replace("_", " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.username && missingFields.includes("username")) {
            const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
            if (!usernameRegex.test(formData.username)) {
                newErrors.username =
                    "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens";
            }
        }

        if (formData.phone_number && missingFields.includes("phone_number")) {
            const phonePattern = /^\d{7,15}$/;
            if (!phonePattern.test(formData.phone_number)) {
                newErrors.phone_number = "Phone number must contain 7-15 digits";
            }
        }

        if (formData.email && missingFields.includes("email_address")) {
            const emailPattern =
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(formData.email)) {
                newErrors.email_address = "Please enter a valid email address";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }
        const submitData: any = { ...formData };
        if (formData.phone_number && countryCode) {
            submitData.phone_country_code = countryCode;
        }
        await handleComplete(submitData);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, phone_number: value }));
        if (errors.phone_number) {
            setErrors((prev) => ({ ...prev, phone_number: "" }));
        }
    };

    const helpFooter = (
        <span className="w-auth-foot">
            Having trouble?{" "}
            <NavigationLink
                to={deployment?.ui_settings.support_page_url || "#"}
                className="w-link"
            >
                Get help
            </NavigationLink>
        </span>
    );

    if (isVerifying) {
        const verificationTitle =
            attempt.current_step === "verify_phone_otp"
                ? "Verify your phone number"
                : "Verify your email";
        const verificationMessage =
            attempt.current_step === "verify_phone_otp"
                ? "Enter the 6-digit code sent to your phone"
                : "Enter the 6-digit code sent to your email";
        const resendStrategy: "phone_otp" | "email_otp" =
            attempt.current_step === "verify_phone_otp"
                ? "phone_otp"
                : "email_otp";

        return (
            <DefaultStylesProvider>
                <AuthCard footer={helpFooter}>
                    <AuthHead
                        title={verificationTitle}
                        sub={verificationMessage}
                    />

                    <form
                        onSubmit={(e) => e.preventDefault()}
                        noValidate
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        <OTPInput
                            onComplete={handleVerificationComplete}
                            onResend={async () => {
                                await prepareVerification({
                                    strategy: resendStrategy,
                                });
                            }}
                            error={displayError?.message}
                            isSubmitting={isLoading}
                        />

                        {displayError && (
                            <span className="w-input-err">
                                {displayError.message}
                            </span>
                        )}
                    </form>

                    <div style={{ marginTop: 16, textAlign: "center" }}>
                        <button
                            type="button"
                            className="w-link"
                            onClick={() => setShowVerification(false)}
                        >
                            Back to profile completion
                        </button>
                    </div>
                </AuthCard>
            </DefaultStylesProvider>
        );
    }

    const isBothNamesEnabled = !!(
        authSettings?.first_name?.enabled &&
        authSettings?.last_name?.enabled &&
        missingFields.includes("first_name") &&
        missingFields.includes("last_name")
    );

    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    onBack ? (
                        <span className="w-auth-foot">
                            <button
                                type="button"
                                className="w-link"
                                onClick={onBack}
                            >
                                Back to login
                            </button>
                        </span>
                    ) : (
                        helpFooter
                    )
                }
            >
                <AuthHead
                    title="Complete your profile"
                    sub="Please provide the following information to continue"
                />

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {(missingFields.includes("first_name") ||
                        missingFields.includes("last_name")) &&
                        (authSettings?.first_name?.enabled ||
                            authSettings?.last_name?.enabled) && (
                            <div className={isBothNamesEnabled ? "w-grid-2" : ""}>
                                {missingFields.includes("first_name") &&
                                    authSettings?.first_name?.enabled && (
                                        <div className="w-field">
                                            <label
                                                className="w-label"
                                                htmlFor="first_name"
                                            >
                                                First name
                                                {authSettings.first_name
                                                    .required && (
                                                    <span className="w-req">
                                                        *
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                className={`w-input${errors.first_name ? " w-input--invalid" : ""}`}
                                                type="text"
                                                id="first_name"
                                                name="first_name"
                                                value={
                                                    formData.first_name || ""
                                                }
                                                onChange={handleInputChange}
                                                placeholder="Enter your first name"
                                                disabled={isLoading}
                                                autoComplete="given-name"
                                            />
                                            {errors.first_name && (
                                                <span className="w-input-err">
                                                    {errors.first_name}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                {missingFields.includes("last_name") &&
                                    authSettings?.last_name?.enabled && (
                                        <div className="w-field">
                                            <label
                                                className="w-label"
                                                htmlFor="last_name"
                                            >
                                                Last name
                                                {authSettings.last_name
                                                    .required && (
                                                    <span className="w-req">
                                                        *
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                className={`w-input${errors.last_name ? " w-input--invalid" : ""}`}
                                                type="text"
                                                id="last_name"
                                                name="last_name"
                                                value={formData.last_name || ""}
                                                onChange={handleInputChange}
                                                placeholder="Enter your last name"
                                                disabled={isLoading}
                                                autoComplete="family-name"
                                            />
                                            {errors.last_name && (
                                                <span className="w-input-err">
                                                    {errors.last_name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}

                    {missingFields.includes("username") &&
                        authSettings?.username?.enabled && (
                            <div className="w-field">
                                <label className="w-label" htmlFor="username">
                                    Username
                                    {authSettings.username.required && (
                                        <span className="w-req">*</span>
                                    )}
                                </label>
                                <input
                                    className={`w-input${errors.username ? " w-input--invalid" : ""}`}
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username || ""}
                                    onChange={handleInputChange}
                                    placeholder="Choose a username"
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                                {errors.username && (
                                    <span className="w-input-err">
                                        {errors.username}
                                    </span>
                                )}
                            </div>
                        )}

                    {missingFields.includes("phone_number") &&
                        authSettings?.phone_number?.enabled && (
                            <div className="w-field">
                                <label
                                    className="w-label"
                                    htmlFor="phone_number"
                                >
                                    Phone number
                                    {authSettings.phone_number.required && (
                                        <span className="w-req">*</span>
                                    )}
                                </label>
                                <PhoneNumberInput
                                    value={formData.phone_number || ""}
                                    onChange={handlePhoneChange}
                                    error={errors.phone_number}
                                    countryCode={countryCode}
                                    setCountryCode={setCountryCode}
                                />
                                {errors.phone_number && (
                                    <span className="w-input-err">
                                        {errors.phone_number}
                                    </span>
                                )}
                            </div>
                        )}

                    {missingFields.includes("email_address") &&
                        authSettings?.email_address?.enabled && (
                            <div className="w-field">
                                <label className="w-label" htmlFor="email">
                                    Email address
                                    {authSettings.email_address.required && (
                                        <span className="w-req">*</span>
                                    )}
                                </label>
                                <input
                                    className={`w-input${errors.email_address ? " w-input--invalid" : ""}`}
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email || ""}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email address"
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                                {errors.email_address && (
                                    <span className="w-input-err">
                                        {errors.email_address}
                                    </span>
                                )}
                            </div>
                        )}

                    {displayError && (
                        <span className="w-input-err">
                            {displayError.message}
                        </span>
                    )}

                    <button
                        type="submit"
                        className="w-btn w-btn--primary w-btn--block"
                        disabled={isLoading}
                    >
                        {isLoading ? <Spin onAccent /> : "Continue"}
                    </button>
                </form>
            </AuthCard>
        </DefaultStylesProvider>
    );
}
