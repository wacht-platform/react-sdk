"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Check, CircleNotch } from "@phosphor-icons/react";
import { DefaultStylesProvider } from "../utility/root";
import { Input } from "../utility/input";
import { Button } from "../utility/button";
import { useDeployment } from "@/hooks/use-deployment";
import { useWaitlist, type WaitlistParams } from "@/hooks/use-waitlist";
import { AuthFormImage } from "./auth-image";
import { standaloneAuthShell } from "./auth-shell";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const ButtonSpinner = styled(CircleNotch)`
    animation: ${spin} 1s linear infinite;
`;

const Container = styled.div`
  ${standaloneAuthShell}
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-8u);
`;

const Title = styled.h1`
  font-size: var(--font-size-xl);
  font-weight: 400;
  color: var(--color-card-foreground);
  margin-bottom: var(--space-2u);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-size-md);
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-6u);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2u);
`;

const NameFields = styled.div<{ $isBothEnabled: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$isBothEnabled ? "1fr 1fr" : "1fr"};
  gap: var(--space-6u);
`;

const Label = styled.label`
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--color-card-foreground);
  text-align: left;
`;

const RequiredAsterisk = styled.span`
  color: var(--color-error);
  margin-left: var(--space-1u);
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1u);
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6u);
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: var(--size-24u);
  height: var(--size-24u);
  background: var(--color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-foreground-inverse);
`;

const SuccessTitle = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: 400;
  color: var(--color-card-foreground);
  margin: 0;
`;

const SuccessMessage = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-secondary-text);
  margin: 0;
  line-height: 1.5;
`;

const Footer = styled.div`
  margin-top: var(--space-8u);
  padding-top: var(--space-6u);
  border-top: var(--border-width-thin) solid var(--color-border);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-secondary-text);
`;

const FooterText = styled.p`
  margin: 0;
`;

const Link = styled.a`
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
`;

export function WaitlistForm() {
  const { deployment } = useDeployment();
  const { loading, joinWaitlist } = useWaitlist();
  const [formData, setFormData] = useState<WaitlistParams>({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getErrorMessage = (_field?: string): string | undefined => {
    if (!error) return undefined;
    return error.message;
  };

  const authSettings = deployment?.auth_settings;
  const isBothNamesEnabled = Boolean(
    authSettings?.first_name?.enabled && authSettings?.last_name?.enabled
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authSettings) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await joinWaitlist(formData);
      if (result.data) {
        setIsSubmitted(true);
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <DefaultStylesProvider>
        <Container>
          <SuccessContainer>
            <SuccessIcon>
              <Check size={32} />
            </SuccessIcon>
            <SuccessTitle>You're on the waitlist!</SuccessTitle>
            <SuccessMessage>
              Thanks for your interest! We'll notify you at {formData.email}{" "}
              when we're ready for you to join.
            </SuccessMessage>
          </SuccessContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />

        <Header>
          <Title>Join the waitlist</Title>
          <Subtitle>Be the first to know when we launch!</Subtitle>
        </Header>

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
                      required={authSettings?.first_name?.required}
                      minLength={2}
                      maxLength={50}
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="First name"
                      aria-invalid={!!getErrorMessage("first_name")}
                    />
                    {getErrorMessage("first_name") && (
                      <ErrorMessage>{getErrorMessage("first_name")}</ErrorMessage>
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
                      required={authSettings?.last_name?.required}
                      minLength={2}
                      maxLength={50}
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      aria-invalid={!!getErrorMessage("last_name")}
                    />
                    {getErrorMessage("last_name") && (
                      <ErrorMessage>{getErrorMessage("last_name")}</ErrorMessage>
                    )}
                  </FormGroup>
                )}
              </NameFields>
            )}

          <FormGroup>
            <Label htmlFor="email">
              Email address
              {authSettings?.email_address?.required && (
                <RequiredAsterisk>*</RequiredAsterisk>
              )}
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              required={authSettings?.email_address?.required}
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              aria-invalid={!!getErrorMessage("email")}
            />
            {getErrorMessage("email") && (
              <ErrorMessage>{getErrorMessage("email")}</ErrorMessage>
            )}
          </FormGroup>

          {getErrorMessage() && (
            <ErrorMessage>{getErrorMessage()}</ErrorMessage>
          )}

          <Button type="submit" $primary $fullWidth disabled={isSubmitting || loading}>
            {isSubmitting || loading ? <ButtonSpinner size={16} /> : "Join waitlist"}
          </Button>
        </Form>

        <Footer>
          <FooterText>
            Need assistance? <Link href="/contact">Get help</Link>
          </FooterText>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
}
