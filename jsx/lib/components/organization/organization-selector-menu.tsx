"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
  Plus,
  Building2,
  Users,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
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

const Container = styled.div`
  width: 100%;
  height: 500px;
  background: var(--color-background);
  display: grid;
  grid-template-columns: 280px 1fr;
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const LeftColumn = styled.div`
  background: var(--color-background-hover);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--color-border);
`;

const RightColumn = styled.div`
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ListSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 24px;
`;

const ListHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ListHeader = styled.h2`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: 0;
`;

const BackLink = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  transition: opacity 0.2s;
  font-weight: 400;

  &:hover {
    opacity: 0.8;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
`;

const Title = styled.h1`
  font-size: 16px;
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-sm);
  margin: 0;
  font-weight: 400;
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`;

const ListItem = styled.button`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: 12px 0px;
  text-align: left;
  border: none;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground);
  transition: background-color 0.2s ease;
  font-size: var(--font-sm);
  position: relative;

  &:last-child {
    border-bottom: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:hover .warning-popover {
    visibility: visible;
    opacity: 1;
  }
`;

const ListItemWarningPopover = styled.div`
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: 50%;
  right: 50px;
  transform: translateY(-50%);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 100;
  width: max-content;
  max-width: 300px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-warning);
  pointer-events: none;
  transition: opacity 0.1s ease, visibility 0.1s ease;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent transparent var(--color-border);
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-hover);
  border: 1px solid var(--color-border);
  color: var(--color-secondary-text);
  font-size: 14px;
  font-weight: 400;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 15px;
  font-weight: 400;
  color: var(--color-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-secondary-text);
  font-weight: 400;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ItemArrow = styled.div`
  color: var(--color-secondary-text);
  display: flex;
  align-items: center;

  svg {
    width: 16px;
    height: 16px;
  }
`;

// WarningText is no longer used, replaced by right-aligned AlertCircle

const EmptyState = styled.div`
  text-align: center;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  margin-top: auto;
  margin-bottom: auto;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
`;

const EmptyStateTitle = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: 4px;
`;

const EmptyStateText = styled.div`
  font-size: 13px;
  color: var(--color-secondary-text);
  margin-bottom: 16px;
  line-height: 1.5;
`;

const EmptyStateCTA = styled(Button)`
  width: auto;
  margin: 0 auto;
  padding: 6px 16px;
  font-size: 13px;
`;

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
    deployment?.b2b_settings.workspaces_enabled ?? false;
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
      if (organizationMemberships[0]) {
        setSelectedOrgId(organizationMemberships[0].organization.id);
      }
      setViewMode("createWorkspace");
      return;
    }

    setViewMode("orgList");
  }, [organizationMemberships, workspaces, workspacesEnabled]);

  console.log("view mode", viewMode, workspacesEnabled);

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

  const handleOrganizationCreated = async (organization?: any) => {
    await refetchOrganizations();

    if (!workspacesEnabled) {
      return;
    }

    if (organization) {
      setSelectedOrgId(organization.id);
      setViewMode("createWorkspace");
    }
  };

  const handleWorkspaceCreated = () => { };

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
    <Container>
      <LeftColumn>
        <div>
          <AuthFormImage />
          <TitleSection>
            <Title>{dialogTitle}</Title>
            <Subtitle>{dialogSubtitle}</Subtitle>
          </TitleSection>
        </div>
        <UserButton showName={true} />
      </LeftColumn>

      <RightColumn>
        <ListSection>
          <ListHeaderContainer>
            <ListHeader>
              {showingWorkspaces ? "Workspaces" : "Your organizations"}
            </ListHeader>
            {showingWorkspaces && (
              <BackLink onClick={handleGoBack}>
                <ChevronLeft />
                Go back
              </BackLink>
            )}
          </ListHeaderContainer>
          <ListContainer>
            {showingWorkspaces ? (
              <>
                {selectedOrgWorkspaces && selectedOrgWorkspaces.length > 0 ? (
                  selectedOrgWorkspaces.map((workspace) => {
                    const hasRestriction =
                      workspace.eligibility_restriction?.type !== "none" &&
                      workspace.eligibility_restriction?.type !== undefined;

                    return (
                      <ListItem
                        key={workspace.id}
                        onClick={() =>
                          !hasRestriction && handleSelectWorkspace(workspace)
                        }
                        disabled={switching === workspace.id || hasRestriction}
                        style={{ opacity: hasRestriction ? 0.6 : 1 }}
                      >
                        {hasRestriction && (
                          <ListItemWarningPopover className="warning-popover">
                            {workspace.eligibility_restriction?.message}
                          </ListItemWarningPopover>
                        )}
                        <Avatar>
                          {workspace.image_url ? (
                            <AvatarImage
                              src={workspace.image_url}
                              alt={workspace.name}
                            />
                          ) : (
                            getInitials(workspace.name).charAt(0)
                          )}
                        </Avatar>
                        <ItemContent>
                          <ItemName>{workspace.name}</ItemName>
                          <ItemMeta>
                            <Users />
                            Workspace
                          </ItemMeta>
                        </ItemContent>
                        <ItemArrow>
                          {hasRestriction && (
                            <AlertCircle
                              size={16}
                              style={{ color: "var(--color-error)" }}
                            />
                          )}
                          <ChevronRight />
                        </ItemArrow>
                      </ListItem>
                    );
                  })
                ) : (
                  <EmptyState>
                    <EmptyStateTitle>No workspaces yet</EmptyStateTitle>
                    <EmptyStateText>
                      Create your first workspace for{" "}
                      {selectedOrg?.name || "this organization"}
                    </EmptyStateText>
                    <EmptyStateCTA
                      onClick={() => setViewMode("createWorkspace")}
                    >
                      <Plus />
                      Create workspace
                    </EmptyStateCTA>
                  </EmptyState>
                )}
              </>
            ) : organizationMemberships &&
              organizationMemberships.length > 0 ? (
              organizationMemberships.map((membership) => {
                const org = membership.organization;
                const orgWorkspaces = workspaces?.filter(
                  (w) => w.organization.id === org.id,
                );
                const workspaceCount = orgWorkspaces?.length || 0;
                const memberCount = org.member_count;

                const firstRole = membership.roles[0].name;
                const remainingRolesCount = membership.roles.length - 1;
                const roleName =
                  remainingRolesCount > 0
                    ? `${firstRole.charAt(0).toUpperCase() + firstRole.slice(1)} +${remainingRolesCount}`
                    : firstRole.charAt(0).toUpperCase() + firstRole.slice(1);

                const hasRestriction =
                  membership.eligibility_restriction?.type !== "none" &&
                  membership.eligibility_restriction?.type !== undefined;

                return (
                  <ListItem
                    key={org.id}
                    onClick={() =>
                      !hasRestriction && handleSelectOrganization(org)
                    }
                    disabled={switching === org.id || hasRestriction}
                    style={{ opacity: hasRestriction ? 0.6 : 1 }}
                  >
                    {hasRestriction && (
                      <ListItemWarningPopover className="warning-popover">
                        {membership.eligibility_restriction?.message}
                      </ListItemWarningPopover>
                    )}
                    <Avatar>
                      {org.image_url ? (
                        <AvatarImage src={org.image_url} alt={org.name} />
                      ) : (
                        getInitials(org.name)
                      )}
                    </Avatar>
                    <ItemContent>
                      <ItemName>{org.name}</ItemName>
                      <ItemMeta>
                        {workspacesEnabled ? (
                          <>
                            <Users />
                            {workspaceCount} workspace
                            {workspaceCount !== 1 ? "s" : ""}
                          </>
                        ) : (
                          <>
                            <Building2 />
                            {roleName} • {memberCount} member
                            {memberCount !== 1 ? "s" : ""}
                          </>
                        )}
                      </ItemMeta>
                    </ItemContent>
                    <ItemArrow>
                      {hasRestriction && (
                        <AlertCircle
                          size={16}
                          style={{ color: "var(--color-error)" }}
                        />
                      )}
                      <ChevronRight />
                    </ItemArrow>
                  </ListItem>
                );
              })
            ) : (
              <EmptyState>
                <EmptyStateTitle>No organizations yet</EmptyStateTitle>
                <EmptyStateText>
                  {allowUsersToCreateOrgs
                    ? "Create your first organization to get started"
                    : "You don't have access to any organizations yet"}
                </EmptyStateText>
                {allowUsersToCreateOrgs && (
                  <EmptyStateCTA onClick={() => setViewMode("createOrg")}>
                    <Plus />
                    Create organization
                  </EmptyStateCTA>
                )}
              </EmptyState>
            )}
          </ListContainer>
        </ListSection>

        {showingWorkspaces &&
          selectedOrgWorkspaces &&
          selectedOrgWorkspaces.length > 0 && (
            <Button
              style={{ marginTop: "var(--space-md)" }}
              onClick={() => setViewMode("createWorkspace")}
              disabled={switching !== null}
            >
              <Plus size={12} />
              Create new workspace
            </Button>
          )}

        {!showingWorkspaces &&
          organizationMemberships &&
          organizationMemberships.length > 0 &&
          allowUsersToCreateOrgs && (
            <Button
              style={{ marginTop: "var(--space-md)" }}
              onClick={() => setViewMode("createOrg")}
              disabled={switching !== null}
            >
              <Plus size={12} />
              Create new organization
            </Button>
          )}
      </RightColumn>
    </Container>
  );
};
