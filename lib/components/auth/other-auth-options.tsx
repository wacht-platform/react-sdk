import { useState } from "react";
import styled from "styled-components";
import { useDeployment } from "../../hooks/use-deployment";
import {
	useSignInWithStrategy,
	SignInStrategy,
	type OAuthProvider,
} from "../../hooks/use-signin";
import { SocialAuthButtons } from "./social-buttons";

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

interface OtherAuthOptionsProps {
	showEmailOptions?: boolean;
	onEmailMagicLink?: () => void;
	onEmailCode?: () => void;
}

export function OtherAuthOptions({
	showEmailOptions = true,
	onEmailMagicLink,
	onEmailCode,
}: OtherAuthOptionsProps) {
	const { deployment } = useDeployment();
	const { signIn: oauthSignIn } = useSignInWithStrategy(SignInStrategy.Oauth);
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

			{showEmailOptions && authSettings?.email_address.required && (
				<div>
					<EmailButton onClick={onEmailMagicLink}>
						Get a magic link on your email
					</EmailButton>
					<EmailButton onClick={onEmailCode}>Login with email code</EmailButton>
				</div>
			)}
		</>
	);
}
