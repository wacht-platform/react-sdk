import React, { useState, useRef, useEffect, JSX } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { LogOut, Settings, Plus } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useSession, useDeployment, useNavigation } from "@/hooks";
import { ManageAccountDialog } from "./manage-account-dialog";
import { useDialog } from "../utility/use-dialog";
import { usePopoverPosition } from "@/hooks/use-popover-position";

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
  border-radius: 30px;
  transition: background-color 0.2s ease;
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-secondary-text);
  border: 1px solid var(--color-border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
`;

const AccountName = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
`;

const AccountEmail = styled.span`
  font-size: 12px;
  color: var(--color-secondary-text);
`;

// Dropdown styled components
const DropdownContainer = styled.div<{
  $position?: { top?: number; bottom?: number; left?: number; right?: number };
  $isOpen: boolean;
  $maxHeight?: number;
}>`
  position: fixed;
  ${(props) =>
    props.$position?.top !== undefined ? `top: ${props.$position.top}px;` : ""}
  ${(props) =>
    props.$position?.bottom !== undefined
      ? `bottom: ${props.$position.bottom}px;`
      : ""}
  ${(props) =>
    props.$position?.left !== undefined
      ? `left: ${props.$position.left}px;`
      : ""}
  ${(props) =>
    props.$position?.right !== undefined
      ? `right: ${props.$position.right}px;`
      : ""}
  visibility: ${(props) =>
    props.$position && props.$isOpen ? "visible" : "hidden"};
  opacity: ${(props) => (props.$isOpen && props.$position ? 1 : 0)};
  transition:
    opacity 0.15s ease,
    visibility 0s linear ${(props) => (props.$isOpen ? "0s" : "0.15s")};
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 99999;
  overflow: hidden;
  min-width: 380px;
  max-width: calc(100vw - 24px);
  max-height: ${(props) =>
    props.$maxHeight ? `${props.$maxHeight}px` : "calc(100vh - 48px)"};
  overflow-y: auto;
`;

const AccountSection = styled.div<{
  $isClickable?: boolean;
}>`
  padding: 12px;
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${(props) =>
    props.$isClickable ? "var(--color-background-hover)" : "transparent"};
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
  background: var(--color-background-hover);
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
  background: var(--color-background-hover);
  padding: 8px 12px;
`;

const FooterButton = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--color-secondary-text);
  cursor: pointer;
  text-align: left;

  &:hover {
    color: var(--color-foreground);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

interface UserButtonProps {
  showName?: boolean;
}

export const UserButton: React.FC<UserButtonProps> = ({
  showName = true,
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dropdownPosition = usePopoverPosition({
    triggerRef: buttonRef,
    isOpen,
    minWidth: 380,
  });
  const manageAccountDialog = useDialog(false);
  const { session, signOut, switchSignIn, refetch } =
    useSession();
  const { navigateToSignIn } = useNavigation();
  const { deployment } = useDeployment();

  const selectedAccount = session?.active_signin?.user;
  const isMultiSessionEnabled =
    deployment?.auth_settings?.multi_session_support?.enabled ?? false;
  const hasMultipleAccounts = (session?.signins?.length ?? 0) > 1;

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        if (buttonRef.current?.contains(target)) {
          return;
        }

        if (dropdownRef.current?.contains(target)) {
          return;
        }

        setIsOpen(false);
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, 50);

    return () => {
      clearTimeout(timer);
    };
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
    } catch (error) { }
  };

  const handleSignOutAll = async () => {
    try {
      await signOut();
      await refetch();
      setIsOpen(false);
    } catch (error) { }
  };

  const handleSwitchUser = async (signInId: string) => {
    try {
      await switchSignIn(signInId);
      await refetch();
      setIsOpen(false);
    } catch (error) { }
  };

  const handleOpenManageAccount = () => {
    manageAccountDialog.open();
    setIsOpen(false);
  };

  return (
    <DefaultStylesProvider>
      <Container>
        <AccountButton ref={buttonRef} onClick={toggleDropdown}>
          <AvatarContainer>
            <Avatar>
              {selectedAccount?.has_profile_picture ? (
                <img
                  src={selectedAccount.profile_picture_url}
                  alt={selectedAccount.first_name}
                />
              ) : (
                getInitials(
                  `${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""
                  }`,
                )
              )}
            </Avatar>
          </AvatarContainer>
          {showName && (
            <UserName>
              {`${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""
                }`}
            </UserName>
          )}
        </AccountButton>

        {typeof window !== "undefined" &&
          isOpen &&
          ReactDOM.createPortal(
            <DefaultStylesProvider>
              <DropdownContainer
                ref={dropdownRef}
                $position={dropdownPosition}
                $isOpen={isOpen}
                $maxHeight={dropdownPosition?.maxHeight}
              >
                <div>
                  {isMultiSessionEnabled
                    ? (() => {
                      // Sort signins to put active account first
                      const sortedSignins = [
                        ...(session?.signins || []),
                      ].sort((a, b) => {
                        const aIsActive = a.user.id === selectedAccount?.id;
                        const bIsActive = b.user.id === selectedAccount?.id;
                        if (aIsActive && !bIsActive) return -1;
                        if (!aIsActive && bIsActive) return 1;
                        return 0;
                      });

                      return sortedSignins.map(
                        ({ user: account, id: signInId }, index) => {
                          const isActive = account.id === selectedAccount?.id;
                          const isClickable = !isActive;

                          return (
                            <React.Fragment key={account.id}>
                              <AccountSection
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
                                          `${account?.first_name || ""} ${account?.last_name || ""
                                          }`,
                                        )
                                      )}
                                    </LargerAvatar>
                                  </AvatarContainer>
                                  <AccountDetails>
                                    <NameRow>
                                      <AccountName>
                                        {`${account?.first_name || ""} ${account?.last_name || ""
                                          }`}
                                      </AccountName>
                                    </NameRow>
                                    <AccountEmail>
                                      {account.primary_email_address.email}
                                    </AccountEmail>
                                  </AccountDetails>
                                </AccountHeader>

                                {isActive && (
                                  <ActionRow>
                                    <ActionLink
                                      onClick={handleOpenManageAccount}
                                    >
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
                              {index === 0 && sortedSignins.length > 1 && (
                                <div
                                  style={{
                                    borderBottom:
                                      "1px solid var(--color-border)",
                                    margin: "0",
                                  }}
                                />
                              )}
                            </React.Fragment>
                          );
                        },
                      );
                    })()
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
                                  `${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""
                                  }`,
                                )
                              )}
                            </LargerAvatar>
                          </AvatarContainer>
                          <AccountDetails>
                            <NameRow>
                              <AccountName>
                                {`${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""
                                  }`}
                              </AccountName>
                            </NameRow>
                            <AccountEmail>
                              {selectedAccount.primary_email_address.email}
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
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <FooterButton onClick={() => navigateToSignIn()}>
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
            </DefaultStylesProvider>,
            document.body,
          )}

        <ManageAccountDialog
          isOpen={manageAccountDialog.isOpen}
          onClose={manageAccountDialog.close}
        />
      </Container>
    </DefaultStylesProvider>
  );
};
