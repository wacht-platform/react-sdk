import { useEffect, useRef } from "react";
import styled from "styled-components";
import { useInvitation } from "@/hooks/use-invitation";
import { useNavigation } from "@/hooks/use-navigation";
import { useDeployment } from "@/hooks/use-deployment";
import { DefaultStylesProvider } from "../utility/root";
import { Button } from "../utility";

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
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;
`;

const StatusContainer = styled.div`
  padding-top: var(--space-xl);
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border-radius: 50%;
  background: var(--color-success-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg) auto;
  color: var(--color-success);
  font-size: var(--font-xl);
`;

const ErrorIcon = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border-radius: 50%;
  background: var(--color-error-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg) auto;
  color: var(--color-error);
  font-size: var(--font-xl);
`;

const InfoIcon = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border-radius: 50%;
  background: var(--color-info-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-lg) auto;
  color: var(--color-info);
  font-size: var(--font-xl);
`;

const LoadingSpinner = styled.div`
  width: calc(var(--space-3xl) * 2);
  height: calc(var(--space-3xl) * 2);
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-lg) auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Message = styled.p`
  font-size: var(--font-sm);
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
`;

const SubMessage = styled.p`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  margin-bottom: var(--space-lg);
`;

const EmailHighlight = styled.span`
  color: var(--color-primary);
  font-weight: 400;
`;

const Footer = styled.div`
  margin-top: var(--space-xl);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 400;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

interface AcceptInviteProps {
  token?: string;
  onSuccess?: (organizationId?: string, workspaceId?: string) => void;
  onError?: (error: string) => void;
}

export function AcceptInvite({
  token: propToken,
  onSuccess,
  onError,
}: AcceptInviteProps) {
  const { acceptInvitation, invitationData, loading, error } = useInvitation();
  const { navigate } = useNavigation();
  const { deployment } = useDeployment();
  const hasAttempted = useRef(false);

  // Get token and other params from URL
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      token: propToken || params.get("invite_token") || params.get("token"),
      redirectUri: params.get("redirect_uri") || deployment?.ui_settings?.after_signin_redirect_url || "/",
    };
  };

  // Handle the invitation acceptance attempt
  useEffect(() => {
    if (hasAttempted.current) return;

    const { token } = getUrlParams();
    if (!token) return;

    hasAttempted.current = true;
    acceptInvitation(token);
  }, [acceptInvitation]);

  // Call success callback if needed
  useEffect(() => {
    if (!invitationData) return;

    // Successful acceptance
    if (invitationData.organization && !invitationData.requires_signin && onSuccess) {
      onSuccess(invitationData.organization.id, invitationData.workspace?.id);
    }

    // Handle other errors
    if (invitationData.error_code && onError) {
      onError(invitationData.message || "Failed to accept invitation");
    }
  }, [invitationData, onSuccess, onError]);

  const handleContinue = () => {
    const { redirectUri } = getUrlParams();
    navigate(redirectUri);
  };

  const handleGoToAuth = () => {
    const { token } = getUrlParams();
    const signInUrl = deployment?.ui_settings?.sign_in_page_url || "/sign-in";
    const signUpUrl = deployment?.ui_settings?.sign_up_page_url || "/sign-up";
    const params = new URLSearchParams();

    if (token) params.set("invite_token", token);
    if (invitationData?.invited_email) params.set("invited_email", invitationData.invited_email);

    const invitePageUrl = window.location.pathname;
    const inviteRedirectUri = `${invitePageUrl}?token=${token}`;
    params.set("redirect_uri", inviteRedirectUri);

    // Add message for display
    if (invitationData?.message) {
      params.set("message", invitationData.message);
    }

    // Redirect based on error code
    const isSignup = invitationData?.error_code === "INVITATION_REQUIRES_SIGNUP";
    navigate(`${isSignup ? signUpUrl : signInUrl}?${params.toString()}`);
  };

  const handleRetry = () => {
    const { token } = getUrlParams();
    if (token) {
      hasAttempted.current = false;
      acceptInvitation(token);
    }
  };

  const { token } = getUrlParams();

  // No token provided
  if (!token && !loading) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Invalid Invitation</Title>
            <Subtitle>No invitation token found</Subtitle>
          </Header>
          <StatusContainer>
            <ErrorIcon>✗</ErrorIcon>
            <Message>Missing Invitation Token</Message>
            <SubMessage>
              The invitation link appears to be invalid or incomplete.
            </SubMessage>
            <Button onClick={() => navigate("/")} style={{ marginTop: "var(--space-lg)" }}>
              Go to Home
            </Button>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Loading state
  if (loading) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Processing Invitation</Title>
            <Subtitle>Please wait while we verify your invitation</Subtitle>
          </Header>
          <StatusContainer>
            <LoadingSpinner />
            <Message>Verifying invitation...</Message>
            <SubMessage>This will only take a moment.</SubMessage>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Success state
  if (invitationData?.organization && !invitationData.requires_signin) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Invitation Accepted!</Title>
            <Subtitle>You've successfully joined the organization</Subtitle>
          </Header>
          <StatusContainer>
            <SuccessIcon>✓</SuccessIcon>
            <Message>Welcome to {invitationData.organization.name}!</Message>
            {invitationData.workspace && (
              <SubMessage>You've been added to the {invitationData.workspace.name} workspace.</SubMessage>
            )}
            <Button onClick={handleContinue} style={{ marginTop: "var(--space-lg)" }}>
              Continue to Application
            </Button>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Already a member
  if (invitationData?.already_member) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Already a Member</Title>
            <Subtitle>You're already part of this organization</Subtitle>
          </Header>
          <StatusContainer>
            <InfoIcon>ℹ</InfoIcon>
            <Message>You're already a member of {invitationData.organization?.name || "this organization"}</Message>
            <SubMessage>No action needed - you already have access.</SubMessage>
            <Button onClick={handleContinue} style={{ marginTop: "var(--space-lg)" }}>
              Continue to Application
            </Button>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Needs to sign in or sign up
  if (invitationData?.requires_signin) {
    const isSignup = invitationData.error_code === "INVITATION_REQUIRES_SIGNUP";

    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>{isSignup ? "Sign Up Required" : "Sign In Required"}</Title>
            <Subtitle>To accept this invitation</Subtitle>
          </Header>
          <StatusContainer>
            <InfoIcon>ℹ</InfoIcon>
            <Message>
              This invitation is for <EmailHighlight>{invitationData.invited_email}</EmailHighlight>
            </Message>
            <SubMessage>
              {isSignup
                ? "You need to create an account with this email address to accept the invitation."
                : invitationData.error_code === "INVITATION_EMAIL_MISMATCH"
                  ? "You're currently signed in with a different account. Please sign in with the invited email."
                  : "Please sign in to accept this invitation."}
            </SubMessage>
            <Button onClick={handleGoToAuth} style={{ marginTop: "var(--space-lg)" }}>
              {isSignup ? "Sign Up to Accept" : "Sign In to Accept"}
            </Button>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Expired invitation
  if (invitationData?.error_code === "INVITATION_EXPIRED") {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Invitation Expired</Title>
            <Subtitle>This invitation is no longer valid</Subtitle>
          </Header>
          <StatusContainer>
            <ErrorIcon>⏱</ErrorIcon>
            <Message>
              Invitation for <EmailHighlight>{invitationData.invited_email}</EmailHighlight> has expired
            </Message>
            <SubMessage>
              Invitations are valid for 10 days. Please request a new invitation from your organization administrator.
            </SubMessage>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Generic error state
  if (error || invitationData?.error_code) {
    return (
      <DefaultStylesProvider>
        <Container>
          <Header>
            <Title>Invitation Error</Title>
            <Subtitle>Unable to process invitation</Subtitle>
          </Header>
          <StatusContainer>
            <ErrorIcon>✗</ErrorIcon>
            <Message>Something went wrong</Message>
            <SubMessage>{invitationData?.message || error || "Failed to accept invitation"}</SubMessage>
            <Button onClick={handleRetry} style={{ marginTop: "var(--space-lg)" }}>
              Try Again
            </Button>
            <Footer>
              <div style={{ marginTop: "var(--space-md)" }}>
                Having trouble?{" "}
                <Link onClick={handleGoToAuth}>
                  Sign in manually
                </Link>
              </div>
            </Footer>
          </StatusContainer>
        </Container>
      </DefaultStylesProvider>
    );
  }

  // Default loading state (shouldn't normally reach here)
  return null;
}