import { useState } from "react";
import {
    Key,
    DeviceMobile,
    User,
    Lightning,
    Hash,
} from "@phosphor-icons/react";
import { useDeployment } from "@/hooks/use-deployment";
import { useSignInWithStrategy, type OAuthProvider } from "@/hooks/use-signin";
import { SocialAuthButtons } from "@/components/auth/social-buttons";
import { MethodButton } from "@/components/utility/method-button";
import { useSignInContext } from "@/context/signin-provider";
import { DeploymentSocialConnection } from "@/types";

const methods = [
    {
        key: "email_magic_link" as const,
        icon: <Lightning />,
        label: "Magic link",
        description: "We'll email you a one-click sign-in link",
    },
    {
        key: "email_password" as const,
        icon: <Key />,
        label: "Email and password",
        description: "Sign in with your email and password",
    },
    {
        key: "email_otp" as const,
        icon: <Hash />,
        label: "Email one-time code",
        description: "We'll send a verification code to your email",
    },
    {
        key: "phone_otp" as const,
        icon: <DeviceMobile />,
        label: "Phone number",
        description: "We'll send a verification code via SMS",
    },
    {
        key: "username_password" as const,
        icon: <User />,
        label: "Username and password",
        description: "Sign in with your username and password",
    },
];

export function OtherAuthOptions() {
    const { deployment } = useDeployment();
    const { signIn: oauthSignIn } = useSignInWithStrategy("oauth");
    const { setFirstFactor, firstFactor, setShowOtherOptions, setSignInStep } =
        useSignInContext();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const authSettings = deployment?.auth_settings;
    const enabledSocialsProviders =
        deployment?.social_connections.filter((conn) => conn.enabled) || [];

    const initSocialAuthSignIn = async (
        connection: DeploymentSocialConnection,
    ) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { data } = await oauthSignIn.create({
                provider: connection.provider as OAuthProvider,
            });
            if (data && typeof data === "object" && "oauth_url" in data) {
                window.location.href = data.oauth_url as string;
            }
        } catch {
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableMethods = methods.filter((m) => {
        if (m.key === firstFactor) return false;
        const factors = authSettings?.auth_factors_enabled;
        if (!factors) return false;
        return factors[m.key as keyof typeof factors];
    });

    const hasSocials = enabledSocialsProviders.length > 0;
    const hasMethods = availableMethods.length > 0;

    return (
        <>
            {hasSocials && (
                <SocialAuthButtons
                    connections={enabledSocialsProviders}
                    callback={initSocialAuthSignIn}
                />
            )}

            {hasSocials && hasMethods && (
                <div className="w-or">
                    <span>or</span>
                </div>
            )}

            {hasMethods && (
                <div className="w-method-stack">
                    {availableMethods.map((method) => (
                        <MethodButton
                            key={method.key}
                            icon={method.icon}
                            label={method.label}
                            description={method.description}
                            onClick={() => {
                                setFirstFactor(method.key);
                                setSignInStep("identifier");
                                setShowOtherOptions(false);
                            }}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
