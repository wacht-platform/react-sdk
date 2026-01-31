import { useCallback, useState } from "react";
import { Settings, Users, Send, Shield, AlertTriangle, Check } from "lucide-react";
import { useActiveWorkspace } from "@/hooks/use-workspace";
import { useDeployment } from "@/hooks/use-deployment";
import { Spinner, DefaultStylesProvider } from "../utility";
import { ScreenContext } from "../organization/context";

import {
  TypographyProvider,
  Container,
  TabsContainer,
  TabsList,
  Tab,
  TabIcon,
  TabContent,
} from "./manage-workspace/shared";

import { GeneralSettingsSection } from "./manage-workspace/general-settings";
import { MembersSection } from "./manage-workspace/members";
import { InvitationsSection } from "./manage-workspace/invitations";
import { RolesSection } from "./manage-workspace/roles";

type TabType = "general" | "members" | "invitations" | "roles";

export const ManageWorkspace = () => {
  const { activeWorkspace, loading } = useActiveWorkspace();
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

  if (loading && !activeWorkspace) {
    return (
      <DefaultStylesProvider>
        <Container style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spinner />
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (!activeWorkspace) return null;

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
                <Tab $isActive={activeTab === "members"} onClick={() => setActiveTab("members")}>
                  <TabIcon><Users size={16} /> Members</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "invitations"} onClick={() => setActiveTab("invitations")}>
                  <TabIcon><Send size={16} /> Invitations</TabIcon>
                </Tab>
                {deployment?.b2b_settings?.custom_workspace_role_enabled && (
                  <Tab $isActive={activeTab === "roles"} onClick={() => setActiveTab("roles")}>
                    <TabIcon><Shield size={16} /> Roles</TabIcon>
                  </Tab>
                )}
              </TabsList>
            </TabsContainer>

            <TabContent>
              {activeTab === "general" && <GeneralSettingsSection />}
              {activeTab === "members" && <MembersSection />}
              {activeTab === "invitations" && <InvitationsSection />}
              {activeTab === "roles" && <RolesSection />}
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

export default ManageWorkspace;
