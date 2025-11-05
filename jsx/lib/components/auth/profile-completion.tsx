"use client";

import { useState } from "react";
import styled from "styled-components";
import { Loader2 } from "lucide-react";
import { useDeployment } from "../../hooks/use-deployment";
import { useNavigation } from "../../hooks/use-navigation";
import { PhoneNumberInput } from "../utility/phone";
import { OTPInput } from "../utility/otp-input";
import { ProfileCompletionData, ProfileCompletionProps } from "@wacht/types";
import { AuthFormImage } from "./auth-image";
import { NavigationLink } from "../utility/navigation";
import { DefaultStylesProvider } from "../utility/root";
import { Button } from "../utility/button";
import { Form, FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-3xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
  position: relative;
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
`;

const NameFields = styled.div<{ $isBothEnabled: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$isBothEnabled ? "1fr 1fr" : "1fr"};
  gap: var(--space-sm);
`;

const ErrorMessage = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-2xs);
`;

const SubmitButton = styled(Button)`
  margin-top: var(--space-sm);
`;

const Footer = styled.div`
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;

  svg {
    animation: spin 1s linear infinite;
    color: var(--color-primary);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export function ProfileCompletion({
  attempt,
  onBack,
  completeProfile,
  completeVerification,
  prepareVerification,
}: ProfileCompletionProps) {
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();

  const [formData, setFormData] = useState<ProfileCompletionData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState<string | undefined>("US");
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const displayError = error;
  const isLoading = loading;

  const handleComplete = async (data: ProfileCompletionData) => {
    setLoading(true);
    setError(null);

    try {
      const session = await completeProfile(data);

      // Check if completed and redirect
      if (session) {
        setIsRedirecting(true);
        let redirectUri: string | null = new URLSearchParams(
          window.location.search,
        ).get("redirect_uri");
        if (!redirectUri) {
          redirectUri =
            deployment?.ui_settings?.after_signin_redirect_url || null;
        }
        if (!redirectUri && deployment?.frontend_host) {
          redirectUri = `https://${deployment.frontend_host}`;
        }
        if (redirectUri) {
          const uri = new URL(redirectUri);
          if (deployment?.mode === "staging") {
            uri.searchParams.set(
              "__dev_session__",
              localStorage.getItem("__dev_session__") || "",
            );
          }
          navigate(uri.toString());
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const session = await completeVerification(code);

      // Check if completed and redirect
      if (session) {
        setIsRedirecting(true);
        let redirectUri: string | null = new URLSearchParams(
          window.location.search,
        ).get("redirect_uri");
        if (!redirectUri) {
          redirectUri =
            deployment?.ui_settings?.after_signin_redirect_url || null;
        }
        if (!redirectUri && deployment?.frontend_host) {
          redirectUri = `https://${deployment.frontend_host}`;
        }
        if (redirectUri) {
          const uri = new URL(redirectUri);
          if (deployment?.mode === "staging") {
            uri.searchParams.set(
              "__dev_session__",
              localStorage.getItem("__dev_session__") || "",
            );
          }
          navigate(uri.toString());
        }
      }
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while redirecting
  if (isRedirecting || !attempt) {
    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />
          <LoadingContainer>
            <Loader2 size={32} />
          </LoadingContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  const missingFields = attempt.missing_fields || [];
  const title = "Complete Your Profile";
  const message = "Please provide the following information to continue";

  const authSettings = deployment?.auth_settings;
  const isVerifying =
    attempt?.current_step === "verify_phone_otp" ||
    attempt?.current_step === "verify_email_otp" ||
    showVerification;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    missingFields.forEach((field: string) => {
      const fieldValue = formData[field as keyof ProfileCompletionData];
      let isFieldEnabled = false;

      switch (field) {
        case "first_name":
          isFieldEnabled = authSettings?.first_name?.enabled || false;
          break;
        case "last_name":
          isFieldEnabled = authSettings?.last_name?.enabled || false;
          break;
        case "username":
          isFieldEnabled = authSettings?.username?.enabled || false;
          break;
        case "phone_number":
          isFieldEnabled = authSettings?.phone_number?.enabled || false;
          break;
        case "email_address":
          isFieldEnabled = authSettings?.email_address?.enabled || false;
          break;
        default:
          isFieldEnabled = true;
      }

      if (isFieldEnabled && (!fieldValue || fieldValue.trim() === "")) {
        const fieldName = field
          .replace("_", " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        newErrors[field] = `${fieldName} is required`;
      }
    });

    // Additional validation
    if (formData.username && missingFields.includes("username")) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(formData.username)) {
        newErrors.username =
          "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens";
      }
    }

    if (formData.phone_number && missingFields.includes("phone_number")) {
      const phonePattern = /^\d{7,15}$/;
      if (!phonePattern.test(formData.phone_number)) {
        newErrors.phone_number = "Phone number must contain 7-15 digits";
      }
    }

    if (formData.email && missingFields.includes("email_address")) {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(formData.email)) {
        newErrors.email_address = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    const submitData: any = { ...formData };
    if (formData.phone_number && countryCode) {
      submitData.phone_country_code = countryCode;
    }
    await handleComplete(submitData);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, phone_number: value }));
    if (errors.phone_number) {
      setErrors((prev) => ({ ...prev, phone_number: "" }));
    }
  };

  if (isVerifying) {
    const verificationTitle =
      attempt.current_step === "verify_phone_otp"
        ? "Verify Your Phone Number"
        : "Verify Your Email";
    const verificationMessage =
      attempt.current_step === "verify_phone_otp"
        ? "Enter the 6-digit code sent to your phone"
        : "Enter the 6-digit code sent to your email";
    const resendStrategy: "phone_otp" | "email_otp" =
      attempt.current_step === "verify_phone_otp" ? "phone_otp" : "email_otp";

    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />

          <Header>
            <Title>{verificationTitle}</Title>
            <Subtitle>{verificationMessage}</Subtitle>
          </Header>

          <Form onSubmit={(e) => e.preventDefault()} noValidate>
            <OTPInput
              onComplete={handleVerificationComplete}
              onResend={async () => {
                await prepareVerification({ strategy: resendStrategy });
              }}
              error={displayError?.message}
              isSubmitting={isLoading}
            />

            {displayError && (
              <ErrorMessage style={{ marginBottom: "var(--space-md)" }}>
                {displayError.message}
              </ErrorMessage>
            )}
          </Form>

          <Footer>
            <div>
              <Link
                onClick={() => setShowVerification(false)}
                style={{ cursor: "pointer" }}
              >
                Back to profile completion
              </Link>
            </div>
            <div style={{ marginTop: "var(--space-sm)" }}>
              Having trouble?{" "}
              <Link>
                <NavigationLink
                  to={deployment?.ui_settings.support_page_url || "#"}
                >
                  Get help
                </NavigationLink>
              </Link>
            </div>
          </Footer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>{title}</Title>
          <Subtitle>{message}</Subtitle>
        </Header>

        <Form onSubmit={handleSubmit} noValidate>
          {(missingFields.includes("first_name") ||
            missingFields.includes("last_name")) &&
            (authSettings?.first_name?.enabled ||
              authSettings?.last_name?.enabled) && (
              <NameFields
                $isBothEnabled={
                  !!(
                    authSettings?.first_name?.enabled &&
                    authSettings?.last_name?.enabled &&
                    missingFields.includes("first_name") &&
                    missingFields.includes("last_name")
                  )
                }
              >
                {missingFields.includes("first_name") &&
                  authSettings?.first_name?.enabled && (
                    <FormGroup>
                      <Label htmlFor="first_name">
                        First name {authSettings.first_name.required && "*"}
                      </Label>
                      <Input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        aria-invalid={!!errors.first_name}
                        disabled={isLoading}
                        autoComplete="given-name"
                      />
                      {errors.first_name && (
                        <ErrorMessage>{errors.first_name}</ErrorMessage>
                      )}
                    </FormGroup>
                  )}

                {missingFields.includes("last_name") &&
                  authSettings?.last_name?.enabled && (
                    <FormGroup>
                      <Label htmlFor="last_name">
                        Last name {authSettings.last_name.required && "*"}
                      </Label>
                      <Input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        aria-invalid={!!errors.last_name}
                        disabled={isLoading}
                        autoComplete="family-name"
                      />
                      {errors.last_name && (
                        <ErrorMessage>{errors.last_name}</ErrorMessage>
                      )}
                    </FormGroup>
                  )}
              </NameFields>
            )}

          {missingFields.includes("username") &&
            authSettings?.username?.enabled && (
              <FormGroup>
                <Label htmlFor="username">
                  Username {authSettings.username.required && "*"}
                </Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username || ""}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  aria-invalid={!!errors.username}
                  disabled={isLoading}
                  autoComplete="username"
                />
                {errors.username && (
                  <ErrorMessage>{errors.username}</ErrorMessage>
                )}
              </FormGroup>
            )}

          {missingFields.includes("phone_number") &&
            authSettings?.phone_number?.enabled && (
              <FormGroup>
                <Label htmlFor="phone_number">
                  Phone number {authSettings.phone_number.required && "*"}
                </Label>
                <PhoneNumberInput
                  value={formData.phone_number || ""}
                  onChange={handlePhoneChange}
                  error={errors.phone_number}
                  countryCode={countryCode}
                  setCountryCode={setCountryCode}
                />
                {errors.phone_number && (
                  <ErrorMessage>{errors.phone_number}</ErrorMessage>
                )}
              </FormGroup>
            )}

          {missingFields.includes("email_address") &&
            authSettings?.email_address?.enabled && (
              <FormGroup>
                <Label htmlFor="email">
                  Email address {authSettings.email_address.required && "*"}
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  aria-invalid={!!errors.email_address}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email_address && (
                  <ErrorMessage>{errors.email_address}</ErrorMessage>
                )}
              </FormGroup>
            )}

          {displayError && (
            <ErrorMessage style={{ marginBottom: "var(--space-md)" }}>
              {displayError.message}
            </ErrorMessage>
          )}

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? "Completing..." : "Continue"}
          </SubmitButton>
        </Form>

        <Footer>
          {onBack && (
            <div>
              <Link onClick={onBack} style={{ cursor: "pointer" }}>
                Back to login
              </Link>
            </div>
          )}
          <div style={{ marginTop: "var(--space-sm)" }}>
            Having trouble?{" "}
            <Link>
              <NavigationLink
                to={deployment?.ui_settings.support_page_url || "#"}
              >
                Get help
              </NavigationLink>
            </Link>
          </div>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
