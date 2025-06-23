import { useCallback, useState } from "react";
import styled from "styled-components";
import {
  // User,
  // Shield,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Plus,
  Eye,
  EyeOff,
  Key,
  Download,
  AlertTriangle,
  RefreshCw,
  // Smartphone,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  KeySquare,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { EmailAddPopover } from "@/components/user/add-email-popover";
import { PhoneAddPopover } from "@/components/user/add-phone-popover";
import {
  Dropdown,
  DropdownItem,
  DropdownItems,
  DropdownTrigger,
} from "@/components/utility/dropdown";
import { useUser, useUserSignins } from "@/hooks/use-user";
import { match, P } from "ts-pattern";
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
import { Screen, ScreenContext, useScreenContext } from "./context";

const TypographyProvider = styled.div`
  * {
    box-sizing: border-box;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }
`;

const Container = styled.div`
  width: 900px;
  max-width: 100%;
  height: 600px;
  background: var(--color-background);
  border-radius: 20px;
  box-shadow: 0 8px 30px var(--color-shadow);
  padding: 24px;
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }
`;

const MainContent = styled.div<{ $isAdding: boolean }>`
  display: flex;
  flex-direction: column;
  transform: translateX(${(props) => (props.$isAdding ? "-100%" : "0")});
  transition: transform 0.3s ease;
  width: 100%;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  height: 100%;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  color: var(--color-foreground);
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProfileHeader = styled.div`
  display: flex;
  padding: 0 4px;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 24px;
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  @media (max-width: 600px) {
    width: 60px;
    height: 60px;
  }
`;

const ProfileName = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 16px;
  margin: 0;
  color: var(--color-foreground);
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

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 2px;
  border-bottom: 1px solid var(--color-border);
  gap: 12px;
  color: var(--color-foreground);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--color-input-background);
  }
`;

const InfoLabel = styled.div`
  color: var(--color-secondary-text);
  font-size: 14px;
  width: 180px;
`;

const InfoContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: none;
  font-size: 14px;
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

const Badge = styled.span`
  background: var(--color-primary-background);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 500;
`;

const EmailItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  transition: all 0.2s ease;
`;

const EmailContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AddItemForm = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 100%;
  width: 100%;
  height: 100%;
  background: var(--color-background);
  overflow-y: auto;
  transform: translateX(${(props) => (props.$isVisible ? "-100%" : "0")});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  const { setScreen } = useScreenContext();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: 16,
          cursor: "pointer",
        }}
        onClick={() => setScreen(null)}
      >
        <ArrowLeft size={16} />
        <SectionTitle style={{ fontSize: 14 }}>{title}</SectionTitle>
      </div>

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

        {deployment?.auth_settings?.password?.enabled && (
          <InfoItem onClick={() => setScreen("password")}>
            <InfoLabel>Password</InfoLabel>
            <InfoContent>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Last changed 3 months ago
              </div>
              <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
            </InfoContent>
          </InfoItem>
        )}

        {(deployment?.auth_settings?.auth_factors_enabled?.authenticator ||
          deployment?.auth_settings?.auth_factors_enabled?.phone_otp ||
          deployment?.auth_settings?.auth_factors_enabled?.backup_code) && (
          <InfoItem onClick={() => setScreen("2fa")}>
            <InfoLabel>Two Factor Verification</InfoLabel>
            <InfoContent>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.second_factor_policy === "none"
                  ? "Add a second layer of security to your account"
                  : "Set up your second factors"}
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
                    activeSession === signin.id ? null : signin.id
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

  return (
    <>
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
                                  deleteEmailAddress(email.id);
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
                                  deleteEmailAddress(email.id);
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
    (conn) => conn.enabled
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
            (conn) => conn.provider === provider.provider
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
                        connectedAccount.id.toString()
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

export const ManageAccount = () => {
  const { loading } = useUser();
  const [screen, setScreen] = useState<Screen>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [setToastMessage]
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

  return (
    <TypographyProvider>
      <ScreenContext.Provider value={{ screen, setScreen, toast }}>
        <Container>
          <Layout>
            <div
              style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <MainContent $isAdding={!!screen}>
                <ProfileManagementSection />
              </MainContent>

              <AddItemForm $isVisible={!!screen}>
                {match(screen)
                  .with("email", () => <EmailManagementSection />)
                  .with(P.union("phone", "2fa/phone"), () => (
                    <PhoneManagementSection />
                  ))
                  .with("social", () => <SocialManagementSection />)
                  .with("password", () => <PasswordManagementSection />)
                  .with("2fa", () => <TwoFactorManagementSection />)
                  .with("2fa/authenticator", () => (
                    <AuthenticatorManagementSection />
                  ))
                  .with("active-sessions", () => <ActiveSessionsSection />)
                  .with("2fa/backup_code", () => (
                    <BackupCodeManagementSection />
                  ))
                  .with("profile-details", () => (
                    <ProfileDetailsManagementSection />
                  ))
                  .otherwise(() => null)}
              </AddItemForm>
              {toastMessage && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    background: "var(--color-input-background)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px var(--color-shadow)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    zIndex: 100,
                    color:
                      toastLevel === "error"
                        ? "var(--color-error)"
                        : "var(--color-secondary-text)",
                  }}
                >
                  {toastLevel === "error" && (
                    <AlertTriangle size={14} color="var(--color-error)" />
                  )}
                  {toastLevel === "info" && (
                    <Check size={14} color="var(--color-secondary-text)" />
                  )}
                  <span>{toastMessage}</span>
                </div>
              )}
            </div>
          </Layout>
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

const PasswordManagementSection = () => {
  const { updatePassword, removePassword, user } = useUser();
  const { deployment } = useDeployment();
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isRemovePasswordOpen, setRemovePasswordOpen] = useState(false);

  // Don't render if password is disabled
  if (!deployment?.auth_settings?.password?.enabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
      setChangePasswordOpen(false);
      alert("Password updated successfully");
    } catch (error) {
      setErrors({ form: "Failed to update password. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!removePasswordInput) {
      setErrors({ removePassword: "Current password is required" });
      return;
    }

    setIsRemoving(true);
    setErrors({});

    try {
      await removePassword(removePasswordInput);
      setRemovePasswordInput("");
      setRemovePasswordOpen(false);
      alert(
        "Password removed successfully. You can now sign in using alternative methods."
      );
    } catch (error: any) {
      setErrors({
        removePassword:
          error?.message ||
          "Failed to remove password. Please check your password and ensure you have alternative authentication methods configured.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const hasAlternativeAuthMethods = () => {
    const hasVerifiedEmail = user?.user_email_addresses?.some(
      (email) => email.verified
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
      <SectionHeader title="Password" />
      <InfoItem
        onClick={() => setChangePasswordOpen(!isChangePasswordOpen)}
        style={{
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <InfoLabel>Change password</InfoLabel>
        <InfoContent>
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          ></div>
          {isChangePasswordOpen ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </InfoContent>
      </InfoItem>

      {isChangePasswordOpen && (
        <div
          style={{
            paddingTop: "16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Form onSubmit={handleSubmit}>
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
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </PasswordInput>
              {errors.currentPassword && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.currentPassword}
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
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </PasswordInput>
              {errors.newPassword && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.newPassword}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </PasswordInput>
              {errors.confirmPassword && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.confirmPassword}
                </div>
              )}
            </FormGroup>

            <div style={{ marginTop: "16px" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  background: "var(--color-primary)",
                  color: "var(--color-background)",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </Form>
        </div>
      )}

      <>
        <InfoItem onClick={() => setRemovePasswordOpen(!isRemovePasswordOpen)}>
          <InfoLabel>Remove password</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            ></div>
            {isRemovePasswordOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </InfoContent>
        </InfoItem>
        {isRemovePasswordOpen && (
          <div style={{ paddingTop: "16px" }}>
            {!hasAlternativeAuthMethods() && (
              <div
                style={{
                  padding: "12px",
                  background: "var(--color-warning-background)",
                  color: "var(--color-warning-text)",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                You must set up an alternative sign-in method (like Social
                connection, phone otp) before you can remove your password.
              </div>
            )}
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-muted)",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Remove password authentication and use only alternative methods
                like email OTP, social sign-in, or authenticator apps.
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
              {errors.removePassword && (
                <div
                  style={{
                    color: "var(--color-error)",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.removePassword}
                </div>
              )}
            </FormGroup>

            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                onClick={handleRemovePassword}
                disabled={
                  isRemoving ||
                  !removePasswordInput ||
                  !hasAlternativeAuthMethods()
                }
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  background: "var(--color-error)",
                  color: "var(--color-background)",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 500,
                  fontSize: "14px",
                  cursor:
                    isRemoving ||
                    !removePasswordInput ||
                    !hasAlternativeAuthMethods()
                      ? "not-allowed"
                      : "pointer",
                  transition: "background-color 0.2s",
                  opacity:
                    isRemoving ||
                    !removePasswordInput ||
                    !hasAlternativeAuthMethods()
                      ? 0.6
                      : 1,
                }}
              >
                {isRemoving ? "Removing..." : "Remove Password"}
              </button>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

const TwoFactorManagementSection = () => {
  const { deployment } = useDeployment();

  const authFactorsEnabled = deployment?.auth_settings?.auth_factors_enabled;

  // Don't render if no 2FA methods are enabled
  const hasAny2FAEnabled =
    authFactorsEnabled?.authenticator ||
    authFactorsEnabled?.phone_otp ||
    authFactorsEnabled?.backup_code;

  if (!hasAny2FAEnabled) {
    return null;
  }

  const { setScreen } = useScreenContext();
  return (
    <div>
      <SectionHeader title="Two-Factor Verification" />

      {authFactorsEnabled?.authenticator && (
        <InfoItem onClick={() => setScreen("2fa/authenticator")}>
          <InfoLabel>Authenticator App</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
              }}
            >
              Add an authenticator app to your account
            </div>
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
          </InfoContent>
        </InfoItem>
      )}

      {authFactorsEnabled?.phone_otp && (
        <InfoItem onClick={() => setScreen("2fa/phone")}>
          <InfoLabel>Phone number</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
              }}
            >
              Add a phone number for 2FA
            </div>
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
          </InfoContent>
        </InfoItem>
      )}

      {authFactorsEnabled?.backup_code && (
        <InfoItem onClick={() => setScreen("2fa/backup_code")}>
          <InfoLabel>Backup Codes</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
              }}
            >
              Download backup codes for your account
            </div>
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
          </InfoContent>
        </InfoItem>
      )}

      <div style={{ marginTop: "24px" }}>
        <p style={{ fontSize: "14px", color: "var(--color-muted)" }}>
          Secure your account with an additional verification step during
          sign-in.
        </p>
      </div>
    </div>
  );
};

const AuthenticatorManagementSection = () => {
  const [firstOtpCode, setFirstOtpCode] = useState("");
  const [secondOtpCode, setSecondOtpCode] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [activeAuthenticator, setActiveAuthenticator] = useState<string | null>(
    null
  );
  const { user, setupAuthenticator, verifyAuthenticator, deleteAuthenticator } =
    useUser();
  const [newAuthenticator, setNewAuthenticator] = useState<UserAuthenticator>();
  const [error, setError] = useState<string | null>(null);
  const handleSetupAuthenticator = async () => {
    const response = await setupAuthenticator();
    setNewAuthenticator(response);
    setIsSettingUp(true);
  };

  const handleVerifyAuthenticator = async () => {
    if (
      firstOtpCode.length === 6 &&
      secondOtpCode.length === 6 &&
      newAuthenticator?.id
    ) {
      const result = await verifyAuthenticator(newAuthenticator?.id, [
        firstOtpCode,
        secondOtpCode,
      ]);

      if (result.errors?.length) {
        setError(result.errors[0].message);
      } else {
        setIsSettingUp(false);
        setFirstOtpCode("");
        setSecondOtpCode("");
        user.refetch();
      }
    }
  };

  const handleRemoveAuthenticator = async (id: string) => {
    await deleteAuthenticator(id);
    setActiveAuthenticator(null);
    user.refetch();
  };

  return (
    <div>
      <SectionTitle
        style={{
          fontSize: "14px",
          margin: "6px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 500 }}>Authenticator App</span>
      </SectionTitle>

      {!user.user_authenticator && !isSettingUp && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "40px",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-muted)",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                Get verification codes even when your phone is offline,
                providing an extra layer of security for your account.
              </p>

              <div style={{ fontSize: "14px", marginBottom: "24px" }}>
                Use your favorite authenticator app to download from the App
                Stores.
              </div>

              <Button
                $primary
                type="button"
                onClick={handleSetupAuthenticator}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                }}
              >
                <Plus size={16} />
                Set up authenticator
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "16px",
                    background: "var(--color-background)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px var(--color-shadow)",
                    overflow: "hidden",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "var(--color-primary)",
                      borderRadius: "50%",
                      transform: "rotate(45deg)",
                    }}
                  />
                </div>

                <div
                  style={{
                    position: "absolute",
                    width: "140px",
                    height: "2px",
                    background: "var(--color-border)",
                    top: "50%",
                    left: "0",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "2px",
                    height: "140px",
                    background: "var(--color-border)",
                    left: "50%",
                    top: "0",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    top: 0,
                    left: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    top: 0,
                    right: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    bottom: 0,
                    left: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    bottom: 0,
                    right: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {user.user_authenticator?.id && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px",
              background: "var(--color-success-background)",
              borderRadius: "8px",
              marginBottom: "16px",
              boxShadow: "0 1px 2px var(--color-shadow)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--color-success-background)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px var(--color-shadow)",
              }}
            >
              ✓
            </div>
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  marginBottom: "4px",
                  color: "var(--color-primary)",
                }}
              >
                Authenticator App Connected
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-secondary-text)",
                }}
              >
                Your account is protected with two-factor authentication.
              </div>
            </div>
          </div>

          <EmailItem
            style={{
              padding: "12px 16px",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
            }}
          >
            <EmailContent>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-foreground)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "500",
                }}
              >
                Authenticator App
                <Badge
                  style={{
                    background: "var(--color-success-background)",
                    color: "var(--color-primary)",
                    fontSize: "11px",
                    padding: "2px 8px",
                  }}
                >
                  Verified
                </Badge>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                Added on{" "}
                {new Date(
                  user.user_authenticator.created_at
                ).toLocaleDateString()}
              </div>
            </EmailContent>
            <Dropdown>
              <DropdownTrigger>
                <IconButton
                  onClick={() =>
                    setActiveAuthenticator(
                      activeAuthenticator === user.user_authenticator?.id
                        ? null
                        : user.user_authenticator?.id || null
                    )
                  }
                  style={{
                    width: "32px",
                    height: "32px",
                  }}
                >
                  •••
                </IconButton>
              </DropdownTrigger>
              <DropdownItems>
                <DropdownItem
                  $destructive
                  onClick={() =>
                    user.user_authenticator?.id &&
                    handleRemoveAuthenticator(user.user_authenticator.id)
                  }
                >
                  Disconnect
                </DropdownItem>
              </DropdownItems>
            </Dropdown>
          </EmailItem>
        </div>
      )}

      {isSettingUp && newAuthenticator && (
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              margin: "20px 0",
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "30px",
              maxWidth: "680px",
              background: "var(--color-background-hover)",
              padding: "24px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "var(--color-background)",
                  padding: "16px",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px var(--color-shadow)",
                  display: "inline-block",
                }}
              >
                <QRCodeSVG
                  width={180}
                  height={180}
                  value={newAuthenticator.otp_url || ""}
                />
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-foreground)",
                  marginTop: "16px",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                Scan the QR code with your authenticator app
              </div>
            </div>

            <div>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                style={{
                  background: "var(--color-background)",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <FormGroup>
                  <Label
                    style={{
                      marginBottom: "12px",
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Enter two consecutive OTPs from authenticator
                  </Label>
                  <div style={{ marginBottom: "12px" }}>
                    <Input
                      type="text"
                      value={firstOtpCode}
                      onChange={(e) =>
                        setFirstOtpCode(
                          e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                        )
                      }
                      placeholder="••••••"
                      maxLength={6}
                      style={{
                        textAlign: "center",
                        letterSpacing: "8px",
                        fontSize: "18px",
                        padding: "8px 12px",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>
                  <Input
                    type="text"
                    value={secondOtpCode}
                    onChange={(e) =>
                      setSecondOtpCode(
                        e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                      )
                    }
                    placeholder="••••••"
                    maxLength={6}
                    style={{
                      textAlign: "center",
                      letterSpacing: "8px",
                      fontSize: "18px",
                      padding: "8px 12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-muted)",
                      marginTop: "8px",
                    }}
                  >
                    This confirms that your authenticator app is properly set
                    up.
                  </div>
                </FormGroup>

                {error && (
                  <div
                    style={{
                      color: "var(--color-error)",
                      marginTop: "12px",
                      padding: "8px 12px",
                      background: "var(--color-error-background)",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="submit"
                    $primary
                    onClick={handleVerifyAuthenticator}
                    style={{
                      padding: "8px 16px",
                    }}
                  >
                    Verify and Enable
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setIsSettingUp(false)}
                    style={{
                      padding: "8px 16px",
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          {/* Having Trouble Section - Accordion */}
          <ManualSetupAccordion
            totp={newAuthenticator?.totp_secret}
            otpUrl={newAuthenticator?.otp_url}
          />
        </div>
      )}
    </div>
  );
};

const ManualSetupAccordion = ({
  totp,
  otpUrl,
}: {
  totp?: string;
  otpUrl?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!totp && !otpUrl) return null;

  return (
    <div
      style={{
        maxWidth: "700px",
        marginTop: "32px",
        borderTop: "1px solid var(--color-border)",
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
          color: "var(--color-secondary-text)",
          fontWeight: 500,
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HelpCircle size={16} />
          Having trouble with the QR code?
        </div>
        <div style={{ transition: "transform 0.2s ease" }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            padding: "16px",
            background: "var(--color-background-hover)",
            borderRadius: "8px",
            marginTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-secondary-text)",
              margin: "0 0 16px 0",
            }}
          >
            If you're having trouble scanning the QR code, you can manually set
            up your authenticator app using the following details:
          </p>

          {totp && (
            <div style={{ marginBottom: "16px" }}>
              <Label>Manual setup code (TOTP Secret)</Label>
              <div
                style={{
                  fontSize: "14px",
                  fontFamily: "monospace",
                  background: "var(--color-background-hover)",
                  padding: "12px",
                  borderRadius: "6px",
                  wordBreak: "break-all",
                  marginTop: "4px",
                  border: "1px solid var(--color-border)",
                }}
              >
                {totp}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  marginTop: "4px",
                }}
              >
                Enter this code manually in your authenticator app if you can't
                scan the QR code.
              </div>
            </div>
          )}

          {otpUrl && (
            <div>
              <Label>OTP URL</Label>
              <div
                style={{
                  fontSize: "14px",
                  fontFamily: "monospace",
                  background: "var(--color-background-hover)",
                  padding: "12px",
                  borderRadius: "6px",
                  wordBreak: "break-all",
                  marginTop: "4px",
                  border: "1px solid var(--color-border)",
                }}
              >
                {otpUrl}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-muted)",
                  marginTop: "4px",
                }}
              >
                Some authenticator apps allow you to enter this URL directly.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BackupCodeManagementSection = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { user, generateBackupCodes, regenerateBackupCodes } = useUser();
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

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

  const handleDownloadCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyCode = (code: string) => {
    copyToClipboard(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAllCodes = () => {
    const allCodes = backupCodes.join("\n");
    copyToClipboard(allCodes);
    setCopiedCode("all");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const matchCase = (code: string, index: number) => {
    return `backup-code-${code}-${index}`;
  };

  return (
    <div>
      <SectionTitle
        style={{
          fontSize: "14px",
          margin: "6px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 500 }}>Backup Codes</span>
      </SectionTitle>

      {!backupCodes.length && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "40px",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-muted)",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                Generate backup codes to sign in if you can't access your
                authenticator app or phone number.
              </p>
              <div style={{ fontSize: "14px", marginBottom: "24px" }}>
                Keep these codes safe and secure. If lost, you can regenerate
                them here anytime.
              </div>

              <Button
                $primary
                type="button"
                onClick={handleGenerateBackupCodes}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                }}
              >
                {user.backup_codes_generated ? (
                  <RefreshCw size={16} />
                ) : (
                  <KeySquare size={16} />
                )}
                {user.backup_codes_generated
                  ? "Regenerate codes"
                  : "Generate codes"}
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "16px",
                    background: "var(--color-background)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px var(--color-shadow)",
                    overflow: "hidden",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--color-background-hover)",
                      borderRadius: "50%",
                    }}
                  >
                    <Key size={32} style={{ color: "var(--color-muted)" }} />
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    width: "140px",
                    height: "2px",
                    background: "var(--color-border)",
                    top: "50%",
                    left: "0",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "2px",
                    height: "140px",
                    background: "var(--color-border)",
                    left: "50%",
                    top: "0",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    top: 0,
                    left: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    top: 0,
                    right: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    bottom: 0,
                    left: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    background: "var(--color-background)",
                    bottom: 0,
                    right: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {backupCodes.length > 0 && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "14px",
                color: "var(--color-muted)",
                marginBottom: "12px",
              }}
            >
              Keep these backup codes in a safe place. These codes can be used
              once to sign in if you lose access to your authenticator app or
              phone number.
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Button
                type="button"
                onClick={handleCopyAllCodes}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Copy size={16} />
                {copiedCode === "all" ? "Copied!" : "Copy all"}
              </Button>

              <Button
                type="button"
                onClick={handleDownloadCodes}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Download size={16} />
                Download
              </Button>

              <Button
                type="button"
                onClick={handleRegenerateBackupCodes}
                disabled={isGenerating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isGenerating ? (
                  <Spinner size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Regenerate
              </Button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {(backupCodes.length > 0
              ? backupCodes
              : Array(10).fill("••••-••••-••••")
            ).map((code: string, i: number) => (
              <div
                key={matchCase(code, i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  background: "var(--color-background-hover)",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  minHeight: "32px",
                }}
              >
                <span style={{ color: "var(--color-foreground)" }}>{code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(code)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color:
                      copiedCode === code
                        ? "var(--color-success)"
                        : "var(--color-muted)",
                    padding: "2px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Copy code"
                >
                  {copiedCode === code ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "12px",
              background: "var(--color-error-background)",
              borderRadius: "8px",
              color: "var(--color-error)",
              fontSize: "14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <AlertTriangle size={16} style={{ marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                Important
              </div>
              <p style={{ margin: 0 }}>
                If you regenerate backup codes, your previous codes will no
                longer work. Keep these codes safe and secure.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileDetailsManagementSection = () => {
  const { deployment } = useDeployment();
  const { user, updateProfile, updateProfilePicture, deleteAccount } =
    useUser();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await updateProfilePicture(file);
      setSuccessMessage("Profile picture updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors({
        profilePicture: "Failed to update profile picture. Please try again.",
      });
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
      setErrors({
        profilePicture: "Failed to remove profile picture. Please try again.",
      });
    }
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      await deleteAccount(password);
      alert("Account deleted successfully");
      // Redirect to sign-in page or home page
      window.location.href = "/";
    } catch (error) {
      setErrors({
        deleteAccount:
          "Failed to delete account. Please check your password and try again.",
      });
    }
  };

  return (
    <div>
      <SectionHeader title="Your Account" />

      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px",
            background: "#dcfce7",
            color: "var(--color-primary)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✓{successMessage}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={triggerFileInput}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: "0 4px 10px var(--color-shadow)",
                }}
              >
                <Avatar
                  src={user?.profile_picture_url}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleProfilePictureChange}
              />
            </button>
            <button
              onClick={removeProfilePicture}
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                boxShadow: "0 2px 4px var(--color-shadow)",
              }}
              aria-label="Remove profile picture"
              type="button"
            >
              <Trash2 size={14} color="var(--color-error)" />
            </button>
          </div>

          <p
            style={{
              margin: "0 0 4px 0",
              fontSize: "15px",
              color: "var(--color-foreground)",
              fontWeight: "500",
            }}
          >
            {user?.first_name} {user?.last_name}
          </p>

          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: "14px",
              color: "var(--color-muted)",
            }}
          >
            @{user?.username || "username"}
          </p>

          {errors.profilePicture && (
            <div
              style={{
                color: "var(--color-error)",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              {errors.profilePicture}
            </div>
          )}
        </div>

        {(deployment?.auth_settings?.first_name?.enabled ||
          deployment?.auth_settings?.last_name?.enabled) && (
          <div>
            <div style={{ display: "flex", gap: "12px" }}>
              {deployment?.auth_settings?.first_name?.enabled && (
                <FormGroup style={{ flex: 1 }}>
                  <Label>First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "var(--color-input-background)",
                      borderColor: errors.firstName
                        ? "var(--color-error)"
                        : undefined,
                    }}
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
                  <Label>Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "var(--color-input-background)",
                      borderColor: errors.lastName
                        ? "var(--color-error)"
                        : undefined,
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
          </div>
        )}

        {deployment?.auth_settings?.username?.enabled && (
          <div style={{ marginTop: "12px" }}>
            <FormGroup>
              <Label>Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "var(--color-input-background)",
                  borderColor: errors.username
                    ? "var(--color-error)"
                    : undefined,
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
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <DeleteAccountAccordion handleDeleteAccount={handleDeleteAccount} />
        </div>
      </form>
    </div>
  );
};

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

          <div style={{ marginBottom: "16px" }}>
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

export default ManageAccount;
