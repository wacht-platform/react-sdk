"use client";

import { useState } from "react";
import styled from "styled-components";
import { Plus, Building2, Users, ChevronRight, ArrowLeft } from "lucide-react";
import { useSession, useDeployment, useOrganizationMemberships } from "@/hooks";
import { useWorkspaceList } from "@/hooks/use-workspace";
import type { Organization, WorkspaceWithOrganization, OrganizationMembershipWithOrganization } from "@/types";
import { AuthFormImage } from "../auth/auth-image";
import { Button } from "../utility/button";
import { UserButton } from "../user/user-button";

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
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--color-border);
`;

const RightColumn = styled.div`
  padding: 32px;
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

const ListHeader = styled.h2`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-secondary-text);
  margin: 0 0 8px 0;
`;

const BackButton = styled.button`
  border: none;
  color: var(--color-secondary-text);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-sm);
  margin-bottom: 16px;

  &:hover {
    color: var(--color-foreground);
  }

  svg {
    width: 16px;
    height: 16px;
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
  display: flex;
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

  &:last-child {
    border-bottom: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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

// const CreateButton = styled.button`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: var(--space-md);
//   width: 100%;
//   padding: 12px 16px;
//   border: none;
//   border-radius: var(--radius-md);
//   background: var(--color-primary);
//   cursor: pointer;
//   color: white;
//   font-size: var(--font-sm);
//   font-weight: 400;
//   transition: all 0.2s ease;
//   margin-top: var(--space-lg);

//   &:hover {
//     background: var(--color-primary-hover);
//   }

//   &:disabled {
//     cursor: not-allowed;
//     opacity: 0.6;
//   }

//   svg {
//     width: 16px;
//     height: 16px;
//     color: white;
//   }
// `;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
  background: var(--color-background-hover);
  border-radius: 12px;
  border: 1px dashed var(--color-border);
`;

const EmptyStateTitle = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

const EmptyStateText = styled.div`
  font-size: 14px;
  color: var(--color-secondary-text);
  margin-bottom: 24px;
  max-width: 280px;
  line-height: 1.5;
`;

const EmptyStateCTA = styled(Button)`
  width: auto;
  margin: 0 auto;
  padding: 8px 24px;
  border-radius: 8px;
`;

const Footer = styled.div`
  margin-top: var(--space-lg);
  margin-bottom: var(--space-lg);
  text-align: center;
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
`;

const Link = styled.span`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 400;
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
  const { organizationMemberships } = useOrganizationMemberships();
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
      <LeftColumn>
        <div>
          <AuthFormImage />
          {showingWorkspaces && (
            <BackButton onClick={() => setSelectedOrgForWorkspace(null)}>
              <ArrowLeft size={16} /> Back
            </BackButton>
          )}
          <TitleSection>
            <Title>{dialogTitle}</Title>
            <Subtitle>{dialogSubtitle}</Subtitle>
          </TitleSection>
        </div>
        <UserButton showName={true} />
      </LeftColumn>

      <RightColumn>
        <ListSection>
          <ListHeader>
            {showingWorkspaces ? "Workspaces" : "Your organizations"}
          </ListHeader>
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
                      Create your first workspace for{" "}
                      {selectedOrgForWorkspace?.name}
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
            ) : organizationMemberships && organizationMemberships.length > 0 ? (
              organizationMemberships.map((membership: OrganizationMembershipWithOrganization) => {
                const org = membership.organization;
                const orgWorkspaces = workspaces?.filter(
                  (w: WorkspaceWithOrganization) => w.organization.id === org.id,
                );
                const workspaceCount = orgWorkspaces?.length || 0;
                const memberCount = org.member_count;

                const firstRole = membership.roles[0].name;
                const remainingRolesCount = membership.roles.length - 1;
                const roleName = remainingRolesCount > 0
                  ? `${firstRole.charAt(0).toUpperCase() + firstRole.slice(1)} +${remainingRolesCount}`
                  : firstRole.charAt(0).toUpperCase() + firstRole.slice(1);

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
                            {roleName} • {memberCount} member{memberCount !== 1 ? "s" : ""}
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
        </ListSection>

        {showingWorkspaces &&
          selectedOrgWorkspaces &&
          selectedOrgWorkspaces.length > 0 && (
            <Button
              style={{ marginTop: 'var(--space-md)' }}
              onClick={() => onCreateWorkspace?.(selectedOrgForWorkspace.id)}
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
              style={{ marginTop: 'var(--space-md)' }}
              onClick={() => onCreateOrganization?.()}
              disabled={switching !== null}
            >
              <Plus size={12} />
              Create new organization
            </Button>
          )}

        {showingWorkspaces ? (
          <Footer>
            <>
              Wrong organization?{" "}
              <Link onClick={() => setSelectedOrgForWorkspace(null)}>
                Go back
              </Link>
            </>
          </Footer>
        ) : (
          <></>
        )}
      </RightColumn>
    </Container >
  );
};
