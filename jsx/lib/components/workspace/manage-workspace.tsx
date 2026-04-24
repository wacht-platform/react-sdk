import { useCallback, useState, useRef, ChangeEvent } from "react";
import {
    Camera,
    GearSix,
    Users,
    PaperPlaneTilt,
    Shield,
    Warning,
    Check,
} from "@phosphor-icons/react";
import styled from "styled-components";
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
    PageHeader,
    PageHeaderInfo,
    PageHeaderName,
    PageHeaderSub,
} from "./manage-workspace/shared";

import { GeneralSettingsSection } from "./manage-workspace/general-settings";
import { MembersSection } from "./manage-workspace/members";
import { InvitationsSection } from "./manage-workspace/invitations";
import { RolesSection } from "./manage-workspace/roles";

type TabType = "general" | "members" | "invitations" | "roles";

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
    bottom: 20px;
    right: 20px;
    background: var(--color-popover);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: var(--shadow-md);
    z-index: 100;
`;

const getInitials = (name?: string) =>
    (name || "").slice(0, 2).toUpperCase() || "W";

export const ManageWorkspace = () => {
    const { activeWorkspace, loading, updateWorkspace } = useActiveWorkspace();
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
            await updateWorkspace({ image: file as any });
            toast("Logo updated", "info");
        } catch (error: any) {
            toast(error?.message || "Failed to update logo", "error");
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (loading && !activeWorkspace) {
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
    }

    if (!activeWorkspace) return null;

    const orgName = (activeWorkspace as any).organization?.name;

    return (
        <DefaultStylesProvider>
            <TypographyProvider>
                <ScreenContext.Provider
                    value={{ screen: null, setScreen: () => {}, toast }}
                >
                    <Container>
                        <PageHeader>
                            <EditableAvatar
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                title="Change logo"
                                aria-label="Change workspace logo"
                            >
                                {(activeWorkspace as any).image_url
                                    ? <img src={(activeWorkspace as any).image_url} alt={activeWorkspace.name} />
                                    : getInitials(activeWorkspace.name)
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
                                <PageHeaderName>{activeWorkspace.name}</PageHeaderName>
                                <PageHeaderSub>
                                    {orgName ? `${orgName} · Workspace settings` : "Workspace settings"}
                                </PageHeaderSub>
                            </PageHeaderInfo>
                        </PageHeader>

                        <TabsContainer>
                            <TabsList>
                                <Tab
                                    $isActive={activeTab === "general"}
                                    onClick={() => setActiveTab("general")}
                                >
                                    <TabIcon>
                                        <GearSix size={14} /> General
                                    </TabIcon>
                                </Tab>
                                <Tab
                                    $isActive={activeTab === "members"}
                                    onClick={() => setActiveTab("members")}
                                >
                                    <TabIcon>
                                        <Users size={14} /> Members
                                    </TabIcon>
                                </Tab>
                                <Tab
                                    $isActive={activeTab === "invitations"}
                                    onClick={() => setActiveTab("invitations")}
                                >
                                    <TabIcon>
                                        <PaperPlaneTilt size={14} /> Invitations
                                    </TabIcon>
                                </Tab>
                                {deployment?.b2b_settings?.custom_workspace_role_enabled && (
                                    <Tab
                                        $isActive={activeTab === "roles"}
                                        onClick={() => setActiveTab("roles")}
                                    >
                                        <TabIcon>
                                            <Shield size={14} /> Roles
                                        </TabIcon>
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
                            <Toast>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {toastLevel === "error" ? (
                                        <Warning size={14} color="var(--color-error)" />
                                    ) : (
                                        <Check size={14} color="var(--color-success, #10b981)" />
                                    )}
                                    <span style={{ fontSize: 13, color: "var(--color-popover-foreground)" }}>
                                        {toastMessage}
                                    </span>
                                </div>
                            </Toast>
                        )}
                    </Container>
                </ScreenContext.Provider>
            </TypographyProvider>
        </DefaultStylesProvider>
    );
};

export default ManageWorkspace;
