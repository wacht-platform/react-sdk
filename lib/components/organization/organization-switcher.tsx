"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  Settings,
  Building,
  FolderKanban,
} from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import {
  useActiveOrganization,
  useOrganizationMemberships,
} from "@/hooks/use-organization";
import { useWorkspaceMemberships } from "@/hooks/use-workspace";
import { useDeployment, useSession } from "@/hooks";
import { Workspace } from "@/types/organization";
import CreateOrganizationDialog from "./create-organization-dialog";
import { ManageOrganizationDialog } from "./manage-organization-dialog";
import { CreateWorkspaceDialog } from "../workspace/create-workspace-dialog";
import { useDialog } from "../utility/use-dialog";

const Container = styled.div`
  position: relative;
  max-width: 100%;
  min-width: 224px;
`;

const SwitcherButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-foreground);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const AvatarContainer = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 2px var(--color-shadow);
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  font-weight: 500;
  font-size: 12px;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  width: 24px;
  height: 24px;
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TruncateText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SubdueText = styled.span`
  color: var(--color-secondary-text);
`;

const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 50;
  overflow: hidden;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  transform: ${(props) => (props.isOpen ? "scale(1)" : "scale(0.95)")};
  transform-origin: top;
  pointer-events: ${(props) => (props.isOpen ? "auto" : "none")};
  transition: all 0.2s ease;
  width: 360px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: none;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  outline: none;
  background: var(--color-background);
  color: var(--color-foreground);

  &::placeholder {
    color: var(--color-secondary-text);
  }
`;

const GroupHeading = styled.div`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--color-secondary-text);
`;

const MenuItem = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
  text-align: left;
  font-size: 14px;
  border: none;
  height: 40px;
  background: ${(props) =>
    props.$isActive ? "var(--color-input-background)" : "transparent"};
  cursor: pointer;
  color: var(--color-foreground);

  &:hover {
    background: var(--color-input-background);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    pointer-events: none;
  }
`;

const WorkspaceMenuItem = styled(MenuItem)`
  padding-left: 36px;
`;

const Separator = styled.div`
  height: 1px;
  width: 100%;
  background: var(--color-border);
  margin: 4px 0;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  margin-right: 2px;
`;

const WorkspaceIcon = styled.div`
  color: var(--color-secondary-text);
`;

const ActionIconContainer = styled.div<{ $destructive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-input-background);
  color: ${({ $destructive }) =>
    $destructive ? "var(--color-error)" : "var(--color-secondary-text)"};
  margin-right: 6px;
`;

const VioletIconContainer = styled(ActionIconContainer)`
  background: var(--color-primary-background);
  color: var(--color-primary);
`;

const Spinner = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface EnhancedOrganization {
  id: string;
  name: string;
  image_url?: string;
  workspaces?: Workspace[];
  personal?: boolean;
}

export const OrganizationSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createOrgDialog = useDialog(false);
  const manageOrgDialog = useDialog(false);
  const createWorkspaceDialog = useDialog(false);

  const {
    organizationMemberships,
    loading: organizationLoading,
    refetch: refetchOrganizations,
  } = useOrganizationMemberships();
  const { activeOrganization: selectedOrganization } = useActiveOrganization();
  const {
    workspaceMemberships,
    loading: workspaceMembershipsLoading,
    refetch: refetchWorkspaceMemberships,
  } = useWorkspaceMemberships();
  const {
    session,
    loading: sessionLoading,
    switchOrganization,
    switchWorkspace,
  } = useSession();
  const { deployment } = useDeployment();

  const organizationsEnabled = useMemo(() => {
    return deployment?.b2b_settings.organizations_enabled;
  }, [deployment]);

  const workspacesEnabled = useMemo(() => {
    return deployment?.b2b_settings.workspaces_enabled;
  }, [deployment]);

  const allowUsersToCreateOrgs = useMemo(() => {
    return deployment?.b2b_settings.allow_users_to_create_orgs;
  }, [deployment]);

  const { dropdownOrgList, selectedOrg, selectedWorkspace } = useMemo(() => {
    const orgs: EnhancedOrganization[] = [];

    const personalOrg: EnhancedOrganization = {
      id: session?.active_signin?.user?.id ?? "",
      name: "Personal Account",
      image_url: session?.active_signin?.user?.profile_picture_url,
      personal: true,
    };

    orgs.push(personalOrg);

    const workspacesByOrg =
      (workspacesEnabled &&
        workspaceMemberships?.reduce((acc, membership) => {
          if (!acc[membership.organization_id]) {
            acc[membership.organization_id] = [];
          }

          const enhancedWorkspace = {
            ...membership.workspace,
          };

          acc[membership.organization_id].push(enhancedWorkspace);
          return acc;
        }, {} as Record<string, Workspace[]>)) ||
      {};

    organizationMemberships?.forEach(({ organization: org }) => {
      orgs.push({
        id: org.id,
        name: org.name,
        image_url: org.image_url,
        workspaces: workspacesEnabled
          ? workspacesByOrg[org.id] || []
          : undefined,
      });
    });

    const defaultOrg = orgs[0];
    let selectedOrg = defaultOrg;
    let selectedWorkspace: Workspace | null = null;

    if (session?.active_signin?.active_organization_membership_id) {
      selectedOrg = {
        id: selectedOrganization?.id ?? "",
        name: selectedOrganization?.name ?? "",
        image_url: selectedOrganization?.image_url ?? "",
        workspaces: workspacesEnabled
          ? workspacesByOrg[selectedOrganization?.id ?? ""] || []
          : undefined,
        personal: false,
      };
      if (workspacesEnabled && selectedOrg.workspaces) {
        selectedWorkspace =
          workspaceMemberships?.find(
            (ws) =>
              ws.id === session?.active_signin?.active_workspace_membership_id
          )?.workspace ?? null;
      }
    }

    return {
      dropdownOrgList: orgs,
      selectedOrg,
      selectedWorkspace,
    };
  }, [
    organizationMemberships,
    workspaceMemberships,
    session,
    workspacesEnabled,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery) return dropdownOrgList;

    return dropdownOrgList.filter((org) => {
      const orgMatches = org.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const workspaceMatches =
        workspacesEnabled &&
        org.workspaces?.some((ws) =>
          ws.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return orgMatches || workspaceMatches;
    });
  }, [dropdownOrgList, searchQuery, workspacesEnabled]);

  const handleOrganizationCreated = () => {
    refetchOrganizations();
  };

  const handleWorkspaceCreated = () => {
    refetchWorkspaceMemberships();
  };

  if (organizationLoading || sessionLoading || workspaceMembershipsLoading) {
    return null;
  }

  // Don't render if organizations are disabled
  if (!organizationsEnabled) {
    return null;
  }

  const handleSwitchOrganization = (orgId?: string) => {
    if (selectedOrg.id === (orgId || session?.active_signin?.user?.id)) return;
    setIsSwitching(true);
    switchOrganization(orgId).finally(() => {
      setIsSwitching(false);
      setOpen(false);
    });
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    if (selectedWorkspace?.id === workspaceId) return;
    setIsSwitching(true);
    switchWorkspace(workspaceId).finally(() => {
      setIsSwitching(false);
      setOpen(false);
    });
  };

  return (
    <DefaultStylesProvider>
      <Container ref={dropdownRef}>
        <SwitcherButton onClick={() => setOpen(!open)} disabled={isSwitching}>
          <FlexContainer>
            <AvatarContainer>
              {isSwitching ? (
                <AvatarFallback style={{ background: "var(--color-border)" }}>
                  <Spinner />
                </AvatarFallback>
              ) : selectedOrg.image_url ? (
                <AvatarImage
                  src={selectedOrg.image_url}
                  alt={selectedOrg.name}
                />
              ) : (
                <IconContainer>
                  <Building size={14} />
                </IconContainer>
              )}
            </AvatarContainer>
            <TruncateText>
              {selectedOrg.name}
              {workspacesEnabled && selectedWorkspace && (
                <SubdueText> / {selectedWorkspace.name}</SubdueText>
              )}
            </TruncateText>
          </FlexContainer>
          {isSwitching ? (
            <span style={{ width: "16px", height: "16px" }}></span>
          ) : (
            <ChevronsUpDown size={16} opacity={0.5} />
          )}
        </SwitcherButton>

        <Dropdown isOpen={open}>
          <SearchInput
            placeholder={
              workspacesEnabled
                ? "Search organization or workspace..."
                : "Search organization..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {filteredOrganizations.length === 0 && (
              <MenuItem>
                No organization{workspacesEnabled ? " or workspace" : ""} found.
              </MenuItem>
            )}

            {workspacesEnabled
              ? filteredOrganizations.map((org, index) => (
                  <React.Fragment key={org.id}>
                    <GroupHeading>{org.name}</GroupHeading>
                    <MenuItem
                      $isActive={
                        selectedOrg.id === org.id && !selectedWorkspace
                      }
                      onClick={() => {
                        handleSwitchOrganization(
                          org.personal ? undefined : org.id
                        );
                      }}
                      disabled={isSwitching}
                    >
                      <FlexContainer>
                        {org.image_url ? (
                          <AvatarImage src={org.image_url} alt={org.name} />
                        ) : (
                          <IconContainer>
                            <Building size={14} />
                          </IconContainer>
                        )}
                        <span style={{ marginTop: "-2px" }}>{org.name}</span>
                      </FlexContainer>
                      {selectedOrg.id === org.id && !selectedWorkspace && (
                        <Check size={16} color="var(--color-primary)" />
                      )}
                    </MenuItem>

                    {org.workspaces?.map((workspace) => (
                      <WorkspaceMenuItem
                        key={workspace.id}
                        $isActive={selectedWorkspace?.id === workspace.id}
                        onClick={() => {
                          handleSwitchWorkspace(workspace.id);
                        }}
                        disabled={isSwitching}
                      >
                        <FlexContainer>
                          {workspace.image_url ? (
                            <AvatarImage
                              style={{ width: 20, height: 20 }}
                              src={workspace.image_url}
                              alt={workspace.name}
                            />
                          ) : (
                            <FolderKanban
                              size={20}
                              color="var(--color-primary)"
                            />
                          )}
                          <span>{workspace.name}</span>
                        </FlexContainer>
                        {selectedWorkspace?.id === workspace.id && (
                          <Check size={16} color="var(--color-primary)" />
                        )}
                      </WorkspaceMenuItem>
                    ))}

                    {!org.personal && (
                      <WorkspaceMenuItem
                        onClick={() => {
                          createWorkspaceDialog.open();
                        }}
                        disabled={isSwitching}
                      >
                        <FlexContainer>
                          <WorkspaceIcon>
                            <PlusCircle size={14} />
                          </WorkspaceIcon>
                          <SubdueText>Add Workspace</SubdueText>
                        </FlexContainer>
                      </WorkspaceMenuItem>
                    )}
                    {index != filteredOrganizations.length - 1 && <Separator />}
                  </React.Fragment>
                ))
              : filteredOrganizations.map((org, index) => (
                  <React.Fragment key={org.id}>
                    <MenuItem
                      key={org.id}
                      $isActive={selectedOrg.id === org.id}
                      onClick={() => {
                        handleSwitchOrganization(
                          org.personal ? undefined : org.id
                        );
                      }}
                      disabled={isSwitching}
                    >
                      <FlexContainer>
                        {org.image_url ? (
                          <AvatarImage src={org.image_url} alt={org.name} />
                        ) : (
                          <IconContainer>
                            <Building size={14} />
                          </IconContainer>
                        )}
                        <span style={{ marginTop: "-2px" }}>{org.name}</span>
                      </FlexContainer>
                      {selectedOrg.id === org.id && (
                        <Check size={16} color="var(--color-primary)" />
                      )}
                    </MenuItem>
                    {index != filteredOrganizations.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
          </div>

          <Separator />

          {allowUsersToCreateOrgs && (
            <MenuItem
              onClick={() => createOrgDialog.open()}
              disabled={isSwitching}
            >
              <FlexContainer>
                <VioletIconContainer>
                  <PlusCircle size={14} />
                </VioletIconContainer>
                <span>Create Organization</span>
              </FlexContainer>
            </MenuItem>
          )}

          {!selectedOrg.personal && (
            <>
              <MenuItem
                onClick={() => {
                  manageOrgDialog.open();
                  setOpen(false);
                }}
                disabled={isSwitching}
              >
                <FlexContainer>
                  <ActionIconContainer>
                    <Settings size={14} />
                  </ActionIconContainer>
                  <span>Manage Organizations</span>
                </FlexContainer>
              </MenuItem>
            </>
          )}
        </Dropdown>

        {workspacesEnabled && selectedOrg && !selectedOrg.personal && (
          <CreateWorkspaceDialog
            isOpen={createWorkspaceDialog.isOpen}
            onClose={createWorkspaceDialog.close}
            onCreated={handleWorkspaceCreated}
            organizationId={selectedOrg.id}
            organizationName={selectedOrg.name}
          />
        )}

        {organizationsEnabled && allowUsersToCreateOrgs && (
          <CreateOrganizationDialog
            isOpen={createOrgDialog.isOpen}
            onClose={createOrgDialog.close}
            onCreated={handleOrganizationCreated}
          />
        )}

        <ManageOrganizationDialog
          isOpen={manageOrgDialog.isOpen}
          onClose={manageOrgDialog.close}
        />
      </Container>
    </DefaultStylesProvider>
  );
};

export default OrganizationSwitcher;
