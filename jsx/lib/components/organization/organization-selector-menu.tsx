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
  max-width: calc(var(--size-50u) * 5);
  height: calc(calc(var(--size-50u) * 4) + calc(var(--size-50u) * 2));
  background: var(--color-card);
  display: grid;
  grid-template-columns: calc(calc(var(--size-50u) * 2) + var(--size-40u)) 1fr;
  border-radius: var(--radius-lg);
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    grid-template-columns: 1fr;
    height: auto;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const LeftColumn = styled.div`
  background: var(--color-secondary);
  padding: var(--space-16u) var(--space-12u);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: var(--border-width-thin) solid var(--color-border);

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: var(--border-width-thin) solid var(--color-border);
    padding: var(--space-12u);
    gap: var(--space-12u);
    align-items: center;
    text-align: center;
  }
`;

const LeftColumnContent = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const RightColumn = styled.div`
  padding: var(--space-16u) var(--space-12u);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: var(--space-12u);
    min-height: calc(var(--size-50u) * 4);
  }
`;

const ListSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: var(--space-12u);
`;

const ListHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4u);
`;

const ListHeader = styled.h2`
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: 0;
`;

const BackLink = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-2u);
  background: none;
  border: none;
  padding: var(--space-2u) var(--space-4u);
  font-size: var(--font-size-md);
  color: var(--color-primary);
  cursor: pointer;
  transition: opacity 0.2s;
  font-weight: 400;

  &:hover {
    opacity: 0.8;
  }

  svg {
    width: var(--space-7u);
    height: var(--space-7u);
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2u);
  flex: 1;

  @media (max-width: 768px) {
    align-items: center;
    text-align: center;
  }
`;

const Title = styled.h1`
  font-size: var(--font-size-xl);
  font-weight: 400;
  color: var(--color-card-foreground);
  margin: 0;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-size-lg);
  margin: 0;
  font-weight: 400;
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-right: var(--space-4u);

  &::-webkit-scrollbar {
    width: var(--space-2u);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--space-1u);
  }
`;

const ListItem = styled.button`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-6u);
  width: 100%;
  padding: var(--space-6u) 0;
  text-align: left;
  border: none;
  border-bottom: var(--border-width-thin) solid var(--color-border);
  background: transparent;
  cursor: pointer;
  color: var(--color-card-foreground);
  transition: background-color 0.2s ease;
  font-size: var(--font-size-lg);
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
  right: var(--size-50u);
  transform: translateY(-50%);
  background: var(--color-popover);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-2xs);
  padding: var(--space-3u) var(--space-5u);
  box-shadow: var(--shadow-md);
  z-index: 100;
  width: max-content;
  max-width: calc(var(--size-50u) * 3);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  color: var(--color-warning);
  pointer-events: none;
  transition: opacity 0.1s ease, visibility 0.1s ease;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 100%;
    margin-top: calc(var(--space-5u) * -1);
    border-width: var(--space-5u);
    border-style: solid;
    border-color: transparent transparent transparent var(--color-border);
  }
`;

const Avatar = styled.div`
  width: var(--size-20u);
  height: var(--size-20u);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  border: var(--border-width-thin) solid var(--color-border);
  color: var(--color-secondary-text);
  font-size: var(--font-size-lg);
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
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-card-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2u);
  margin-top: var(--space-1u);
  font-size: var(--font-size-sm);
  color: var(--color-secondary-text);
  font-weight: 400;

  svg {
    width: var(--size-6u);
    height: var(--size-6u);
  }
`;

const ItemArrow = styled.div`
  color: var(--color-secondary-text);
  display: flex;
  align-items: center;

  svg {
    width: var(--size-8u);
    height: var(--size-8u);
  }
`;

// WarningText is no longer used, replaced by right-aligned AlertCircle

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-16u) var(--space-8u);
  display: flex;
  flex-direction: column;
  margin-top: auto;
  margin-bottom: auto;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
`;

const EmptyStateTitle = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-card-foreground);
  margin-bottom: var(--space-2u);
`;

const EmptyStateText = styled.div`
  font-size: var(--font-size-md);
  color: var(--color-secondary-text);
  margin-bottom: var(--space-8u);
  line-height: 1.5;
`;

const EmptyStateCTA = styled(Button)`
  width: auto;
  margin: 0 auto;
  padding: var(--space-3u) var(--space-8u);
  font-size: var(--font-size-md);
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
        <LeftColumnContent>
          <AuthFormImage />
          <TitleSection>
            <Title>{dialogTitle}</Title>
            <Subtitle>{dialogSubtitle}</Subtitle>
          </TitleSection>
        </LeftColumnContent>
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


        {!showingWorkspaces &&
          organizationMemberships &&
          organizationMemberships.length > 0 &&
          allowUsersToCreateOrgs && (
            <Button
              $outline
              style={{
                marginTop: workspacesEnabled ? "var(--space-4u)" : "var(--space-6u)",
              }}
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
