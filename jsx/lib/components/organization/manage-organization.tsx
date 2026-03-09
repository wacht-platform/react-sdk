import { useCallback, useState, useEffect } from "react";
import { Building, Settings, Globe, Users, Shield, Mail, AlertTriangle, Check } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks/use-deployment";
import { Spinner, DefaultStylesProvider } from "../utility";
import { ScreenContext } from "./context";
import OrganizationSwitcher from "./organization-switcher";
import { SSOSettingsSection } from "./sso-settings-section";
import { Organization } from "@/types";

import {
  TypographyProvider,
  Container,
  TabsContainer,
  TabsList,
  Tab,
  TabIcon,
  TabContent,
} from "./manage-organization/shared";
import styled from "styled-components";

import { GeneralSettingsSection } from "./manage-organization/general-settings";
import { DomainsSection } from "./manage-organization/domains";
import { MembersSection } from "./manage-organization/members";
import { InvitationsSection } from "./manage-organization/invitations";
import { RolesSection } from "./manage-organization/roles";

const useStickyActiveOrganization = () => {
  const { activeOrganization: currentOrg, loading: orgLoading } = useActiveOrganization();
  const [stickyOrg, setStickyOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (currentOrg) {
      setStickyOrg(currentOrg);
    } else if (!orgLoading && !currentOrg && stickyOrg) {
      setStickyOrg(null);
    }
  }, [currentOrg, orgLoading, stickyOrg]);

  return { activeOrganization: stickyOrg || currentOrg, loading: orgLoading };
};

type TabType = "general" | "domains" | "members" | "invitations" | "roles" | "sso";

const LoadingState = styled(Container)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--size-20u) var(--space-12u);
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  width: var(--size-40u);
  height: var(--size-40u);
  border-radius: var(--radius-full);
  background: var(--color-input-background);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-12u);
  border: var(--border-width-regular) dashed var(--color-border);
`;

const EmptyStateTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-4u) 0;
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
  animation: slideDown 0.3s ease-out;
  z-index: 100;
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

export const ManageOrganization = () => {
  const { loading, activeOrganization } = useStickyActiveOrganization();
  const { deployment } = useDeployment();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [],
  );

  if (loading && !activeOrganization) {
    return (
      <DefaultStylesProvider>
        <LoadingState>
          <Spinner />
        </LoadingState>
      </DefaultStylesProvider>
    );
  }

  if (!activeOrganization) {
    return (
      <DefaultStylesProvider>
        <TypographyProvider>
          <Container>
            <EmptyState>
              <EmptyStateIcon>
                <Building size={32} color="var(--color-muted)" />
              </EmptyStateIcon>
              <EmptyStateTitle>No Organization Selected</EmptyStateTitle>
              <OrganizationSwitcher />
            </EmptyState>
          </Container>
        </TypographyProvider>
      </DefaultStylesProvider>
    );
  }

  return (
    <DefaultStylesProvider>
      <TypographyProvider>
        <ScreenContext.Provider value={{ screen: null, setScreen: () => { }, toast }}>
          <Container>
            <TabsContainer>
              <TabsList>
                <Tab $isActive={activeTab === "general"} onClick={() => setActiveTab("general")}>
                  <TabIcon><Settings size={16} /> General</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "domains"} onClick={() => setActiveTab("domains")}>
                  <TabIcon><Globe size={16} /> Domains</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "members"} onClick={() => setActiveTab("members")}>
                  <TabIcon><Users size={16} /> Members</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "invitations"} onClick={() => setActiveTab("invitations")}>
                  <TabIcon><Mail size={16} /> Invitations</TabIcon>
                </Tab>
                {deployment?.b2b_settings?.custom_org_role_enabled && (
                  <Tab $isActive={activeTab === "roles"} onClick={() => setActiveTab("roles")}>
                    <TabIcon><Shield size={16} /> Roles</TabIcon>
                  </Tab>
                )}
                {deployment?.b2b_settings?.enterprise_sso_enabled && (
                  <Tab $isActive={activeTab === "sso"} onClick={() => setActiveTab("sso")}>
                    <TabIcon><Shield size={16} /> SSO</TabIcon>
                  </Tab>
                )}
              </TabsList>
            </TabsContainer>

            <TabContent>
              {activeTab === "general" && <GeneralSettingsSection organization={activeOrganization} />}
              {activeTab === "domains" && <DomainsSection organization={activeOrganization} />}
              {activeTab === "members" && <MembersSection organization={activeOrganization} />}
              {activeTab === "invitations" && <InvitationsSection organization={activeOrganization} />}
              {activeTab === "roles" && <RolesSection organization={activeOrganization} />}
              {activeTab === "sso" && <SSOSettingsSection organization={activeOrganization} />}
            </TabContent>

            {toastMessage && (
              <Toast>
                <ToastContent>
                  {toastLevel === "error" ? <AlertTriangle size={16} color="var(--color-error)" /> : <Check size={16} color="var(--color-success)" />}
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
