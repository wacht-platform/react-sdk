import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import type { SignUpParams } from "../../types/auth";
import { useSignUp } from "../../hooks/use-signup";
import {
	useSignInWithStrategy,
	SignInStrategy,
	type OAuthProvider,
} from "../../hooks/use-signin";
import { useDeployment } from "../../hooks/use-deployment";
import { TypographyProvider } from "../utility/typography";
import { OTPInput } from "./otp-input";
import { ArrowLeft } from "lucide-react";
import { SocialAuthButtons } from "./social-buttons";
import { countries } from "../constants/geo";

const Container = styled.div`
  max-width: 25rem;
  width: 25rem;
  padding: 2rem 2.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 0.25rem 1.5rem rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
`;

const Divider = styled.div`
  position: relative;
  text-align: center;
  margin: 1.5rem 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 0.0625rem;
    background: #e5e7eb;
  }
`;

const DividerText = styled.span`
  position: relative;
  background: white;
  padding: 0 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NameFields = styled.div<{ $isBothEnabled: boolean }>`
  display: grid;
  grid-template-columns: ${(props) => (props.$isBothEnabled ? "1fr 1fr" : "1fr")};
  gap: 0.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  text-align: left;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  width: 100%;
  height: 2.1875rem;
  border: 0.0625rem solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  background: #f9fafb;
  transition: all 0.2s;

  &:not(:placeholder-shown):invalid {
    outline: none;
    border: 0.0625rem solid #ef4444;
    background: white;
  }

  &:not(:placeholder-shown):valid {
    outline: none;
    background: white;
  }

  &:focus:valid {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 0.1875rem rgba(34, 197, 94, 0.1);
    background: white;
  }

  &:focus:invalid {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 0.1875rem rgba(99, 102, 241, 0.1);
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

const RequiredAsterisk = styled.span`
  color: #ef4444;
  margin-left: 4px;
  vertical-align: middle;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.5625rem 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: #4f46e5;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Footer = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
`;

const Link = styled.a`
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #4f46e5;
  }
`;

const PhoneInputGroup = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const CountryCodeSelect = styled.div`
  position: relative;
`;

const CountryCodeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: white;
  }
`;

const CountryCodeDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 280px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const CountrySearch = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CountryList = styled.div`
  max-height: 250px;
  overflow-y: auto;
`;

const CountryOption = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #111827;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #f9fafb;
  }

  .country-code {
    color: #6b7280;
    margin-left: auto;
  }
`;

const PhoneInput = styled(Input)`
  flex: 1;
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

interface SignUpFormProps {
	className?: string;
	signInUrl: string;
}

export function SignUpForm({ className = "", signInUrl }: SignUpFormProps) {
	const {
		loading,
		signUp,
		identifierAvailability,
		signupAttempt,
		discardSignupAttempt,
	} = useSignUp();
	const { signIn: oauthSignIn } = useSignInWithStrategy(SignInStrategy.Oauth);
	const { deployment } = useDeployment();
	const countryDropdownRef = useRef<HTMLDivElement>(null);
	const [formData, setFormData] = useState<SignUpParams>({
		first_name: "",
		last_name: "",
		email: "",
		password: "",
		username: "",
		phone_number: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState(
		countries.find(
			(c) =>
				c.code ===
				Intl.DateTimeFormat().resolvedOptions().locale.split("-")?.pop(),
		) || countries[0],
	);
	const [countrySearch, setCountrySearch] = useState("");
	const phoneNumberInputRef = useRef<HTMLInputElement>(null);
	const [otpSent, setOtpSent] = useState(false);
	const [otpCode, setOtpCode] = useState("");

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				countryDropdownRef.current &&
				!countryDropdownRef.current.contains(event.target as Node)
			) {
				setIsCountryDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let { name, value } = e.target;
		if (name === "phone_number") {
			value = value.replace(/[^0-9-]/g, "");
		} else if (name === "email") {
			value = value.toLowerCase();
		}
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const resetFormData = () => {
		setFormData({
			first_name: "",
			last_name: "",
			email: "",
			password: "",
			username: "",
			phone_number: "",
		});
		setErrors({});
		setOtpSent(false);
		setOtpCode("");
		discardSignupAttempt();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading || isSubmitting) return;

		const newErrors: Record<string, string> = {};

		const namePattern = /^[a-zA-Z]{3,30}$/;
		const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/;
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const phonePattern = /^\d{7,15}$/;
		const passwordPattern =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$/;

		if (authSettings?.username.enabled && formData.username) {
			const { data } = await identifierAvailability(
				formData.username,
				"username",
			);
			if (data.exists) {
				newErrors.username = "Username is not available";
			}
		}

		if (authSettings?.email_address.enabled && formData.email) {
			const { data } = await identifierAvailability(formData.email, "email");
			if (data.exists) {
				newErrors.email = "Email address is not available";
			}
		}

		if (authSettings?.first_name.required && !formData.first_name) {
			newErrors.first_name = "First name is required";
		} else if (
			authSettings?.first_name.enabled &&
			formData.first_name &&
			!namePattern.test(formData.first_name)
		) {
			newErrors.first_name = "Invalid name";
		}

		if (authSettings?.last_name.required && !formData.last_name) {
			newErrors.last_name = "Last name is required";
		} else if (
			authSettings?.last_name.enabled &&
			formData.last_name &&
			!namePattern.test(formData.last_name)
		) {
			newErrors.last_name = "Invalid last name";
		}

		if (authSettings?.username.required && !formData.username) {
			newErrors.username = "Username is required";
		} else if (
			authSettings?.username.enabled &&
			formData.username &&
			!usernamePattern.test(formData.username)
		) {
			newErrors.username = "Username must be 3-20 characters";
		}

		if (authSettings?.email_address.required && !formData.email) {
			newErrors.email = "Email address is required";
		} else if (
			authSettings?.email_address.enabled &&
			formData.email &&
			!emailPattern.test(formData.email)
		) {
			newErrors.email = "Invalid email address";
		}

		if (authSettings?.phone_number.required && !formData.phone_number) {
			newErrors.phone_number = "Phone number is required";
		} else if (
			authSettings?.phone_number.enabled &&
			formData.phone_number &&
			!phonePattern.test(formData.phone_number)
		) {
			newErrors.phone_number = "Phone number must contain 7-15 digits";
		}

		if (authSettings?.password.required && !formData.password) {
			newErrors.password = "Password is required";
		} else if (
			authSettings?.password.enabled &&
			formData.password &&
			!passwordPattern.test(formData.password)
		) {
			newErrors.password =
				"Password must be 8-125 characters and include uppercase, lowercase, number, and special character";
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			return;
		}

		setIsSubmitting(true);
		try {
			await signUp.create(formData);
		} catch (err) {
			setErrors({ submit: (err as Error).message });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSocialSignIn = async (connection: DeploymentSocialConnection) => {
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

	const enabledSocialProviders =
		deployment?.social_connections.filter((conn) => conn.enabled) || [];

	const authSettings = deployment?.auth_settings;

	const filteredCountries = countries.filter(
		(country) =>
			country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
			country.dialCode.includes(countrySearch),
	);

	const isBothNamesEnabled = Boolean(
		authSettings?.first_name?.enabled && authSettings?.last_name?.enabled,
	);

	const completeVerification = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading || isSubmitting) return;
		setIsSubmitting(true);
		const newErrors: Record<string, string> = {};
		if (!otpCode) {
			newErrors.otp = "OTP code is required";
		}
		setErrors(newErrors);
		signUp.completeVerification(otpCode);
		setIsSubmitting(false);
	};

	useEffect(() => {
		if (!signupAttempt) return;

		if (signupAttempt.completed || otpSent) {
			return;
		}

		switch (signupAttempt.current_step) {
			case "verify_email":
				signUp.prepareVerification("email_otp");
				break;
			case "verify_phone":
				signUp.prepareVerification("phone_otp");
				break;
		}

		setOtpSent(true);
	}, [signupAttempt, signUp, otpSent]);

	return (
		<TypographyProvider>
			<Container className={className}>
				{otpSent ? (
					<>
						<Header>
							<BackButton
								onClick={() => {
									resetFormData();
								}}
							>
								<ArrowLeft size={16} />
							</BackButton>
							<Title>
								Check your{" "}
								{authSettings?.email_address?.enabled ? "email" : "phone"}
							</Title>
							<Subtitle>
								{authSettings?.email_address?.enabled
									? `${formData.email} to continue to Wacht`
									: `${formData.phone_number} to continue to Wacht`}
							</Subtitle>
						</Header>
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
									await signUp.prepareVerification("email_otp");
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
							Having trouble? <Link href={signInUrl}>Contact support</Link>
						</Footer>
					</>
				) : (
					<>
						<Header>
							<Title>Create your account</Title>
							<Subtitle>
								Welcome! Please fill in the details to get started.
							</Subtitle>
						</Header>

						{enabledSocialProviders.length > 0 && (
							<>
								<SocialAuthButtons
									connections={enabledSocialProviders}
									callback={handleSocialSignIn}
								/>

								<Divider>
									<DividerText>or</DividerText>
								</Divider>
							</>
						)}

						<Form onSubmit={handleSubmit} noValidate>
							{(authSettings?.first_name?.enabled ||
								authSettings?.last_name?.enabled) && (
								<NameFields $isBothEnabled={isBothNamesEnabled}>
									{authSettings?.first_name?.enabled && (
										<FormGroup>
											<Label htmlFor="first_name">
												First name
												{authSettings?.first_name?.required && (
													<RequiredAsterisk>*</RequiredAsterisk>
												)}
											</Label>
											<Input
												type="text"
												id="first_name"
												name="first_name"
												required
												minLength={3}
												maxLength={30}
												value={formData.first_name}
												onChange={handleInputChange}
												placeholder="First name"
												aria-invalid={!!errors.first_name}
												pattern="^[a-zA-Z]{3,30}$"
											/>
											{errors.first_name && (
												<ErrorMessage>{errors.first_name}</ErrorMessage>
											)}
										</FormGroup>
									)}
									{authSettings?.last_name?.enabled && (
										<FormGroup>
											<Label htmlFor="last_name">
												Last name
												{authSettings?.last_name?.required && (
													<RequiredAsterisk>*</RequiredAsterisk>
												)}
											</Label>
											<Input
												type="text"
												id="last_name"
												name="last_name"
												required
												minLength={3}
												maxLength={30}
												value={formData.last_name}
												onChange={handleInputChange}
												placeholder="Last name"
												aria-invalid={!!errors.last_name}
												pattern="^[a-zA-Z]{3,30}$"
											/>
											{errors.last_name && (
												<ErrorMessage>{errors.last_name}</ErrorMessage>
											)}
										</FormGroup>
									)}
								</NameFields>
							)}

							{authSettings?.username.enabled && (
								<FormGroup>
									<Label htmlFor="username">
										Username
										{authSettings.username.required && (
											<RequiredAsterisk>*</RequiredAsterisk>
										)}
									</Label>
									<Input
										type="text"
										id="username"
										name="username"
										minLength={3}
										maxLength={20}
										value={formData.username}
										onChange={handleInputChange}
										placeholder="Choose a username"
										aria-invalid={!!errors.username}
										required
										pattern="^[a-zA-Z][a-zA-Z0-9_.]{2,29}$"
									/>

									{errors.username && (
										<ErrorMessage>{errors.username}</ErrorMessage>
									)}
								</FormGroup>
							)}

							{authSettings?.email_address.enabled && (
								<FormGroup>
									<Label htmlFor="email">
										Email address
										{authSettings.email_address.required && (
											<RequiredAsterisk>*</RequiredAsterisk>
										)}
									</Label>
									<Input
										type="email"
										id="email"
										name="email"
										maxLength={320}
										value={formData.email}
										onChange={handleInputChange}
										placeholder="Enter your email address"
										aria-invalid={!!errors.email}
										required
										pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
									/>
									{errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
								</FormGroup>
							)}

							{authSettings?.phone_number.enabled && (
								<FormGroup>
									<Label htmlFor="phone_number">
										Phone number
										{authSettings.phone_number.required && (
											<RequiredAsterisk>*</RequiredAsterisk>
										)}
									</Label>
									<PhoneInputGroup>
										<CountryCodeSelect ref={countryDropdownRef}>
											<CountryCodeButton
												type="button"
												onClick={() =>
													setIsCountryDropdownOpen((prev) => !prev)
												}
											>
												<img
													src={`https://flagcdn.com/16x12/${selectedCountry.code.toLocaleLowerCase()}.png`}
													srcSet={`https://flagcdn.com/32x24/${selectedCountry.code.toLocaleLowerCase()}.png 2x, https://flagcdn.com/48x36/${selectedCountry.code.toLocaleLowerCase()}.png 3x`}
													alt={selectedCountry.name}
												/>
												<span>{selectedCountry.dialCode}</span>
											</CountryCodeButton>
											<CountryCodeDropdown $isOpen={isCountryDropdownOpen}>
												<CountrySearch
													type="text"
													placeholder="Search country..."
													value={countrySearch}
													onChange={(e) => setCountrySearch(e.target.value)}
													onClick={(e) => e.stopPropagation()}
												/>
												<CountryList>
													{filteredCountries.map((country) => (
														<CountryOption
															key={country.code}
															onClick={(e) => {
																e.stopPropagation();
																e.preventDefault();
																setSelectedCountry(country);
																setIsCountryDropdownOpen(false);
																phoneNumberInputRef.current?.focus();
															}}
														>
															<img
																src={`https://flagcdn.com/16x12/${country.code.toLocaleLowerCase()}.png`}
																srcSet={`https://flagcdn.com/32x24/${country.code.toLocaleLowerCase()}.png 2x, https://flagcdn.com/48x36/${country.code.toLocaleLowerCase()}.png 3x`}
																alt={country.name}
															/>
															<span>{country.name}</span>
															<span className="country-code">
																{country.dialCode}
															</span>
														</CountryOption>
													))}
												</CountryList>
											</CountryCodeDropdown>
										</CountryCodeSelect>
										<PhoneInput
											style={{ height: "100%" }}
											type="tel"
											id="phone_number"
											name="phone_number"
											required
											minLength={7}
											maxLength={15}
											ref={phoneNumberInputRef}
											value={formData.phone_number}
											onChange={handleInputChange}
											placeholder="Phone number"
											aria-invalid={!!errors.phone_number}
											pattern="^\d{7,15}$"
										/>
									</PhoneInputGroup>
									{errors.phone_number && (
										<ErrorMessage>{errors.phone_number}</ErrorMessage>
									)}
								</FormGroup>
							)}

							{authSettings?.password.enabled && (
								<FormGroup>
									<Label htmlFor="password">
										Password
										{authSettings.password.required && (
											<RequiredAsterisk>*</RequiredAsterisk>
										)}
									</Label>
									<PasswordGroup>
										<Input
											type="password"
											id="password"
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											placeholder="Enter your password"
											aria-invalid={!!errors.password}
											required
											minLength={8}
											maxLength={128}
											pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,125}$"
										/>
									</PasswordGroup>
									{errors.password && (
										<ErrorMessage>{errors.password}</ErrorMessage>
									)}
								</FormGroup>
							)}

							{errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

							<SubmitButton type="submit" disabled={isSubmitting || loading}>
								{isSubmitting ? "Creating account..." : "Continue"}
							</SubmitButton>
						</Form>

						<Footer>
							Already have an account? <Link href={signInUrl}>Sign in</Link>
						</Footer>
					</>
				)}
			</Container>
		</TypographyProvider>
	);
}
