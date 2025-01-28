import { useEffect, useState } from "react";
import styled from "styled-components";
import type { SSOProvider, SignInParams } from "../../types/auth";
import { useSignInWithStrategy } from "../../hooks/use-signin";
import type { OAuthProvider } from "../../hooks/use-signin";
import { SignInStrategy } from "../../hooks/use-signin";
import { useDeployment } from "../../hooks/use-deployment";
import { TypographyProvider } from "../utility/typography";
import { OTPInput } from './otp-input';
import { ArrowLeft } from 'lucide-react';

const ssoConfig = {
	google_oauth: {
		shortLabel: "Google",
		fullLabel: "Continue with Google",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				role="img"
				aria-label="Google"
				viewBox="0 0 48 48"
				width="24px"
				height="24px"
			>
				<path
					fill="#fbc02d"
					d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
				/>
				<path
					fill="#e53935"
					d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
				/>
				<path
					fill="#4caf50"
					d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
				/>
				<path
					fill="#1565c0"
					d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
				/>
			</svg>
		),
	},
	microsoft_oauth: {
		shortLabel: "Microsoft",
		fullLabel: "Continue with Microsoft",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 48 48"
				width="24px"
				height="24px"
				role="img"
				aria-label="Microsoft"
			>
				<path fill="#ff5722" d="M6 6H22V22H6z" transform="rotate(-180 14 14)" />
				<path
					fill="#4caf50"
					d="M26 6H42V22H26z"
					transform="rotate(-180 34 14)"
				/>
				<path
					fill="#ffc107"
					d="M26 26H42V42H26z"
					transform="rotate(-180 34 34)"
				/>
				<path
					fill="#03a9f4"
					d="M6 26H22V42H6z"
					transform="rotate(-180 14 34)"
				/>
			</svg>
		),
	},
	github_oauth: {
		shortLabel: "GitHub",
		fullLabel: "Continue with GitHub",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 30 30"
				width="24px"
				height="24px"
				role="img"
				aria-label="GitHub"
			>
				<path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z" />
			</svg>
		),
	},
};

const Container = styled.div`
	max-width: 400px;
	width: 400px;
	padding: 32px;
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
	color: #6B7280;
	font-size: 14px;
`;

const SSOButtonsContainer = styled.div`
	display: flex;
	flex-direction: row;
	gap: 12px;
	margin-bottom: 24px;
`;

const SSOButton = styled.button`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 4px 16px;
	border: 1px solid #E5E7EB;
	border-radius: 8px;
	background: white;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 14px;
	color: #374151;
	font-weight: 500;

	&:hover {
		background-color: #F9FAFB;
		border-color: #D1D5DB;
	}

	img {
		width: 16px;
		height: 16px;
	}
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
		background: #E5E7EB;
	}
`;

const DividerText = styled.span`
	position: relative;
	background: white;
	padding: 0 12px;
	color: #6B7280;
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
	border: 1px solid #E5E7EB;
	border-radius: 8px;
	font-size: 14px;
	color: #111827;
	background: #F9FAFB;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #6366F1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
		background: white;
	}

	&::placeholder {
		color: #9CA3AF;
	}
`;

const PasswordGroup = styled.div`
	position: relative;
`;

const ErrorMessage = styled.p`
	font-size: 12px;
	color: #EF4444;
	margin: 0;
	margin-top: 2px;
`;

const SubmitButton = styled.button`
	width: 100%;
	padding: 9px 16px;
	background: #6366F1;
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 500;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s;
	margin-top: 8px;

	&:hover:not(:disabled) {
		background: #4F46E5;
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
	color: #6B7280;
`;

const Link = styled.a`
	color: #6366F1;
	text-decoration: none;
	font-weight: 500;
	transition: color 0.2s;

	&:hover {
		color: #4F46E5;
	}
`;

interface SignInFormProps {
	className?: string;
	signUpUrl: string;
}

export function SignInForm({ className = "", signUpUrl }: SignInFormProps) {
	const { isLoaded, signIn, signInAttempt, discardSignInAttempt } = useSignInWithStrategy(
		SignInStrategy.Generic,
	);
	const { isLoaded: isOAuthLoaded, signIn: oauthSignIn } =
		useSignInWithStrategy(SignInStrategy.Oauth);
	const { deployment } = useDeployment();
	const [formData, setFormData] = useState<SignInParams>({
		email: "",
		username: "",
		password: "",
		phone: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [otpCode, setOtpCode] = useState("");

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
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
		if (!isLoaded || isSubmitting) return;

		const newErrors: Record<string, string> = {};
		const firstFactor = authSettings?.first_factor;

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
		if (!isLoaded || isSubmitting) return;
		setIsSubmitting(true);
		const newErrors: Record<string, string> = {};
		if (!otpCode) {
			newErrors.otp = "OTP code is required";
		}
		setErrors(newErrors);
		signIn.completeVerification(otpCode);
		setIsSubmitting(false)
	}

	const handleSSOSignIn = async (provider: SSOProvider) => {
		if (!isOAuthLoaded || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const { data } = await oauthSignIn.create({
				provider: provider as unknown as OAuthProvider,
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

	const enabledSSOProviders =
		deployment?.social_connections.filter((conn) => conn.enabled) || [];

	const authSettings = deployment?.auth_settings;
	const firstFactor = authSettings?.first_factor;

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

	return (
		<TypographyProvider>
			<Container className={className}>
				{otpSent ? (
					<>
						<Header>
							<BackButton onClick={() => { setOtpSent(false); discardSignInAttempt(); resetFormData() }}>
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
						{enabledSSOProviders.length > 0 && (
							<>
								<SSOButtonsContainer>
									{enabledSSOProviders.map((conn) => {
										const provider = conn.provider.toLowerCase() as SSOProvider;
										if (!ssoConfig[provider]) return null;
										const numProviders = enabledSSOProviders.length;

										return (
											<SSOButton
												key={conn.id}
												onClick={() => handleSSOSignIn(provider)}
												type="button"
											>
												{ssoConfig[provider].icon}
												{numProviders > 1
													? ssoConfig[provider].shortLabel
													: ssoConfig[provider].fullLabel}
											</SSOButton>
										);
									})}
								</SSOButtonsContainer>

								<Divider>
									<DividerText>or</DividerText>
								</Divider>
							</>
						)}

						<Form onSubmit={createSignIn} noValidate>
							{(firstFactor === "email_password" || firstFactor === "email_otp") && (
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
									{errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
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
										<Label htmlFor="password">Password</Label>
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
										{errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
									</FormGroup>
								)}

							{errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

							<SubmitButton type="submit" disabled={isSubmitting || !isLoaded}>
								{isSubmitting
									? "Signing in..."
									: "Sign in"}
							</SubmitButton>
						</Form>
						<Footer>
							Don't have an account? <Link href={signUpUrl}>Sign up</Link>
						</Footer>
					</>
				) : (
					<>
						<Form style={{ gap: "15px" }} onSubmit={completeVerification} noValidate>
							<OTPInput
								onComplete={async (code) => {
									setOtpCode(code);
								}}
								onResend={async () => {
									const strategy = firstFactor === "email_otp" ? "email_otp" : "phone_otp";
									await signIn.prepareVerification(strategy);
								}}
								error={errors.otp}
								isSubmitting={isSubmitting}
							/>

							<SubmitButton type="submit" disabled={
								isSubmitting || !isLoaded || !otpCode
							}>
								{isSubmitting
									? `Verifying...`
									: "Continue to Wacht"}
							</SubmitButton>
						</Form>
						<Footer>
							Having trouble? <Link href={signUpUrl}>Contact support</Link>
						</Footer>
					</>
				)}

			</Container>
		</TypographyProvider>
	);
}
