"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead, Spin } from "./auth-card";
import { useDeployment } from "@/hooks/use-deployment";
import { useWaitlist, type WaitlistParams } from "@/hooks/use-waitlist";

export function WaitlistForm() {
    const { deployment } = useDeployment();
    const { loading, joinWaitlist } = useWaitlist();
    const [formData, setFormData] = useState<WaitlistParams>({
        first_name: "",
        last_name: "",
        email: "",
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const getErrorMessage = (): string | undefined => {
        if (!error) return undefined;
        return error.message;
    };

    const authSettings = deployment?.auth_settings;
    const isBothNamesEnabled = Boolean(
        authSettings?.first_name?.enabled && authSettings?.last_name?.enabled,
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!authSettings) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const result = await joinWaitlist(formData);
            if (result.data) {
                setIsSubmitted(true);
            }
        } catch (error) {
            setError(error as Error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <DefaultStylesProvider>
                <AuthCard>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 16,
                            textAlign: "center",
                        }}
                    >
                        <div className="w-success">
                            <span className="ring" />
                            <span className="disc">
                                <Check weight="bold" />
                            </span>
                        </div>
                        <h1 className="w-auth-title">You're on the waitlist</h1>
                        <p className="w-auth-sub">
                            Thanks for your interest! We'll notify you at{" "}
                            {formData.email} when we're ready for you to join.
                        </p>
                    </div>
                </AuthCard>
            </DefaultStylesProvider>
        );
    }

    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    <span className="w-auth-foot">
                        Need assistance?{" "}
                        <a href="/contact" className="w-link">
                            Get help
                        </a>
                    </span>
                }
            >
                <AuthHead
                    title="Join the waitlist"
                    sub="Be the first to know when we launch!"
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
                    {(authSettings?.first_name?.enabled ||
                        authSettings?.last_name?.enabled) && (
                        <div className={isBothNamesEnabled ? "w-grid-2" : ""}>
                            {authSettings?.first_name?.enabled && (
                                <div className="w-field">
                                    <label
                                        className="w-label"
                                        htmlFor="first_name"
                                    >
                                        First name
                                        {authSettings?.first_name?.required && (
                                            <span className="w-req">*</span>
                                        )}
                                    </label>
                                    <input
                                        className="w-input"
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        required={
                                            authSettings?.first_name?.required
                                        }
                                        minLength={2}
                                        maxLength={50}
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        placeholder="First name"
                                    />
                                </div>
                            )}

                            {authSettings?.last_name?.enabled && (
                                <div className="w-field">
                                    <label
                                        className="w-label"
                                        htmlFor="last_name"
                                    >
                                        Last name
                                        {authSettings?.last_name?.required && (
                                            <span className="w-req">*</span>
                                        )}
                                    </label>
                                    <input
                                        className="w-input"
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        required={
                                            authSettings?.last_name?.required
                                        }
                                        minLength={2}
                                        maxLength={50}
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        placeholder="Last name"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="w-field">
                        <label className="w-label" htmlFor="email">
                            Email address
                            {authSettings?.email_address?.required && (
                                <span className="w-req">*</span>
                            )}
                        </label>
                        <input
                            className="w-input"
                            type="email"
                            id="email"
                            name="email"
                            required={authSettings?.email_address?.required}
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                        />
                    </div>

                    {getErrorMessage() && (
                        <span className="w-input-err">{getErrorMessage()}</span>
                    )}

                    <button
                        type="submit"
                        className="w-btn w-btn--primary w-btn--block"
                        disabled={isSubmitting || loading}
                    >
                        {isSubmitting || loading ? (
                            <Spin onAccent />
                        ) : (
                            "Join waitlist"
                        )}
                    </button>
                </form>
            </AuthCard>
        </DefaultStylesProvider>
    );
}
