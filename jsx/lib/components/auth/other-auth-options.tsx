import { useState } from "react";
import styled from "styled-components";
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

const MethodStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-3u);
`;


const Divider = styled.div`
    position: relative;
    text-align: center;
    margin: var(--space-6u) 0;

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
    padding: 0 var(--space-4u);
    color: var(--color-secondary-text);
    font-size: var(--font-size-2xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
`;

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
    const { setFirstFactor, firstFactor, setShowOtherOptions } =
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
                <Divider>
                    <DividerText>or</DividerText>
                </Divider>
            )}

            {hasMethods && (
                <MethodStack>
                    {availableMethods.map((method) => (
                        <MethodButton
                            key={method.key}
                            icon={method.icon}
                            label={method.label}
                            description={method.description}
                            onClick={() => {
                                setFirstFactor(method.key);
                                setShowOtherOptions(false);
                            }}
                        />
                    ))}
                </MethodStack>
            )}
        </>
    );
}
