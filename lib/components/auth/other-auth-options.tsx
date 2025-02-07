import { useState } from "react";
import styled from "styled-components";
import { useDeployment } from "@/hooks/use-deployment";
import {
	useSignInWithStrategy,
	SignInStrategy,
	type OAuthProvider,
} from "@/hooks/use-signin";
import { SocialAuthButtons } from "@/components/auth/social-buttons";
import { useSignInContext } from "@/context/signin-provider";

const EmailButton = styled.button`
  width: 100%;
  padding: 9px 16px;
  background: #f9fafb;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;



export function OtherAuthOptions() {
	const { deployment } = useDeployment();
	const { signIn: oauthSignIn } = useSignInWithStrategy(SignInStrategy.Oauth);
	const { setFirstFactor, firstFactor } = useSignInContext();
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
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{enabledSocialsProviders.length > 0 && (
				<SocialAuthButtons
					connections={enabledSocialsProviders}
					callback={initSocialAuthSignIn}
				/>
			)}

			<div>
				{firstFactor !== "email_magic_link" && authSettings?.auth_factors_enabled.email_magic_link && (
					<EmailButton onClick={() => setFirstFactor("email_magic_link")}>
						Get a magic link on your email
					</EmailButton>
				)}
				{
					firstFactor !== "email_password" && authSettings?.auth_factors_enabled.email_password && (
						<EmailButton onClick={() => setFirstFactor("email_password")}>
							Sign in with email and password
						</EmailButton>
					)
				}
				{
					firstFactor !== "email_otp" && authSettings?.auth_factors_enabled.email_otp && (
						<EmailButton onClick={() => setFirstFactor("email_otp")}>
							Sign in with email and OTP
						</EmailButton>
					)
				}
				{
					firstFactor !== "phone_otp" && authSettings?.auth_factors_enabled.phone_otp && (
						<EmailButton onClick={() => setFirstFactor("phone_otp")}>
							Sign in with phone number
						</EmailButton>
					)
				}
				{
					firstFactor !== "username_password" && authSettings?.auth_factors_enabled.username_password && (
						<EmailButton onClick={() => setFirstFactor("username_password")}>
							Sign in with username and password
						</EmailButton>
					)
				}
			</div>
		</>
	);
}
