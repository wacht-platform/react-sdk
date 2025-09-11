"use client";

import { useState } from "react";
import styled from "styled-components";
import { Check } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { Input } from "../utility/input";
import { useDeployment } from "@/hooks/use-deployment";
import { useWaitlist, type WaitlistParams } from "@/hooks/use-waitlist";
import { AuthFormImage } from "./auth-image";

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

const NameFields = styled.div<{ $isBothEnabled: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$isBothEnabled ? "1fr 1fr" : "1fr"};
  gap: var(--space-md);
`;

const Label = styled.label`
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-foreground);
  text-align: left;
`;

const RequiredAsterisk = styled.span`
  color: var(--color-error);
  margin-left: var(--space-2xs);
`;

const Button = styled.button<{ $primary?: boolean }>`
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: ${(props) =>
    props.$primary ? "none" : "1px solid var(--color-input-border)"};
  border-radius: var(--radius-md);
  font-size: var(--font-xs);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  background: ${(props) =>
    props.$primary ? "var(--color-primary)" : "var(--color-background)"};
  color: ${(props) => (props.$primary ? "white" : "var(--color-foreground)")};
  margin-top: var(--space-sm);
  height: 36px;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$primary
        ? "var(--color-primary-hover)"
        : "var(--color-input-background)"};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: var(--font-2xs);
  margin-top: var(--space-2xs);
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 48px;
  height: 48px;
  background: var(--color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const SuccessTitle = styled.h2`
  font-size: var(--font-lg);
  color: var(--color-foreground);
  margin: 0;
`;

const SuccessMessage = styled.p`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  margin: 0;
  line-height: 1.5;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-lg);
`;

const FooterText = styled.p`
  font-size: var(--font-xs);
  color: var(--color-muted);
  margin: 0;
`;

const Link = styled.a`
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
`;

export function WaitlistForm() {
  const { deployment } = useDeployment();
  const { loading, error, joinWaitlist } = useWaitlist();
  const [formData, setFormData] = useState<WaitlistParams>({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = (field?: string): string | undefined => {
    if (!error?.errors) return undefined;

    if (field) {
      const fieldError = error.errors.find((err: any) =>
        err.code?.toLowerCase().includes(field.toLowerCase())
      );
      if (fieldError) return fieldError.message;
    } else return error?.errors[0]?.message;
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
    try {
      const result = await joinWaitlist(formData);
      if (result.data) {
        setIsSubmitted(true);
      }
    } catch (error) {
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

          <Button type="submit" $primary disabled={isSubmitting || loading}>
            {isSubmitting || loading ? "Joining waitlist..." : "Join waitlist"}
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
