import { useCallback, useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { QRCodeSVG } from "qrcode.react";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

import {
  User,
  LogOut,
  Download,
  AlertTriangle,
  Check,
  Mail,
  Phone,
  Link2,
  Shield,
  Activity,
  X,
  ChevronDown,
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
import { EmailAddPopover } from "@/components/user/add-email-popover";
import { PhoneAddPopover } from "@/components/user/add-phone-popover";
import { SetupTOTPPopover } from "@/components/user/setup-totp-popover";
import { ChangePasswordPopover } from "@/components/user/change-password-popover";
import { RemovePasswordPopover } from "@/components/user/remove-password-popover";
import { BackupCodesPopover } from "@/components/user/backup-codes-popover";
import { AddPasskeyPopover } from "@/components/user/add-passkey-popover";
import {
  Dropdown,
  DropdownItem,
  DropdownItems,
  DropdownTrigger,
} from "@/components/utility/dropdown";
import { useUser, useUserSignins } from "@/hooks/use-user";
import { useSession } from "@/hooks/use-session";
import { GoogleIcon } from "../icons/google";
import { MicrosoftIcon } from "../icons/microsoft";
import { GithubIcon } from "../icons/github";
import { XIcon } from "../icons/x";
import { GitLabIcon } from "../icons/gitlab";
import { LinkedInIcon } from "../icons/linkedin";
import { DiscordIcon } from "../icons/discord";
import { ChromeIcon } from "../icons/chrome";
import { FirefoxIcon } from "../icons/firefox";
import { SafariIcon } from "../icons/safari";
import { EdgeIcon } from "../icons/edge";
import { OperaIcon } from "../icons/opera";
import { BraveIcon } from "../icons/brave";
import { useDeployment } from "@/hooks/use-deployment";
import { countries } from "@/constants/geo";
import { ConfirmationPopover } from "../utility/confirmation-popover";

import { FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";
import {
  Spinner,
  Button,
  SearchInput,
  DefaultStylesProvider,
} from "../utility";
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
    content: "";
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
  font-weight: 400;
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
  margin-bottom: 0;
`;

const UnknownBrowserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    style={{ color: "var(--color-secondary-text)" }}
  >
    <circle
      cx="12"
      cy="12"
      r="11"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.5"
      opacity="0.6"
    />
    <circle
      cx="12"
      cy="12"
      r="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      opacity="0.3"
    />
    <path
      d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
      fill="currentColor"
      opacity="0.5"
    />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fill="currentColor"
      fontSize="6"
      opacity="0.7"
    >
      ?
    </text>
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
  const { refetch: refetchSession } = useSession();
  const { toast } = useScreenContext();

  // Type the signins data properly
  const typedSignins = signins as UserSignIn[] | undefined;

  const logoutSession = async (sessionId: string) => {
    try {
      await removeSignin(sessionId);
      // Refetch both the signins list and the current session
      await Promise.all([refetch(), refetchSession()]);
      setActiveSession(null);
      toast("Session ended successfully", "info");
    } catch (error: any) {
      toast(
        error.message || "Failed to end session. Please try again.",
        "error",
      );
    }
  };

  const formatLastActive = (lastActiveAt: string) => {
    if (!lastActiveAt || lastActiveAt.trim() === "") return "Unknown";

    const date = new Date(lastActiveAt);
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

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
        <h3
          style={{
            fontSize: "16px",
            color: "var(--color-foreground)",
            margin: 0,
          }}
        >
          Active Sessions
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-muted)",
            margin: 0,
          }}
        >
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <IconWrapper>
                        <BrowserIcon browser={signin.browser || "Unknown"} />
                      </IconWrapper>
                      <div>
                        <div>{signin.browser || "Unknown Browser"}</div>
                        {signin.device && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--color-muted)",
                            }}
                          >
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
                          : "Unknown location"}
                      </div>
                      {signin.ip_address && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-muted)",
                          }}
                        >
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
                      openChange={(isOpen) =>
                        setActiveSession(isOpen ? signin.id : null)
                      }
                    >
                      <DropdownTrigger>
                        <IconButton>•••</IconButton>
                      </DropdownTrigger>
                      <DropdownItems>
                        <DropdownItem onClick={() => logoutSession(signin.id)}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
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
  const [verifyingEmailId, setVerifyingEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const emailButtonRef = useRef<HTMLButtonElement>(null);
  const verifyButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>(
    {},
  );
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
      // Check if this is the primary email
      if (emailId === user?.primary_email_address_id) {
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
      email.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [user?.user_email_addresses, searchQuery]);

  return (
    <>
      <HeaderCTAContainer style={{ marginBottom: "20px" }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Email"
        />
        <div style={{ position: "relative" }}>
          <Button
            ref={emailButtonRef}
            onClick={() => setIsAddingEmail(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px",
            }}
          >
            Add Email
          </Button>
          {isAddingEmail && (
            <EmailAddPopover
              triggerRef={emailButtonRef}
              onClose={() => setIsAddingEmail(false)}
              onAddEmail={async (email) => {
                const newEmailData = await createEmailAddress(email);
                setNewEmail(newEmailData.data.id);
                await prepareEmailVerification(newEmailData.data.id);
                user.refetch();
                // Don't close the popover - let it transition to OTP step
              }}
              onPrepareVerification={async () => {
                await prepareEmailVerification(newEmail);
                user.refetch();
              }}
              onAttemptVerification={async (otp) => {
                await attemptEmailVerification(newEmail, otp);
                user.refetch();
                setIsAddingEmail(false);
                setNewEmail("");
                toast("Email added and verified successfully!", "info");
              }}
            />
          )}
        </div>
      </HeaderCTAContainer>

      {!filteredEmails?.length ? (
        <EmptyState
          title={
            searchQuery ? "No emails match your search" : "No email addresses"
          }
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
                  {/* Only show dropdown if there are actions available (not primary or not verified) */}
                  {email.id !== user?.primary_email_address_id ||
                    !email.verified ? (
                    <Dropdown
                      open={activeDropdown === email.id}
                      openChange={(isOpen) =>
                        setActiveDropdown(isOpen ? email.id : null)
                      }
                    >
                      <DropdownTrigger>
                        <IconButton
                          ref={(ref: HTMLButtonElement | null) => {
                            if (ref) verifyButtonRefs.current[email.id] = ref;
                          }}
                        >
                          •••
                        </IconButton>
                      </DropdownTrigger>
                      <DropdownItems>
                        {email.id !== user?.primary_email_address_id &&
                          email.verified && (
                            <DropdownItem
                              onClick={async () => {
                                try {
                                  await makeEmailPrimary(email.id);
                                  user.refetch();
                                  setActiveDropdown(null);
                                  toast(
                                    "Primary email updated successfully",
                                    "info",
                                  );
                                } catch (error: any) {
                                  toast(
                                    error.message ||
                                    "Failed to update primary email",
                                    "error",
                                  );
                                }
                              }}
                            >
                              Make primary
                            </DropdownItem>
                          )}
                        {!email.verified && (
                          <DropdownItem
                            onClick={async () => {
                              setActiveDropdown(null);
                              await prepareEmailVerification(email.id);
                              setVerifyingEmailId(email.id);
                            }}
                          >
                            Verify email
                          </DropdownItem>
                        )}
                        {email.id !== user?.primary_email_address_id && (
                          <DropdownItem
                            $destructive
                            onClick={() => {
                              handleDeleteEmail(email.id);
                              setActiveDropdown(null);
                            }}
                          >
                            Remove
                          </DropdownItem>
                        )}
                      </DropdownItems>
                    </Dropdown>
                  ) : null}
                </ActionsCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {verifyingEmailId && (
        <EmailAddPopover
          existingEmail={
            user?.user_email_addresses?.find((e) => e.id === verifyingEmailId)
              ?.email
          }
          triggerRef={{ current: verifyButtonRefs.current[verifyingEmailId] }}
          onClose={() => setVerifyingEmailId(null)}
          onAddEmail={async () => {
            // This won't be called since we're starting at OTP step
          }}
          onPrepareVerification={async () => {
            await prepareEmailVerification(verifyingEmailId);
            user.refetch();
          }}
          onAttemptVerification={async (otp) => {
            await attemptEmailVerification(verifyingEmailId, otp);
            user.refetch();
            setVerifyingEmailId(null);
            toast("Email verified successfully!", "info");
          }}
        />
      )}
    </>
  );
};

const PhoneManagementSection = () => {
  const { deployment } = useDeployment();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [verifyingPhoneId, setVerifyingPhoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const phoneButtonRef = useRef<HTMLButtonElement>(null);
  const phoneVerifyButtonRefs = useRef<Record<string, HTMLButtonElement>>({});
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

  // Helper function to get country flag from dial code
  const getCountryFlag = (countryCode: string) => {
    const country = countries.find((c) => c.dialCode === countryCode);
    return country?.flag || "🌍";
  };

  // Filter phones based on search query
  const filteredPhones = React.useMemo(() => {
    if (!user?.user_phone_numbers) return [];
    if (!searchQuery.trim()) return user.user_phone_numbers;

    return user.user_phone_numbers.filter((phone) =>
      phone.phone_number.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [user?.user_phone_numbers, searchQuery]);

  return (
    <>
      <HeaderCTAContainer style={{ marginBottom: "20px" }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Phone"
        />
        <div style={{ position: "relative" }}>
          <Button
            ref={phoneButtonRef}
            onClick={() => setIsAddingPhone(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px",
            }}
          >
            Add Phone
          </Button>
          {isAddingPhone && (
            <PhoneAddPopover
              triggerRef={phoneButtonRef}
              onClose={() => setIsAddingPhone(false)}
              onAddPhone={async (phone, countryCode) => {
                const newPhoneData = await createPhoneNumber(
                  phone,
                  countryCode,
                );
                setNewPhone(newPhoneData.data.id);
                await preparePhoneVerification(newPhoneData.data.id);
                // Don't close the popover - let it transition to OTP step
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
          {verifyingPhoneId && (
            <PhoneAddPopover
              existingPhone={
                user?.user_phone_numbers?.find((p) => p.id === verifyingPhoneId)
                  ?.phone_number
              }
              triggerRef={{
                current: phoneVerifyButtonRefs.current[verifyingPhoneId],
              }}
              onClose={() => setVerifyingPhoneId(null)}
              onAddPhone={async () => {
                // This won't be called since we're starting at OTP step
              }}
              onPrepareVerification={async () => {
                await preparePhoneVerification(verifyingPhoneId);
                user.refetch();
              }}
              onAttemptVerification={async (otp) => {
                await attemptPhoneVerification(verifyingPhoneId, otp);
                user.refetch();
                setVerifyingPhoneId(null);
              }}
            />
          )}
        </div>
      </HeaderCTAContainer>

      {!filteredPhones?.length ? (
        <EmptyState
          title={
            searchQuery ? "No phones match your search" : "No phone numbers"
          }
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
                <TableCell>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>
                      {getCountryFlag(phone.country_code)}
                    </span>
                    <span>{phone.country_code}</span>
                    <span>{phone.phone_number}</span>
                  </div>
                </TableCell>
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
                      <IconButton
                        ref={(ref: HTMLButtonElement | null) => {
                          if (ref)
                            phoneVerifyButtonRefs.current[phone.id] = ref;
                        }}
                      >
                        •••
                      </IconButton>
                    </DropdownTrigger>
                    <DropdownItems>
                      {phone.id !== user?.primary_phone_number_id &&
                        phone.verified && (
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
                          onClick={async () => {
                            await preparePhoneVerification(phone.id);
                            setVerifyingPhoneId(phone.id);
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
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: block;
  }
`;

const SocialManagementSection = () => {
  const { user, disconnectSocialConnection, connectSocialAccount } = useUser();
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
    gitlab_oauth: {
      icon: <GitLabIcon />,
      label: "GitLab",
    },
    linkedin_oauth: {
      icon: <LinkedInIcon />,
      label: "LinkedIn",
    },
    discord_oauth: {
      icon: <DiscordIcon />,
      label: "Discord",
    },
    x_oauth: {
      icon: <XIcon />,
      label: "X",
    },
  };

  const enabledProviders =
    deployment?.social_connections.filter((conn) => conn.enabled) || [];

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{
            fontSize: "16px",
            margin: "0 0 6px 0",
            letterSpacing: "-0.01em",
            color: "var(--color-foreground)",
          }}
        >
          Connected Accounts
        </h3>
        <p
          style={{
            fontSize: "13px",
            margin: 0,
            lineHeight: "1.5",
            color: "var(--color-muted)",
          }}
        >
          Connect social accounts for easy sign-in and profile sync
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {enabledProviders.map((provider, index) => {
          const connectedAccounts =
            user?.social_connections?.filter(
              (conn) => conn.provider === provider.provider,
            ) || [];
          const providerInfo =
            socialAuthProviders[
            provider.provider as keyof typeof socialAuthProviders
            ];

          if (!providerInfo) return null;

          return (
            <div key={provider.provider}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  minHeight: "58px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "var(--color-foreground)",
                  }}
                >
                  <IconWrapper>{providerInfo.icon}</IconWrapper>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {providerInfo.label}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  {connectedAccounts.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "var(--color-input-background)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "13px",
                        color: "var(--color-muted)",
                      }}
                    >
                      <span>{account.email_address}</span>
                      <IconButton
                        onClick={async () => {
                          await disconnectSocialConnection(
                            account.id.toString(),
                          );
                          user.refetch();
                        }}
                        style={{ padding: "2px" }}
                      >
                        <X size={14} />
                      </IconButton>
                    </div>
                  ))}

                  {connectedAccounts.length > 0 ? (
                    <Button
                      onClick={() => {
                        connectSocialAccount({
                          provider: provider.provider,
                          redirectUri: window.location.href,
                        });
                      }}
                      style={{
                        padding: "6px 24px",
                        fontSize: "13px",
                      }}
                    >
                      Add
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        connectSocialAccount({
                          provider: provider.provider,
                          redirectUri: window.location.href,
                        });
                      }}
                      style={{
                        padding: "6px 14px",
                        fontSize: "13px",
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {index < enabledProviders.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--color-border)",
                  }}
                />
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
      <DefaultStylesProvider>
        <Container
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spinner />
        </Container>
      </DefaultStylesProvider>
    );

  const authSettings = deployment?.auth_settings;
  const showEmailTab = authSettings?.email_address?.enabled;
  const showPhoneTab = authSettings?.phone_number?.enabled;
  const showSocialTab = deployment?.social_connections?.some((conn) => conn.enabled) || false;
  const showSecurityTab =
    authSettings?.password?.enabled ||
    authSettings?.auth_factors_enabled?.authenticator ||
    authSettings?.auth_factors_enabled?.phone_otp ||
    authSettings?.auth_factors_enabled?.backup_code;

  return (
    <DefaultStylesProvider>
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

                {showSocialTab && (
                  <Tab
                    $isActive={activeTab === "social"}
                    onClick={() => setActiveTab("social")}
                  >
                    <TabIcon>
                      <Link2 size={16} />
                      Connections
                    </TabIcon>
                  </Tab>
                )}

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
              {activeTab === "social" && showSocialTab && <SocialManagementSection />}
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
                    style={{
                      fontSize: "14px",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {toastMessage}
                  </span>
                </div>
              </div>
            )}
          </Container>
        </ScreenContext.Provider>
      </TypographyProvider>
    </DefaultStylesProvider>
  );
};

import { Switch } from "../utility/switch";

const SecurityManagementSection = () => {
  const { deployment } = useDeployment();
  const {
    user,
    updatePassword,
    removePassword,
    setupAuthenticator,
    verifyAuthenticator,
    deleteAuthenticator,
    generateBackupCodes,
    regenerateBackupCodes,
    updateProfile,
    getPasskeys,
    registerPasskey,
    deletePasskey,
  } = useUser();
  const { toast } = useScreenContext();

  const [secondFactorPolicy, setSecondFactorPolicy] = useState(
    user?.second_factor_policy || "none",
  );

  const [showDeleteAuthPopover, setShowDeleteAuthPopover] = useState(false);

  const handleSecondFactorPolicyChange = async (
    policy: "none" | "enforced",
  ) => {
    try {
      await updateProfile({ second_factor_policy: policy });
      setSecondFactorPolicy(policy);
      toast("2FA requirement updated successfully", "info");
    } catch (error: any) {
      toast(error.message || "Failed to update 2FA requirement", "error");
    }
  };

  const [showTOTPPopover, setShowTOTPPopover] = useState(false);
  const [showPasswordPopover, setShowPasswordPopover] = useState(false);
  const [showRemovePasswordPopover, setShowRemovePasswordPopover] =
    useState(false);
  const [showBackupCodesPopover, setShowBackupCodesPopover] = useState(false);
  const totpButtonRef = useRef<HTMLButtonElement>(null);
  const passwordButtonRef = useRef<HTMLButtonElement>(null);
  const removePasswordButtonRef = useRef<HTMLButtonElement>(null);
  const backupCodesButtonRef = useRef<HTMLButtonElement>(null);

  // Passkey state
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [isPasskeyExpanded, setIsPasskeyExpanded] = useState(false);
  const [showAddPasskeyPopover, setShowAddPasskeyPopover] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<string | null>(null);
  const addPasskeyButtonRef = useRef<HTMLButtonElement>(null);

  const [setupStep, setSetupStep] = useState<
    "table" | "qr" | "verify" | "backup" | "success"
  >("table");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [authenticatorId, setAuthenticatorId] = useState<string>("");
  const [verificationCodes, setVerificationCodes] = useState<string[]>([
    "",
    "",
  ]);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingQR] = useState(false);
  const [isRemovingAuth, setIsRemovingAuth] = useState(false);

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

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    await updatePassword(currentPassword, newPassword);
    await user.refetch();
    toast("Password updated successfully", "info");
  };

  const handleRemovePassword = async (currentPassword: string) => {
    await removePassword(currentPassword);
    await user.refetch();
    toast("Password removed successfully", "info");
  };

  const canRemovePassword = () => {
    if (!user) return false;

    const hasVerifiedEmail = user.user_email_addresses?.some(
      (email) => email.verified,
    );

    const hasVerifiedPhone = user.user_phone_numbers?.some(
      (phone) => phone.verified,
    );

    const hasSocialConnection =
      user.social_connections && user.social_connections.length > 0;

    const authSettings = deployment?.auth_settings;

    const hasAlternativeAuth =
      (authSettings?.first_factor === "email_otp" && hasVerifiedEmail) ||
      (authSettings?.magic_link?.enabled && hasVerifiedEmail) ||
      authSettings?.passkey?.enabled ||
      (authSettings?.auth_factors_enabled?.phone_otp && hasVerifiedPhone) ||
      (hasSocialConnection &&
        deployment?.social_connections?.some((sc) => sc.enabled));

    return hasAlternativeAuth;
  };

  const handleVerifyAuthenticator = async () => {
    if (verificationCodes.some((code) => code.length !== 6)) {
      toast("Please enter both 6-digit verification codes", "error");
      return;
    }

    try {
      setIsVerifying(true);
      await verifyAuthenticator(authenticatorId, verificationCodes);
      await user.refetch();

      if (authFactorsEnabled?.backup_code) {
        const codes = await generateBackupCodes();
        setBackupCodes(codes);
        await user.refetch();
        setSetupStep("backup");
      } else {
        setSetupStep("success");
      }
    } catch (error: any) {
      toast(error.message || "Invalid verification codes", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteSetup = () => {
    setSetupStep("table");
    setQrCodeUrl("");
    setSecretKey("");
    setAuthenticatorId("");
    setVerificationCodes(["", ""]);
    setBackupCodes([]);
    toast("Two-factor authentication setup completed successfully!", "info");
  };

  const handleRemoveAuthenticator = async () => {
    if (!user?.user_authenticator?.id) return;

    try {
      setIsRemovingAuth(true);
      await deleteAuthenticator(user.user_authenticator.id);
      await user.refetch();
      setShowDeleteAuthPopover(false);
      toast("Two-factor authentication removed successfully", "info");
    } catch (error: any) {
      toast(error.message || "Failed to remove authenticator", "error");
    } finally {
      setIsRemovingAuth(false);
    }
  };

  const handleGenerateNewBackupCodes = async () => {
    if (isGeneratingCodes) return;

    try {
      setIsGeneratingCodes(true);
      const codes = await regenerateBackupCodes();
      setBackupCodes(codes);
      await user.refetch();
      setShowBackupCodesPopover(true);
      toast("New backup codes generated", "info");
    } catch (error: any) {
      toast(error.message || "Failed to generate backup codes", "error");
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard
      .writeText(codesText)
      .then(() => {
        toast("Backup codes copied to clipboard", "info");
      })
      .catch(() => {
        toast("Failed to copy backup codes", "error");
      });
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wacht-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup codes downloaded", "info");
  };

  // Passkey handlers
  const loadPasskeys = async () => {
    if (!deployment?.auth_settings?.passkey?.enabled) return;
    try {
      setIsLoadingPasskeys(true);
      const result = await getPasskeys();
      setPasskeys(result.data || []);
    } catch (error) {
      console.error("Failed to load passkeys:", error);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };

  const handleRegisterPasskey = async (name: string) => {
    try {
      setIsRegisteringPasskey(true);
      await registerPasskey(name || undefined);
      await loadPasskeys();
      toast("Passkey registered successfully!", "info");
    } catch (error: any) {
      toast(error.message || "Failed to register passkey", "error");
      throw error; // Re-throw so popover can show error
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      await deletePasskey(id);
      await loadPasskeys();
      toast("Passkey removed", "info");
    } catch (error: any) {
      toast(error.message || "Failed to remove passkey", "error");
    }
  };

  // Load passkeys on mount
  useEffect(() => {
    loadPasskeys();
  }, [deployment?.auth_settings?.passkey?.enabled]);

  // Create security items for table display
  const securityItems = [];

  if (passwordEnabled) {
    securityItems.push({
      id: "password",
      name: "Password",
      description: "Secure your account with a strong password",
      status: user?.has_password ? "Enabled" : "Disabled",
      actions: user?.has_password ? ["change"] : ["setup"],
    });
  }

  if (deployment?.auth_settings?.passkey?.enabled) {
    securityItems.push({
      id: "passkey",
      name: "Passkeys",
      description: "Sign in faster with fingerprint, face, or screen lock",
      status: passkeys.length > 0 ? `${passkeys.length} registered` : "",
      actions: passkeys.length > 0 ? ["manage", "add"] : ["add"],
    });
  }

  if (authFactorsEnabled?.authenticator) {
    securityItems.push({
      id: "authenticator",
      name: "Authenticator App",
      description: "Use an authenticator app for extra security",
      status: user?.user_authenticator ? "Enabled" : "Disabled",
      actions: user?.user_authenticator ? ["remove"] : ["setup"],
    });
  }

  if (user?.user_authenticator) {
    securityItems.push({
      id: "backup_codes",
      name: "Backup Codes",
      description: "Recovery codes if you lose your authenticator",
      status: user?.backup_codes_generated ? "Generated" : "Not Generated",
      actions: ["generate"],
    });
  }

  if (user?.user_authenticator) {
    securityItems.push({
      id: "second_factor_policy",
      name: "Require 2FA",
      description: "Require a second factor for all sign-ins",
      status: secondFactorPolicy === "enforced" ? "Enforced" : "Optional",
      actions: ["toggle"],
    });
  }


  if (setupStep !== "table") {
    return (
      <>
        <HeaderCTAContainer>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={16} />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--color-foreground)",
              }}
            >
              {setupStep === "qr" && "Setup Two-Factor Authentication"}
              {setupStep === "verify" && "Verify Your Authenticator"}
              {setupStep === "backup" && "Save Your Backup Codes"}
              {setupStep === "success" && "Setup Complete!"}
            </span>
          </div>
          <Button
            onClick={() => setSetupStep("table")}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-foreground)",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ← Back
          </Button>
        </HeaderCTAContainer>

        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            textAlign: "center",
            padding: "24px",
          }}
        >
          {setupStep === "qr" && (
            <>
              <p
                style={{
                  color: "var(--color-secondary-text)",
                  marginBottom: "24px",
                }}
              >
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.)
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}
              >
                {isLoadingQR ? (
                  <div
                    style={{
                      width: "200px",
                      height: "200px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--color-input-background)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          border: "2px solid var(--color-border)",
                          borderTop: "2px solid var(--color-primary)",
                          borderRadius: "50%",
                          animation: `${spin} 1s linear infinite`,
                          margin: "0 auto 8px",
                        }}
                      ></div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-secondary-text)",
                        }}
                      >
                        Loading QR Code...
                      </div>
                    </div>
                  </div>
                ) : qrCodeUrl ? (
                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      background: "white",
                    }}
                  >
                    <QRCodeSVG
                      value={qrCodeUrl}
                      size={200}
                      level="M"
                      marginSize={0}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "200px",
                      height: "200px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--color-input-background)",
                      color: "var(--color-error)",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    QR Code Not Available
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "var(--color-input-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-secondary-text)",
                    margin: "0 0 8px 0",
                  }}
                >
                  Or enter this code manually:
                </p>
                <code
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    wordBreak: "break-all",
                  }}
                >
                  {secretKey || "Loading..."}
                </code>
              </div>

              <Button
                onClick={() => setSetupStep("verify")}
                disabled={!qrCodeUrl || !secretKey}
                style={{
                  padding: "10px 20px",
                  background:
                    !qrCodeUrl || !secretKey
                      ? "var(--color-border)"
                      : "var(--color-primary)",
                  color:
                    !qrCodeUrl || !secretKey
                      ? "var(--color-secondary-text)"
                      : "white",
                  border: `1px solid ${!qrCodeUrl || !secretKey ? "var(--color-border)" : "var(--color-primary)"}`,
                  cursor: !qrCodeUrl || !secretKey ? "not-allowed" : "pointer",
                }}
              >
                I've Scanned the Code
              </Button>
            </>
          )}

          {setupStep === "verify" && (
            <>
              <p
                style={{
                  color: "var(--color-secondary-text)",
                  marginBottom: "24px",
                }}
              >
                Enter two consecutive codes from your authenticator app to
                verify setup
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}
              >
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCodes[0]}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .substring(0, 6);
                    setVerificationCodes([value, verificationCodes[1]]);
                  }}
                  maxLength={6}
                  style={{
                    width: "100px",
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                />
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCodes[1]}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .substring(0, 6);
                    setVerificationCodes([verificationCodes[0], value]);
                  }}
                  maxLength={6}
                  style={{
                    width: "100px",
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}
              >
                <Button
                  onClick={() => setSetupStep("qr")}
                  style={{
                    padding: "8px 16px",
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyAuthenticator}
                  disabled={
                    isVerifying ||
                    verificationCodes.some((code) => code.length !== 6)
                  }
                  style={{
                    padding: "8px 16px",
                    background: "var(--color-primary)",
                    color: "white",
                    border: "1px solid var(--color-primary)",
                  }}
                >
                  {isVerifying ? "Verifying..." : "Verify & Continue"}
                </Button>
              </div>
            </>
          )}

          {setupStep === "backup" && (
            <>
              <div
                style={{
                  background: "var(--color-warning-background)",
                  border: "1px solid var(--color-warning-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  textAlign: "left",
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: "var(--color-warning)", marginTop: "2px" }}
                />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                    Important!
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--color-secondary-text)",
                    }}
                  >
                    Store these codes safely. Each code can only be used once if
                    you lose access to your authenticator device.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  marginBottom: "24px",
                  maxWidth: "300px",
                  margin: "0 auto 24px auto",
                }}
              >
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    style={{
                      background: "var(--color-input-background)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "8px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}
              >
                <Button
                  onClick={copyBackupCodes}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Copy All
                </Button>
                <Button
                  onClick={downloadBackupCodes}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Download size={16} style={{ marginRight: "4px" }} />
                  Download
                </Button>
              </div>

              <Button
                onClick={handleCompleteSetup}
                style={{
                  padding: "10px 20px",
                  background: "var(--color-primary)",
                  color: "white",
                  border: "1px solid var(--color-primary)",
                }}
              >
                Complete Setup
              </Button>
            </>
          )}

          {setupStep === "success" && (
            <>
              <div style={{ marginBottom: "24px" }}>
                <Check
                  size={48}
                  style={{
                    color: "var(--color-success)",
                    marginBottom: "16px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    margin: "0 0 8px 0",
                  }}
                >
                  All Set!
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-secondary-text)",
                    margin: 0,
                  }}
                >
                  Your account is now protected with two-factor authentication.
                </p>
              </div>

              <Button
                onClick={handleCompleteSetup}
                style={{
                  padding: "10px 20px",
                  background: "var(--color-primary)",
                  color: "white",
                  border: "1px solid var(--color-primary)",
                }}
              >
                Continue to Security
              </Button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderCTAContainer>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "var(--color-foreground)",
            }}
          >
            Security Settings
          </span>
        </div>
      </HeaderCTAContainer>

      {!securityItems.length ? (
        <EmptyState
          title="No security features available"
          description="Contact your administrator to enable security features."
        />
      ) : (
        <div>
          {securityItems.map((item, index) => (
            <div key={item.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 400,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-secondary-text)",
                    }}
                  >
                    {item.description}
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {/* Status badge - hide for passkeys since they have custom buttons */}
                  {item.status && item.id !== "passkey" && (
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: 400,
                        background:
                          item.status === "Enabled" || item.status === "Generated"
                            ? "var(--color-success-background)"
                            : "var(--color-background-hover)",
                        color:
                          item.status === "Enabled" || item.status === "Generated"
                            ? "var(--color-success)"
                            : "var(--color-secondary-text)",
                      }}
                    >
                      {item.status}
                    </span>
                  )}

                  <div style={{ position: "relative" }}>
                    {item.id === "password" && (
                      <>
                        {user?.has_password ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <div style={{ position: "relative" }}>
                              <Button
                                ref={passwordButtonRef}
                                onClick={() => setShowPasswordPopover(true)}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  background: "var(--color-primary)",
                                  color: "white",
                                  border: "1px solid var(--color-primary)",
                                  borderRadius: "var(--radius-md)",
                                  fontWeight: "400",
                                }}
                              >
                                Change
                              </Button>

                              {showPasswordPopover && (
                                <ChangePasswordPopover
                                  triggerRef={passwordButtonRef}
                                  onClose={() => setShowPasswordPopover(false)}
                                  onChangePassword={handleChangePassword}
                                />
                              )}
                            </div>

                            {canRemovePassword() && (
                              <div style={{ position: "relative" }}>
                                <Button
                                  ref={removePasswordButtonRef}
                                  onClick={() =>
                                    setShowRemovePasswordPopover(true)
                                  }
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    background: "transparent",
                                    color: "var(--color-error)",
                                    border: "1px solid var(--color-error)",
                                    borderRadius: "var(--radius-md)",
                                    fontWeight: "400",
                                  }}
                                >
                                  Remove
                                </Button>

                                {showRemovePasswordPopover && (
                                  <RemovePasswordPopover
                                    triggerRef={removePasswordButtonRef}
                                    onClose={() =>
                                      setShowRemovePasswordPopover(false)
                                    }
                                    onRemovePassword={handleRemovePassword}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ position: "relative" }}>
                            <Button
                              ref={passwordButtonRef}
                              onClick={() => setShowPasswordPopover(true)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                background: "var(--color-primary)",
                                color: "white",
                                border: "1px solid var(--color-primary)",
                                borderRadius: "var(--radius-md)",
                                fontWeight: "400",
                              }}
                            >
                              Setup
                            </Button>

                            {showPasswordPopover && (
                              <ChangePasswordPopover
                                triggerRef={passwordButtonRef}
                                onClose={() => setShowPasswordPopover(false)}
                                onChangePassword={handleChangePassword}
                                isSetup={true}
                              />
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {item.id === "authenticator" &&
                      !user?.user_authenticator && (
                        <>
                          <div style={{ position: "relative" }}>
                            <Button
                              ref={totpButtonRef}
                              onClick={() => setShowTOTPPopover(true)}
                              disabled={isLoadingQR}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                background: "var(--color-primary)",
                                color: "white",
                                border: "1px solid var(--color-primary)",
                                borderRadius: "var(--radius-md)",
                                fontWeight: "400",
                              }}
                            >
                              {isLoadingQR ? "Setting up..." : "Setup"}
                            </Button>

                            {showTOTPPopover && (
                              <SetupTOTPPopover
                                triggerRef={totpButtonRef}
                                onClose={() => setShowTOTPPopover(false)}
                                onSetupTOTP={async () => {
                                  const result = await setupAuthenticator();
                                  setAuthenticatorId(result.id);
                                  return result;
                                }}
                                onVerifyTOTP={async (codes) => {
                                  await verifyAuthenticator(
                                    authenticatorId,
                                    codes,
                                  );
                                  await user.refetch();
                                  toast(
                                    "Two-factor authentication enabled successfully!",
                                    "info",
                                  );
                                }}
                              />
                            )}
                          </div>
                        </>
                      )}

                    {item.id === "authenticator" &&
                      user?.user_authenticator && (
                        <div style={{ position: "relative" }}>
                          <Button
                            onClick={() => setShowDeleteAuthPopover(true)}
                            disabled={isRemovingAuth}
                            style={{
                              padding: "6px 16px",
                              fontSize: "13px",
                              background: "var(--color-error)",
                              border: "1px solid var(--color-error)",
                              color: "white",
                              cursor: isRemovingAuth ? "not-allowed" : "pointer",
                              opacity: isRemovingAuth ? 0.6 : 1,
                            }}
                          >
                            {isRemovingAuth ? "Removing..." : "Remove"}
                          </Button>
                          {showDeleteAuthPopover && (
                            <ConfirmationPopover
                              title="Remove MFA and reset policy to default?"
                              onConfirm={handleRemoveAuthenticator}
                              onCancel={() => setShowDeleteAuthPopover(false)}
                            />
                          )}
                        </div>
                      )}

                    {item.id === "backup_codes" && (
                      <>
                        <div style={{ position: "relative" }}>
                          <Button
                            ref={backupCodesButtonRef}
                            onClick={handleGenerateNewBackupCodes}
                            disabled={isGeneratingCodes}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              background: "var(--color-primary)",
                              color: "white",
                              border: "1px solid var(--color-primary)",
                              borderRadius: "var(--radius-md)",
                              fontWeight: "400",
                            }}
                          >
                            {isGeneratingCodes
                              ? "Generating..."
                              : user?.backup_codes_generated
                                ? "Regenerate"
                                : "Generate"}
                          </Button>

                          {showBackupCodesPopover && (
                            <BackupCodesPopover
                              triggerRef={backupCodesButtonRef}
                              codes={backupCodes}
                              onClose={() => setShowBackupCodesPopover(false)}
                              onCopy={copyBackupCodes}
                              onDownload={downloadBackupCodes}
                            />
                          )}
                        </div>
                      </>
                    )}

                    {item.id === "second_factor_policy" && (
                      <Switch
                        checked={secondFactorPolicy === "enforced"}
                        onChange={(checked) => {
                          handleSecondFactorPolicyChange(
                            checked ? "enforced" : "none",
                          );
                        }}
                      />
                    )}

                    {item.id === "passkey" && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Button
                          onClick={() => setIsPasskeyExpanded(!isPasskeyExpanded)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            background: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "400",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            width: "auto",
                            height: "auto",
                          }}
                        >
                          {isPasskeyExpanded ? "Hide" : "Manage"} ({passkeys.length})
                          <ChevronDown
                            size={14}
                            style={{
                              transform: isPasskeyExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </Button>
                        <div style={{ position: "relative" }}>
                          <Button
                            ref={addPasskeyButtonRef}
                            onClick={() => setShowAddPasskeyPopover(true)}
                            disabled={isRegisteringPasskey}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              background: "var(--color-primary)",
                              color: "white",
                              border: "1px solid var(--color-primary)",
                              borderRadius: "var(--radius-md)",
                              fontWeight: "400",
                              cursor: isRegisteringPasskey ? "not-allowed" : "pointer",
                              opacity: isRegisteringPasskey ? 0.7 : 1,
                              whiteSpace: "nowrap",
                              width: "auto",
                              height: "auto",
                            }}
                          >
                            {isRegisteringPasskey ? "Registering..." : "Add"}
                          </Button>

                          {showAddPasskeyPopover && (
                            <AddPasskeyPopover
                              triggerRef={addPasskeyButtonRef}
                              onClose={() => setShowAddPasskeyPopover(false)}
                              onAddPasskey={handleRegisterPasskey}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Passkey Accordion Content */}
              {item.id === "passkey" && isPasskeyExpanded && (
                <div
                  style={{
                    padding: "12px 0",
                    borderTop: "1px solid var(--color-border)",
                    marginTop: "8px",
                  }}
                >
                  {isLoadingPasskeys ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                      <Spinner />
                    </div>
                  ) : passkeys.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "16px",
                        color: "var(--color-secondary-text)",
                        fontSize: "13px",
                      }}
                    >
                      No passkeys registered yet
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {passkeys.map((passkey: any) => (
                        <div
                          key={passkey.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            background: "var(--color-input-background)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span
                              style={{
                                fontWeight: 500,
                                fontSize: "13px",
                                color: "var(--color-foreground)",
                              }}
                            >
                              {passkey.name || "Unnamed Passkey"}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--color-secondary-text)",
                              }}
                            >
                              {passkey.device_type === "platform" ? "This device" : "Security key"}
                              {passkey.last_used_at && ` • Last used ${new Date(passkey.last_used_at).toLocaleDateString()}`}
                            </span>
                          </div>
                          <div style={{ position: "relative" }}>
                            <Button
                              onClick={() => setPasskeyToDelete(passkey.id)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                background: "transparent",
                                border: "1px solid var(--color-error)",
                                borderRadius: "var(--radius-md)",
                                color: "var(--color-error)",
                                cursor: "pointer",
                                flexShrink: 0,
                                width: "auto",
                              }}
                            >
                              Remove
                            </Button>

                            {passkeyToDelete === passkey.id && (
                              <ConfirmationPopover
                                title={`Remove "${passkey.name || "Unnamed Passkey"}"?`}
                                onConfirm={() => {
                                  handleDeletePasskey(passkey.id);
                                  setPasskeyToDelete(null);
                                }}
                                onCancel={() => setPasskeyToDelete(null)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {index < securityItems.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--color-border)",
                    margin: "0",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const ProfileDetailsManagementSection = () => {
  const { deployment } = useDeployment();
  const { user, updateProfile, updateProfilePicture, deleteAccount } =
    useUser();
  const { toast } = useScreenContext();

  // State for profile management
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profile_picture_url || null,
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize form values only once when user data is available
  React.useEffect(() => {
    if (user && !hasInitialized) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || "");
      setPreviewUrl(user.profile_picture_url || null);
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

  const autoSave = React.useCallback(async () => {
    if (!user) return;

    try {
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
      }
    } catch (error: any) {
      toast(error.message || "Failed to save profile changes", "error");
    }
  }, [user, updateProfile, firstName, lastName, username, toast]);

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleFirstNameBlur = () => {
    autoSave();
  };

  const handleLastNameBlur = () => {
    autoSave();
  };

  const handleUsernameBlur = () => {
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2xl)",
        }}
      >
        {/* Profile Picture Section - Two Column Layout */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2xl)",
            alignItems: "center",
          }}
        >
          {/* Left Column - Profile Picture Preview */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "2px dashed var(--color-border)",
                background: previewUrl
                  ? "transparent"
                  : "var(--color-input-background)",
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
              <h3
                style={{
                  fontSize: "var(--font-sm)",
                  color: "var(--color-foreground)",
                  margin: "0 0 var(--space-2xs) 0",
                }}
              >
                Profile Picture
              </h3>
              <p
                style={{
                  fontSize: "var(--font-xs)",
                  color: "var(--color-secondary-text)",
                  margin: 0,
                }}
              >
                Upload an image to represent your profile
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--space-sm)",
                marginBottom: "var(--space-sm)",
              }}
            >
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
                onClick={async () => {
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                  // Save the removal to backend
                  try {
                    await updateProfile({
                      remove_profile_picture: true,
                    });
                    await user.refetch();
                    toast("Profile picture removed successfully", "info");
                  } catch (error: any) {
                    toast(
                      error.message || "Failed to remove profile picture",
                      "error",
                    );
                    // Reset preview on error
                    setPreviewUrl(user?.profile_picture_url || null);
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
            <h3
              style={{
                fontSize: "var(--font-sm)",
                color: "var(--color-foreground)",
                margin: "0 0 var(--space-2xs) 0",
              }}
            >
              Profile Details
            </h3>
            <p
              style={{
                fontSize: "var(--font-xs)",
                color: "var(--color-secondary-text)",
                margin: 0,
              }}
            >
              Basic information about your profile
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
            }}
          >
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
            <h3
              style={{
                fontSize: "16px",
                color: "var(--color-foreground)",
                margin: "0 0 4px 0",
              }}
            >
              Danger Zone
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-muted)",
                margin: 0,
              }}
            >
              Irreversible and destructive actions
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid var(--color-error)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: showDeleteConfirm ? "20px" : "0",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--color-foreground)",
                    marginBottom: "4px",
                    fontWeight: "500",
                  }}
                >
                  Delete Account
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-muted)",
                  }}
                >
                  Once you delete your account, there is no going back. Please
                  be certain.
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
                  width: "auto",
                }}
              >
                {showDeleteConfirm ? "Cancel" : "Delete"}
              </Button>
            </div>

            {showDeleteConfirm && (
              <div style={{ maxWidth: "400px" }}>
                <FormGroup>
                  <Label htmlFor="confirm_username">
                    Confirm by typing your username
                  </Label>
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
                    background:
                      confirmName === user?.username
                        ? "var(--color-error)"
                        : "transparent",
                    color:
                      confirmName === user?.username
                        ? "white"
                        : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    padding: "8px 16px",
                    fontSize: "14px",
                    height: "36px",
                    cursor:
                      confirmName === user?.username
                        ? "pointer"
                        : "not-allowed",
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
