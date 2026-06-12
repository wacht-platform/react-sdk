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
                <Container className="w-items-center w-justify-center">
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
                    <Container className="w-relative">
                        <PageHeader>
                            <button
                                type="button"
                                className="w-avatar w-avatar--lg w-avatar-edit"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                data-busy={isUploadingLogo ? "" : undefined}
                                title="Change logo"
                                aria-label="Change workspace logo"
                            >
                                {(activeWorkspace as any).image_url
                                    ? <img src={(activeWorkspace as any).image_url} alt={activeWorkspace.name} />
                                    : getInitials(activeWorkspace.name)
                                }
                                <span className="w-avatar-veil">
                                    {isUploadingLogo ? <Spinner size={14} /> : <Camera size={16} />}
                                </span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="w-none"
                                hidden
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
                            <div
                                className={`w-toast w-toast--contained ${toastLevel === "error" ? "w-toast--error" : "w-toast--success"}`}
                            >
                                <span className="w-toast-ic">
                                    {toastLevel === "error" ? (
                                        <Warning size={14} />
                                    ) : (
                                        <Check size={14} />
                                    )}
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

export default ManageWorkspace;
