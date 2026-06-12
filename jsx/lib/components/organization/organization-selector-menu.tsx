"use client";

import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Buildings,
    Users,
    CaretRight,
    CaretLeft,
    WarningCircle,
} from "@phosphor-icons/react";
import { useSession, useDeployment, useOrganizationMemberships } from "@/hooks";
import { useWorkspaceList } from "@/hooks/use-workspace";
import type { Organization, WorkspaceWithOrganization } from "@/types";
import { AuthFormImage } from "../auth/auth-image";
import { Button } from "../utility/button";
import { UserButton } from "../user/user-button";
import { CreateOrganizationForm } from "./create-organization-form";
import { CreateWorkspaceForm } from "../workspace/create-workspace-form";
import { Dialog } from "../utility/dialog";

type ViewMode = "orgList" | "workspaceList" | "createOrg" | "createWorkspace";

export const OrganizationSelectorMenu = () => {
    const {
        organizationMemberships,
        refetch: refetchOrganizations,
        loading,
    } = useOrganizationMemberships();
    const { workspaces } = useWorkspaceList();
    const { switchOrganization, switchWorkspace } = useSession();
    const { deployment } = useDeployment();

    const [switching, setSwitching] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("orgList");
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    const workspacesEnabled =
        (deployment?.b2b_settings.organizations_enabled ?? false) &&
        (deployment?.b2b_settings.workspaces_enabled ?? false);
    const allowUsersToCreateOrgs =
        deployment?.b2b_settings.allow_users_to_create_orgs ?? false;

    // Initialize view only once when data first loads
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (hasInitializedRef.current || !organizationMemberships) {
            return;
        }

        hasInitializedRef.current = true;

        if (organizationMemberships.length === 0) {
            setViewMode("createOrg");
            return;
        }

        if (!workspacesEnabled) {
            setViewMode("orgList");
            return;
        }

        if (!workspaces || workspaces.length === 0) {
            const eligibleOrg = organizationMemberships.find(
                (m) =>
                    !m.eligibility_restriction?.type ||
                    m.eligibility_restriction?.type === "none",
            );
            if (eligibleOrg) {
                setSelectedOrgId(eligibleOrg.organization.id);
                setViewMode("createWorkspace");
                return;
            }
        }

        setViewMode("orgList");
    }, [organizationMemberships, workspaces, workspacesEnabled]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSelectOrganization = async (org: Organization) => {
        if (workspacesEnabled) {
            setSelectedOrgId(org.id);
            setViewMode("workspaceList");
            return;
        }

        setSwitching(org.id);
        try {
            await switchOrganization(org.id);
        } finally {
            setSwitching(null);
        }
    };

    const handleSelectWorkspace = async (
        workspace: WorkspaceWithOrganization,
    ) => {
        setSwitching(workspace.id);
        try {
            await switchWorkspace(workspace.id);
        } finally {
            setSwitching(null);
        }
    };

    const handleOrganizationCreated = async (response?: any) => {
        await refetchOrganizations();

        // The backend returns { data: { organization, membership } }
        // or sometimes just the organization depending on the hook
        const createdOrg =
            response?.data?.organization || response?.organization || response;

        if (!workspacesEnabled) {
            setViewMode("orgList");
            return;
        }

        if (createdOrg?.id) {
            setSelectedOrgId(createdOrg.id);
            setViewMode("createWorkspace");
        } else {
            setViewMode("orgList");
        }
    };

    const handleWorkspaceCreated = async (workspace?: any) => {
        const wsId = workspace?.id ?? workspace?.workspace?.id;
        if (!wsId) return;
        setSwitching(wsId);
        try {
            await switchWorkspace(wsId);
        } finally {
            setSwitching(null);
        }
    };

    const handleGoBack = async () => {
        setSelectedOrgId(null);
        setViewMode("orgList");
    };

    const selectedOrg = organizationMemberships?.find(
        (m) => m.organization.id === selectedOrgId,
    )?.organization;

    const selectedOrgWorkspaces = selectedOrgId
        ? workspaces?.filter((w) => w.organization.id === selectedOrgId)
        : [];

    if (loading) {
        return null;
    }

    if (viewMode === "createOrg") {
        return (
            <Dialog.Body style={{ padding: 0 }}>
                <CreateOrganizationForm
                    onSuccess={handleOrganizationCreated}
                    onCancel={() => setViewMode("orgList")}
                />
            </Dialog.Body>
        );
    }

    if (viewMode === "createWorkspace" && selectedOrgId) {
        return (
            <Dialog.Body style={{ padding: 0 }}>
                <CreateWorkspaceForm
                    organizationId={selectedOrgId}
                    onSuccess={handleWorkspaceCreated}
                    onCancel={() => setViewMode("workspaceList")}
                    onCreateOrganization={() => setViewMode("createOrg")}
                />
            </Dialog.Body>
        );
    }

    const showingWorkspaces = viewMode === "workspaceList";
    const dialogTitle = showingWorkspaces
        ? "Select a workspace"
        : "Select an organization";

    const dialogSubtitle = showingWorkspaces
        ? `Choose a workspace in ${selectedOrg?.name || ""}`
        : `to continue to ${deployment?.ui_settings?.app_name || "App"}`;

    return (
        <div className="w-split">
            <div className="w-split-aside w-flex-col w-justify-between w-gap-6">
                <div className="w-flex-col w-gap-4">
                    <AuthFormImage placement="left" />
                    <div className="w-flex-col w-gap-1">
                        <div className="w-title">{dialogTitle}</div>
                        <p className="w-sub">{dialogSubtitle}</p>
                    </div>
                </div>
                <UserButton showName={true} />
            </div>

            <div className="w-split-main">
                <div className="w-grow w-flex-col" style={{ overflow: "hidden", marginBottom: 24 }}>
                    <div className="w-flex w-items-center w-gap-2" style={{ marginBottom: 8 }}>
                        {showingWorkspaces && (
                            <button
                                className="w-btn w-btn--icon"
                                onClick={handleGoBack}
                                aria-label="Go back"
                                title="Go back"
                            >
                                <CaretLeft />
                            </button>
                        )}
                        <h2 className="w-sec">
                            {showingWorkspaces
                                ? "Workspaces"
                                : "Your organizations"}
                        </h2>
                    </div>
                    <div className="w-grow w-flex-col" style={{ overflowY: "auto" }}>
                        {showingWorkspaces ? (
                            <>
                                {selectedOrgWorkspaces &&
                                selectedOrgWorkspaces.length > 0 ? (
                                    selectedOrgWorkspaces.map((workspace) => {
                                        const hasRestriction =
                                            workspace.eligibility_restriction
                                                ?.type !== "none" &&
                                            workspace.eligibility_restriction
                                                ?.type !== undefined;

                                        return (
                                            <button
                                                key={workspace.id}
                                                className="w-listrow"
                                                onClick={() =>
                                                    !hasRestriction &&
                                                    handleSelectWorkspace(
                                                        workspace,
                                                    )
                                                }
                                                disabled={
                                                    switching ===
                                                        workspace.id ||
                                                    hasRestriction
                                                }
                                                title={
                                                    hasRestriction
                                                        ? workspace
                                                              .eligibility_restriction
                                                              ?.message
                                                        : undefined
                                                }
                                            >
                                                <div className="w-avatar w-avatar--lg">
                                                    {workspace.image_url ? (
                                                        <img
                                                            src={
                                                                workspace.image_url
                                                            }
                                                            alt={workspace.name}
                                                        />
                                                    ) : (
                                                        getInitials(
                                                            workspace.name,
                                                        ).charAt(0)
                                                    )}
                                                </div>
                                                <div className="w-grow">
                                                    <div className="w-sec w-truncate">
                                                        {workspace.name}
                                                    </div>
                                                    <div className="w-secsub w-inline w-gap-1">
                                                        <Users />
                                                        Workspace
                                                    </div>
                                                </div>
                                                <div className="w-inline w-gap-1 w-text-secondary">
                                                    {hasRestriction && (
                                                        <WarningCircle
                                                            size={16}
                                                            className="w-text-error"
                                                        />
                                                    )}
                                                    <CaretRight />
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="w-empty">
                                        <div className="w-empty-ic">
                                            <Users size={20} />
                                        </div>
                                        <div className="w-empty-text">
                                            <h4>No workspaces yet</h4>
                                            <p>
                                                Create your first workspace for{" "}
                                                {selectedOrg?.name ||
                                                    "this organization"}
                                            </p>
                                        </div>
                                        <div className="w-empty-action">
                                            <Button
                                                $size="sm"
                                                onClick={() =>
                                                    setViewMode("createWorkspace")
                                                }
                                            >
                                                <Plus />
                                                Create workspace
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : organizationMemberships &&
                          organizationMemberships.length > 0 ? (
                            organizationMemberships.map((membership) => {
                                const org = membership.organization;
                                const orgWorkspaces = workspaces?.filter(
                                    (w) => w.organization.id === org.id,
                                );
                                const workspaceCount =
                                    orgWorkspaces?.length || 0;
                                const memberCount = org.member_count;

                                const firstRole =
                                    membership.roles?.[0]?.name || "No role";
                                const remainingRolesCount =
                                    membership.roles.length - 1;
                                const roleName =
                                    remainingRolesCount > 0
                                        ? `${firstRole.charAt(0).toUpperCase() + firstRole.slice(1)} +${remainingRolesCount}`
                                        : firstRole.charAt(0).toUpperCase() +
                                          firstRole.slice(1);

                                const hasRestriction =
                                    membership.eligibility_restriction?.type !==
                                        "none" &&
                                    membership.eligibility_restriction?.type !==
                                        undefined;

                                return (
                                    <button
                                        key={org.id}
                                        className="w-listrow"
                                        onClick={() =>
                                            !hasRestriction &&
                                            handleSelectOrganization(org)
                                        }
                                        disabled={
                                            switching === org.id ||
                                            hasRestriction
                                        }
                                        title={
                                            hasRestriction
                                                ? membership
                                                      .eligibility_restriction
                                                      ?.message
                                                : undefined
                                        }
                                    >
                                        <div className="w-avatar w-avatar--lg">
                                            {org.image_url ? (
                                                <img
                                                    src={org.image_url}
                                                    alt={org.name}
                                                />
                                            ) : (
                                                getInitials(org.name)
                                            )}
                                        </div>
                                        <div className="w-grow">
                                            <div className="w-sec w-truncate">{org.name}</div>
                                            <div className="w-secsub w-inline w-gap-1">
                                                {workspacesEnabled ? (
                                                    <>
                                                        <Users />
                                                        {workspaceCount}{" "}
                                                        workspace
                                                        {workspaceCount !== 1
                                                            ? "s"
                                                            : ""}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Buildings />
                                                        {roleName} •{" "}
                                                        {memberCount} member
                                                        {memberCount !== 1
                                                            ? "s"
                                                            : ""}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-inline w-gap-1 w-text-secondary">
                                            {hasRestriction && (
                                                <WarningCircle
                                                    size={16}
                                                    className="w-text-error"
                                                />
                                            )}
                                            <CaretRight />
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="w-empty">
                                <div className="w-empty-ic">
                                    <Buildings size={20} />
                                </div>
                                <div className="w-empty-text">
                                    <h4>No organizations yet</h4>
                                    <p>
                                        {allowUsersToCreateOrgs
                                            ? "Create your first organization to get started"
                                            : "You don't have access to any organizations yet"}
                                    </p>
                                </div>
                                {allowUsersToCreateOrgs && (
                                    <div className="w-empty-action">
                                        <Button
                                            $size="sm"
                                            onClick={() => setViewMode("createOrg")}
                                        >
                                            <Plus />
                                            Create organization
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showingWorkspaces && selectedOrgId && (
                    <Button
                        $outline
                        onClick={() => setViewMode("createWorkspace")}
                        disabled={switching !== null}
                    >
                        <Plus size={12} />
                        Create workspace
                    </Button>
                )}

                {!showingWorkspaces &&
                    organizationMemberships &&
                    organizationMemberships.length > 0 &&
                    allowUsersToCreateOrgs && (
                        <Button
                            $outline
                            onClick={() => setViewMode("createOrg")}
                            disabled={switching !== null}
                        >
                            <Plus size={12} />
                            Create new organization
                        </Button>
                    )}
            </div>
        </div>
    );
};
