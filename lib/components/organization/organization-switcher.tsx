"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  Settings,
  Building,
  FolderKanban,
} from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useOrganization, useOrganizationList } from "@/hooks/use-organization";
import { useWorkspaceMemberships } from "@/hooks/use-workspace";
import { useDeployment, useSession } from "@/hooks";
import { Workspace } from "@/types/organization";
import CreateOrganizationDialog from "./create-organization-dialog";
import { ManageOrganizationDialog } from "./manage-organization-dialog";
import { useDialog } from "../utility/use-dialog";

const Container = styled.div`
  position: relative;
  width: 280px;
`;

const SwitcherButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(238, 238, 238, 0.8);

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }

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
  border: 1px solid #e4e4e7;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, #8b5cf6, #7c3aed);
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
  color: #71717a;
`;

const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  border-bottom: 1px solid #f4f4f5;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #a1a1aa;
  }
`;

const GroupHeading = styled.div`
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: #71717a;
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
  background: ${(props) => (props.$isActive ? "#f4f4f5" : "transparent")};
  cursor: pointer;

  &:hover {
    background: #f4f4f5;
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
  background: #f4f4f5;
  margin: 4px 0;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(to bottom right, #8b5cf6, #7c3aed);
  color: white;
  margin-right: 2px;
`;

const WorkspaceIcon = styled.div`
  color: #71717a;
  margin-right: 8px;
`;

const ActionIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f4f4f5;
  color: #71717a;
  margin-right: 6px;
`;

const VioletIconContainer = styled(ActionIconContainer)`
  background: #ede9fe;
  color: #7c3aed;
`;

const Spinner = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(156, 163, 175, 0.5);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Modal Components
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.isOpen ? "auto" : "none")};
  transition: opacity 0.2s ease;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 425px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f4f4f5;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const ModalDescription = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: #71717a;
`;

const ModalBody = styled.div`
  padding: 16px 24px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #f4f4f5;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  }
`;

const Button = styled.button<{ variant?: "primary" | "outline" }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) =>
    props.variant === "primary" &&
    css`
      background: #8b5cf6;
      color: white;
      border: none;

      &:hover {
        background: #7c3aed;
      }
    `}

  ${(props) =>
    props.variant === "outline" &&
    css`
      background: transparent;
      border: 1px solid #e4e4e7;
      color: #18181b;

      &:hover {
        background: #f4f4f5;
      }
    `}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

interface EnhancedWorkspace extends Workspace {
  organizationId: string;
}

interface EnhancedOrganization {
  id: string;
  name: string;
  imageUrl?: string;
  workspaces?: EnhancedWorkspace[];
  personal?: boolean;
}

export const OrganizationSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createOrgDialog = useDialog(false);
  const manageOrgDialog = useDialog(false);

  const {
    organizations,
    loading: organizationLoading,
    refetch: refetchOrganizations,
  } = useOrganizationList();
  const { selectedOrganization } = useOrganization();
  const { workspaceMemberships, loading: workspaceMembershipsLoading } =
    useWorkspaceMemberships();
  const {
    session,
    loading: sessionLoading,
    switchOrganization,
    switchWorkspace,
  } = useSession();
  const { deployment } = useDeployment();

  const workspacesEnabled = useMemo(() => {
    return deployment?.b2b_settings.workspaces_enabled;
  }, [deployment]);

  const { dropdownOrgList, selectedOrg, selectedWorkspace } = useMemo(() => {
    const orgs: EnhancedOrganization[] = [];

    const personalOrg: EnhancedOrganization = {
      id: session?.active_signin?.user?.id ?? "",
      name: "Personal Account",
      imageUrl: session?.active_signin?.user?.profile_picture_url,
      personal: true,
    };

    orgs.push(personalOrg);

    const workspacesByOrg =
      (workspacesEnabled &&
        workspaceMemberships?.reduce((acc, membership) => {
          if (!acc[membership.organization_id]) {
            acc[membership.organization_id] = [];
          }

          const enhancedWorkspace: EnhancedWorkspace = {
            ...membership.workspace,
            organizationId: membership.organization_id,
          };

          acc[membership.organization_id].push(enhancedWorkspace);
          return acc;
        }, {} as Record<string, EnhancedWorkspace[]>)) ||
      {};

    organizations?.forEach((org) => {
      orgs.push({
        id: org.id,
        name: org.name,
        imageUrl: org.image_url,
        workspaces: workspacesEnabled
          ? workspacesByOrg[org.id] || []
          : undefined,
      });
    });

    const defaultOrg = orgs[0];
    const defaultWorkspace = workspacesEnabled
      ? defaultOrg.workspaces?.find(
          (ws) => ws.id === session?.active_signin?.active_workspace_id
        ) ?? null
      : null;

    let selectedOrg = defaultOrg;
    let selectedWorkspace: EnhancedWorkspace | null = defaultWorkspace;

    if (session?.active_signin?.active_organization_id) {
      selectedOrg = {
        id: selectedOrganization?.id ?? "",
        name: selectedOrganization?.name ?? "",
        imageUrl: selectedOrganization?.image_url ?? "",
        workspaces: workspacesEnabled
          ? workspacesByOrg[selectedOrganization?.id ?? ""] || []
          : undefined,
        personal: false,
      };
      if (workspacesEnabled && selectedOrg.workspaces) {
        selectedWorkspace =
          selectedOrg.workspaces.find(
            (ws) => ws.id === session?.active_signin?.active_workspace_id
          ) ?? null;
      }
    }

    return {
      dropdownOrgList: orgs,
      selectedOrg,
      selectedWorkspace,
    };
  }, [organizations, workspaceMemberships, session, workspacesEnabled]);

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

  const handleCreateWorkspace = () => {
    console.log(
      `Creating new workspace: ${newWorkspaceName} in org: ${selectedOrg.name}`
    );
    setNewWorkspaceName("");
    setShowNewWorkspaceDialog(false);
  };

  const handleOrganizationCreated = () => {
    refetchOrganizations();
  };

  if (organizationLoading || sessionLoading || workspaceMembershipsLoading) {
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
                <AvatarFallback style={{ background: "#e4e4e7" }}>
                  <Spinner />
                </AvatarFallback>
              ) : selectedOrg.imageUrl ? (
                <AvatarImage
                  src={selectedOrg.imageUrl}
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

          {filteredOrganizations.length === 0 && (
            <MenuItem>
              No organization{workspacesEnabled ? " or workspace" : ""} found.
            </MenuItem>
          )}

          {workspacesEnabled
            ? filteredOrganizations.map((org) => (
                <React.Fragment key={org.id}>
                  <GroupHeading>{org.name}</GroupHeading>
                  <MenuItem
                    $isActive={selectedOrg.id === org.id && !selectedWorkspace}
                    onClick={() => {
                      handleSwitchOrganization(
                        org.personal ? undefined : org.id
                      );
                    }}
                    disabled={isSwitching}
                  >
                    <FlexContainer>
                      {org.imageUrl ? (
                        <AvatarImage src={org.imageUrl} alt={org.name} />
                      ) : (
                        <IconContainer>
                          <Building size={14} />
                        </IconContainer>
                      )}
                      <span style={{ marginTop: "-2px" }}>{org.name}</span>
                    </FlexContainer>
                    {selectedOrg.id === org.id && !selectedWorkspace && (
                      <Check size={16} color="#8b5cf6" />
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
                        <WorkspaceIcon>
                          <FolderKanban size={14} />
                        </WorkspaceIcon>
                        <span>{workspace.name}</span>
                      </FlexContainer>
                      {selectedWorkspace?.id === workspace.id && (
                        <Check size={16} color="#8b5cf6" />
                      )}
                    </WorkspaceMenuItem>
                  ))}

                  {!org.personal && (
                    <WorkspaceMenuItem
                      onClick={() => {
                        setShowNewWorkspaceDialog(true);
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

                  <Separator />
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
                      {org.imageUrl ? (
                        <AvatarImage src={org.imageUrl} alt={org.name} />
                      ) : (
                        <IconContainer>
                          <Building size={14} />
                        </IconContainer>
                      )}
                      <span style={{ marginTop: "-2px" }}>{org.name}</span>
                    </FlexContainer>
                    {selectedOrg.id === org.id && (
                      <Check size={16} color="#8b5cf6" />
                    )}
                  </MenuItem>
                  {index === filteredOrganizations.length - 1 && <Separator />}
                </React.Fragment>
              ))}

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

          {!selectedOrg.personal && (
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
          )}
        </Dropdown>

        {/* New Workspace Dialog - only show if workspaces are enabled */}
        {workspacesEnabled && (
          <ModalOverlay isOpen={showNewWorkspaceDialog}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Create workspace</ModalTitle>
                <ModalDescription>
                  Add a new workspace to {selectedOrg.name}.
                </ModalDescription>
              </ModalHeader>
              <ModalBody>
                <FormGroup>
                  <Label htmlFor="workspace-name">Workspace name</Label>
                  <Input
                    id="workspace-name"
                    placeholder="Engineering"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowNewWorkspaceDialog(false)}
                  disabled={isSwitching}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateWorkspace}
                  disabled={isSwitching}
                >
                  Create
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}

        <CreateOrganizationDialog
          isOpen={createOrgDialog.isOpen}
          onClose={createOrgDialog.close}
          onCreated={handleOrganizationCreated}
        />

        <ManageOrganizationDialog
          isOpen={manageOrgDialog.isOpen}
          onClose={manageOrgDialog.close}
        />
      </Container>
    </DefaultStylesProvider>
  );
};

export default OrganizationSwitcher;
