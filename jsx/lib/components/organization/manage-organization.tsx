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
  background: var(--color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-12u);
  border: var(--border-width-regular) dashed var(--color-border);
`;

const EmptyStateTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-card-foreground);
  margin: 0 0 var(--space-4u) 0;
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
  transition: filter 0.15s ease;

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
  color: var(--color-popover-foreground);
`;

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
                <Buildings size={32} color="var(--color-muted)" />
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
            <PageHeader>
              <EditableAvatar
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                title="Change logo"
                aria-label="Change organization logo"
              >
                {activeOrganization.image_url
                  ? <img src={activeOrganization.image_url} alt={activeOrganization.name} />
                  : (activeOrganization.name?.slice(0, 2).toUpperCase() || "O")
                }
                <span className="hover-overlay">
                  {isUploadingLogo ? <Spinner size={14} /> : <Camera size={16} />}
                </span>
              </EditableAvatar>
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
              <Toast>
                <ToastContent>
                  {toastLevel === "error" ? <Warning size={16} color="var(--color-error)" /> : <Check size={16} color="var(--color-success)" />}
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
