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
        <Container className="w-flex w-items-center w-justify-center">
          <Spinner />
        </Container>
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
          <Container className="w-relative">
            {user && (
              <PageHeader className="mac-page-header">
                <button
                  type="button"
                  className="w-avatar-edit"
                  data-busy={isUploadingAvatar ? "" : undefined}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <span className="w-avatar w-avatar--lg">
                    {user.profile_picture_url
                      ? <img src={user.profile_picture_url} alt="" />
                      : getInitials(user.first_name, user.last_name)
                    }
                  </span>
                  <span className="w-avatar-veil">
                    {isUploadingAvatar ? <Spinner size={14} /> : <Camera size={16} />}
                  </span>
                </button>
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
              <div
                className={`w-toast w-toast--contained ${toastLevel === "error" ? "w-toast--error" : "w-toast--success"}`}
                style={{ minWidth: 0 }}
              >
                <span className="w-toast-ic">
                  {toastLevel === "error" ? <Warning size={12} /> : <Check size={12} />}
                </span>
                <span className="w-toast-msg">{toastMessage}</span>
              </div>
            )}
          </Container>
        </ScreenContext.Provider>
      </TypographyProvider>
    </DefaultStylesProvider>
  );
};

export default ManageAccount;
