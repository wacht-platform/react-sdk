import { useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import {
  User,
  LogOut,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Check,
  Mail,
  Phone,
  Link2,
  Shield,
  Activity,
} from "lucide-react";
import * as TFA2 from "./2fa-redesign";
import { EmailAddPopover } from "@/components/user/add-email-popover";
import { PhoneAddPopover } from "@/components/user/add-phone-popover";
import {
  Dropdown,
  DropdownItem,
  DropdownItems,
  DropdownTrigger,
} from "@/components/utility/dropdown";
import { useUser, useUserSignins } from "@/hooks/use-user";
import { GoogleIcon } from "../icons/google";
import { MicrosoftIcon } from "../icons/microsoft";
import { GithubIcon } from "../icons/github";
import { XIcon } from "../icons/x";
import { useDeployment } from "@/hooks/use-deployment";
import { Form, FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";
import { Spinner, Button } from "../utility";
import { EmptyState } from "@/components/utility/empty-state";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { UserAuthenticator } from "@/types/user";
import { ScreenContext, useScreenContext } from "./context";

const TypographyProvider = styled.div`
  * {
    box-sizing: border-box;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 1000px;
      transform: translateY(0);
    }
  }
`;

const Container = styled.div`
  width: 100%;
  height: 600px;
  background: var(--color-background);
  border-radius: 20px;
  box-shadow: 0 8px 30px var(--color-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    border-radius: 16px;
  }
`;

const TabsContainer = styled.div`
  padding: 8px 24px 0;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 768px) {
    padding: 20px 20px 0;
  }
`;

const TabsList = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ $isActive: boolean }>`
  padding: 12px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) =>
    props.$isActive ? "var(--color-foreground)" : "var(--color-muted)"};
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: var(--color-foreground);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
    opacity: ${(props) => (props.$isActive ? 1 : 0)};
    transition: opacity 0.15s ease;
  }
`;

const TabIcon = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TabContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;




const SectionTitle = styled.h2`
  font-size: 16px;
  color: var(--color-foreground);
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;





const EditButton = styled.button`
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-input-background);
  color: var(--color-foreground);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-border);
  }
`;




const LastLogin = styled.div`
  font-size: 13px;
  color: var(--color-secondary-text);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;


const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-secondary-text);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-input-background);
    color: var(--color-foreground);
  }
`;


const MemberListItem = styled.div`
  background: var(--color-background);
  padding: 16px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-input-background);
  }
`;

const MemberListItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const MemberName = styled.div`
  font-size: 14px;
  color: var(--color-foreground);
`;

const MemberEmail = styled.div`
  font-size: 12px;
  color: var(--color-muted);
`;

const MemberListItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProfileSection = styled.div`
  padding: 24px;
`;


const SessionDropdown = ({
  isOpen,
  onClose,
  sessionId,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onLogout: (id: string) => void;
}) => {
  return (
    <Dropdown open={isOpen} openChange={onClose}>
      <DropdownTrigger>
        <IconButton>•••</IconButton>
      </DropdownTrigger>
      <DropdownItems>
        <DropdownItem onClick={() => onLogout(sessionId)}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LogOut size={14} />
            Logout Session
          </div>
        </DropdownItem>
      </DropdownItems>
    </Dropdown>
  );
};

const SectionHeader = ({
  title,
  actionLabel,
  onAction,
  buttonIcon,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  buttonIcon?: React.ReactNode;
}) => {

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <SectionTitle style={{ fontSize: 14 }}>{title}</SectionTitle>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          style={{
            width: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {buttonIcon}
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  );
};

// Removed ProfileManagementSection - using tabs instead
/*
const ProfileManagementSection = () => {
  const { setScreen } = useScreenContext();
  const { user } = useUser();
  const { deployment } = useDeployment();

  return (
    <>
      <SectionTitle style={{ marginBottom: "20px" }}>
        Manage your account
      </SectionTitle>
      <ProfileSection>
        <ProfileHeader onClick={() => setScreen("profile-details")}>
          <Avatar
            src={
              user?.profile_picture_url ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            }
            alt="Profile"
          />
          <ProfileName>
            <Name>
              {user?.first_name} {user?.last_name}
            </Name>
          </ProfileName>

          <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
        </ProfileHeader>

        {deployment?.auth_settings?.email_address?.enabled && (
          <InfoItem onClick={() => setScreen("email")}>
            <InfoLabel>Email addresses</InfoLabel>
            <InfoContent>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.user_email_addresses?.length
                  ? user.user_email_addresses
                      .map((email) => email.email)
                      .join(", ")
                  : "No email addresses added"}
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
            </InfoContent>
          </InfoItem>
        )}

        {deployment?.auth_settings?.phone_number?.enabled && (
          <InfoItem onClick={() => setScreen("phone")}>
            <InfoLabel>Phone number</InfoLabel>
            <InfoContent>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.user_phone_numbers?.length
                  ? user.user_phone_numbers
                      .map((phone) => phone.phone_number)
                      .join(", ")
                  : "No phone numbers added"}
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
            </InfoContent>
          </InfoItem>
        )}

        <InfoItem onClick={() => setScreen("social")}>
          <InfoLabel>Connected accounts</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.social_connections?.length
                ? user.social_connections
                    .map((conn) => `${conn.provider} • ${conn.email_address}`)
                    .join(", ")
                : "No accounts connected"}
            </div>
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
          </InfoContent>
        </InfoItem>

        <SectionTitle style={{ marginTop: "32px", marginBottom: "16px" }}>
          Security settings
        </SectionTitle>

        {(deployment?.auth_settings?.password?.enabled ||
          deployment?.auth_settings?.auth_factors_enabled?.authenticator ||
          deployment?.auth_settings?.auth_factors_enabled?.phone_otp ||
          deployment?.auth_settings?.auth_factors_enabled?.backup_code) && (
          <InfoItem onClick={() => setScreen("security")}>
            <InfoLabel>Security</InfoLabel>
            <InfoContent>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Manage password and two-factor authentication
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
            </InfoContent>
          </InfoItem>
        )}
        <InfoItem onClick={() => setScreen("active-sessions")}>
          <InfoLabel>Active sessions</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage your active sessions
            </div>
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
          </InfoContent>
        </InfoItem>
      </ProfileSection>
    </>
  );
};
*/

const ActiveSessionsSection = () => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const { signins, removeSignin, loading } = useUserSignins();

  const handleCloseDropdown = () => {
    setActiveSession(null);
  };

  const logoutSession = async (sessionId: string) => {
    await removeSignin(sessionId);
    setActiveSession(null);
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "20px" }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <ProfileSection>
      <SectionHeader title="Active Sessions" />
      {signins && signins.length > 0 ? (
        signins.map((signin) => (
          <div
            key={signin.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px",
              background:
                activeSession === signin.id
                  ? "var(--color-background-hover)"
                  : "transparent",
              borderRadius: "8px",
              marginTop: "12px",
              position: "relative",
            }}
          >
            <div style={{ marginRight: "16px" }}></div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-foreground)",
                  fontWeight: 500,
                }}
              >
                {signin.browser || "Unknown Browser"}
                {signin.device ? ` • ${signin.device}` : ""}
              </div>
              <LastLogin>
                <div>
                  {signin.city && signin.country
                    ? `${signin.city}, ${signin.country}`
                    : signin.ipAddress || "Unknown location"}
                </div>
                <div>{new Date(signin.lastActiveAt).toLocaleString()}</div>
              </LastLogin>
            </div>
            <div style={{ position: "relative" }}>
              <IconButton
                onClick={() =>
                  setActiveSession(
                    activeSession === signin.id ? null : signin.id,
                  )
                }
              >
                •••
              </IconButton>
              <SessionDropdown
                isOpen={activeSession === signin.id}
                onClose={handleCloseDropdown}
                sessionId={signin.id}
                onLogout={logoutSession}
              />
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "var(--color-muted)",
          }}
        >
          No active sign-ins found
        </div>
      )}
    </ProfileSection>
  );
};

const EmailManagementSection = () => {
  const { deployment } = useDeployment();
  const { toast } = useScreenContext();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const {
    user,
    createEmailAddress,
    deleteEmailAddress,
    prepareEmailVerification,
    attemptEmailVerification,
    makeEmailPrimary,
  } = useUser();

  // Don't render if email is disabled
  if (!deployment?.auth_settings?.email_address?.enabled) {
    return null;
  }

  const handleDeleteEmail = async (emailId: string) => {
    try {
      const emailToDelete = user?.user_email_addresses?.find(
        (email) => email.id === emailId,
      );

      if (emailToDelete?.is_primary) {
        toast(
          "Cannot delete primary email address. Please set another email as primary first.",
          "error",
        );
        return;
      }

      await deleteEmailAddress(emailId);
      user.refetch();
      toast("Email address deleted successfully", "info");
    } catch (error: any) {
      toast(
        error.message || "Failed to delete email address. Please try again.",
        "error",
      );
    }
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        <SectionHeader
          title="Email addresses"
          actionLabel="Add Email"
          onAction={() => setIsAddingEmail(true)}
        />
        {isAddingEmail && (
          <EmailAddPopover
            onClose={() => setIsAddingEmail(false)}
            onAddEmail={async (email) => {
              const newEmailData = await createEmailAddress(email);
              setNewEmail(newEmailData.data.id);
              await prepareEmailVerification(newEmailData.data.id);
              user.refetch();
              setIsAddingEmail(false);
            }}
            onPrepareVerification={async () => {
              await prepareEmailVerification(newEmail);
              user.refetch();
            }}
            onAttemptVerification={async (otp) => {
              await attemptEmailVerification(newEmail, otp);
              user.refetch();
              setIsAddingEmail(false);
            }}
          />
        )}
      </div>
      <div>
        {!user?.user_email_addresses?.length ? (
          <EmptyState
            title="No email addresses"
            description="Add an email address to get started."
          />
        ) : (
          <>
            <div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  marginBottom: "8px",
                  color: "var(--color-muted)",
                }}
              >
                Verified
              </h3>
              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                {user.user_email_addresses.filter((email) => email.verified)
                  .length === 0 ? (
                  <EmptyState
                    title="No verified emails"
                    description="Verify an email to see it here."
                  />
                ) : (
                  user.user_email_addresses
                    .filter((email) => email.verified)
                    .map((email) => (
                      <MemberListItem key={email.id}>
                        <MemberListItemContent>
                          <MemberInfo>
                            <MemberName>{email.email}</MemberName>
                            <MemberEmail>
                              {email.id === user?.primary_email_address_id
                                ? "Primary"
                                : "Verified"}
                            </MemberEmail>
                          </MemberInfo>
                        </MemberListItemContent>
                        <MemberListItemActions>
                          <Dropdown
                            open={activeDropdown === email.id}
                            openChange={(isOpen) =>
                              setActiveDropdown(isOpen ? email.id : null)
                            }
                          >
                            <DropdownTrigger>
                              <IconButton>•••</IconButton>
                            </DropdownTrigger>
                            <DropdownItems>
                              {email.id !== user?.primary_email_address_id && (
                                <DropdownItem
                                  onClick={async () => {
                                    await makeEmailPrimary(email.id);
                                    user.refetch();
                                    setActiveDropdown(null);
                                  }}
                                >
                                  Make primary
                                </DropdownItem>
                              )}
                              <DropdownItem
                                $destructive
                                onClick={() => {
                                  handleDeleteEmail(email.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                Remove
                              </DropdownItem>
                            </DropdownItems>
                          </Dropdown>
                        </MemberListItemActions>
                      </MemberListItem>
                    ))
                )}
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  marginBottom: "8px",
                  color: "var(--color-muted)",
                }}
              >
                Unverified
              </h3>
              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                {user.user_email_addresses.filter((email) => !email.verified)
                  .length === 0 ? (
                  <EmptyState
                    title="No unverified emails"
                    description="You are all set!"
                  />
                ) : (
                  user.user_email_addresses
                    .filter((email) => !email.verified)
                    .map((email) => (
                      <MemberListItem key={email.id}>
                        <MemberListItemContent>
                          <MemberInfo>
                            <MemberName>{email.email}</MemberName>
                            <MemberEmail>Not Verified</MemberEmail>
                          </MemberInfo>
                        </MemberListItemContent>
                        <MemberListItemActions>
                          <Dropdown
                            open={activeDropdown === email.id}
                            openChange={(isOpen) =>
                              setActiveDropdown(isOpen ? email.id : null)
                            }
                          >
                            <DropdownTrigger>
                              <IconButton>•••</IconButton>
                            </DropdownTrigger>
                            <DropdownItems>
                              <DropdownItem
                                onClick={() => {
                                  prepareEmailVerification(email.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                Verify email
                              </DropdownItem>
                              <DropdownItem
                                $destructive
                                onClick={() => {
                                  handleDeleteEmail(email.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                Remove
                              </DropdownItem>
                            </DropdownItems>
                          </Dropdown>
                        </MemberListItemActions>
                      </MemberListItem>
                    ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const PhoneManagementSection = () => {
  const { deployment } = useDeployment();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const {
    user,
    createPhoneNumber,
    deletePhoneNumber,
    preparePhoneVerification,
    attemptPhoneVerification,
    makePhonePrimary,
  } = useUser();

  // Don't render if phone is disabled
  if (!deployment?.auth_settings?.phone_number?.enabled) {
    return null;
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        <SectionHeader
          title="Phone number"
          actionLabel="Add Phone"
          onAction={() => setIsAddingPhone(true)}
        />
        {isAddingPhone && (
          <PhoneAddPopover
            onClose={() => setIsAddingPhone(false)}
            onAddPhone={async (phone) => {
              const newPhoneData = await createPhoneNumber(phone);
              setNewPhone(newPhoneData.data.id);
              await preparePhoneVerification(newPhoneData.data.id);
              user.refetch();
              setIsAddingPhone(false);
            }}
            onPrepareVerification={async () => {
              await preparePhoneVerification(newPhone);
              user.refetch();
            }}
            onAttemptVerification={async (otp) => {
              await attemptPhoneVerification(newPhone, otp);
              user.refetch();
              setIsAddingPhone(false);
            }}
          />
        )}
      </div>
      <div>
        {!user?.user_phone_numbers?.length ? (
          <EmptyState
            title="No phone numbers"
            description="Add a phone number to get started."
          />
        ) : (
          <>
            <div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  marginBottom: "8px",
                  color: "var(--color-muted)",
                }}
              >
                Verified
              </h3>
              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                {user.user_phone_numbers.filter((phone) => phone.verified)
                  .length === 0 ? (
                  <EmptyState
                    title="No verified phone numbers"
                    description="Verify a phone number to see it here."
                  />
                ) : (
                  user.user_phone_numbers
                    .filter((phone) => phone.verified)
                    .map((phone) => (
                      <MemberListItem key={phone.id}>
                        <MemberListItemContent>
                          <MemberInfo>
                            <MemberName>{phone.phone_number}</MemberName>
                            <MemberEmail>
                              {phone.id === user?.primary_phone_number_id
                                ? "Primary"
                                : "Verified"}
                            </MemberEmail>
                          </MemberInfo>
                        </MemberListItemContent>
                        <MemberListItemActions>
                          <Dropdown
                            open={activeDropdown === phone.id}
                            openChange={(isOpen) =>
                              setActiveDropdown(isOpen ? phone.id : null)
                            }
                          >
                            <DropdownTrigger>
                              <IconButton>•••</IconButton>
                            </DropdownTrigger>
                            <DropdownItems>
                              {phone.id !== user?.primary_phone_number_id && (
                                <DropdownItem
                                  onClick={async () => {
                                    await makePhonePrimary(phone.id);
                                    setActiveDropdown(null);
                                    user.refetch();
                                  }}
                                >
                                  Make primary
                                </DropdownItem>
                              )}
                              <DropdownItem
                                $destructive
                                onClick={async () => {
                                  await deletePhoneNumber(phone.id);
                                  setActiveDropdown(null);
                                  user.refetch();
                                }}
                              >
                                Remove
                              </DropdownItem>
                            </DropdownItems>
                          </Dropdown>
                        </MemberListItemActions>
                      </MemberListItem>
                    ))
                )}
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  marginBottom: "8px",
                  color: "var(--color-muted)",
                }}
              >
                Unverified
              </h3>
              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                {user.user_phone_numbers.filter((phone) => !phone.verified)
                  .length === 0 ? (
                  <EmptyState
                    title="No unverified phone numbers"
                    description="Add a new phone number to see it here."
                  />
                ) : (
                  user.user_phone_numbers
                    .filter((phone) => !phone.verified)
                    .map((phone) => (
                      <MemberListItem key={phone.id}>
                        <MemberListItemContent>
                          <MemberInfo>
                            <MemberName>{phone.phone_number}</MemberName>
                            <MemberEmail>Not Verified</MemberEmail>
                          </MemberInfo>
                        </MemberListItemContent>
                        <MemberListItemActions>
                          <Dropdown
                            open={activeDropdown === phone.id}
                            openChange={(isOpen) =>
                              setActiveDropdown(isOpen ? phone.id : null)
                            }
                          >
                            <DropdownTrigger>
                              <IconButton>•••</IconButton>
                            </DropdownTrigger>
                            <DropdownItems>
                              <DropdownItem
                                onClick={() => {
                                  preparePhoneVerification(phone.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                Verify phone
                              </DropdownItem>
                              <DropdownItem
                                $destructive
                                onClick={async () => {
                                  await deletePhoneNumber(phone.id);
                                  setActiveDropdown(null);
                                  user.refetch();
                                }}
                              >
                                Remove
                              </DropdownItem>
                            </DropdownItems>
                          </Dropdown>
                        </MemberListItemActions>
                      </MemberListItem>
                    ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const IconWrapper = styled.div`
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const SocialManagementSection = () => {
  const { user, disconnectSocialConnection } = useUser();
  const { deployment } = useDeployment();

  const socialAuthProviders = {
    google_oauth: {
      icon: <GoogleIcon />,
      label: "Google",
    },
    microsoft_oauth: {
      icon: <MicrosoftIcon />,
      label: "Microsoft",
    },
    github_oauth: {
      icon: <GithubIcon />,
      label: "GitHub",
    },
    x_oauth: {
      icon: <XIcon />,
      label: "X",
    },
  };

  const enabledProviders = deployment?.social_connections.filter(
    (conn) => conn.enabled,
  );

  return (
    <>
      <SectionHeader title="Connected Accounts" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {enabledProviders?.map((provider) => {
          const connectedAccount = user?.social_connections?.find(
            (conn) => conn.provider === provider.provider,
          );
          const providerInfo =
            socialAuthProviders[
              provider.provider as keyof typeof socialAuthProviders
            ];

          if (!providerInfo) return null;

          return (
            <div
              key={provider.provider}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                background: "var(--color-background-hover)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <IconWrapper>{providerInfo.icon}</IconWrapper>
                <div
                  style={{ fontSize: "14px", color: "var(--color-foreground)" }}
                >
                  {providerInfo.label}
                </div>
              </div>
              {connectedAccount ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{ fontSize: "14px", color: "var(--color-muted)" }}
                  >
                    {connectedAccount.email_address}
                  </div>
                  <EditButton
                    onClick={async () => {
                      await disconnectSocialConnection(
                        connectedAccount.id.toString(),
                      );
                      user.refetch();
                    }}
                    style={{
                      background: "var(--color-error-background)",
                      color: "var(--color-error)",
                    }}
                  >
                    Disconnect
                  </EditButton>
                </div>
              ) : (
                <EditButton
                  onClick={() => {
                    // Redirect to OAuth flow for this provider
                    const baseUrl = deployment?.backend_host || "";
                    const redirectUrl = `${baseUrl}/auth/oauth2/init?provider=${
                      provider.provider
                    }&redirect_url=${encodeURIComponent(window.location.href)}`;
                    window.location.href = redirectUrl;
                  }}
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-background)",
                    fontSize: "12px",
                    padding: "6px 12px",
                  }}
                >
                  Connect
                </EditButton>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};


type TabType = "profile" | "email" | "phone" | "social" | "security" | "sessions";

export const ManageAccount = () => {
  const { loading } = useUser();
  const { deployment } = useDeployment();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [setToastMessage],
  );

  if (loading)
    return (
      <Container
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </Container>
    );

  const authSettings = deployment?.auth_settings;
  const showEmailTab = authSettings?.email_address?.enabled;
  const showPhoneTab = authSettings?.phone_number?.enabled;
  const showSecurityTab = authSettings?.password?.enabled || 
    authSettings?.auth_factors_enabled?.authenticator ||
    authSettings?.auth_factors_enabled?.phone_otp ||
    authSettings?.auth_factors_enabled?.backup_code;

  return (
    <TypographyProvider>
      <ScreenContext.Provider value={{ screen: null, setScreen: () => {}, toast }}>
        <Container>
          <TabsContainer>
            <TabsList>
              <Tab
                $isActive={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              >
                <TabIcon>
                  <User size={16} />
                  Profile
                </TabIcon>
              </Tab>
              {showEmailTab && (
                <Tab
                  $isActive={activeTab === "email"}
                  onClick={() => setActiveTab("email")}
                >
                  <TabIcon>
                    <Mail size={16} />
                    Email
                  </TabIcon>
                </Tab>
              )}
              {showPhoneTab && (
                <Tab
                  $isActive={activeTab === "phone"}
                  onClick={() => setActiveTab("phone")}
                >
                  <TabIcon>
                    <Phone size={16} />
                    Phone
                  </TabIcon>
                </Tab>
              )}
              <Tab
                $isActive={activeTab === "social"}
                onClick={() => setActiveTab("social")}
              >
                <TabIcon>
                  <Link2 size={16} />
                  Connected
                </TabIcon>
              </Tab>
              {showSecurityTab && (
                <Tab
                  $isActive={activeTab === "security"}
                  onClick={() => setActiveTab("security")}
                >
                  <TabIcon>
                    <Shield size={16} />
                    Security
                  </TabIcon>
                </Tab>
              )}
              <Tab
                $isActive={activeTab === "sessions"}
                onClick={() => setActiveTab("sessions")}
              >
                <TabIcon>
                  <Activity size={16} />
                  Sessions
                </TabIcon>
              </Tab>
            </TabsList>
          </TabsContainer>

          <TabContent>
            {activeTab === "profile" && <ProfileDetailsManagementSection />}
            {activeTab === "email" && showEmailTab && <EmailManagementSection />}
            {activeTab === "phone" && showPhoneTab && <PhoneManagementSection />}
            {activeTab === "social" && <SocialManagementSection />}
            {activeTab === "security" && showSecurityTab && <SecurityManagementSection />}
            {activeTab === "sessions" && <ActiveSessionsSection />}
          </TabContent>

          {toastMessage && (
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                background: "var(--color-input-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "12px 16px",
                boxShadow: "0 4px 12px var(--color-shadow)",
                animation: "slideUp 0.3s ease-out",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {toastLevel === "error" ? (
                  <AlertTriangle size={16} color="var(--color-error)" />
                ) : (
                  <Check size={16} color="var(--color-success)" />
                )}
                <span style={{ fontSize: "14px", color: "var(--color-foreground)" }}>
                  {toastMessage}
                </span>
              </div>
            </div>
          )}
        </Container>
      </ScreenContext.Provider>
    </TypographyProvider>
  );
};

const PasswordInput = styled.div`
  position: relative;
  width: 100%;

  input {
    padding-right: 40px;
  }

  button {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-muted);

    &:hover {
      color: var(--color-text);
    }
  }
`;

// const PasswordManagementSection = () => {
//   const { updatePassword, removePassword, user } = useUser();
//   const { deployment } = useDeployment();
//   const { toast } = useScreenContext();
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isRemoving, setIsRemoving] = useState(false);
//   const [removePasswordInput, setRemovePasswordInput] = useState("");
//   const [showRemovePassword, setShowRemovePassword] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   // Don't render if password is disabled
//   if (!deployment?.auth_settings?.password?.enabled) {
//     return null;
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (isSubmitting) return;

//     const newErrors: Record<string, string> = {};

//     if (!currentPassword) {
//       newErrors.currentPassword = "Current password is required";
//     }

//     if (!newPassword) {
//       newErrors.newPassword = "New password is required";
//     } else if (newPassword.length < 8) {
//       newErrors.newPassword = "Password must be at least 8 characters";
//     }

//     if (newPassword !== confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       await updatePassword(currentPassword, newPassword);
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");
//       setErrors({});
//       toast("Password updated successfully", "info");
//     } catch (error: any) {
//       const errorMessage =
//         error.message || "Failed to update password. Please try again.";
//       setErrors({ form: errorMessage });
//       toast(errorMessage, "error");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleRemovePassword = async () => {
//     if (!removePasswordInput) {
//       setErrors({ removePassword: "Current password is required" });
//       return;
//     }

//     setIsRemoving(true);
//     setErrors({});

//     try {
//       await removePassword(removePasswordInput);
//       setRemovePasswordInput("");
//       toast(
//         "Password removed successfully. You can now sign in using alternative methods.",
//         "info",
//       );
//     } catch (error: any) {
//       const errorMessage =
//         error?.message ||
//         "Failed to remove password. Please check your password and ensure you have alternative authentication methods configured.";
//       setErrors({
//         removePassword: errorMessage,
//       });
//       toast(errorMessage, "error");
//     } finally {
//       setIsRemoving(false);
//     }
//   };

//   const hasAlternativeAuthMethods = () => {
//     const hasVerifiedEmail = user?.user_email_addresses?.some(
//       (email) => email.verified,
//     );
//     const hasSocialConnections = (user?.social_connections?.length || 0) > 0;
//     const hasAuthenticator = !!user?.user_authenticator;
//     const emailOtpEnabled =
//       deployment?.auth_settings?.first_factor === "email_otp";
//     return (
//       (hasVerifiedEmail && emailOtpEnabled) ||
//       hasSocialConnections ||
//       hasAuthenticator
//     );
//   };

//   return (
//     <div>
//       <SectionHeader title="Password" />

//       {/* Change Password Section */}
//       <div
//         style={{
//           display: "flex",
//           gap: "24px",
//           padding: "32px 0",
//           alignItems: "flex-start",
//         }}
//       >
//         {/* Left side - Text content */}
//         <div
//           style={{
//             flex: 1,
//           }}
//         >
//           <h3
//             style={{
//               margin: 0,
//               fontSize: "16px",
//               fontWeight: "400",
//               color: "var(--color-foreground)",
//               marginBottom: "8px",
//             }}
//           >
//             Change Password
//           </h3>
//           <p
//             style={{
//               margin: 0,
//               fontSize: "14px",
//               color: "var(--color-muted)",
//               lineHeight: "1.5",
//             }}
//           >
//             Update your current password with a new one. Make sure to use a
//             strong password with at least 8 characters.
//           </p>
//         </div>

//         {/* Right side - Form */}
//         <div
//           style={{
//             flex: "0 0 450px",
//             backgroundColor: "var(--color-background)",
//             border: "1px solid var(--color-border)",
//             borderRadius: "12px",
//             padding: "24px",
//           }}
//         >
//           <Form onSubmit={handleSubmit}>
//             <FormGroup>
//               <Label htmlFor="currentPassword">Current Password</Label>
//               <PasswordInput>
//                 <Input
//                   id="currentPassword"
//                   type={showCurrentPassword ? "text" : "password"}
//                   value={currentPassword}
//                   onChange={(e) => setCurrentPassword(e.target.value)}
//                   placeholder="Enter your current password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                 >
//                   {showCurrentPassword ? (
//                     <EyeOff size={16} />
//                   ) : (
//                     <Eye size={16} />
//                   )}
//                 </button>
//               </PasswordInput>
//               {errors.currentPassword && (
//                 <div
//                   style={{
//                     color: "var(--color-error)",
//                     fontSize: "12px",
//                     marginTop: "4px",
//                   }}
//                 >
//                   {errors.currentPassword}
//                 </div>
//               )}
//             </FormGroup>

//             <FormGroup>
//               <Label htmlFor="newPassword">New Password</Label>
//               <PasswordInput>
//                 <Input
//                   id="newPassword"
//                   type={showNewPassword ? "text" : "password"}
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   placeholder="Enter your new password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowNewPassword(!showNewPassword)}
//                 >
//                   {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>
//               </PasswordInput>
//               {errors.newPassword && (
//                 <div
//                   style={{
//                     color: "var(--color-error)",
//                     fontSize: "12px",
//                     marginTop: "4px",
//                   }}
//                 >
//                   {errors.newPassword}
//                 </div>
//               )}
//             </FormGroup>

//             <FormGroup>
//               <Label htmlFor="confirmPassword">Confirm New Password</Label>
//               <PasswordInput>
//                 <Input
//                   id="confirmPassword"
//                   type={showConfirmPassword ? "text" : "password"}
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   placeholder="Confirm your new password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 >
//                   {showConfirmPassword ? (
//                     <EyeOff size={16} />
//                   ) : (
//                     <Eye size={16} />
//                   )}
//                 </button>
//               </PasswordInput>
//               {errors.confirmPassword && (
//                 <div
//                   style={{
//                     color: "var(--color-error)",
//                     fontSize: "12px",
//                     marginTop: "4px",
//                   }}
//                 >
//                   {errors.confirmPassword}
//                 </div>
//               )}
//             </FormGroup>

//             <div style={{ marginTop: "12px" }}>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 style={{
//                   width: "100%",
//                   padding: "9px 16px",
//                   background: "var(--color-primary)",
//                   color: "var(--color-background)",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: 500,
//                   fontSize: "14px",
//                   cursor: "pointer",
//                   transition: "background-color 0.2s",
//                   opacity: isSubmitting ? 0.7 : 1,
//                 }}
//               >
//                 {isSubmitting ? "Updating..." : "Update Password"}
//               </button>
//             </div>
//           </Form>
//         </div>
//       </div>

//       {/* Divider */}
//       <div
//         style={{
//           height: "1px",
//           backgroundColor: "var(--color-border)",
//           margin: "0 0",
//         }}
//       />

//       {/* Remove Password Section */}
//       <div
//         style={{
//           display: "flex",
//           gap: "24px",
//           padding: "32px 0",
//           alignItems: "flex-start",
//         }}
//       >
//         {/* Left side - Text content */}
//         <div
//           style={{
//             flex: 1,
//           }}
//         >
//           <h3
//             style={{
//               margin: 0,
//               fontSize: "16px",
//               fontWeight: "400",
//               color: "var(--color-foreground)",
//               marginBottom: "8px",
//             }}
//           >
//             Remove Password
//           </h3>
//           <p
//             style={{
//               margin: 0,
//               fontSize: "14px",
//               color: "var(--color-muted)",
//               lineHeight: "1.5",
//             }}
//           >
//             {hasAlternativeAuthMethods()
//               ? "Disable password authentication for your account. You'll still be able to sign in using your connected social accounts or other authentication methods."
//               : "You must set up alternative sign-in methods (like social connections or phone authentication) before removing your password."}
//           </p>
//         </div>

//         {/* Right side - Form */}
//         <div
//           style={{
//             flex: "0 0 450px",
//             backgroundColor: "var(--color-background)",
//             border: "1px solid var(--color-border)",
//             borderRadius: "12px",
//             padding: "24px",
//           }}
//         >
//           {!hasAlternativeAuthMethods() && (
//             <div
//               style={{
//                 padding: "12px",
//                 background: "var(--color-warning-background)",
//                 color: "var(--color-warning-text)",
//                 borderRadius: "8px",
//                 marginBottom: "12px",
//                 fontSize: "14px",
//               }}
//             >
//               You must set up an alternative sign-in method (like Social
//               connection, phone otp) before you can remove your password.
//             </div>
//           )}
//           <div style={{ marginBottom: "12px" }}>
//             <p
//               style={{
//                 fontSize: "14px",
//                 color: "var(--color-muted)",
//                 margin: 0,
//                 lineHeight: "1.5",
//               }}
//             >
//               Remove password authentication and use only alternative methods
//               like email OTP, social sign-in, or authenticator apps.
//             </p>
//           </div>

//           <FormGroup>
//             <Label htmlFor="removePasswordInput">Current Password</Label>
//             <PasswordInput>
//               <Input
//                 id="removePasswordInput"
//                 type={showRemovePassword ? "text" : "password"}
//                 value={removePasswordInput}
//                 onChange={(e) => setRemovePasswordInput(e.target.value)}
//                 placeholder="Enter your current password"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowRemovePassword(!showRemovePassword)}
//               >
//                 {showRemovePassword ? <EyeOff size={16} /> : <Eye size={16} />}
//               </button>
//             </PasswordInput>
//             {errors.removePassword && (
//               <div
//                 style={{
//                   color: "var(--color-error)",
//                   fontSize: "12px",
//                   marginTop: "4px",
//                 }}
//               >
//                 {errors.removePassword}
//               </div>
//             )}
//           </FormGroup>

//           <div style={{ marginTop: "12px" }}>
//             <button
//               type="button"
//               onClick={handleRemovePassword}
//               disabled={
//                 isRemoving ||
//                 !removePasswordInput ||
//                 !hasAlternativeAuthMethods()
//               }
//               style={{
//                 width: "100%",
//                 padding: "9px 16px",
//                 background: "var(--color-error)",
//                 color: "var(--color-background)",
//                 border: "none",
//                 borderRadius: "8px",
//                 fontWeight: 500,
//                 fontSize: "14px",
//                 cursor:
//                   isRemoving ||
//                   !removePasswordInput ||
//                   !hasAlternativeAuthMethods()
//                     ? "not-allowed"
//                     : "pointer",
//                 transition: "background-color 0.2s",
//                 opacity:
//                   isRemoving ||
//                   !removePasswordInput ||
//                   !hasAlternativeAuthMethods()
//                     ? 0.6
//                     : 1,
//               }}
//             >
//               {isRemoving ? "Removing..." : "Remove Password"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const TwoFactorManagementSection = () => {
//   const { deployment } = useDeployment();
//   const { user, setupAuthenticator, verifyAuthenticator, deleteAuthenticator, generateBackupCodes, regenerateBackupCodes } = useUser();
//   const [isSettingUp, setIsSettingUp] = useState(false);
//   const [verificationCode, setVerificationCode] = useState("");
//   const [backupCodes, setBackupCodes] = useState<string[]>([]);
//   const [copiedCode, setCopiedCode] = useState<string | null>(null);
//   const [newAuthenticator, setNewAuthenticator] = useState<UserAuthenticator>();
//   const [error, setError] = useState<string | null>(null);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);

//   const authFactorsEnabled = deployment?.auth_settings?.auth_factors_enabled;
//   const passwordEnabled = deployment?.auth_settings?.password?.enabled;

//   // Don't render if no 2FA methods are enabled and password is disabled
//   if (!authFactorsEnabled?.authenticator && !authFactorsEnabled?.backup_code && !passwordEnabled) {
//     return null;
//   }

//   const handleSetupAuthenticator = async () => {
//     setIsSettingUp(true);
//     setError(null);
//     const response = await setupAuthenticator();
//     setNewAuthenticator(response);
//   };

//   const handleVerifyAuthenticator = async () => {
//     if (verificationCode.length !== 6 || !newAuthenticator?.id) return;
//
//     setIsVerifying(true);
//     setError(null);
//
//     const result = await verifyAuthenticator(newAuthenticator.id, [verificationCode]);
//
//     if (result.errors?.length) {
//       setError(result.errors[0].message);
//       setIsVerifying(false);
//     } else {
//       setIsSettingUp(false);
//       setVerificationCode("");
//       setNewAuthenticator(undefined);
//       user.refetch();
//       setIsVerifying(false);
//     }
//   };

//   const handleRemoveAuthenticator = async (id: string) => {
//     if (confirm("Are you sure you want to remove your authenticator app?")) {
//       await deleteAuthenticator(id);
//       user.refetch();
//     }
//   };

//   const handleGenerateBackupCodes = async () => {
//     setIsGenerating(true);
//     try {
//       const codes = await generateBackupCodes();
//       setBackupCodes(codes);
//       user.refetch();
//     } catch (error) {
//       console.error("Failed to generate backup codes:", error);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleRegenerateBackupCodes = async () => {
//     if (!confirm("Are you sure? Your old backup codes will stop working immediately.")) {
//       return;
//     }
//
//     setIsGenerating(true);
//     try {
//       const codes = await regenerateBackupCodes();
//       setBackupCodes(codes);
//       user.refetch();
//     } catch (error) {
//       console.error("Failed to regenerate backup codes:", error);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleCopyCode = (code: string) => {
//     navigator.clipboard.writeText(code);
//     setCopiedCode(code);
//     setTimeout(() => setCopiedCode(null), 2000);
//   };

//   const handleDownloadCodes = () => {
//     const timestamp = new Date().toISOString().split('T')[0];
//     const codesText = `Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}`;
//     const blob = new Blob([codesText], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `backup-codes-${timestamp}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div>
//       <SectionHeader title="Two-Factor Authentication" />
//
//       <TFA2.TwoFactorContainer>
//         {/* Authenticator App Section */}
//         {authFactorsEnabled?.authenticator && (
//           <TFA2.TwoFactorSection>
//             <TFA2.SectionHeader>
//               <TFA2.SectionTitle>Authenticator App</TFA2.SectionTitle>
//               <TFA2.StatusBadge $active={!!user?.user_authenticator?.id}>
//                 {user?.user_authenticator?.id ? "Active" : "Not Set Up"}
//               </TFA2.StatusBadge>
//             </TFA2.SectionHeader>

//             {!user?.user_authenticator && !isSettingUp && (
//               <TFA2.EmptyState>
//                 <TFA2.EmptyStateText>
//                   Use an authenticator app like Google Authenticator or Authy
//                 </TFA2.EmptyStateText>
//                 <TFA2.ActionButton $variant="primary" onClick={handleSetupAuthenticator}>
//                   Set Up Authenticator
//                 </TFA2.ActionButton>
//               </TFA2.EmptyState>
//             )}

//             {isSettingUp && newAuthenticator && (
//               <div>
//                 <TFA2.QRCodeWrapper>
//                   <QRCodeSVG
//                     width={160}
//                     height={160}
//                     value={newAuthenticator.otp_url || ""}
//                     level="H"
//                     includeMargin={false}
//                   />
//                 </TFA2.QRCodeWrapper>
//
//                 <TFA2.InfoText>Scan with your authenticator app, then enter the code:</TFA2.InfoText>
//
//                 <TFA2.CodeInput
//                   type="text"
//                   value={verificationCode}
//                   onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
//                   placeholder="000000"
//                   maxLength={6}
//                 />
//
//                 {error && (
//                   <TFA2.InfoText style={{ color: "var(--color-error)" }}>
//                     {error}
//                   </TFA2.InfoText>
//                 )}
//
//                 <TFA2.ButtonGroup>
//                   <TFA2.ActionButton onClick={() => setIsSettingUp(false)}>Cancel</TFA2.ActionButton>
//                   <TFA2.ActionButton
//                     $variant="primary"
//                     onClick={handleVerifyAuthenticator}
//                     disabled={verificationCode.length !== 6 || isVerifying}
//                   >
//                     {isVerifying ? "Verifying..." : "Verify"}
//                   </TFA2.ActionButton>
//                 </TFA2.ButtonGroup>
//               </div>
//             )}

//             {user?.user_authenticator?.id && (
//               <div>
//                 <TFA2.InfoText>
//                   Added on {new Date(user.user_authenticator?.created_at || '').toLocaleDateString()}
//                 </TFA2.InfoText>
//                 <TFA2.ActionButton
//                   $variant="danger"
//                   onClick={() => user.user_authenticator?.id && handleRemoveAuthenticator(user.user_authenticator.id)}
//                 >
//                   Remove Authenticator
//                 </TFA2.ActionButton>
//               </div>
//             )}
//           </TFA2.TwoFactorSection>
//         )}

//         {/* Backup Codes Section */}
//         {authFactorsEnabled?.backup_code && (
//           <TFA2.TwoFactorSection>
//             <TFA2.SectionHeader>
//               <TFA2.SectionTitle>Backup Codes</TFA2.SectionTitle>
//               <TFA2.StatusBadge $active={user?.backup_codes_generated || backupCodes.length > 0}>
//                 {user?.backup_codes_generated || backupCodes.length > 0 ? "Generated" : "Not Generated"}
//               </TFA2.StatusBadge>
//             </TFA2.SectionHeader>

//             {!backupCodes.length && !user?.backup_codes_generated && (
//               <TFA2.EmptyState>
//                 <TFA2.EmptyStateText>
//                   Generate single-use codes for emergency access
//                 </TFA2.EmptyStateText>
//                 <TFA2.ActionButton
//                   $variant="primary"
//                   onClick={handleGenerateBackupCodes}
//                   disabled={isGenerating}
//                 >
//                   {isGenerating ? "Generating..." : "Generate Codes"}
//                 </TFA2.ActionButton>
//               </TFA2.EmptyState>
//             )}

//             {!backupCodes.length && user?.backup_codes_generated && (
//               <div>
//                 <TFA2.InfoText>
//                   Your backup codes have been generated. You can regenerate new ones if needed.
//                 </TFA2.InfoText>
//                 <TFA2.ActionButton
//                   onClick={handleRegenerateBackupCodes}
//                   disabled={isGenerating}
//                 >
//                   {isGenerating ? "Regenerating..." : "Regenerate Codes"}
//                 </TFA2.ActionButton>
//               </div>
//             )}

//             {backupCodes.length > 0 && (
//               <div>
//                 <TFA2.BackupCodesGrid>
//                   {backupCodes.map((code, i) => (
//                     <TFA2.BackupCode
//                       key={i}
//                       onClick={() => handleCopyCode(code)}
//                       title="Click to copy"
//                     >
//                       {copiedCode === code && <Check size={12} style={{ marginRight: "4px" }} />}
//                       {code}
//                     </TFA2.BackupCode>
//                   ))}
//                 </TFA2.BackupCodesGrid>
//
//                 <TFA2.ButtonGroup>
//                   <TFA2.ActionButton onClick={handleDownloadCodes}>
//                     <Download size={14} style={{ marginRight: "4px" }} />
//                     Download
//                   </TFA2.ActionButton>
//                   <TFA2.ActionButton
//                     $variant="danger"
//                     onClick={handleRegenerateBackupCodes}
//                     disabled={isGenerating}
//                   >
//                     Regenerate
//                   </TFA2.ActionButton>
//                 </TFA2.ButtonGroup>
//               </div>
//             )}
//           </TFA2.TwoFactorSection>
//         )}
//       </TFA2.TwoFactorContainer>
//     </div>
//   );
// };

// Styled components for expandable sections
const SecurityManagementSection = () => {
  const { deployment } = useDeployment();
  const {
    user,
    setupAuthenticator,
    verifyAuthenticator,
    deleteAuthenticator,
    generateBackupCodes,
    regenerateBackupCodes,
    updatePassword,
    removePassword,
  } = useUser();
  const { toast } = useScreenContext();

  // Visibility state for sections
  const [visibleSections, setVisibleSections] = useState<
    Record<string, boolean>
  >({
    changePassword: false,
    authenticator: false,
    backupCodes: false,
    removePassword: false,
  });

  // 2FA state
  const [qrCodeRevealed, setQrCodeRevealed] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [secondVerificationCode, setSecondVerificationCode] = useState("");
  const [isWaitingForSecondCode, setIsWaitingForSecondCode] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newAuthenticator, setNewAuthenticator] = useState<UserAuthenticator>();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removePasswordInput, setRemovePasswordInput] = useState("");
  const [showRemovePassword, setShowRemovePassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  const toggleSection = (section: string) => {
    setVisibleSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));

    // Reset state when opening authenticator section
    if (section === "authenticator" && !visibleSections.authenticator) {
      setQrCodeRevealed(false);
      setVerificationCode("");
      setSecondVerificationCode("");
      setIsWaitingForSecondCode(false);
      setRemainingTime(30);
      setNewAuthenticator(undefined);
      setError(null);
    }
  };

  // Timer for second code countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWaitingForSecondCode && remainingTime > 0) {
      timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isWaitingForSecondCode, remainingTime]);

  const authFactorsEnabled = deployment?.auth_settings?.auth_factors_enabled;
  const passwordEnabled = deployment?.auth_settings?.password?.enabled;

  // Don't render if nothing is enabled
  if (
    !authFactorsEnabled?.authenticator &&
    !authFactorsEnabled?.backup_code &&
    !passwordEnabled
  ) {
    return null;
  }

  // 2FA handlers
  const handleRevealQRCode = async () => {
    if (!newAuthenticator) {
      setIsLoadingQR(true);
      try {
        // Make the backend call to setup authenticator
        const response = await setupAuthenticator();
        setNewAuthenticator(response);
      } catch (error) {
        setError("Failed to generate QR code. Please try again.");
        setIsLoadingQR(false);
        return;
      }
      setIsLoadingQR(false);
    }
    setQrCodeRevealed(true);
  };

  const handleCancelAuthenticatorSetup = () => {
    setQrCodeRevealed(false);
    setVerificationCode("");
    setSecondVerificationCode("");
    setIsWaitingForSecondCode(false);
    setRemainingTime(30);
    setNewAuthenticator(undefined);
    setError(null);
    setIsLoadingQR(false);
    // Close the authenticator section when canceling
    setVisibleSections((prev) => ({
      ...prev,
      authenticator: false,
    }));
  };

  const handleVerifyAuthenticator = async () => {
    if (!isWaitingForSecondCode && verificationCode.length !== 6) return;
    if (isWaitingForSecondCode && secondVerificationCode.length !== 6) return;
    if (!newAuthenticator?.id) return;

    // First code submitted
    if (!isWaitingForSecondCode) {
      setIsWaitingForSecondCode(true);
      setRemainingTime(30);
      setError(null);
      return;
    }

    // Second code submitted
    setIsVerifying(true);
    setError(null);
    
    const result = await verifyAuthenticator(newAuthenticator.id, [
      verificationCode,
      secondVerificationCode,
    ]);
    
    if (result.errors?.length) {
      setError(result.errors[0].message);
      setIsVerifying(false);
      setIsWaitingForSecondCode(false);
      setSecondVerificationCode("");
    } else {
      setQrCodeRevealed(false);
      setVerificationCode("");
      setSecondVerificationCode("");
      setIsWaitingForSecondCode(false);
      setNewAuthenticator(undefined);
      user.refetch();
      setIsVerifying(false);
      // Close the section after successful verification
      setVisibleSections((prev) => ({
        ...prev,
        authenticator: false,
      }));
    }
  };

  const handleRemoveAuthenticator = async (id: string) => {
    if (confirm("Are you sure you want to remove your authenticator app?")) {
      await deleteAuthenticator(id);
      user.refetch();
    }
  };

  const handleGenerateBackupCodes = async () => {
    setIsGenerating(true);
    try {
      const codes = await generateBackupCodes();
      setBackupCodes(codes);
      user.refetch();
    } catch (error) {
      console.error("Failed to generate backup codes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (
      !confirm(
        "Are you sure? Your old backup codes will stop working immediately.",
      )
    ) {
      return;
    }

    setIsGenerating(true);
    try {
      const codes = await regenerateBackupCodes();
      setBackupCodes(codes);
      user.refetch();
    } catch (error) {
      console.error("Failed to regenerate backup codes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadCodes = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const codesText = `Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join("\n")}`;
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-codes-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Password handlers
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
      toast("Password updated successfully", "info");
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to update password. Please try again.";
      setPasswordErrors({ form: errorMessage });
      toast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!removePasswordInput) {
      setPasswordErrors({ removePassword: "Current password is required" });
      return;
    }

    setIsRemoving(true);
    setPasswordErrors({});

    try {
      await removePassword(removePasswordInput);
      setRemovePasswordInput("");
      toast(
        "Password removed successfully. You can now sign in using alternative methods.",
        "info",
      );
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        "Failed to remove password. Please check your password and ensure you have alternative authentication methods configured.";
      setPasswordErrors({
        removePassword: errorMessage,
      });
      toast(errorMessage, "error");
    } finally {
      setIsRemoving(false);
    }
  };

  const hasAlternativeAuthMethods = () => {
    const hasVerifiedEmail = user?.user_email_addresses?.some(
      (email) => email.verified,
    );
    const hasSocialConnections = (user?.social_connections?.length || 0) > 0;
    const hasAuthenticator = !!user?.user_authenticator;
    const emailOtpEnabled =
      deployment?.auth_settings?.first_factor === "email_otp";
    return (
      (hasVerifiedEmail && emailOtpEnabled) ||
      hasSocialConnections ||
      hasAuthenticator
    );
  };

  return (
    <div>
      <SectionHeader title="Security" />

      {/* Password Section */}
      {passwordEnabled && (
        <>
          {/* Change Password */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              padding: "16px 0",
              alignItems: "flex-start",
            }}
          >
            {/* Left side - Text content */}
            <div
              style={{
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "var(--color-foreground)",
                  marginBottom: "8px",
                }}
              >
                Change Password
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  lineHeight: "1.5",
                }}
              >
                Update your current password with a new one. Make sure to use a
                strong password with at least 8 characters.
              </p>
            </div>

            {/* Right side - Toggle button */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("changePassword")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-input-background)",
                  color: "var(--color-foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {visibleSections.changePassword ? "Hide" : "Show"}
                {visibleSections.changePassword ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Change Password Card - Below the row */}
          {visibleSections.changePassword && (
            <div
              style={{
                padding: "16px 0",
                marginBottom: "12px",
              }}
            >
              <Form onSubmit={handlePasswordSubmit}>
                <FormGroup>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <PasswordInput>
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </PasswordInput>
                  {passwordErrors.currentPassword && (
                    <div
                      style={{
                        color: "var(--color-error)",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {passwordErrors.currentPassword}
                    </div>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput>
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </PasswordInput>
                  {passwordErrors.newPassword && (
                    <div
                      style={{
                        color: "var(--color-error)",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {passwordErrors.newPassword}
                    </div>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <PasswordInput>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </PasswordInput>
                  {passwordErrors.confirmPassword && (
                    <div
                      style={{
                        color: "var(--color-error)",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {passwordErrors.confirmPassword}
                    </div>
                  )}
                </FormGroup>

                <TFA2.ButtonGroup>
                  <TFA2.ActionButton
                    type="button"
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordErrors({});
                      toggleSection("changePassword");
                    }}
                  >
                    Cancel
                  </TFA2.ActionButton>
                  <TFA2.ActionButton
                    type="submit"
                    $variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </TFA2.ActionButton>
                </TFA2.ButtonGroup>
              </Form>
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "var(--color-border)",
              margin: "0 0",
            }}
          />
        </>
      )}

      {/* Authenticator App Section */}
      {authFactorsEnabled?.authenticator && (
        <>
          <div
            style={{
              display: "flex",
              gap: "14px",
              padding: "16px 0",
              alignItems: "flex-start",
            }}
          >
            {/* Left side - Text content */}
            <div
              style={{
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "var(--color-foreground)",
                  marginBottom: "8px",
                }}
              >
                Authenticator App
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  lineHeight: "1.5",
                }}
              >
                Use an authenticator app like Google Authenticator or Authy for
                secure two-factor authentication.
              </p>
            </div>

            {/* Right side - Toggle button */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("authenticator")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-input-background)",
                  color: "var(--color-foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {visibleSections.authenticator ? "Hide" : "Show"}
                {visibleSections.authenticator ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Authenticator App Card - Below the row */}
          {visibleSections.authenticator && (
            <div
              style={{
                padding: "16px 0",
                marginBottom: "12px",
              }}
            >
              <TFA2.TwoFactorSection>
                {!user?.user_authenticator && (
                  <div
                    style={{
                      display: "flex",
                      gap: "40px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Left side - QR Code */}
                    <div style={{ flex: "0 0 auto", position: "relative" }}>
                      <TFA2.QRCodeWrapper
                        style={{ position: "relative", overflow: "hidden" }}
                      >
                        {newAuthenticator ? (
                          <QRCodeSVG
                            width={200}
                            height={200}
                            value={newAuthenticator.otp_url || ""}
                            level="H"
                            includeMargin={false}
                            style={{
                              filter: qrCodeRevealed ? "none" : "blur(8px)",
                              transition: "filter 0.3s ease",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 200,
                              height: 200,
                              background: "var(--color-background-hover)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "80%",
                                height: "80%",
                                background: "var(--color-border)",
                                opacity: 0.3,
                                borderRadius: "8px",
                              }}
                            />
                          </div>
                        )}
                        {!qrCodeRevealed && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <button
                              onClick={handleRevealQRCode}
                              disabled={isLoadingQR}
                              style={{
                                padding: "8px 16px",
                                background: "var(--color-primary)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: isLoadingQR ? "not-allowed" : "pointer",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                opacity: isLoadingQR ? 0.7 : 1,
                              }}
                            >
                              {isLoadingQR ? "Loading..." : "Reveal QR Code"}
                            </button>
                          </div>
                        )}
                      </TFA2.QRCodeWrapper>
                    </div>

                    {/* Right side - Form */}
                    <div style={{ flex: 1 }}>
                      <TFA2.InfoText style={{ marginBottom: "12px" }}>
                        {!qrCodeRevealed
                          ? "Click 'Reveal QR Code' to display the code, then scan it with your authenticator app."
                          : "Scan the QR code with your authenticator app, then enter two consecutive codes:"}
                      </TFA2.InfoText>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                        <div>
                          <TFA2.InfoText style={{ fontSize: "12px", marginBottom: "4px" }}>
                            First code (current):
                          </TFA2.InfoText>
                          <TFA2.CodeInput
                            type="text"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(
                                e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                              )
                            }
                            placeholder="000000"
                            maxLength={6}
                            style={{ 
                              padding: "6px 8px",
                              fontSize: "14px",
                              marginBottom: 0
                            }}
                            disabled={!qrCodeRevealed}
                          />
                        </div>
                        <div>
                          <TFA2.InfoText style={{ fontSize: "12px", marginBottom: "4px" }}>
                            Second code (wait {isWaitingForSecondCode ? remainingTime : '30'}s after first):
                          </TFA2.InfoText>
                          <TFA2.CodeInput
                            type="text"
                            value={secondVerificationCode}
                            onChange={(e) =>
                              setSecondVerificationCode(
                                e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                              )
                            }
                            placeholder="000000"
                            maxLength={6}
                            style={{ 
                              padding: "6px 8px",
                              fontSize: "14px",
                              marginBottom: 0
                            }}
                            disabled={!qrCodeRevealed}
                          />
                        </div>
                      </div>

                      {error && (
                        <TFA2.InfoText
                          style={{
                            color: "var(--color-error)",
                            marginBottom: "12px",
                          }}
                        >
                          {error}
                        </TFA2.InfoText>
                      )}

                      <TFA2.ButtonGroup>
                        <TFA2.ActionButton
                          onClick={handleCancelAuthenticatorSetup}
                        >
                          Cancel
                        </TFA2.ActionButton>
                        <TFA2.ActionButton
                          $variant="primary"
                          onClick={handleVerifyAuthenticator}
                          disabled={
                            !qrCodeRevealed ||
                            (!isWaitingForSecondCode && verificationCode.length !== 6) ||
                            (isWaitingForSecondCode && secondVerificationCode.length !== 6) ||
                            isVerifying
                          }
                        >
                          {isVerifying 
                            ? "Verifying..." 
                            : isWaitingForSecondCode 
                            ? "Submit Both Codes" 
                            : "Continue"}
                        </TFA2.ActionButton>
                      </TFA2.ButtonGroup>
                    </div>
                  </div>
                )}

                {user?.user_authenticator?.id && (
                  <div>
                    <TFA2.InfoText>
                      Added on{" "}
                      {new Date(
                        user.user_authenticator?.created_at || "",
                      ).toLocaleDateString()}
                    </TFA2.InfoText>
                    <TFA2.ActionButton
                      $variant="danger"
                      onClick={() =>
                        user.user_authenticator?.id &&
                        handleRemoveAuthenticator(user.user_authenticator.id)
                      }
                    >
                      Remove Authenticator
                    </TFA2.ActionButton>
                  </div>
                )}
              </TFA2.TwoFactorSection>
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "var(--color-border)",
              margin: "0 0",
            }}
          />
        </>
      )}

      {/* Backup Codes Section */}
      {authFactorsEnabled?.backup_code && (
        <>
          <div
            style={{
              display: "flex",
              gap: "14px",
              padding: "16px 0",
              alignItems: "flex-start",
            }}
          >
            {/* Left side - Text content */}
            <div
              style={{
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "var(--color-foreground)",
                  marginBottom: "8px",
                }}
              >
                Backup Codes
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  lineHeight: "1.5",
                }}
              >
                Generate single-use backup codes for emergency access when you
                can't use your authenticator app.
              </p>
            </div>

            {/* Right side - Toggle button */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("backupCodes")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-input-background)",
                  color: "var(--color-foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {visibleSections.backupCodes ? "Hide" : "Show"}
                {visibleSections.backupCodes ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Backup Codes Card - Below the row */}
          {visibleSections.backupCodes && (
            <div
              style={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "32px",
              }}
            >
              <TFA2.TwoFactorSection>
                <TFA2.SectionHeader>
                  <TFA2.SectionTitle>Backup Codes</TFA2.SectionTitle>
                  <TFA2.StatusBadge
                    $active={
                      user?.backup_codes_generated || backupCodes.length > 0
                    }
                  >
                    {user?.backup_codes_generated || backupCodes.length > 0
                      ? "Generated"
                      : "Not Generated"}
                  </TFA2.StatusBadge>
                </TFA2.SectionHeader>

                {!backupCodes.length && !user?.backup_codes_generated && (
                  <TFA2.EmptyState>
                    <TFA2.EmptyStateText>
                      Keep these codes in a safe place. Each code can only be
                      used once.
                    </TFA2.EmptyStateText>
                    <TFA2.ActionButton
                      $variant="primary"
                      onClick={handleGenerateBackupCodes}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Generate Codes"}
                    </TFA2.ActionButton>
                  </TFA2.EmptyState>
                )}

                {!backupCodes.length && user?.backup_codes_generated && (
                  <div>
                    <TFA2.InfoText>
                      Your backup codes have been generated. You can regenerate
                      new ones if needed.
                    </TFA2.InfoText>
                    <TFA2.ActionButton
                      onClick={handleRegenerateBackupCodes}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Regenerating..." : "Regenerate Codes"}
                    </TFA2.ActionButton>
                  </div>
                )}

                {backupCodes.length > 0 && (
                  <div>
                    <TFA2.BackupCodesGrid>
                      {backupCodes.map((code, i) => (
                        <TFA2.BackupCode
                          key={i}
                          onClick={() => handleCopyCode(code)}
                          title="Click to copy"
                        >
                          {copiedCode === code && (
                            <Check size={12} style={{ marginRight: "4px" }} />
                          )}
                          {code}
                        </TFA2.BackupCode>
                      ))}
                    </TFA2.BackupCodesGrid>

                    <TFA2.ButtonGroup>
                      <TFA2.ActionButton onClick={handleDownloadCodes}>
                        <Download size={14} style={{ marginRight: "4px" }} />
                        Download
                      </TFA2.ActionButton>
                      <TFA2.ActionButton
                        $variant="danger"
                        onClick={handleRegenerateBackupCodes}
                        disabled={isGenerating}
                      >
                        Regenerate
                      </TFA2.ActionButton>
                    </TFA2.ButtonGroup>
                  </div>
                )}
              </TFA2.TwoFactorSection>
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "var(--color-border)",
              margin: "0 0",
            }}
          />
        </>
      )}

      {/* Remove Password Section - only show if password is enabled */}
      {passwordEnabled && hasAlternativeAuthMethods() && (
        <>
          <div
            style={{
              display: "flex",
              gap: "14px",
              padding: "16px 0",
              alignItems: "flex-start",
            }}
          >
            {/* Left side - Text content */}
            <div
              style={{
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "var(--color-foreground)",
                  marginBottom: "8px",
                }}
              >
                Remove Password
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  lineHeight: "1.5",
                }}
              >
                Disable password authentication for your account. You'll still
                be able to sign in using your connected social accounts or other
                authentication methods.
              </p>
            </div>

            {/* Right side - Toggle button */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection("removePassword")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-input-background)",
                  color: "var(--color-foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {visibleSections.removePassword ? "Hide" : "Show"}
                {visibleSections.removePassword ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Remove Password Card - Below the row */}
          {visibleSections.removePassword && (
            <div
              style={{
                padding: "16px 0",
                marginBottom: "12px",
              }}
            >
              {!hasAlternativeAuthMethods() && (
                <div
                  style={{
                    padding: "12px",
                    background: "var(--color-warning-background)",
                    color: "var(--color-warning-text)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    fontSize: "14px",
                  }}
                >
                  You must set up an alternative sign-in method (like Social
                  connection, phone otp) before you can remove your password.
                </div>
              )}
              <div style={{ marginBottom: "12px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-muted)",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  Remove password authentication and use only alternative
                  methods like email OTP, social sign-in, or authenticator apps.
                </p>
              </div>

              <FormGroup>
                <Label htmlFor="removePasswordInput">Current Password</Label>
                <PasswordInput>
                  <Input
                    id="removePasswordInput"
                    type={showRemovePassword ? "text" : "password"}
                    value={removePasswordInput}
                    onChange={(e) => setRemovePasswordInput(e.target.value)}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRemovePassword(!showRemovePassword)}
                  >
                    {showRemovePassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </PasswordInput>
                {passwordErrors.removePassword && (
                  <div
                    style={{
                      color: "var(--color-error)",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    {passwordErrors.removePassword}
                  </div>
                )}
              </FormGroup>

              <TFA2.ButtonGroup>
                <TFA2.ActionButton
                  type="button"
                  onClick={() => {
                    setRemovePasswordInput("");
                    setPasswordErrors({});
                    toggleSection("removePassword");
                  }}
                >
                  Cancel
                </TFA2.ActionButton>
                <TFA2.ActionButton
                  type="button"
                  $variant="danger"
                  onClick={handleRemovePassword}
                  disabled={
                    isRemoving ||
                    !removePasswordInput ||
                    !hasAlternativeAuthMethods()
                  }
                >
                  {isRemoving ? "Removing..." : "Remove Password"}
                </TFA2.ActionButton>
              </TFA2.ButtonGroup>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ProfileDetailsManagementSection = () => {
  const { deployment } = useDeployment();
  const { user, updateProfile, updateProfilePicture, deleteAccount } =
    useUser();
  const { toast } = useScreenContext();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || "");
    }
  }, [user?.first_name, user?.last_name, user?.username]);

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await updateProfilePicture(file);
      setSuccessMessage("Profile picture updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      toast("Failed to update profile picture. Please try again.", "error");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeProfilePicture = async () => {
    try {
      await updateProfile({});
      setSuccessMessage("Profile picture removed successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      toast("Failed to remove profile picture. Please try again.", "error");
    }
  };

  // Delete account functionality moved to Danger tab
  /*
  const handleDeleteAccount = async (password: string) => {
    try {
      await deleteAccount(password);
      toast("Account deleted successfully", "info");
      // Redirect to sign-in page or home page
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      toast(
        "Failed to delete account. Please check your password and try again.",
        "error",
      );
    }
  };
  */

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setErrors({});

    try {
      const updateData: any = {};

      if (deployment?.auth_settings?.first_name?.enabled) {
        updateData.first_name = firstName;
      }

      if (deployment?.auth_settings?.last_name?.enabled) {
        updateData.last_name = lastName;
      }

      if (deployment?.auth_settings?.username?.enabled) {
        updateData.username = username;
      }

      await updateProfile(updateData);
      setSuccessMessage("Settings updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      toast(
        error.message || "Failed to update profile. Please try again.",
        "error",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      setSuccessMessage("");
      // We'll show error in the form validation instead
      return;
    }

    if (window.confirm("Are you absolutely sure? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteAccount(password);
        setSuccessMessage("Account deleted successfully");
      } catch (error) {
        setSuccessMessage("");
        // Handle error appropriately
      } finally {
        setIsDeleting(false);
        setPassword("");
      }
    }
  };

  return (
    <>
      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px",
            background: "var(--color-success-background)",
            color: "var(--color-success)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✓{successMessage}
        </div>
      )}

      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "1px",
        }}
      >
        {/* Left Panel - Profile Picture */}
        <div
          style={{
            width: "280px",
            paddingRight: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            borderRight: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              border: "2px solid #e5e7eb",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            onClick={triggerFileInput}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {user?.profile_picture_url ? (
              <img
                src={user?.profile_picture_url}
                alt="Profile Picture"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "32px",
                  fontWeight: 500,
                }}
              >
                {user?.first_name?.charAt(0)?.toUpperCase() || (
                  <User size={48} />
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleProfilePictureChange}
            />
          </div>

          <div style={{ textAlign: "center", marginTop: "20px", width: "240px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  width: "100%",
                }}
              >
                Change Picture
              </Button>
              <Button
                onClick={removeProfilePicture}
                disabled={!user?.profile_picture_url}
                style={{
                  background: user?.profile_picture_url ? "#ef4444" : "#e5e7eb",
                  color: user?.profile_picture_url ? "white" : "#9ca3af",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: user?.profile_picture_url ? "pointer" : "not-allowed",
                  width: "100%",
                }}
              >
                Remove Picture
              </Button>
            </div>
            <div
              style={{ fontSize: "11px", color: "#9ca3af", lineHeight: "1.4" }}
            >
              <div>JPG, PNG, GIF • Max 2MB</div>
            </div>
          </div>

        </div>

        {/* Right Panel - Form Fields */}
        <div style={{ flex: 1, paddingLeft: "24px" }}>
          <form onSubmit={handleUpdateProfile}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {(deployment?.auth_settings?.first_name?.enabled ||
                deployment?.auth_settings?.last_name?.enabled) && (
                <div style={{ display: "flex", gap: "12px" }}>
                  {deployment?.auth_settings?.first_name?.enabled && (
                    <FormGroup style={{ flex: 1 }}>
                      <Label
                        style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "14px",
                          border: "1px solid #e5e7eb",
                        }}
                        required
                      />
                      {errors.firstName && (
                        <div
                          style={{
                            color: "var(--color-error)",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          {errors.firstName}
                        </div>
                      )}
                    </FormGroup>
                  )}

                  {deployment?.auth_settings?.last_name?.enabled && (
                    <FormGroup style={{ flex: 1 }}>
                      <Label
                        style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          fontSize: "14px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      {errors.lastName && (
                        <div
                          style={{
                            color: "var(--color-error)",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          {errors.lastName}
                        </div>
                      )}
                    </FormGroup>
                  )}
                </div>
              )}

              {deployment?.auth_settings?.username?.enabled && (
                <FormGroup>
                  <Label
                    style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  {errors.username && (
                    <div
                      style={{
                        color: "var(--color-error)",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {errors.username}
                    </div>
                  )}
                </FormGroup>
              )}


              {/* Button Group */}
              {(deployment?.auth_settings?.first_name?.enabled ||
                deployment?.auth_settings?.last_name?.enabled ||
                deployment?.auth_settings?.username?.enabled) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "20px",
                  }}
                >
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    style={{
                      background: "#6366f1",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {isUpdating ? <Spinner size={16} /> : "Save Changes"}
                  </Button>
                </div>
              )}

              {/* Delete Section */}
              <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #f3f4f6" }}>
                <button
                  onClick={() => {
                    if (!showDeleteConfirm) {
                      setShowDeleteConfirm(true);
                    } else {
                      setShowDeleteConfirm(false);
                      setPassword("");
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0",
                  }}
                >
                  {showDeleteConfirm ? "Cancel" : "Delete account"}
                </button>
                
                {showDeleteConfirm && (
                  <div style={{ marginTop: "16px", maxWidth: "300px" }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px 0" }}>
                      This action cannot be undone.
                    </p>
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          fontSize: "13px",
                          border: "1px solid #e5e7eb",
                          paddingRight: "40px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#6b7280",
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !password}
                      style={{
                        background: password ? "#dc2626" : "#e5e7eb",
                        color: password ? "white" : "#9ca3af",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: password ? "pointer" : "not-allowed",
                      }}
                    >
                      {isDeleting ? <Spinner size={12} /> : "Delete"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// Removed DeleteAccountAccordion - functionality moved to Danger tab
/*
const DeleteAccountAccordion = ({
  handleDeleteAccount,
}: {
  handleDeleteAccount: (password: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onDeleteClick = async () => {
    if (!password) {
      alert("Please enter your password to confirm account deletion.");
      return;
    }

    if (
      window.confirm("Are you absolutely sure? This action cannot be undone.")
    ) {
      setIsDeleting(true);
      try {
        await handleDeleteAccount(password);
      } finally {
        setIsDeleting(false);
        setPassword("");
      }
    }
  };

  return (
    <div
      style={{
        paddingTop: "16px",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--color-error)",
          fontWeight: 500,
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} />
          Delete your account
        </div>
        <div style={{ transition: "transform 0.2s ease" }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            padding: "16px",
            background: "var(--color-error-background)",
            borderRadius: "8px",
            marginTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-secondary-text)",
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            Permanently remove your account from the platform. This action is
            not reversible, so please continue with caution.
          </p>

          <div style={{ marginBottom: "12px" }}>
            <Label
              htmlFor="deletePassword"
              style={{
                fontSize: "14px",
                marginBottom: "8px",
                display: "block",
              }}
            >
              Enter your password to confirm
            </Label>
            <div style={{ position: "relative" }}>
              <Input
                id="deletePassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  paddingRight: "40px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-muted)",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onDeleteClick}
            disabled={isDeleting || !password}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--color-error)",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-background)",
              cursor: isDeleting || !password ? "not-allowed" : "pointer",
              opacity: isDeleting || !password ? 0.6 : 1,
            }}
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      )}
    </div>
  );
};
*/

export default ManageAccount;
