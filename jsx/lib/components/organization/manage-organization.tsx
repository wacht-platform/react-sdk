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
        <Container style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (!activeOrganization) {
    return (
      <DefaultStylesProvider>
        <TypographyProvider>
          <Container>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 24px", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-input-background)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", border: "2px dashed var(--color-border)" }}>
                <Building size={32} color="var(--color-muted)" />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-foreground)", margin: "0 0 8px 0" }}>No Organization Selected</h3>
              <OrganizationSwitcher />
            </div>
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
              <div style={{ position: "absolute", bottom: "20px", right: "20px", background: "var(--color-input-background)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px 16px", boxShadow: "0 4px 12px var(--color-shadow)", animation: "slideDown 0.3s ease-out", zIndex: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {toastLevel === "error" ? <AlertTriangle size={16} color="var(--color-error)" /> : <Check size={16} color="var(--color-success)" />}
                  <span style={{ fontSize: "14px", color: "var(--color-foreground)" }}>{toastMessage}</span>
                </div>
              </div>
            )}
          </Container>
        </ScreenContext.Provider>
      </TypographyProvider>
    </DefaultStylesProvider>
  );
};
