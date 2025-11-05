"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Plus } from "lucide-react";
import { useOrganizationList, useSession, useDeployment } from "@/hooks";
import { useWorkspaceList } from "@/hooks/use-workspace";
import type { Organization, WorkspaceWithOrganization } from "@/types";
import { AuthFormImage } from "../auth/auth-image";
import { NavigationLink } from "../utility/navigation";

const Container = styled.div`
  width: 100%;
  padding: var(--space-3xl) var(--space-sm);
  background: var(--color-background);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-xl);
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
`;

const MenuList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
  margin: var(--space-lg) 0;
`;

const MenuItem = styled.div<{ $isActive?: boolean; as?: React.ElementType }>`
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
  transition: all 0.2s ease;
  position: relative;
  border-bottom: 1px solid var(--color-border);

  &:hover {
    background: var(--color-background-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const MenuItemAvatar = styled.div<{ $small?: boolean }>`
  width: ${(props) => (props.$small ? "32px" : "40px")};
  height: ${(props) => (props.$small ? "32px" : "40px")};
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-input-background);
  color: var(--color-secondary-text);
  font-size: var(--font-sm);
  font-weight: 500;
  flex-shrink: 0;
`;

const MenuItemAvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MenuItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  overflow: hidden;
  flex: 1;
  min-width: 0;
`;

const MenuItemName = styled.span`
  font-weight: 500;
  font-size: var(--font-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-foreground);
`;

const MenuItemSubtext = styled.span`
  font-size: var(--font-2xs);
  color: var(--color-secondary-text);
  font-weight: 400;
`;

const WorkspaceAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-input-background);
  color: var(--color-secondary-text);
  font-size: var(--font-xs);
  font-weight: 500;
  flex-shrink: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-lg);
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 400;
  transition: background-color 0.2s ease;
  position: relative;

  &:hover {
    background: var(--color-background-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  color: var(--color-secondary-text);
  font-size: var(--font-sm);
  font-weight: 400;
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
    ? `to continue to ${deployment?.ui_settings?.app_name || "App"}`
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
      <Header>
        <Title>{dialogTitle}</Title>
        <Subtitle>{dialogSubtitle}</Subtitle>
      </Header>

      <MenuList>
        {showingWorkspaces ? (
          <>
            {selectedOrgWorkspaces && selectedOrgWorkspaces.length > 0 ? (
              <>
                {selectedOrgWorkspaces.map(
                  (workspace: WorkspaceWithOrganization) => (
                    <MenuItem
                      as="button"
                      key={workspace.id}
                      onClick={() =>
                        handleSelectWorkspace(
                          selectedOrgForWorkspace,
                          workspace,
                        )
                      }
                      disabled={switching === workspace.id}
                    >
                      <WorkspaceAvatar>
                        {workspace.image_url ? (
                          <img
                            src={workspace.image_url}
                            alt={workspace.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(workspace.name).charAt(0)
                        )}
                      </WorkspaceAvatar>
                      <MenuItemInfo>
                        <MenuItemName>{workspace.name}</MenuItemName>
                      </MenuItemInfo>
                    </MenuItem>
                  ),
                )}
              </>
            ) : (
              <EmptyState>
                No workspaces available in this organization.
              </EmptyState>
            )}

            <CreateButton
              onClick={() => onCreateWorkspace?.(selectedOrgForWorkspace.id)}
              disabled={switching !== null}
            >
              <Plus />
              Create workspace
            </CreateButton>
          </>
        ) : organizations && organizations.length > 0 ? (
          <>
            {organizations.map((org) => {
              const orgWorkspaces = workspaces?.filter(
                (w: WorkspaceWithOrganization) => w.organization.id === org.id,
              );
              const workspaceCount = orgWorkspaces?.length || 0;

              return (
                <MenuItem
                  as="button"
                  key={org.id}
                  onClick={() => handleSelectOrganization(org)}
                  disabled={switching === org.id}
                >
                  <MenuItemAvatar $small={!workspacesEnabled}>
                    {org.image_url ? (
                      <MenuItemAvatarImage src={org.image_url} alt={org.name} />
                    ) : (
                      getInitials(org.name)
                    )}
                  </MenuItemAvatar>
                  <MenuItemInfo>
                    <MenuItemName>{org.name}</MenuItemName>
                    {workspacesEnabled && (
                      <MenuItemSubtext>
                        {workspaceCount} workspace
                        {workspaceCount !== 1 ? "s" : ""}
                      </MenuItemSubtext>
                    )}
                  </MenuItemInfo>
                </MenuItem>
              );
            })}
          </>
        ) : (
          <EmptyState>
            {workspacesEnabled
              ? "No workspaces available. Create one to get started."
              : "No organizations available. Create one to get started."}
          </EmptyState>
        )}

        {!showingWorkspaces && (
          <>
            {workspacesEnabled
              ? organizations &&
                organizations.length > 0 &&
                organizations[0] && (
                  <CreateButton
                    onClick={() => {
                      onCreateWorkspace?.(organizations[0].id);
                    }}
                    disabled={switching !== null}
                  >
                    <Plus />
                    Create workspace
                  </CreateButton>
                )
              : allowUsersToCreateOrgs && (
                  <CreateButton
                    onClick={() => {
                      onCreateOrganization?.();
                    }}
                    disabled={switching !== null}
                  >
                    <Plus />
                    Create organization
                  </CreateButton>
                )}
          </>
        )}
      </MenuList>

      {showingWorkspaces ? (
        <Footer>
          Make a mistake?{" "}
          <Link onClick={() => setSelectedOrgForWorkspace(null)}>
            Select Organizations
          </Link>
        </Footer>
      ) : (
        <Footer>
          Having trouble?{" "}
          <Link>
            <NavigationLink
              to={deployment?.ui_settings?.support_page_url || "#"}
            >
              Get help
            </NavigationLink>
          </Link>
        </Footer>
      )}
    </Container>
  );
};
