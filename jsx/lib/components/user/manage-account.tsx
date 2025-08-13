import { useCallback, useState } from "react";
import styled from "styled-components";
import {
  User,
  LogOut,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,

  Check,
  Mail,
  Phone,
  Link2,
  Shield,
  Activity,
} from "lucide-react";

// Local interface to match the actual API response
interface UserSignIn {
  id: string;
  session_id: string;
  user_id: string;
  active_organization_membership_id?: string;
  active_workspace_membership_id?: string;
  expires_at: string;
  last_active_at: string;
  ip_address: string;
  browser: string;
  device: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_code: string;
}
import * as TFA2 from "./2fa";
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
import { ChromeIcon } from "../icons/chrome";
import { FirefoxIcon } from "../icons/firefox";
import { SafariIcon } from "../icons/safari";
import { EdgeIcon } from "../icons/edge";
import { OperaIcon } from "../icons/opera";
import { BraveIcon } from "../icons/brave";
import { useDeployment } from "@/hooks/use-deployment";
import { Form, FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";
import { Spinner, Button, SearchInput } from "../utility";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ActionsCell,
} from "@/components/utility/table";
import { EmptyState } from "@/components/utility/empty-state";

import React from "react";
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
  padding-bottom: 24px;
  position: relative;

  @media (max-width: 768px) {
    border-radius: 16px;
    padding-bottom: 20px;
  }

  /* Blur effect at the bottom */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--color-background) 70%
    );
    pointer-events: none;
    z-index: 1;
  }
`;

const TabsContainer = styled.div`
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

const TabsList = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
`;



const Tab = styled.button<{ $isActive: boolean }>`
  padding: 12px 12px;
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
  min-width: fit-content;

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
  padding: 24px 24px 0 24px;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px 20px 0 20px;
  }
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

const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;











const UnknownBrowserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#6B7280" stroke="#9CA3AF" strokeWidth="0.5" />
    <circle cx="12" cy="12" r="8" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />
    <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#9CA3AF" />
    <circle cx="12" cy="12" r="1" fill="#6B7280" />
    <text x="12" y="16.5" textAnchor="middle" fill="#9CA3AF" fontSize="6">?</text>
  </svg>
);

const BrowserIcon = ({ browser }: { browser: string }) => {
  const browserName = browser?.toLowerCase() || "";
  const iconProps = { width: 20, height: 20 };

  if (browserName.includes("chrome")) {
    return <ChromeIcon {...iconProps} />;
  }

  if (browserName.includes("firefox")) {
    return <FirefoxIcon {...iconProps} />;
  }

  if (browserName.includes("safari")) {
    return <SafariIcon {...iconProps} />;
  }

  if (browserName.includes("edge")) {
    return <EdgeIcon {...iconProps} />;
  }

  if (browserName.includes("opera")) {
    return <OperaIcon {...iconProps} />;
  }

  if (browserName.includes("brave")) {
    return <BraveIcon {...iconProps} />;
  }

  return <UnknownBrowserIcon />;
};

const ActiveSessionsSection = () => {
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const { signins, removeSignin, refetch, loading } = useUserSignins();
  const { toast } = useScreenContext();
  
  // Type the signins data properly
  const typedSignins = signins as UserSignIn[] | undefined;

  const logoutSession = async (sessionId: string) => {
    try {
      await removeSignin(sessionId);
      await refetch();
      setActiveSession(null);
      toast("Session ended successfully", "info");
    } catch (error: any) {
      toast(error.message || "Failed to end session. Please try again.", "error");
    }
  };

  const formatLastActive = (lastActiveAt: string) => {
    if (!lastActiveAt || lastActiveAt.trim() === "") return "Unknown";

    const date = new Date(lastActiveAt);
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
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
    <>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{
          fontSize: "16px",
          color: "var(--color-foreground)",
          margin: 0
        }}>
          Active Sessions
        </h3>
        <p style={{
          fontSize: "14px",
          color: "var(--color-muted)",
          margin: 0
        }}>
          Manage your active browser sessions and sign-ins
        </p>
      </div>
      <div>
        {typedSignins && typedSignins.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Browser & Device</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Last Active</TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {typedSignins.map((signin) => (
                <TableRow key={signin.id}>
                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <IconWrapper>
                        <BrowserIcon browser={signin.browser || "Unknown"} />
                      </IconWrapper>
                      <div>
                        <div>{signin.browser || "Unknown Browser"}</div>
                        {signin.device && (
                          <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                            {signin.device}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>
                        {signin.city && signin.country
                          ? `${signin.city}, ${signin.country}`
                          : "Unknown location"
                        }
                      </div>
                      {signin.ip_address && (
                        <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                          {signin.ip_address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatLastActive(signin.last_active_at)}
                  </TableCell>
                  <ActionsCell>
                    <Dropdown
                      open={activeSession === signin.id}
                      openChange={(isOpen) => setActiveSession(isOpen ? signin.id : null)}
                    >
                      <DropdownTrigger>
                        <IconButton>•••</IconButton>
                      </DropdownTrigger>
                      <DropdownItems>
                        <DropdownItem onClick={() => logoutSession(signin.id)}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <LogOut size={14} />
                            End Session
                          </div>
                        </DropdownItem>
                      </DropdownItems>
                    </Dropdown>
                  </ActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No active sessions"
            description="You don't have any active sessions at the moment."
          />
        )}
      </div>
    </>
  );
};

const EmailManagementSection = () => {
  const { deployment } = useDeployment();
  const { toast } = useScreenContext();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter emails based on search query
  const filteredEmails = React.useMemo(() => {
    if (!user?.user_email_addresses) return [];
    if (!searchQuery.trim()) return user.user_email_addresses;

    return user.user_email_addresses.filter((email) =>
      email.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [user?.user_email_addresses, searchQuery]);

  return (
    <>
      <HeaderCTAContainer>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Email"
        />
        <div>
          <Button
            onClick={() => setIsAddingEmail(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px"
            }}
          >
            Add Email
          </Button>
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
      </HeaderCTAContainer>

      {!filteredEmails?.length ? (
        <EmptyState
          title={searchQuery ? "No emails match your search" : "No email addresses"}
          description="Add an email address to get started."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Email Address</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>{email.email}</TableCell>
                <TableCell>
                  {email.id === user?.primary_email_address_id
                    ? "Primary"
                    : email.verified
                      ? "Verified"
                      : "Not Verified"}
                </TableCell>
                <ActionsCell>
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
                      {email.id !== user?.primary_email_address_id && email.verified && (
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
                      {!email.verified && (
                        <DropdownItem
                          onClick={() => {
                            prepareEmailVerification(email.id);
                            setActiveDropdown(null);
                          }}
                        >
                          Verify email
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
                </ActionsCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

const PhoneManagementSection = () => {
  const { deployment } = useDeployment();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter phones based on search query
  const filteredPhones = React.useMemo(() => {
    if (!user?.user_phone_numbers) return [];
    if (!searchQuery.trim()) return user.user_phone_numbers;

    return user.user_phone_numbers.filter((phone) =>
      phone.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [user?.user_phone_numbers, searchQuery]);

  return (
    <>
      <HeaderCTAContainer>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Phone"
        />
        <div>
          <Button
            onClick={() => setIsAddingPhone(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px"
            }}
          >
            Add Phone
          </Button>
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
      </HeaderCTAContainer>

      {!filteredPhones?.length ? (
        <EmptyState
          title={searchQuery ? "No phones match your search" : "No phone numbers"}
          description="Add a phone number to get started."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Phone Number</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPhones.map((phone) => (
              <TableRow key={phone.id}>
                <TableCell>{phone.phone_number}</TableCell>
                <TableCell>
                  {phone.id === user?.primary_phone_number_id
                    ? "Primary"
                    : phone.verified
                      ? "Verified"
                      : "Not Verified"}
                </TableCell>
                <ActionsCell>
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
                      {phone.id !== user?.primary_phone_number_id && phone.verified && (
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
                      {!phone.verified && (
                        <DropdownItem
                          onClick={() => {
                            preparePhoneVerification(phone.id);
                            setActiveDropdown(null);
                          }}
                        >
                          Verify phone
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
                </ActionsCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

const IconWrapper = styled.div`
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: block;
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
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{
          fontSize: "16px",
          color: "var(--color-foreground)",
          margin: 0
        }}>
          Connected Accounts
        </h3>
        <p style={{
          fontSize: "14px",
          color: "var(--color-muted)",
          margin: 0
        }}>
          Connect social accounts for easy sign-in and profile sync
        </p>
      </div>
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
                    const redirectUrl = `${baseUrl}/auth/oauth2/init?provider=${provider.provider
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

type TabType =
  | "profile"
  | "email"
  | "phone"
  | "social"
  | "security"
  | "sessions";

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
  const showSecurityTab =
    authSettings?.password?.enabled ||
    authSettings?.auth_factors_enabled?.authenticator ||
    authSettings?.auth_factors_enabled?.phone_otp ||
    authSettings?.auth_factors_enabled?.backup_code;

  return (
    <TypographyProvider>
      <ScreenContext.Provider
        value={{ screen: null, setScreen: () => { }, toast }}
      >
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
                  Connections
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
            {activeTab === "email" && showEmailTab && (
              <EmailManagementSection />
            )}
            {activeTab === "phone" && showPhoneTab && (
              <PhoneManagementSection />
            )}
            {activeTab === "social" && <SocialManagementSection />}
            {activeTab === "security" && showSecurityTab && (
              <SecurityManagementSection />
            )}
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {toastLevel === "error" ? (
                  <AlertTriangle size={16} color="var(--color-error)" />
                ) : (
                  <Check size={16} color="var(--color-success)" />
                )}
                <span
                  style={{ fontSize: "14px", color: "var(--color-foreground)" }}
                >
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

// Security Card Component for better organization
const SecurityCard = styled.div`
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SecurityCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SecurityCardTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SecurityCardDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--color-muted);
  line-height: 1.5;
`;

const SecurityStatus = styled.span<{ $status: 'enabled' | 'disabled' | 'warning' }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props =>
    props.$status === 'enabled' ? 'var(--color-success-background)' :
      props.$status === 'warning' ? 'var(--color-warning-background)' :
        'var(--color-muted-background)'
  };
  color: ${props =>
    props.$status === 'enabled' ? 'var(--color-success)' :
      props.$status === 'warning' ? 'var(--color-warning)' :
        'var(--color-muted)'
  };
`;

const SecurityManagementSection = () => {
  const { deployment } = useDeployment();
  const {
    user,
    updatePassword,
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

  // 2FA state - keeping minimal state for future use

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  const toggleSection = (section: string) => {
    setVisibleSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Timer for second code countdown - removed for now

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

  // 2FA handlers - keeping only the ones that are used

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



  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Password Management Card */}
      {passwordEnabled && (
        <SecurityCard>
          <SecurityCardHeader>
            <SecurityCardTitle>
              <Shield size={20} />
              Password
            </SecurityCardTitle>
            <SecurityStatus $status={'enabled'}>
              {'Enabled'}
            </SecurityStatus>
          </SecurityCardHeader>
          <SecurityCardDescription>
            Update your password or manage your authentication settings.
          </SecurityCardDescription>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Button
              onClick={() => toggleSection("changePassword")}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                height: "36px",
                background: visibleSections.changePassword ? "var(--color-primary)" : "var(--color-background)",
                color: visibleSections.changePassword ? "white" : "var(--color-foreground)",
                border: "1px solid var(--color-border)"
              }}
            >
              Change Password
            </Button>

            {false && (
              <Button
                onClick={() => toggleSection("removePassword")}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  height: "36px",
                  background: visibleSections.removePassword ? "var(--color-error)" : "transparent",
                  color: visibleSections.removePassword ? "white" : "var(--color-error)",
                  border: "1px solid var(--color-error)"
                }}
              >
                Remove Password
              </Button>
            )}
          </div>
        </SecurityCard>
      )}

      {/* Two-Factor Authentication Card */}
      {authFactorsEnabled?.authenticator && (
        <SecurityCard>
          <SecurityCardHeader>
            <SecurityCardTitle>
              <Shield size={20} />
              Authenticator App
            </SecurityCardTitle>
            <SecurityStatus $status={user?.user_authenticator ? 'enabled' : 'disabled'}>
              {user?.user_authenticator ? 'Enabled' : 'Disabled'}
            </SecurityStatus>
          </SecurityCardHeader>
          <SecurityCardDescription>
            Use an authenticator app like Google Authenticator or Authy for secure two-factor authentication.
          </SecurityCardDescription>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {!user?.user_authenticator ? (
              <Button
                onClick={() => toggleSection("authenticator")}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  height: "36px",
                  background: visibleSections.authenticator ? "var(--color-primary)" : "var(--color-background)",
                  color: visibleSections.authenticator ? "white" : "var(--color-foreground)",
                  border: "1px solid var(--color-border)"
                }}
              >
                Set Up Authenticator
              </Button>
            ) : (
              <Button
                onClick={() => console.log('Remove authenticator')}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  height: "36px",
                  background: "transparent",
                  color: "var(--color-error)",
                  border: "1px solid var(--color-error)"
                }}
              >
                Remove Authenticator
              </Button>
            )}
          </div>
        </SecurityCard>
      )}

      {/* Backup Codes Card */}
      {authFactorsEnabled?.backup_code && user?.user_authenticator && (
        <SecurityCard>
          <SecurityCardHeader>
            <SecurityCardTitle>
              <Download size={20} />
              Backup Codes
            </SecurityCardTitle>
            <SecurityStatus $status={user?.backup_codes_generated ? 'enabled' : 'warning'}>
              {user?.backup_codes_generated ? 'Generated' : 'Not Generated'}
            </SecurityStatus>
          </SecurityCardHeader>
          <SecurityCardDescription>
            Generate backup codes to access your account if you lose your authenticator device.
          </SecurityCardDescription>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Button
              onClick={() => toggleSection("backupCodes")}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                height: "36px",
                background: visibleSections.backupCodes ? "var(--color-primary)" : "var(--color-background)",
                color: visibleSections.backupCodes ? "white" : "var(--color-foreground)",
                border: "1px solid var(--color-border)"
              }}
            >
              {user?.backup_codes_generated ? 'Regenerate Codes' : 'Generate Codes'}
            </Button>
          </div>
        </SecurityCard>
      )}

      {/* Expandable Forms */}
      {visibleSections.changePassword && passwordEnabled && (
        <SecurityCard>
          <SecurityCardTitle>Change Password</SecurityCardTitle>
          <Form onSubmit={handlePasswordSubmit} style={{ marginTop: "16px" }}>
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
        </SecurityCard>
      )}
    </div>
  );
};

const ProfileDetailsManagementSection = () => {
  const { deployment } = useDeployment();
  const { user, updateProfile, updateProfilePicture, deleteAccount } = useUser();
  const { toast } = useScreenContext();

  // State for profile management
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profile_picture_url || null,
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || "");
      setPreviewUrl(user.profile_picture_url || null);
    }
  }, [user]);

  const autoSave = React.useCallback(async () => {
    if (!user || isAutoSaving) return;

    try {
      setIsAutoSaving(true);
      const data: any = {};

      if (firstName !== user.first_name) {
        data.first_name = firstName;
      }
      if (lastName !== user.last_name) {
        data.last_name = lastName;
      }
      if (username !== user.username) {
        data.username = username;
      }

      // Only save if there are actual changes
      if (Object.keys(data).length > 0) {
        await updateProfile(data);
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 3000);
      }
    } catch (error: any) {
      toast(error.message || "Failed to save profile changes", "error");
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, updateProfile, firstName, lastName, username, isAutoSaving, toast]);

  const scheduleAutoSave = React.useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000); // Auto-save after 1 second of inactivity
  }, [autoSave]);

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
    scheduleAutoSave();
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
    scheduleAutoSave();
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    scheduleAutoSave();
  };

  const handleFirstNameBlur = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSave();
  };

  const handleLastNameBlur = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSave();
  };

  const handleUsernameBlur = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSave();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      // Auto-save image immediately
      setTimeout(async () => {
        try {
          await updateProfilePicture(file);
          user.refetch();
          toast("Profile picture updated successfully", "info");
        } catch (error: any) {
          toast(error.message || "Failed to update profile picture", "error");
          // Reset preview on error
          setPreviewUrl(user?.profile_picture_url || null);
        }
      }, 100);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (!user || confirmName !== user.username) return;

    setIsDeleting(true);
    try {
      await deleteAccount("");
      toast("Account deleted successfully", "info");
    } catch (error: any) {
      toast(error.message || "Failed to delete account", "error");
    } finally {
      setIsDeleting(false);
      setConfirmName("");
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xl)" }}>
        {/* Profile Picture Section - Two Column Layout */}
        <div style={{ display: "flex", gap: "var(--space-2xl)", alignItems: "center" }}>
          {/* Left Column - Profile Picture Preview */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "2px dashed var(--color-border)",
                background: previewUrl ? "transparent" : "var(--color-input-background)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
              onClick={triggerFileInput}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile Picture"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <User size={32} color="var(--color-muted)" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Right Column - Content and Controls */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <h3 style={{
                fontSize: "var(--font-sm)",
                color: "var(--color-foreground)",
                margin: "0 0 var(--space-2xs) 0"
              }}>
                Profile Picture
              </h3>
              <p style={{
                fontSize: "var(--font-xs)",
                color: "var(--color-secondary-text)",
                margin: 0
              }}>
                Upload an image to represent your profile
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "var(--space-xs) var(--space-md)",
                  fontSize: "var(--font-xs)",
                  height: "32px",
                  width: "100px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Download size={14} />
                {previewUrl ? "Change" : "Upload"}
              </Button>
              <Button
                onClick={() => {
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                style={{
                  background: "transparent",
                  color: "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                  padding: "var(--space-xs) var(--space-md)",
                  fontSize: "var(--font-xs)",
                  height: "32px",
                  width: "100px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertTriangle size={14} />
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            position: "relative",
            height: "1px",
            background: "var(--color-divider)",
            margin: "0",
          }}
        />

        {/* Profile Details */}
        <div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3 style={{
              fontSize: "var(--font-sm)",
              color: "var(--color-foreground)",
              margin: "0 0 var(--space-2xs) 0"
            }}>
              Profile Details
            </h3>
            <p style={{
              fontSize: "var(--font-xs)",
              color: "var(--color-secondary-text)",
              margin: 0
            }}>
              Basic information about your profile
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
            {/* First Name and Last Name in same row */}
            <div style={{ display: "flex", gap: "var(--space-md)" }}>
              <FormGroup style={{ flex: 1 }}>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={handleFirstNameChange}
                  onBlur={handleFirstNameBlur}
                  placeholder="Enter your first name"
                  required
                />
              </FormGroup>

              <FormGroup style={{ flex: 1 }}>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={handleLastNameChange}
                  onBlur={handleLastNameBlur}
                  placeholder="Enter your last name"
                  required
                />
              </FormGroup>
            </div>

            {deployment?.auth_settings?.username?.enabled && (
              <FormGroup>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  onBlur={handleUsernameBlur}
                  placeholder="Enter your username"
                  required
                />
              </FormGroup>
            )}
          </div>

          {/* Auto-save indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            marginTop: "var(--space-md)",
            fontSize: "var(--font-xs)",
            color: "var(--color-muted)"
          }}>
            {isAutoSaving && (
              <>
                <Spinner size={14} />
                <span>Saving changes...</span>
              </>
            )}
            {showSaveNotification && (
              <>
                <Check size={14} color="var(--color-success)" />
                <span style={{ color: "var(--color-success)" }}>Changes saved</span>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            position: "relative",
            height: "1px",
            background: "var(--color-divider)",
            margin: "0",
          }}
        />

        {/* Danger Zone */}
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{
              fontSize: "16px",
              color: "var(--color-foreground)",
              margin: "0 0 4px 0"
            }}>
              Danger Zone
            </h3>
            <p style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              margin: 0
            }}>
              Irreversible and destructive actions
            </p>
          </div>

          <div style={{
            padding: "20px",
            border: "1px solid var(--color-error)",
            borderRadius: "8px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: showDeleteConfirm ? "20px" : "0"
            }}>
              <div>
                <div style={{
                  fontSize: "14px",
                  color: "var(--color-foreground)",
                  marginBottom: "4px",
                  fontWeight: "500"
                }}>
                  Delete Account
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "var(--color-muted)"
                }}>
                  Once you delete your account, there is no going back. Please be certain.
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!showDeleteConfirm) {
                    setShowDeleteConfirm(true);
                  } else {
                    setShowDeleteConfirm(false);
                    setConfirmName("");
                  }
                }}
                style={{
                  background: "var(--color-error)",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "13px",
                  height: "32px",
                  width: "auto"
                }}
              >
                {showDeleteConfirm ? "Cancel" : "Delete"}
              </Button>
            </div>

            {showDeleteConfirm && (
              <div style={{ maxWidth: "400px" }}>
                <FormGroup>
                  <Label htmlFor="confirm_username">Confirm by typing your username</Label>
                  <Input
                    id="confirm_username"
                    type="text"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={`Type "${user?.username}" to confirm`}
                  />
                </FormGroup>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={confirmName !== user?.username || isDeleting}
                  style={{
                    background: confirmName === user?.username ? "var(--color-error)" : "transparent",
                    color: confirmName === user?.username ? "white" : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    padding: "8px 16px",
                    fontSize: "14px",
                    height: "36px",
                    cursor: confirmName === user?.username ? "pointer" : "not-allowed",
                    opacity: confirmName === user?.username ? 1 : 0.6,
                    marginTop: "12px",
                  }}
                >
                  {isDeleting ? <Spinner size={12} /> : "Delete Forever"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageAccount;
