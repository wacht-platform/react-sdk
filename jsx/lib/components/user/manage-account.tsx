import { useCallback, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Link2,
  Shield,
  Activity,
  AlertTriangle,
  Check,
} from "lucide-react";

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

const Toast = styled.div`
  position: absolute;
  bottom: var(--space-10u);
  right: var(--space-10u);
  background: var(--color-input-background);
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
  color: var(--color-foreground);
`;

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
                    <AlertTriangle size={16} color="var(--color-error)" />
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
