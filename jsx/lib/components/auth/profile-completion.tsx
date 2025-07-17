"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useDeployment } from "../../hooks/use-deployment";
import { useProfileCompletion } from "../../hooks/use-profile-completion";
import { PhoneNumberInput } from "../utility/phone";
import { OTPInput } from "../utility/otp-input";
import { ProfileCompletionData, ProfileCompletionProps } from "@snipextt/wacht-types";
import { AuthFormImage } from "./auth-image";
import { NavigationLink } from "../utility/navigation";
import { DefaultStylesProvider } from "../utility/root";

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

const Message = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const Label = styled.label`
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-foreground);
`;

const Input = styled.input`
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-input-background);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--color-foreground);
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-shadow);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &[aria-invalid="true"] {
    border-color: var(--color-error);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: var(--space-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  font-size: var(--font-2xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-2xs);
`;

const Footer = styled.p`
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

export function ProfileCompletion({
  redirectUri,
  onComplete,
  onError,
  onBack,
}: ProfileCompletionProps) {
  const { deployment } = useDeployment();
  const {
    attempt,
    attemptType,
    loading: hookLoading,
    error: hookError,
    handleComplete: hookHandleComplete,
    handleCompleteVerification,
    handlePrepareVerification,
  } = useProfileCompletion();

  const [formData, setFormData] = useState<ProfileCompletionData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState<string | undefined>("US");
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use hook's error if no local error
  const displayError = error || hookError;
  const isLoading = loading || hookLoading;

  // Handle completion with success/error callbacks
  const handleComplete = async (data: ProfileCompletionData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await hookHandleComplete(data);

      if (result.success) {
        if (onComplete) {
          onComplete(result.data.session || result.data);
        } else {
          // Redirect logic
          let finalRedirectUri = redirectUri || new URLSearchParams(window.location.search).get("redirect_uri");
          if (!finalRedirectUri) {
            finalRedirectUri = "https://" + window.location.hostname;
          }
          const uri = new URL(finalRedirectUri);
          if (deployment?.mode === "staging") {
            uri.searchParams.set("dev_session", localStorage.getItem("__dev_session__") ?? "");
          }
          window.location.href = uri.toString();
        }
      } else {
        // Still has remaining steps, check if verification is needed
        const attemptData = result.data.signin_attempt || result.data.signup_attempt;
        if (attemptData?.current_step === "verify_phone" || attemptData?.current_step === "verify_email") {
          setShowVerification(true);
          // Prepare verification
          const strategy = attemptData.current_step === "verify_phone" ? "phone_otp" : "email_otp";
          await handlePrepareVerification(strategy);
        }
      }

      return result.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle verification completion
  const handleVerificationComplete = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await handleCompleteVerification(code);

      if (result.success) {
        if (onComplete) {
          onComplete(result.data.session || result.data);
        } else {
          // Redirect logic
          let finalRedirectUri = redirectUri || new URLSearchParams(window.location.search).get("redirect_uri");
          if (!finalRedirectUri) {
            finalRedirectUri = "https://" + window.location.hostname;
          }
          const uri = new URL(finalRedirectUri);
          if (deployment?.mode === "staging") {
            uri.searchParams.set("dev_session", localStorage.getItem("__dev_session__") ?? "");
          }
          window.location.href = uri.toString();
        }
      }

      return result.success;
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) {
        onError(error);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Show loading or no attempt
  if (isLoading || !attempt) {
    return null;
  }

  const missingFields = attempt.missing_fields || [];
  const title = attemptType === "signin"
    ? "Complete Your Profile"
    : "Complete Your Account";
  const message = attemptType === "signin"
    ? "Please provide the following information to continue"
    : "Just a few more details to finish setting up your account";

  const authSettings = deployment?.auth_settings;
  const isVerifying = attempt?.current_step === "verify_phone" ||
                     attempt?.current_step === "verify_email" ||
                     showVerification;

  // Initialize form data from attempt
  useEffect(() => {
    if (attempt) {
      setFormData({
        first_name: attempt.first_name || "",
        last_name: attempt.last_name || "",
        username: attempt.username || "",
        phone_number: attempt.phone_number || "",
      });
    }
  }, [attempt]);

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
        default:
          isFieldEnabled = true;
      }

      if (isFieldEnabled && (!fieldValue || fieldValue.trim() === "")) {
        const fieldName = field.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
        newErrors[field] = `${fieldName} is required`;
      }
    });

    // Additional validation
    if (formData.username && missingFields.includes("username")) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(formData.username)) {
        newErrors.username = "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens";
      }
    }
    
    if (formData.phone_number && missingFields.includes("phone_number")) {
      const phonePattern = /^\d{7,15}$/;
      if (!phonePattern.test(formData.phone_number)) {
        newErrors.phone_number = "Phone number must contain 7-15 digits";
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

    await handleComplete(formData);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, phone_number: value }));
    if (errors.phone_number) {
      setErrors((prev) => ({ ...prev, phone_number: "" }));
    }
  };

  if (isVerifying) {
    const verificationTitle = attempt.current_step === "verify_phone" 
      ? "Verify Your Phone Number" 
      : "Verify Your Email";
    const verificationMessage = attempt.current_step === "verify_phone"
      ? "Enter the 6-digit code sent to your phone"
      : "Enter the 6-digit code sent to your email";
    const resendStrategy = attempt.current_step === "verify_phone" ? "phone_otp" : "email_otp";

    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />
          
          <Header>
            <Title>{verificationTitle}</Title>
            <Message>{verificationMessage}</Message>
          </Header>

          <Form onSubmit={(e) => e.preventDefault()} noValidate>
            <OTPInput
              onComplete={handleVerificationComplete}
              onResend={async () => {
                if (handlePrepareVerification) {
                  await handlePrepareVerification(resendStrategy);
                }
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
              <Link onClick={() => setShowVerification(false)} style={{ cursor: "pointer" }}>
                Back to profile completion
              </Link>
            </div>
            <div style={{ marginTop: "var(--space-sm)" }}>
              Having trouble?{" "}
              <Link>
                <NavigationLink to={deployment?.ui_settings.support_page_url || "#"}>
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
          <Message>{message}</Message>
        </Header>

        <Form onSubmit={handleSubmit} noValidate>
          {missingFields.includes("first_name") && authSettings?.first_name?.enabled && (
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
              {errors.first_name && <ErrorMessage>{errors.first_name}</ErrorMessage>}
            </FormGroup>
          )}

          {missingFields.includes("last_name") && authSettings?.last_name?.enabled && (
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
              {errors.last_name && <ErrorMessage>{errors.last_name}</ErrorMessage>}
            </FormGroup>
          )}

          {missingFields.includes("username") && authSettings?.username?.enabled && (
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
              {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
            </FormGroup>
          )}

          {missingFields.includes("phone_number") && authSettings?.phone_number?.enabled && (
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
              {errors.phone_number && <ErrorMessage>{errors.phone_number}</ErrorMessage>}
            </FormGroup>
          )}

          {displayError && (
            <ErrorMessage style={{ marginBottom: "var(--space-md)" }}>
              {displayError.message}
            </ErrorMessage>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Completing..." : "Complete Profile"}
          </Button>
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
              <NavigationLink to={deployment?.ui_settings.support_page_url || "#"}>
                Get help
              </NavigationLink>
            </Link>
          </div>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}