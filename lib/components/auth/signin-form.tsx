import { useEffect, useState } from "react";
import styled from "styled-components";
import type { SignInParams } from "../../types/auth";
import { useSignInWithStrategy } from "../../hooks/use-signin";
import type { OAuthProvider } from "../../hooks/use-signin";
import { SignInStrategy } from "../../hooks/use-signin";
import { TypographyProvider } from "../utility/typography";
import { OTPInput } from "./otp-input";
import { ArrowLeft } from "lucide-react";
import { SocialAuthButtons } from "./social-buttons";
import { ForgotPassword } from "./forgot-password";
import { OtherSignInOptions } from "./other-signin-options";
import { useSignIn, SignInProvider } from "../../context/signin-provider";

const Container = styled.div`
  max-width: 400px;
  width: 400px;
  padding: 32px 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  position: absolute;
  top: 6px;
  left: 0px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 24px;
  color: #64748b;
  background: none;
  border: none;

  &:hover {
    color: #1e293b;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
  position: relative;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 14px;
`;

const Divider = styled.div`
  position: relative;
  text-align: center;
  margin: 16px 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
  }
`;

const DividerText = styled.span`
  position: relative;
  background: white;
  padding: 0 12px;
  color: #6b7280;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  text-align: left;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 8px 12px;
  width: 100%;
  height: 35px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #f9fafb;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordGroup = styled.div`
  position: relative;
`;

const ErrorMessage = styled.p`
  font-size: 12px;
  color: #ef4444;
  margin: 0;
  margin-top: 2px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 9px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: #4f46e5;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Footer = styled.p`
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
`;

const Link = styled.a`
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: #4f46e5;
  }
`;

interface SignInFormProps {
	signUpUrl: string;
}

export function SignInForm({ signUpUrl }: SignInFormProps) {
	return (
		<SignInProvider>
			<SignInFormContent signUpUrl={signUpUrl} />
		</SignInProvider>
	);
}

function SignInFormContent({ signUpUrl }: SignInFormProps) {
	const { setEmail, otpSent, setOtpSent, showForgotPassword, setShowForgotPassword, showOtherOptions, setShowOtherOptions, enabledSocialsProviders, firstFactor } = useSignIn();
	const { loading, signIn, signInAttempt, discardSignInAttempt } =
		useSignInWithStrategy(SignInStrategy.Generic);
	const { signIn: oauthSignIn } = useSignInWithStrategy(SignInStrategy.Oauth);
	const [formData, setFormData] = useState<SignInParams>({
		email: "",
		username: "",
		password: "",
		phone: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [otpCode, setOtpCode] = useState("");

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (name === 'email') {
			setEmail(value);
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
	};

	const createSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading || isSubmitting) return;

		const newErrors: Record<string, string> = {};

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
			if (otpSent && !otpCode) {
				newErrors.otp = "OTP code is required";
			}
		} else if (firstFactor === "phone_otp") {
			if (!formData.phone) {
				newErrors.phone = "Phone number is required";
			}
			if (otpSent && !otpCode) {
				newErrors.otp = "OTP code is required";
			}
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			return;
		}

		setIsSubmitting(true);
		try {
			await signIn.create(formData);
		} catch (err) {
			setErrors({ submit: (err as Error).message });
		} finally {
			setIsSubmitting(false);
		}
	};

	const completeVerification = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading || isSubmitting) return;
		setIsSubmitting(true);
		const newErrors: Record<string, string> = {};
		if (!otpCode) {
			newErrors.otp = "OTP code is required";
		}
		setErrors(newErrors);
		signIn.completeVerification(otpCode);
		setIsSubmitting(false);
	};

	const initSocialAuthSignIn = async (
		connection: DeploymentSocialConnection,
	) => {
		if (loading || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const { data } = await oauthSignIn.create({
				provider: connection.provider as OAuthProvider,
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

	useEffect(() => {
		if (!signInAttempt) return;

		if (signInAttempt.completed || otpSent) {
			return;
		}

		switch (signInAttempt.current_step) {
			case "verify_email":
			case "verify_email_otp":
				signIn.prepareVerification("email_otp");
				break;
			case "verify_phone":
			case "verify_phone_otp":
				signIn.prepareVerification("phone_otp");
				break;
		}

		setOtpSent(true);
	}, [signInAttempt, signIn.prepareVerification, otpSent]);

	if (showOtherOptions) {
		return <OtherSignInOptions onBack={() => setShowOtherOptions(false)} />;
	}

	if (showForgotPassword) {
		return (
			<ForgotPassword
				onBack={() => setShowForgotPassword(false)}
				onHelp={() => {
					console.log("Help requested");
				}}
			/>
		);
	}

	return (
		<TypographyProvider>
			<Container>
				{otpSent ? (
					<>
						<Header>
							<BackButton
								onClick={() => {
									setOtpSent(false);
									discardSignInAttempt();
									resetFormData();
								}}
							>
								<ArrowLeft size={16} />
							</BackButton>
							<Title>Check your email</Title>
							<Subtitle>{formData.email} to continue to Wacht</Subtitle>
						</Header>
					</>
				) : (
					<Header>
						<Title>Sign in to your account</Title>
						<Subtitle>Welcome back! Please enter your details.</Subtitle>
					</Header>
				)}

				{!otpSent ? (
					<>
						{enabledSocialsProviders.length > 0 && (
							<>
								<SocialAuthButtons
									connections={enabledSocialsProviders}
									callback={initSocialAuthSignIn}
								/>

								<Divider>
									<DividerText>or</DividerText>
								</Divider>
							</>
						)}

						<Form onSubmit={createSignIn} noValidate>
							{(firstFactor === "email_password" ||
								firstFactor === "email_otp") && (
									<FormGroup>
										<Label htmlFor="email">Email address</Label>
										<Input
											type="email"
											id="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											placeholder="Enter your email address"
											aria-invalid={!!errors.email}
										/>
										{errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
									</FormGroup>
								)}

							{firstFactor === "username_password" && (
								<FormGroup>
									<Label htmlFor="username">Username</Label>
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
										<ErrorMessage>{errors.username}</ErrorMessage>
									)}
								</FormGroup>
							)}

							{firstFactor === "phone_otp" && (
								<FormGroup>
									<Label htmlFor="phone">Phone number</Label>
									<Input
										type="tel"
										id="phone"
										name="phone"
										value={formData.phone}
										onChange={handleInputChange}
										placeholder="Enter your phone number"
										aria-invalid={!!errors.phone}
									/>
									{errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
								</FormGroup>
							)}

							{(firstFactor === "email_password" ||
								firstFactor === "username_password") && (
									<FormGroup>
										<div
											style={{ display: "flex", justifyContent: "space-between" }}
										>
											<Label htmlFor="password">Password</Label>
											<Link
												style={{ fontSize: "12px" }}
												onClick={() => setShowForgotPassword(true)}
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
											<ErrorMessage>{errors.password}</ErrorMessage>
										)}
									</FormGroup>
								)}

							{errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

							<SubmitButton type="submit" disabled={isSubmitting || loading}>
								{isSubmitting ? "Signing in..." : "Sign in"}
							</SubmitButton>

							<Link
								style={{
									fontSize: "12px",
									textAlign: "center",
								}}
								onClick={() => setShowOtherOptions(true)}
							>
								Use other methods
							</Link>
						</Form>
						<Footer>
							Don't have an account? <Link href={signUpUrl}>Sign up</Link>
						</Footer>
					</>
				) : (
					<>
						<Form
							style={{ gap: "15px" }}
							onSubmit={completeVerification}
							noValidate
						>
							<OTPInput
								onComplete={async (code) => {
									setOtpCode(code);
								}}
								onResend={async () => {
									const strategy =
										firstFactor === "email_otp" ? "email_otp" : "phone_otp";
									await signIn.prepareVerification(strategy);
								}}
								error={errors.otp}
								isSubmitting={isSubmitting}
							/>

							<SubmitButton
								type="submit"
								disabled={isSubmitting || loading || !otpCode}
							>
								{isSubmitting ? "Verifying..." : "Continue to Wacht"}
							</SubmitButton>
						</Form>
						<Footer>
							Having trouble? <Link href={signUpUrl}>Get help</Link>
						</Footer>
					</>
				)}
			</Container>
		</TypographyProvider>
	);
}
