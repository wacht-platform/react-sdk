import { useCallback, useState, useRef, ChangeEvent } from "react";
import {
  Camera,
  User,
  EnvelopeSimple,
  Phone,
  Link,
  Shield,
  Pulse,
  Warning,
  Check,
} from "@phosphor-icons/react";

import { useUser } from "@/hooks/use-user";
import { useDeployment } from "@/hooks/use-deployment";
import { Spinner, DefaultStylesProvider } from "../utility";
import { ScreenContext } from "./context";

import {
  TypographyProvider,
  Container,
  TabsContainer,
  TabsList,
  Tab,
  TabIcon,
  TabContent,
  PageHeader,
  PageHeaderInfo,
  PageHeaderName,
  PageHeaderSub,
} from "./manage-account/shared";
import styled from "styled-components";

// Modularised Sections
import { ProfileDetailsManagementSection } from "./manage-account/profile-details";
import { EmailManagementSection } from "./manage-account/email-management";
import { PhoneManagementSection } from "./manage-account/phone-management";
import { SocialManagementSection } from "./manage-account/social-management";
import { SecurityManagementSection } from "./manage-account/security";
import { ActiveSessionsSection } from "./manage-account/active-sessions";

type TabType =
  | "profile"
  | "email"
  | "phone"
  | "social"
  | "security"
  | "sessions";

const LoadingState = styled(Container)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const EditableAvatar = styled.button`
  position: relative;
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: var(--color-secondary);
  color: var(--color-secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  border: none;
  padding: 0;
  cursor: pointer;

  img { width: 100%; height: 100%; object-fit: cover; }

  .hover-overlay {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, black 55%, transparent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s ease;
    border-radius: 50%;
  }
  &:hover .hover-overlay { opacity: 1; }

  @media (max-width: 600px) {
    width: 38px;
    height: 38px;
    min-width: 38px;
    font-size: 13px;
  }
`;

const Toast = styled.div`
  position: absolute;
  bottom: var(--space-10u);
  right: var(--space-10u);
  background: var(--color-popover);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6u) var(--space-8u);
  box-shadow: var(--shadow-md);
  animation: slideUp 0.3s ease-out;
`;

const ToastContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4u);
`;

const ToastText = styled.span`
  font-size: var(--font-size-lg);
  color: var(--color-popover-foreground);
`;

const getInitials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "U";

export const ManageAccount = () => {
  const { loading, user, updateProfilePicture } = useUser();
  const { deployment } = useDeployment();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [setToastMessage],
  );

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast("File size cannot exceed 2MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast("Please select a valid image file", "error");
      return;
    }
    try {
      setIsUploadingAvatar(true);
      await updateProfilePicture(file);
      await user?.refetch();
      toast("Profile picture updated", "info");
    } catch (error: any) {
      toast(error?.message || "Failed to update profile picture", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading)
    return (
      <DefaultStylesProvider>
        <LoadingState>
          <Spinner />
        </LoadingState>
      </DefaultStylesProvider>
    );

  const authSettings = deployment?.auth_settings;
  const showEmailTab = authSettings?.email_address?.enabled;
  const showPhoneTab = authSettings?.phone_number?.enabled;
  const showSocialTab =
    deployment?.social_connections?.some((conn) => conn.enabled) || false;
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
            {user && (
              <PageHeader className="mac-page-header">
                <EditableAvatar
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  {user.profile_picture_url
                    ? <img src={user.profile_picture_url} alt="" />
                    : getInitials(user.first_name, user.last_name)
                  }
                  <span className="hover-overlay">
                    {isUploadingAvatar ? <Spinner size={14} /> : <Camera size={16} />}
                  </span>
                </EditableAvatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                <PageHeaderInfo>
                  <PageHeaderName>
                    {`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Account"}
                  </PageHeaderName>
                  {user.primary_email_address?.email && (
                    <PageHeaderSub>{user.primary_email_address.email}</PageHeaderSub>
                  )}
                </PageHeaderInfo>
              </PageHeader>
            )}
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
                      <EnvelopeSimple size={16} />
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
                      <Link size={16} />
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
                    <Pulse size={16} />
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
              {activeTab === "social" && showSocialTab && (
                <SocialManagementSection />
              )}
              {activeTab === "security" && showSecurityTab && (
                <SecurityManagementSection />
              )}
              {activeTab === "sessions" && <ActiveSessionsSection />}
            </TabContent>

            {toastMessage && (
              <Toast>
                <ToastContent>
                  {toastLevel === "error" ? (
                    <Warning size={16} color="var(--color-error)" />
                  ) : (
                    <Check size={16} color="var(--color-success)" />
                  )}
                  <ToastText>{toastMessage}</ToastText>
                </ToastContent>
              </Toast>
            )}
          </Container>
        </ScreenContext.Provider>
      </TypographyProvider>
    </DefaultStylesProvider>
  );
};

export default ManageAccount;
