"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Plus, Building2, Users, ChevronRight, ArrowLeft } from "lucide-react";
import { useOrganizationList, useSession, useDeployment } from "@/hooks";
import { useWorkspaceList } from "@/hooks/use-workspace";
import type { Organization, WorkspaceWithOrganization } from "@/types";
import { AuthFormImage } from "../auth/auth-image";
import { NavigationLink } from "../utility/navigation";
import { UserButton } from "../user/user-button";
import { Button } from "../utility/button";

const Container = styled.div`
  width: 100%;
  max-width: 400px;
  padding: var(--space-3xl);
  background: var(--color-background);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  cursor: pointer;
  padding: var(--space-xs);
  transition: color 0.2s ease;
  font-weight: 400;

  &:hover {
    color: var(--color-foreground);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
`;

const Title = styled.h1`
  font-size: var(--font-lg);
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  margin: 0;
  font-weight: 400;
`;

const ListContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  margin: var(--space-lg) 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
`;

const ListItem = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md);
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground);
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-background-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-hover);
  border: 1px solid var(--color-border);
  color: var(--color-secondary-text);
  font-size: 14px;
  font-weight: 500;
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
  font-size: var(--font-sm);
  font-weight: 500;
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

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--color-background-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
  color: var(--color-secondary-text);
`;

const EmptyStateTitle = styled.div`
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: var(--space-xs);
`;

const EmptyStateText = styled.div`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  margin-bottom: var(--space-lg);
`;

const EmptyStateCTA = styled(Button)`
  width: auto;
  margin: 0 auto;
  padding: var(--space-sm) var(--space-lg);
`;

const Footer = styled.div`
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

interface OrganizationSelectorMenuProps {
  onSelect: (organizationId: string, workspaceId?: string) => void;
  onCreateOrganization?: () => void;
  onCreateWorkspace?: (organizationId: string) => void;
}

export const OrganizationSelectorMenu = ({
  onSelect,
  onCreateOrganization,
  onCreateWorkspace,
}: OrganizationSelectorMenuProps) => {
  const { organizations } = useOrganizationList();
  const { workspaces } = useWorkspaceList();
  const { switchOrganization, switchWorkspace } = useSession();
  const { deployment } = useDeployment();
  const [switching, setSwitching] = useState<string | null>(null);
  const [selectedOrgForWorkspace, setSelectedOrgForWorkspace] =
    useState<Organization | null>(null);

  const workspacesEnabled = deployment?.b2b_settings.workspaces_enabled;
  const allowUsersToCreateOrgs =
    deployment?.b2b_settings.allow_users_to_create_orgs;

  const showingWorkspaces = workspacesEnabled && selectedOrgForWorkspace;

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
      setSwitching(org.id);
      try {
        await switchOrganization(org.id);
        setSelectedOrgForWorkspace(org);
      } finally {
        setSwitching(null);
      }
      return;
    }

    setSwitching(org.id);
    try {
      await switchOrganization(org.id);
      onSelect(org.id);
    } finally {
      setSwitching(null);
    }
  };

  const handleSelectWorkspace = async (
    org: Organization,
    workspace: WorkspaceWithOrganization,
  ) => {
    setSwitching(workspace.id);
    try {
      await switchWorkspace(workspace.id);
      onSelect(org.id, workspace.id);
    } finally {
      setSwitching(null);
    }
  };

  const dialogTitle = showingWorkspaces
    ? "Select a workspace"
    : "Select an organization";

  const dialogSubtitle = showingWorkspaces
    ? `Choose a workspace in ${selectedOrgForWorkspace?.name}`
    : workspacesEnabled
      ? "Choose an organization to view its workspaces"
      : `to continue to ${deployment?.ui_settings?.app_name || "App"}`;

  const selectedOrgWorkspaces = selectedOrgForWorkspace
    ? workspaces?.filter(
        (w: WorkspaceWithOrganization) =>
          w.organization.id === selectedOrgForWorkspace.id,
      )
    : [];

  return (
    <Container>
      <AuthFormImage />

      <TopBar>
        {showingWorkspaces ? (
          <BackButton onClick={() => setSelectedOrgForWorkspace(null)}>
            <ArrowLeft />
            Back
          </BackButton>
        ) : (
          <div />
        )}
        <UserButton showName={false} />
      </TopBar>

      <Header>
        <Title>{dialogTitle}</Title>
        <Subtitle>{dialogSubtitle}</Subtitle>
      </Header>

      <ListContainer>
        {showingWorkspaces ? (
          <>
            {selectedOrgWorkspaces && selectedOrgWorkspaces.length > 0 ? (
              selectedOrgWorkspaces.map(
                (workspace: WorkspaceWithOrganization) => (
                  <ListItem
                    key={workspace.id}
                    onClick={() =>
                      handleSelectWorkspace(selectedOrgForWorkspace, workspace)
                    }
                    disabled={switching === workspace.id}
                  >
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
                      <ChevronRight />
                    </ItemArrow>
                  </ListItem>
                ),
              )
            ) : (
              <EmptyState>
                <EmptyStateTitle>No workspaces yet</EmptyStateTitle>
                <EmptyStateText>
                  Create your first workspace for {selectedOrgForWorkspace?.name}
                </EmptyStateText>
                <EmptyStateCTA
                  onClick={() =>
                    onCreateWorkspace?.(selectedOrgForWorkspace!.id)
                  }
                >
                  <Plus />
                  Create workspace
                </EmptyStateCTA>
              </EmptyState>
            )}
          </>
        ) : organizations && organizations.length > 0 ? (
          organizations.map((org) => {
            const orgWorkspaces = workspaces?.filter(
              (w: WorkspaceWithOrganization) => w.organization.id === org.id,
            );
            const workspaceCount = orgWorkspaces?.length || 0;

            return (
              <ListItem
                key={org.id}
                onClick={() => handleSelectOrganization(org)}
                disabled={switching === org.id}
              >
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
                        Organization
                      </>
                    )}
                  </ItemMeta>
                </ItemContent>
                <ItemArrow>
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
              <EmptyStateCTA onClick={() => onCreateOrganization?.()}>
                <Plus />
                Create organization
              </EmptyStateCTA>
            )}
          </EmptyState>
        )}
      </ListContainer>

      {showingWorkspaces &&
        selectedOrgWorkspaces &&
        selectedOrgWorkspaces.length > 0 && (
          <CreateButton
            onClick={() => onCreateWorkspace?.(selectedOrgForWorkspace.id)}
            disabled={switching !== null}
          >
            <Plus />
            Create new workspace
          </CreateButton>
        )}

      {!showingWorkspaces && organizations && organizations.length > 0 && allowUsersToCreateOrgs && (
        <CreateButton
          onClick={() => onCreateOrganization?.()}
          disabled={switching !== null}
        >
          <Plus />
          Create new organization
        </CreateButton>
      )}

      <Footer>
        {showingWorkspaces ? (
          <>
            Wrong organization?{" "}
            <Link onClick={() => setSelectedOrgForWorkspace(null)}>
              Go back
            </Link>
          </>
        ) : (
          <>
            Having trouble?{" "}
            <Link>
              <NavigationLink
                to={deployment?.ui_settings?.support_page_url || "#"}
              >
                Get help
              </NavigationLink>
            </Link>
          </>
        )}
      </Footer>
    </Container>
  );
};
