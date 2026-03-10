import { useState } from "react";
import styled from "styled-components";
import { ChevronRight, KeyRound, Mail, Smartphone, User } from "lucide-react";
import { useDeployment } from "@/hooks/use-deployment";
import { useSignInWithStrategy, type OAuthProvider } from "@/hooks/use-signin";
import { SocialAuthButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/utility";
import { useSignInContext } from "@/context/signin-provider";
import { DeploymentSocialConnection } from "@/types";

const EmailButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !["$fullWidth", "$size", "$outline"].includes(prop),
})<{ $fullWidth?: boolean; $size?: "sm" | "md" | "lg"; $outline?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4u);
  padding-top: 0;
  padding-bottom: 0;
  color: var(--color-card-foreground);
  text-align: left;
  height: var(--size-18u);
  min-height: var(--size-18u);
  line-height: 1;
`;

const MethodStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4u);
`;

const EmailButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-4u);
  min-width: 0;
`;

const EmailButtonLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmailButtonArrow = styled(ChevronRight)`
  width: var(--space-7u);
  height: var(--space-7u);
  color: var(--color-secondary-text);
  flex-shrink: 0;
`;

const MethodIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);

  svg {
    width: var(--size-8u);
    height: var(--size-8u);
  }
`;

export function OtherAuthOptions() {
  const { deployment } = useDeployment();
  const { signIn: oauthSignIn } = useSignInWithStrategy("oauth");
  const {
    setFirstFactor,
    firstFactor,
    setShowOtherOptions,
    setShowForgotPassword,
  } = useSignInContext();
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
    } catch (err) {
      // OAuth sign-in error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setShowForgotPassword(false);
    setShowOtherOptions(false);
  };

  return (
    <>
      {enabledSocialsProviders.length > 0 && (
        <SocialAuthButtons
          connections={enabledSocialsProviders}
          callback={initSocialAuthSignIn}
        />
      )}

      <MethodStack>
        {firstFactor !== "email_magic_link" &&
          authSettings?.auth_factors_enabled.email_magic_link && (
            <EmailButton
              $outline
              $fullWidth
              onClick={() => {
                setFirstFactor("email_magic_link");
                handleBack();
              }}
            >
              <EmailButtonContent>
                <MethodIcon>
                  <Mail />
                </MethodIcon>
                <EmailButtonLabel>Get a magic link on your email</EmailButtonLabel>
              </EmailButtonContent>
              <EmailButtonArrow />
            </EmailButton>
          )}
        {firstFactor !== "email_password" &&
          authSettings?.auth_factors_enabled.email_password && (
            <EmailButton
              $outline
              $fullWidth
              onClick={() => {
                setFirstFactor("email_password");
                handleBack();
              }}
            >
              <EmailButtonContent>
                <MethodIcon>
                  <KeyRound />
                </MethodIcon>
                <EmailButtonLabel>Sign in with email and password</EmailButtonLabel>
              </EmailButtonContent>
              <EmailButtonArrow />
            </EmailButton>
          )}
        {firstFactor !== "email_otp" &&
          authSettings?.auth_factors_enabled.email_otp && (
            <EmailButton
              $outline
              $fullWidth
              onClick={() => {
                setFirstFactor("email_otp");
                handleBack();
              }}
            >
              <EmailButtonContent>
                <MethodIcon>
                  <Mail />
                </MethodIcon>
                <EmailButtonLabel>Sign in with email and OTP</EmailButtonLabel>
              </EmailButtonContent>
              <EmailButtonArrow />
            </EmailButton>
          )}
        {firstFactor !== "phone_otp" &&
          authSettings?.auth_factors_enabled.phone_otp && (
            <EmailButton
              $outline
              $fullWidth
              onClick={() => {
                setFirstFactor("phone_otp");
                handleBack();
              }}
            >
              <EmailButtonContent>
                <MethodIcon>
                  <Smartphone />
                </MethodIcon>
                <EmailButtonLabel>Sign in with phone number</EmailButtonLabel>
              </EmailButtonContent>
              <EmailButtonArrow />
            </EmailButton>
          )}
        {firstFactor !== "username_password" &&
          authSettings?.auth_factors_enabled.username_password && (
            <EmailButton
              $outline
              $fullWidth
              onClick={() => {
                setFirstFactor("username_password");
                handleBack();
              }}
            >
              <EmailButtonContent>
                <MethodIcon>
                  <User />
                </MethodIcon>
                <EmailButtonLabel>Sign in with username and password</EmailButtonLabel>
              </EmailButtonContent>
              <EmailButtonArrow />
            </EmailButton>
          )}
      </MethodStack>
    </>
  );
}
