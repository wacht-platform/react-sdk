"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Plus, Building2, Users, ChevronRight, ArrowLeft } from "lucide-react";
import { useOrganizationList, useSession, useDeployment } from "@/hooks";
import { useWorkspaceList } from "@/hooks/use-workspace";
import type { Organization, WorkspaceWithOrganization } from "@/types";
import { AuthFormImage } from "../auth/auth-image";
import { NavigationLink } from "../utility/navigation";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const Container = styled.div`
  width: 100%;
  padding: var(--space-3xl) var(--space-xl);
  background: var(--color-background);
  animation: ${fadeIn} 0.3s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--space-2xl);
`;

const Title = styled.h1`
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: var(--space-sm);
  margin-top: 0;
`;

const Subtitle = styled.p`
  color: var(--color-secondary-text);
  font-size: var(--font-sm);
  margin: 0;
  font-weight: 400;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--color-secondary-text);
  font-size: var(--font-sm);
  cursor: pointer;
  padding: var(--space-sm);
  margin-bottom: var(--space-lg);
  transition: all 0.2s ease;
  border-radius: var(--radius-md);

  &:hover {
    color: var(--color-foreground);
    background: var(--color-background-hover);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
  margin: var(--space-xl) 0;
  max-height: 500px;
  overflow-y: auto;
  padding: var(--space-xs);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-secondary-text);
  }
`;

const Card = styled.button<{ $isDisabled?: boolean }>`
  position: relative;
  padding: var(--space-xl);
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  animation: ${slideIn} 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
`;

const Avatar = styled.div<{ $size?: "sm" | "md" | "lg" }>`
  width: ${(props) =>
    props.$size === "lg" ? "64px" : props.$size === "sm" ? "40px" : "48px"};
  height: ${(props) =>
    props.$size === "lg" ? "64px" : props.$size === "sm" ? "40px" : "48px"};
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  font-size: ${(props) =>
    props.$size === "lg"
      ? "var(--font-xl)"
      : props.$size === "sm"
        ? "var(--font-sm)"
        : "var(--font-lg)"};
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.h3`
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  font-weight: 500;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const CardArrow = styled.div`
  position: absolute;
  top: 50%;
  right: var(--space-lg);
  transform: translateY(-50%);
  color: var(--color-secondary-text);
  transition: all 0.2s ease;

  ${Card}:hover & {
    color: var(--color-primary);
    transform: translateY(-50%) translateX(4px);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CreateCard = styled(Card)`
  border-style: dashed;
  border-color: var(--color-border);
  background: transparent;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  color: var(--color-secondary-text);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-background-hover);
    color: var(--color-primary);
  }
`;

const CreateCardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
`;

const CreateIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  ${CreateCard}:hover & {
    background: var(--color-primary);
    color: white;
    transform: scale(1.1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const CreateCardText = styled.span`
  font-size: var(--font-sm);
  font-weight: 500;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  color: var(--color-secondary-text);
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  border-radius: 50%;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);

  svg {
    width: 40px;
    height: 40px;
  }
`;

const EmptyStateTitle = styled.h3`
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 var(--space-sm) 0;
`;

const EmptyStateText = styled.p`
  font-size: var(--font-sm);
  color: var(--color-secondary-text);
  margin: 0;
`;

const Footer = styled.div`
  margin-top: var(--space-xl);
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
    text-decoration: underline;
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

      {showingWorkspaces && (
        <BackButton onClick={() => setSelectedOrgForWorkspace(null)}>
          <ArrowLeft />
          Back to organizations
        </BackButton>
      )}

      <Header>
        <Title>{dialogTitle}</Title>
        <Subtitle>{dialogSubtitle}</Subtitle>
      </Header>

      <GridContainer>
        {showingWorkspaces ? (
          <>
            {selectedOrgWorkspaces && selectedOrgWorkspaces.length > 0 ? (
              <>
                {selectedOrgWorkspaces.map(
                  (workspace: WorkspaceWithOrganization) => (
                    <Card
                      key={workspace.id}
                      onClick={() =>
                        handleSelectWorkspace(
                          selectedOrgForWorkspace,
                          workspace,
                        )
                      }
                      disabled={switching === workspace.id}
                    >
                      <CardHeader>
                        <Avatar $size="md">
                          {workspace.image_url ? (
                            <AvatarImage
                              src={workspace.image_url}
                              alt={workspace.name}
                            />
                          ) : (
                            getInitials(workspace.name).charAt(0)
                          )}
                        </Avatar>
                        <CardContent>
                          <CardTitle>{workspace.name}</CardTitle>
                          <CardMeta>
                            <Users />
                            Workspace
                          </CardMeta>
                        </CardContent>
                      </CardHeader>
                      <CardArrow>
                        <ChevronRight />
                      </CardArrow>
                    </Card>
                  ),
                )}
                <CreateCard
                  onClick={() => onCreateWorkspace?.(selectedOrgForWorkspace.id)}
                  disabled={switching !== null}
                >
                  <CreateCardContent>
                    <CreateIcon>
                      <Plus />
                    </CreateIcon>
                    <CreateCardText>Create new workspace</CreateCardText>
                  </CreateCardContent>
                </CreateCard>
              </>
            ) : (
              <EmptyState>
                <EmptyStateIcon>
                  <Users />
                </EmptyStateIcon>
                <EmptyStateTitle>No workspaces yet</EmptyStateTitle>
                <EmptyStateText>
                  Create your first workspace to get started with {selectedOrgForWorkspace?.name}.
                </EmptyStateText>
              </EmptyState>
            )}
          </>
        ) : organizations && organizations.length > 0 ? (
          <>
            {organizations.map((org) => {
              const orgWorkspaces = workspaces?.filter(
                (w: WorkspaceWithOrganization) => w.organization.id === org.id,
              );
              const workspaceCount = orgWorkspaces?.length || 0;

              return (
                <Card
                  key={org.id}
                  onClick={() => handleSelectOrganization(org)}
                  disabled={switching === org.id}
                >
                  <CardHeader>
                    <Avatar $size="md">
                      {org.image_url ? (
                        <AvatarImage src={org.image_url} alt={org.name} />
                      ) : (
                        getInitials(org.name)
                      )}
                    </Avatar>
                    <CardContent>
                      <CardTitle>{org.name}</CardTitle>
                      <CardMeta>
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
                      </CardMeta>
                    </CardContent>
                  </CardHeader>
                  <CardArrow>
                    <ChevronRight />
                  </CardArrow>
                </Card>
              );
            })}
            {allowUsersToCreateOrgs && (
              <CreateCard
                onClick={() => onCreateOrganization?.()}
                disabled={switching !== null}
              >
                <CreateCardContent>
                  <CreateIcon>
                    <Plus />
                  </CreateIcon>
                  <CreateCardText>Create new organization</CreateCardText>
                </CreateCardContent>
              </CreateCard>
            )}
          </>
        ) : (
          <EmptyState>
            <EmptyStateIcon>
              <Building2 />
            </EmptyStateIcon>
            <EmptyStateTitle>No organizations yet</EmptyStateTitle>
            <EmptyStateText>
              {allowUsersToCreateOrgs
                ? "Create your first organization to get started."
                : "You don't have access to any organizations yet. Contact your administrator."}
            </EmptyStateText>
          </EmptyState>
        )}
      </GridContainer>

      <Footer>
        {showingWorkspaces ? (
          <>
            Need a different organization?{" "}
            <Link onClick={() => setSelectedOrgForWorkspace(null)}>
              Switch organizations
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
