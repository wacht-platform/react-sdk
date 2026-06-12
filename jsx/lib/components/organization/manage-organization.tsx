import { useCallback, useState, useEffect, useRef, ChangeEvent } from "react";
import { Buildings, Camera, GearSix, Globe, Users, Shield, EnvelopeSimple, Warning, Check } from "@phosphor-icons/react";
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
  PageHeader,
  PageHeaderInfo,
  PageHeaderName,
  PageHeaderSub,
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
  const { updateOrganization } = useActiveOrganization();
  const { deployment } = useDeployment();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [],
  );

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
      setIsUploadingLogo(true);
      await updateOrganization({ image: file as any });
      toast("Logo updated", "info");
    } catch (error: any) {
      toast(error?.message || "Failed to update logo", "error");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading && !activeOrganization) {
    return (
      <DefaultStylesProvider>
        <Container className="w-items-center w-justify-center">
          <Spinner />
        </Container>
      </DefaultStylesProvider>
    );
  }

  if (!activeOrganization) {
    return (
      <DefaultStylesProvider>
        <TypographyProvider>
          <Container className="w-items-center w-justify-center">
            <div className="w-empty">
              <span className="w-empty-ic">
                <Buildings size={20} />
              </span>
              <h4>No Organization Selected</h4>
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
          <Container className="w-relative">
            <PageHeader>
              <button
                type="button"
                className="w-avatar w-avatar--lg w-avatar-edit"
                data-busy={isUploadingLogo ? "" : undefined}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                title="Change logo"
                aria-label="Change organization logo"
              >
                {activeOrganization.image_url
                  ? <img src={activeOrganization.image_url} alt={activeOrganization.name} />
                  : (activeOrganization.name?.slice(0, 2).toUpperCase() || "O")
                }
                <span className="w-avatar-veil">
                  {isUploadingLogo ? <Spinner size={14} /> : <Camera size={16} />}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLogoChange}
              />
              <PageHeaderInfo>
                <PageHeaderName>{activeOrganization.name}</PageHeaderName>
                <PageHeaderSub>
                  {(activeOrganization as any).member_count != null
                    ? `${(activeOrganization as any).member_count} members`
                    : "Organization settings"
                  }
                </PageHeaderSub>
              </PageHeaderInfo>
            </PageHeader>
            <TabsContainer>
              <TabsList>
                <Tab $isActive={activeTab === "general"} onClick={() => setActiveTab("general")}>
                  <TabIcon><GearSix size={16} /> General</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "domains"} onClick={() => setActiveTab("domains")}>
                  <TabIcon><Globe size={16} /> Domains</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "members"} onClick={() => setActiveTab("members")}>
                  <TabIcon><Users size={16} /> Members</TabIcon>
                </Tab>
                <Tab $isActive={activeTab === "invitations"} onClick={() => setActiveTab("invitations")}>
                  <TabIcon><EnvelopeSimple size={16} /> Invitations</TabIcon>
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
              <div
                className={`w-toast w-toast--contained ${toastLevel === "error" ? "w-toast--error" : "w-toast--success"}`}
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
