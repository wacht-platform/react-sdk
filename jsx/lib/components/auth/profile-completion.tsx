"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { ArrowLeft } from "lucide-react";
import { useDeployment } from "../../hooks/use-deployment";
import { useProfileCompletion } from "../../hooks/use-profile-completion";
import { PhoneNumberInput } from "../utility/phone";
import { OTPInput } from "../utility/otp-input";
import { ProfileCompletionData, ProfileCompletionProps } from "../../types/profile";
import { hasIncompleteProfile, redirectToProfileCompletion } from "../../utils/profile-completion";
import { useSession } from "@/hooks";

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: var(--space-lg);
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
  overflow: hidden;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: var(--space-xl);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  margin-bottom: var(--space-md);

  &:hover {
    color: var(--color-text);
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-sm) 0;
`;

const Message = styled.p`
  color: var(--color-muted);
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
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
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-input-background);
  color: var(--color-text);
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &[aria-invalid="true"] {
    border-color: var(--color-error);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 12px;
  margin-top: var(--space-xs);
`;



export function ProfileCompletion({
  redirectUri,
  onComplete,
  onError,
  onBack,
  autoRedirect = false,
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
  const { session } = useSession()

  const [formData, setFormData] = useState<ProfileCompletionData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState<string | undefined>("US");
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use hook's error if no local error
  const displayError = error || hookError;
  const isLoading = loading || hookLoading;

  // Auto-redirect logic
  useEffect(() => {
    if (autoRedirect && attempt && hasIncompleteProfile(session)) {
      redirectToProfileCompletion(redirectUri);
    }
  }, [autoRedirect, attempt, redirectUri]);

  // Handle completion with success/error callbacks
  const handleComplete = async (data: ProfileCompletionData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await hookHandleComplete(data);

      if (result.success) {
        if (onComplete) {
          onComplete(result.data.session || result.data);
        } else if (redirectUri) {
          window.location.href = redirectUri;
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        // Still has remaining steps, check if verification is needed
        const attemptData = result.data.signin_attempt || result.data.signup_attempt;
        if (attemptData?.current_step === "verify_phone" || attemptData?.current_step === "verify_email") {
          setShowVerification(true);
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
        } else if (redirectUri) {
          window.location.href = redirectUri;
        } else {
          window.location.href = "/dashboard";
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (redirectUri) {
      window.location.href = redirectUri;
    } else {
      window.history.back();
    }
  };

  // Show loading while detecting attempt
  if (isLoading || (!attempt && !displayError)) {
    return (
      <PageContainer>
        <ContentWrapper>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px"
          }}>
            <div>Loading...</div>
          </div>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // Show error if no attempt found
  if (displayError && !attempt) {
    return (
      <PageContainer>
        <ContentWrapper>
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            gap: "16px",
            padding: "var(--space-lg)"
          }}>
            <div style={{ color: "var(--color-error)" }}>
              {displayError?.message}
            </div>
            <button onClick={handleBack}>
              Go Back
            </button>
          </div>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (!attempt) {
    return null;
  }

  const missingFields = attempt.missing_fields || [];
  const title = attemptType === "signin"
    ? "Complete Your Profile"
    : "Complete Your Account Setup";
  const message = attemptType === "signin"
    ? "Please provide the following information to complete your sign in."
    : "Please provide the following information to complete your account setup.";

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const dataToSend: ProfileCompletionData = {};
    missingFields.forEach((field: string) => {
      const fieldValue = formData[field as keyof ProfileCompletionData];
      if (fieldValue) {
        dataToSend[field as keyof ProfileCompletionData] = fieldValue;
      }
    });

    const result = await handleComplete(dataToSend);

    if (result && typeof result === "object") {
      const resultData = result as any;
      const attemptData = resultData.signin_attempt || resultData.signup_attempt;
      if (attemptData?.current_step === "verify_phone" || attemptData?.current_step === "verify_email") {
        setShowVerification(true);
      }
    }
  };

  if (isVerifying) {
    const isEmailVerification = attempt?.current_step === "verify_email";
    const verificationTitle = isEmailVerification ? "Verify Your Email" : "Verify Your Phone";
    const verificationMessage = isEmailVerification
      ? "Please enter the verification code sent to your email address."
      : "Please enter the verification code sent to your phone number.";
    const resendStrategy = isEmailVerification ? "email_otp" : "phone_otp";

    return (
      <PageContainer>
        <ContentWrapper>
          <Container>
            {onBack && (
              <BackButton onClick={() => setShowVerification(false)}>
                <ArrowLeft size={16} />
                Back
              </BackButton>
            )}

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
          </Container>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <Container>
          {onBack && (
            <BackButton onClick={handleBack}>
              <ArrowLeft size={16} />
              Back
            </BackButton>
          )}

          <Header>
            <Title>{title}</Title>
            <Message>{message}</Message>
          </Header>

          <Form onSubmit={handleSubmit} noValidate>
            {missingFields.includes("first_name") && authSettings?.first_name?.enabled && (
              <FormGroup>
                <Label htmlFor="first_name">
                  First Name {authSettings.first_name.required && "*"}
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
                />
                {errors.first_name && <ErrorMessage>{errors.first_name}</ErrorMessage>}
              </FormGroup>
            )}

            {missingFields.includes("last_name") && authSettings?.last_name?.enabled && (
              <FormGroup>
                <Label htmlFor="last_name">
                  Last Name {authSettings.last_name.required && "*"}
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
                  placeholder="Enter your username"
                  aria-invalid={!!errors.username}
                  disabled={isLoading}
                />
                {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
              </FormGroup>
            )}

            {missingFields.includes("phone_number") && authSettings?.phone_number?.enabled && (
              <FormGroup>
                <Label htmlFor="phone_number">
                  Phone Number {authSettings.phone_number.required && "*"}
                </Label>
                <PhoneNumberInput
                  value={formData.phone_number || ""}
                  onChange={handleInputChange}
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

            <Button type="submit" disabled={isLoading} style={{ width: "100%" }}>
              {isLoading ? "Completing..." : "Complete Profile"}
            </Button>
          </Form>
        </Container>
      </ContentWrapper>
    </PageContainer>
  );
}
