import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { LogOut, Settings, Plus } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useSession, useDeployment } from "@/hooks";
import { ManageAccountDialog } from "./manage-account-dialog";
import { useDialog } from "../utility/use-dialog";

const Container = styled.div`
  position: relative;
`;

const AccountButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px;
  border-radius: 30px;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--color-input-background);
  }
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-input-background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-secondary-text);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
`;

const StatusIndicator = styled.span<{ $status: "available" | "busy" | "away" }>`
	position: absolute;
	bottom: 0;
	right: 0;
	height: 8px;
	width: 8px;
	border-radius: 50%;
	background: ${(props) => {
    switch (props.$status) {
      case "available":
        return "var(--color-success)";
      case "busy":
        return "var(--color-warning)";
      case "away":
        return "var(--color-error)";
      default:
        return "var(--color-success)";
    }
  }}
	border: 1px solid var(--color-background);
`;

const AccountName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
`;

const AccountEmail = styled.span`
  font-size: 12px;
  color: var(--color-secondary-text);
`;

// Dropdown styled components
const DropdownContainer = styled.div<{
  $position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}>`
  position: absolute;
  ${(props) => {
    switch (props.$position) {
      case "bottom-right":
        return `
					top: calc(100% + 8px);
					left: 8px;
				`;
      case "bottom-left":
        return `
					top: calc(100% + 8px);
					right: 8px;
				`;
      case "top-right":
        return `
					bottom: calc(100% + 8px);
					left: 8px;
				`;
      case "top-left":
        return `
					bottom: calc(100% + 8px);
					right: 8px;
				`;
      default:
        return `
					top: calc(100% + 8px);
					left: 8px;
				`;
    }
  }}
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  box-shadow: 0 4px 24px var(--color-shadow);
  z-index: 50;
  overflow: hidden;
  min-width: 380px;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
`;

const AccountSection = styled.div<{
  $isClickable?: boolean;
}>`
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$isClickable ? "var(--color-input-background)" : "transparent"};
  }
`;

const AccountHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AccountDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LargerAvatar = styled(Avatar)`
  width: 40px;
  height: 40px;
`;

const ActionRow = styled.div`
  display: flex;
  margin-top: 12px;
  gap: 8px;
`;

const ActionLink = styled.button<{ $destructive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--color-input-background);
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px;
  font-size: 12px;
  color: ${(props) =>
    props.$destructive ? "var(--color-error)" : "var(--color-secondary-text)"};
  cursor: pointer;
  text-align: center;
  flex: 1;

  &:hover {
    background: ${(props) =>
      props.$destructive
        ? "var(--color-error-background)"
        : "var(--color-input-background)"};
    color: ${(props) =>
      props.$destructive ? "var(--color-error)" : "var(--color-foreground)"};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FooterSection = styled.div`
  background: var(--color-input-background);
  padding: 12px;
`;

const FooterButton = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 8px;
  font-size: 14px;
  color: var(--color-secondary-text);
  cursor: pointer;
  text-align: left;

  &:hover {
    color: var(--color-foreground);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

interface UserButtonProps {
  showName?: boolean;
}

export const UserButton: React.FC<UserButtonProps> = ({ showName = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<
    "bottom-right" | "bottom-left" | "top-right" | "top-left"
  >("bottom-right");
  const manageAccountDialog = useDialog(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { session, signOut, switchSignIn, addNewAccount, refetch } =
    useSession();
  const { deployment } = useDeployment();

  const selectedAccount = session?.active_signin?.user;
  const isMultiSessionEnabled =
    deployment?.auth_settings?.multi_session_support?.enabled ?? false;
  const hasMultipleAccounts = (session?.signins?.length ?? 0) > 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      setTimeout(() => {
        if (!containerRef.current || !dropdownRef.current) return;

        const buttonRect = containerRef.current.getBoundingClientRect();
        const dropdownWidth = dropdownRef.current.offsetWidth || 300;
        const dropdownHeight = dropdownRef.current.offsetHeight || 300;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const spaceRight = windowWidth - buttonRect.right;
        const spaceLeft = buttonRect.left;
        const spaceBottom = windowHeight - buttonRect.bottom;
        const spaceTop = buttonRect.top;

        if (spaceBottom >= dropdownHeight && spaceRight >= dropdownWidth) {
          setDropdownPosition("bottom-right");
        } else if (
          spaceBottom >= dropdownHeight &&
          spaceLeft >= dropdownWidth
        ) {
          setDropdownPosition("bottom-left");
        } else if (spaceTop >= dropdownHeight && spaceRight >= dropdownWidth) {
          setDropdownPosition("top-right");
        } else if (spaceTop >= dropdownHeight && spaceLeft >= dropdownWidth) {
          setDropdownPosition("top-left");
        } else {
          const positions = [
            {
              position: "bottom-right",
              space: Math.min(spaceBottom, spaceRight),
            },
            {
              position: "bottom-left",
              space: Math.min(spaceBottom, spaceLeft),
            },
            { position: "top-right", space: Math.min(spaceTop, spaceRight) },
            { position: "top-left", space: Math.min(spaceTop, spaceLeft) },
          ];

          positions.sort((a, b) => b.space - a.space);

          setDropdownPosition(
            positions[0].position as
              | "bottom-right"
              | "bottom-left"
              | "top-right"
              | "top-left"
          );
        }
      }, 0);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleSignOut = async (signInId: string) => {
    try {
      await signOut(signInId);
      await refetch();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
      // You could add a toast notification here for better UX
    }
  };

  const handleSignOutAll = async () => {
    try {
      await signOut();
      await refetch();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to sign out all accounts:", error);
      // You could add a toast notification here for better UX
    }
  };

  const handleSwitchUser = async (signInId: string) => {
    try {
      await switchSignIn(signInId);
      await refetch();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch user:", error);
      // You could add a toast notification here for better UX
    }
  };

  const handleOpenManageAccount = () => {
    manageAccountDialog.open();
    setIsOpen(false);
  };

  return (
    <DefaultStylesProvider>
      <Container ref={containerRef}>
        <AccountButton onClick={toggleDropdown}>
          <AvatarContainer>
            <Avatar>
              {selectedAccount?.has_profile_picture ? (
                <img
                  src={selectedAccount.profile_picture_url}
                  alt={selectedAccount.first_name}
                />
              ) : (
                getInitials(
                  `${selectedAccount?.first_name || ""} ${
                    selectedAccount?.last_name || ""
                  }`
                )
              )}
            </Avatar>
            <StatusIndicator
              $status={selectedAccount?.availability || "away"}
            />
          </AvatarContainer>
          {showName && (
            <UserName>
              {`${selectedAccount?.first_name || ""} ${
                selectedAccount?.last_name || ""
              }`}
            </UserName>
          )}
        </AccountButton>

        {isOpen && (
          <DropdownContainer ref={dropdownRef} $position={dropdownPosition}>
            <div>
              {isMultiSessionEnabled
                ? session?.signins?.map(({ user: account, id: signInId }) => {
                    const isActive = account.id === selectedAccount?.id;
                    const isClickable = !isActive;

                    return (
                      <AccountSection
                        key={account.id}
                        $isClickable={isClickable}
                        onClick={
                          isClickable
                            ? () => handleSwitchUser(signInId)
                            : undefined
                        }
                      >
                        <AccountHeader>
                          <AvatarContainer>
                            <LargerAvatar>
                              {account.has_profile_picture ? (
                                <img
                                  src={account.profile_picture_url}
                                  alt={account.first_name}
                                />
                              ) : (
                                getInitials(
                                  `${account?.first_name || ""} ${
                                    account?.last_name || ""
                                  }`
                                )
                              )}
                            </LargerAvatar>
                            {isActive ? (
                              <StatusIndicator $status={account.availability} />
                            ) : (
                              <StatusIndicator $status="away" />
                            )}
                          </AvatarContainer>
                          <AccountDetails>
                            <NameRow>
                              <AccountName>
                                {`${account?.first_name || ""} ${
                                  account?.last_name || ""
                                }`}
                              </AccountName>
                            </NameRow>
                            <AccountEmail>
                              {account.user_email_addresses[0].email}
                            </AccountEmail>
                          </AccountDetails>
                        </AccountHeader>

                        {isActive && (
                          <ActionRow>
                            <ActionLink onClick={handleOpenManageAccount}>
                              <Settings />
                              Manage account
                            </ActionLink>
                            <ActionLink
                              $destructive
                              onClick={() => handleSignOut(signInId)}
                            >
                              <LogOut />
                              Sign out
                            </ActionLink>
                          </ActionRow>
                        )}
                      </AccountSection>
                    );
                  })
                : selectedAccount && (
                    <AccountSection $isClickable={false}>
                      <AccountHeader>
                        <AvatarContainer>
                          <LargerAvatar>
                            {selectedAccount.has_profile_picture ? (
                              <img
                                src={selectedAccount.profile_picture_url}
                                alt={selectedAccount.first_name}
                              />
                            ) : (
                              getInitials(
                                `${selectedAccount?.first_name || ""} ${
                                  selectedAccount?.last_name || ""
                                }`
                              )
                            )}
                          </LargerAvatar>
                          <StatusIndicator
                            $status={selectedAccount.availability}
                          />
                        </AvatarContainer>
                        <AccountDetails>
                          <NameRow>
                            <AccountName>
                              {`${selectedAccount?.first_name || ""} ${
                                selectedAccount?.last_name || ""
                              }`}
                            </AccountName>
                          </NameRow>
                          <AccountEmail>
                            {selectedAccount.user_email_addresses[0].email}
                          </AccountEmail>
                        </AccountDetails>
                      </AccountHeader>

                      <ActionRow>
                        <ActionLink onClick={handleOpenManageAccount}>
                          <Settings />
                          Manage account
                        </ActionLink>
                        <ActionLink
                          $destructive
                          onClick={() =>
                            handleSignOut(session?.active_signin?.id || "")
                          }
                        >
                          <LogOut />
                          Sign out
                        </ActionLink>
                      </ActionRow>
                    </AccountSection>
                  )}

              {isMultiSessionEnabled && (
                <>
                  <FooterSection
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <FooterButton onClick={addNewAccount}>
                      <Plus />
                      Add new account
                    </FooterButton>
                  </FooterSection>

                  {hasMultipleAccounts && (
                    <FooterSection>
                      <FooterButton onClick={handleSignOutAll}>
                        <LogOut />
                        Sign out of all accounts
                      </FooterButton>
                    </FooterSection>
                  )}
                </>
              )}
            </div>
          </DropdownContainer>
        )}

        <ManageAccountDialog
          isOpen={manageAccountDialog.isOpen}
          onClose={manageAccountDialog.close}
        />
      </Container>
    </DefaultStylesProvider>
  );
};
