"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { ArrowLeft } from "lucide-react";
import { useDeployment } from "../../hooks/use-deployment";
import { Button, Input, FormGroup, Label, Form } from "../utility";
import { PhoneNumberInput } from "../utility/phone";
import { OTPInput } from "../utility/otp-input";

const Container = styled.div`
  max-width: 380px;
  width: 380px;
  padding: var(--space-3xl);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px var(--color-shadow);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-xs) 0;
`;

const Message = styled.p`
  font-size: var(--font-sm);
  color: var(--color-muted);
  margin: 0;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: var(--font-sm);
  cursor: pointer;
  margin-bottom: var(--space-md);

  &:hover {
    color: var(--color-foreground);
  }
`;

const ErrorMessage = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-error);
  margin: 0;
  margin-top: var(--space-2xs);
`;

interface SignInProfileCompletionProps {
  signinAttempt: any;
  onComplete: (data: {
    first_name?: string;
    last_name?: string;
    username?: string;
    phone_number?: string;
  }) => Promise<any>;
  onBack?: () => void;
  loading?: boolean;
  error?: Error | null;
}

export function SignInProfileCompletion({
  signinAttempt,
  onComplete,
  onBack,
  loading = false,
  error = null,
}: SignInProfileCompletionProps) {
  const { deployment } = useDeployment();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState<string | undefined>("US");
  const [showVerification, setShowVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const authSettings = deployment?.auth_settings;
  const missingFields = signinAttempt?.missing_fields || [];

  const isVerifying =
    signinAttempt?.current_step === "verify_phone" || showVerification;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (missingFields.includes("first_name") && !formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (missingFields.includes("last_name") && !formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (missingFields.includes("username") && !formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (
      missingFields.includes("phone_number") &&
      !formData.phone_number.trim()
    ) {
      newErrors.phone_number = "Phone number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSend: any = {};
    if (missingFields.includes("first_name") && formData.first_name) {
      dataToSend.first_name = formData.first_name;
    }
    if (missingFields.includes("last_name") && formData.last_name) {
      dataToSend.last_name = formData.last_name;
    }
    if (missingFields.includes("username") && formData.username) {
      dataToSend.username = formData.username;
    }
    if (missingFields.includes("phone_number") && formData.phone_number) {
      dataToSend.phone_number = formData.phone_number;
    }

    const result = await onComplete(dataToSend);

    if (result && typeof result === "object" && "signin_attempt" in result) {
      const attempt = (result as any).signin_attempt;
      if (attempt?.current_step === "verify_phone") {
        setShowVerification(true);
      }
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setErrors({ otp: "Verification code is required" });
      return;
    }
  };

  if (isVerifying) {
    return (
      <Container>
        {onBack && (
          <BackButton onClick={onBack}>
            <ArrowLeft size={16} />
            Back
          </BackButton>
        )}

        <Header>
          <Title>Verify Your Phone</Title>
          <Message>
            Please enter the verification code sent to {formData.phone_number}
          </Message>
        </Header>

        <Form onSubmit={handleVerification} noValidate>
          <OTPInput
            onComplete={async (code) => {
              setOtpCode(code);
            }}
            onResend={async () => {}}
            error={errors.otp}
            isSubmitting={loading}
          />

          {error && (
            <ErrorMessage style={{ marginBottom: "var(--space-md)" }}>
              {error.message}
            </ErrorMessage>
          )}

          <Button
            type="submit"
            disabled={loading || !otpCode}
            style={{ width: "100%" }}
          >
            {loading ? "Verifying..." : "Verify Phone"}
          </Button>
        </Form>
      </Container>
    );
  }

  return (
    <Container>
      {onBack && (
        <BackButton onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </BackButton>
      )}

      <Header>
        <Title>Complete Your Profile</Title>
        <Message>
          Please provide the following information to complete your sign in.
        </Message>
      </Header>

      <Form onSubmit={handleSubmit} noValidate>
        {missingFields.includes("first_name") &&
          authSettings?.first_name?.enabled && (
            <FormGroup>
              <Label htmlFor="first_name">
                First Name {authSettings.first_name.required && "*"}
              </Label>
              <Input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                aria-invalid={!!errors.first_name}
                disabled={loading}
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
                Last Name {authSettings.last_name.required && "*"}
              </Label>
              <Input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                aria-invalid={!!errors.last_name}
                disabled={loading}
              />
              {errors.last_name && (
                <ErrorMessage>{errors.last_name}</ErrorMessage>
              )}
            </FormGroup>
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
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                aria-invalid={!!errors.username}
                disabled={loading}
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
                Phone Number {authSettings.phone_number.required && "*"}
              </Label>
              <PhoneNumberInput
                value={formData.phone_number}
                onChange={handleInputChange}
                error={errors.phone_number}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
              />
              {errors.phone_number && (
                <ErrorMessage>{errors.phone_number}</ErrorMessage>
              )}
            </FormGroup>
          )}

        {error && (
          <ErrorMessage style={{ marginBottom: "var(--space-md)" }}>
            {error.message}
          </ErrorMessage>
        )}

        <Button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Completing..." : "Complete Profile"}
        </Button>
      </Form>
    </Container>
  );
}
