import { useState } from "react";
import { OTPInput } from "../utility/otp-input";
import { useForgotPassword } from "../../hooks/use-forgot-password";
import { OtherAuthOptions } from "./other-auth-options";
import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead, Spin } from "./auth-card";
import { useDeployment } from "@/hooks/use-deployment";
import { useNavigation } from "@/hooks/use-navigation";

interface ForgotPasswordProps {
    onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
    const { deployment } = useDeployment();
    const { navigate } = useNavigation();
    const [step, setStep] = useState<"start" | "email" | "otp" | "reset">(
        "start",
    );
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { forgotPassword, verifyOtp, resetPassword } = useForgotPassword();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await forgotPassword(email);
            setStep("otp");
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await verifyOtp(email, otp);
            if (result.data) {
                setToken(result.data.token);
                setStep("reset");
            }
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return;
        }
        if (password.length < 8) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await resetPassword(token, password);
            if (result.data) {
                const session = result.data;
                // Check for incomplete sign-in attempts (e.g. 2FA). We take the
                // last attempt as it is the one created by the password reset.
                const incompleteAttempt =
                    session.signin_attempts &&
                    session.signin_attempts.length > 0
                        ? session.signin_attempts[
                              session.signin_attempts.length - 1
                          ]
                        : null;

                if (incompleteAttempt && !incompleteAttempt.completed) {
                    const signinUrl =
                        deployment?.ui_settings?.sign_in_page_url;
                    if (signinUrl) {
                        const url = new URL(signinUrl, window.location.origin);
                        url.searchParams.set(
                            "signin_attempt_id",
                            incompleteAttempt.id,
                        );
                        navigate(url.toString());
                    } else {
                        onBack();
                    }
                } else {
                    const redirectUrl =
                        deployment?.ui_settings?.after_signin_redirect_url ||
                        "/";
                    navigate(redirectUrl);
                }
            }
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const backFooter = (
        <span className="w-auth-foot">
            <span
                className="w-link"
                style={{ cursor: "pointer" }}
                onClick={onBack}
            >
                Back to sign in
            </span>
        </span>
    );

    return (
        <DefaultStylesProvider>
            {step === "start" && (
                <AuthCard footer={backFooter}>
                    <AuthHead
                        title="Forgot your password?"
                        sub="Reset it, or sign in another way."
                    />
                    <button
                        type="button"
                        className="w-btn w-btn--primary w-btn--block"
                        onClick={() => setStep("email")}
                        disabled={loading}
                    >
                        Reset your password
                    </button>
                    <div className="w-or">
                        <span>OR</span>
                    </div>
                    <OtherAuthOptions />
                    <p
                        className="w-secsub"
                        style={{ textAlign: "center", marginTop: 16 }}
                    >
                        Unable to reset password?{" "}
                        <a
                            className="w-link"
                            href={
                                deployment?.ui_settings?.support_page_url || "#"
                            }
                        >
                            Get help
                        </a>
                    </p>
                </AuthCard>
            )}

            {step === "email" && (
                <AuthCard footer={backFooter}>
                    <AuthHead
                        title="Forgot password"
                        sub="Enter your email and we'll send you a code to reset your password."
                    />
                    <form
                        onSubmit={handleEmailSubmit}
                        noValidate
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 13,
                        }}
                    >
                        <label className="w-field">
                            <span className="w-label">Email address</span>
                            <input
                                className="w-input"
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                            />
                        </label>
                        {error && (
                            <span className="w-input-err">{error.message}</span>
                        )}
                        <button
                            type="submit"
                            className="w-btn w-btn--primary w-btn--block"
                            disabled={loading}
                        >
                            {loading ? <Spin size={15} onAccent /> : "Send code"}
                        </button>
                    </form>
                </AuthCard>
            )}

            {step === "otp" && (
                <AuthCard footer={backFooter}>
                    <AuthHead
                        title="Enter verification code"
                        sub={`We sent a 6-digit code to ${email}.`}
                    />
                    <form
                        onSubmit={handleOtpSubmit}
                        noValidate
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                            alignItems: "center",
                        }}
                    >
                        <OTPInput
                            onComplete={(code) => setOtp(code)}
                            isSubmitting={loading}
                            error={error?.message}
                            onResend={async () => {
                                await forgotPassword(email);
                            }}
                        />
                        <button
                            type="submit"
                            className="w-btn w-btn--primary w-btn--block"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? <Spin size={15} onAccent /> : "Verify"}
                        </button>
                    </form>
                </AuthCard>
            )}

            {step === "reset" && (
                <AuthCard footer={backFooter}>
                    <AuthHead
                        title="Reset password"
                        sub="Create a new password for your account."
                    />
                    <form
                        onSubmit={handleResetSubmit}
                        noValidate
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 13,
                        }}
                    >
                        <label className="w-field">
                            <span className="w-label">New password</span>
                            <input
                                className="w-input"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                        </label>
                        <label className="w-field">
                            <span className="w-label">Confirm new password</span>
                            <input
                                className="w-input"
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm new password"
                                required
                            />
                        </label>
                        {error && (
                            <span className="w-input-err">{error.message}</span>
                        )}
                        <button
                            type="submit"
                            className="w-btn w-btn--primary w-btn--block"
                            disabled={loading}
                        >
                            {loading ? (
                                <Spin size={15} onAccent />
                            ) : (
                                "Reset password"
                            )}
                        </button>
                    </form>
                </AuthCard>
            )}
        </DefaultStylesProvider>
    );
}
