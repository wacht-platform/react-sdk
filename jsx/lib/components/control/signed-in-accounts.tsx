import { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Plus, CheckCircle } from "lucide-react";
import { useSession, useDeployment, useNavigation } from "@/hooks";
import { DefaultStylesProvider } from "../utility/root";
import { AuthFormImage } from "../auth/auth-image";
import { NavigationLink } from "../utility/navigation";

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const Container = styled.div`
  width: 400px;
  max-width: 100vw;
  padding: var(--space-3xl) var(--space-sm);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
  margin: 0 auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const AccountsWrapper = styled.div`
  margin-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-xl);
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

const AccountItem = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
  border-bottom: 1px solid var(--color-border);

  &:last-of-type {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-background-hover);
  }

  ${(props) =>
    props.$isActive &&
    `
    background: var(--color-background-hover);
    cursor: default;

    &:hover {
      background: var(--color-background-hover);
    }
  `}
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-input-background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-secondary-text);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AccountDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const AccountName = styled.div`
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AccountEmail = styled.div`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-success);
  font-size: var(--font-2xs);
  font-weight: 500;
`;

const AddAccountButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-lg);
  background: transparent;
  border: none;
  border-top: 1px solid var(--color-border);
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 400;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--color-background-hover);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SkeletonItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const SkeletonAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--color-background-hover) 0%,
    var(--color-input-background) 50%,
    var(--color-background-hover) 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
`;

const SkeletonTextWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const SkeletonText = styled.div<{ $width?: string }>`
  height: ${(props) => (props.$width === "small" ? "12px" : "14px")};
  width: ${(props) => (props.$width === "small" ? "60%" : "40%")};
  border-radius: var(--radius-xs);
  background: linear-gradient(
    90deg,
    var(--color-background-hover) 0%,
    var(--color-input-background) 50%,
    var(--color-background-hover) 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
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

interface SignedInAccountsProps {
  onAccountSelect?: (signInId: string) => void;
  showAddAccount?: boolean;
}

export const SignedInAccounts: React.FC<SignedInAccountsProps> = ({
  onAccountSelect,
  showAddAccount = true,
}) => {
  const { session, loading, switchSignIn, addNewAccount } = useSession();
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();

  const activeSignIn = session?.active_signin;
  const signins = session?.signins || [];

  useEffect(() => {
    if (loading) return;

    if (!signins.length) {
      const signInUrl = deployment?.ui_settings?.sign_in_page_url;
      if (signInUrl) navigate(signInUrl);
    }
  }, [loading, signins, deployment, navigate]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAccountClick = async (signInId: string) => {
    if (signInId === activeSignIn?.id) return;

    try {
      await switchSignIn(signInId);
      if (onAccountSelect) {
        onAccountSelect(signInId);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to switch account:", error);
    }
  };

  const handleAddAccount = () => {
    if (addNewAccount) {
      addNewAccount();
    } else {
      const signInUrl = deployment?.ui_settings?.sign_in_page_url;
      if (signInUrl) navigate(signInUrl);
    }
  };

  if (loading) {
    return (
      <DefaultStylesProvider>
        <Container>
          <AuthFormImage />
          <Header>
            <Title>Choose an account</Title>
            <Subtitle>
              to continue to {deployment?.ui_settings?.app_name || "App"}
            </Subtitle>
          </Header>

          <AccountsWrapper>
            {/* Show 2-3 skeleton items */}
            {[1, 2].map((item) => (
              <SkeletonItem key={item}>
                <SkeletonAvatar />
                <SkeletonTextWrapper>
                  <SkeletonText />
                  <SkeletonText $width="small" />
                </SkeletonTextWrapper>
              </SkeletonItem>
            ))}
          </AccountsWrapper>
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (!signins.length) {
    return null;
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <AuthFormImage />
        <Header>
          <Title>Choose an account</Title>
          <Subtitle>
            to continue to {deployment?.ui_settings?.app_name || "Wacht"}
          </Subtitle>
        </Header>

        <AccountsWrapper>
          {signins.map(({ user: account, id: signInId }) => {
            const isActive = account.id === activeSignIn?.user?.id;
            const fullName =
              `${account.first_name || ""} ${account.last_name || ""}`.trim();

            return (
              <AccountItem
                key={signInId}
                $isActive={isActive}
                onClick={() => handleAccountClick(signInId)}
              >
                <Avatar>
                  {account.has_profile_picture ? (
                    <img src={account.profile_picture_url} alt={fullName} />
                  ) : (
                    getInitials(fullName || account.primary_email_address.email)
                  )}
                </Avatar>

                <AccountDetails>
                  <AccountName>{fullName || "User"}</AccountName>
                  <AccountEmail>
                    {account.primary_email_address.email || account.username}
                  </AccountEmail>
                </AccountDetails>

                {isActive && (
                  <ActiveIndicator>
                    <CheckCircle size={16} />
                    Active
                  </ActiveIndicator>
                )}
              </AccountItem>
            );
          })}

          {showAddAccount && (
            <AddAccountButton onClick={handleAddAccount}>
              <Plus />
              Add another account
            </AddAccountButton>
          )}
        </AccountsWrapper>

        <Footer>
          Don't have an account?{" "}
          <Link>
            <NavigationLink to={deployment!.ui_settings?.sign_up_page_url}>
              Sign up
            </NavigationLink>
          </Link>
        </Footer>
      </Container>
    </DefaultStylesProvider>
  );
};
