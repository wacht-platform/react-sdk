"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import {
  useActiveOrganization,
  useOrganizationMemberships,
} from "@/hooks/use-organization";
import { useActiveWorkspace, useWorkspaceList } from "@/hooks/use-workspace";
import { useDeployment, useSession } from "@/hooks";
import CreateOrganizationDialog from "./create-organization-dialog";
import { ManageOrganizationDialog } from "./manage-organization-dialog";
import CreateWorkspaceDialog from "../workspace/create-workspace-dialog";
import { ManageWorkspaceDialog } from "../workspace/manage-workspace-dialog";
import { useDialog } from "../utility/use-dialog";
import type { WorkspaceWithOrganization } from "@/types";

const Container = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 300px;
`;

const SwitcherButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e5e5e5;
  background: #ffffff;
  color: #000000;
  transition: all 0.15s ease;
  min-width: 200px;
  width: 100%;

  &:hover {
    background: #fafafa;
    border-color: #d4d4d4;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const Avatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366f1;
  color: white;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OrgName = styled.span`
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #000000;
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 320px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  z-index: 50;
  overflow: hidden;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transform: ${(props) =>
    props.$isOpen ? "translateY(0)" : "translateY(-4px)"};
  pointer-events: ${(props) => (props.$isOpen ? "auto" : "none")};
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const MenuItem = styled.div<{ $isActive?: boolean; as?: any }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px 9px 24px;
  text-align: left;
  font-size: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #000000;
  transition: background 0.1s ease;
  position: relative;

  &:hover {
    background: #f5f5f5;

    .hover-arrow {
      opacity: 1;
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const HoverArrow = styled(ChevronRight)`
  opacity: 0;
  transition: opacity 0.1s ease;
  color: #666666;
`;

const Separator = styled.div`
  height: 1px;
  background: #e5e5e5;
  margin: 0;
`;

const MenuItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const MenuItemAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366f1;
  color: white;
  font-size: 10px;
  font-weight: 600;
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
  gap: 2px;
  overflow: hidden;
`;

const MenuItemName = styled.span`
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #000000;
`;

const MenuItemRole = styled.span`
  font-size: 13px;
  color: #666666;
  font-weight: 400;
`;

const ManageButton = styled.button`
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #d4d4d4;
  background: transparent;
  color: #666666;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  &:hover {
    background: #f5f5f5;
    color: #000000;
  }
`;

const LogoutButton = styled(ManageButton)`
  &:hover:not(:disabled) {
    background: #fee;
    color: #d73a49;
    border-color: #fcc;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CreateOrgButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px;
  text-align: left;
  font-size: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #000000;
  transition: background 0.1s ease;
  position: relative;

  &:hover {
    background: #f5f5f5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const PlusIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px dashed #d4d4d4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  background: #fafafa;
`;

const ActiveIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
`;

const PersonalIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  overflow: hidden;
`;

const PersonalAvatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const WorkspaceItem = styled(MenuItem)`
  padding-left: 48px;
  font-size: 13px;
`;

const WorkspaceAvatar = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e5e5;
  color: #666666;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  padding: 9px 12px;
  margin: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  background: ${(props) => (props.$isError ? "#fee" : "#e3f2fd")};
  color: ${(props) => (props.$isError ? "#d73a49" : "#1976d2")};
  border: 1px solid ${(props) => (props.$isError ? "#fcc" : "#bbdefb")};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ShimmerWrapper = styled.div`
  padding: 8px;
`;

const ShimmerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  animation: shimmer 1.5s ease-in-out infinite;

  @keyframes shimmer {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`;

const ShimmerAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e5e5e5;
`;

const ShimmerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ShimmerLine = styled.div<{ width?: string }>`
  height: 12px;
  background: #e5e5e5;
  border-radius: 4px;
  width: ${(props) => props.width || "100%"};
`;

const ShimmerSmallLine = styled.div<{ width?: string }>`
  height: 10px;
  background: #e5e5e5;
  border-radius: 4px;
  width: ${(props) => props.width || "60%"};
`;

export const OrganizationSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createOrgDialog = useDialog(false);
  const manageOrgDialog = useDialog(false);
  const createWorkspaceDialog = useDialog(false);
  const manageWorkspaceDialog = useDialog(false);
  const [selectedOrgForWorkspace, setSelectedOrgForWorkspace] = useState<
    string | null
  >(null);
  const [leavingOrg, setLeavingOrg] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const {
    organizationMemberships,
    loading: organizationLoading,
    refetch: refetchOrganizations,
  } = useOrganizationMemberships();
  const { activeOrganization, leave: leaveOrganization } =
    useActiveOrganization();
  const { activeWorkspace, leave: leaveWorkspace } = useActiveWorkspace();
  const { workspaces: workspaceList, loading: workspacesLoading } =
    useWorkspaceList();
  const {
    session,
    loading: sessionLoading,
    switchOrganization,
    switchWorkspace,
  } = useSession();
  const { deployment } = useDeployment();

  const organizationsEnabled = deployment?.b2b_settings.organizations_enabled;
  const workspacesEnabled = deployment?.b2b_settings.workspaces_enabled;
  const allowUsersToCreateOrgs =
    deployment?.b2b_settings.allow_users_to_create_orgs;

  const isPersonalActive =
    !session?.active_signin?.active_organization_membership_id;

  const currentDisplay = useMemo(() => {
    if (isPersonalActive) {
      return {
        name: "Personal account",
        image_url: session?.active_signin?.user?.profile_picture_url,
        isPersonal: true,
      };
    }

    let displayName = activeOrganization?.name || "";
    if (workspacesEnabled && activeWorkspace) {
      displayName = `${activeOrganization?.name} / ${activeWorkspace.name}`;
    }

    return {
      name: displayName,
      image_url: activeOrganization?.image_url,
      isPersonal: false,
    };
  }, [
    isPersonalActive,
    activeOrganization,
    activeWorkspace,
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
        setLeaveError(null); // Clear error when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (leaveError) {
      const timer = setTimeout(() => {
        setLeaveError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [leaveError]);

  const handleOrganizationCreated = () => {
    refetchOrganizations();
  };

  if (organizationLoading || sessionLoading) {
    return null;
  }

  if (!organizationsEnabled) {
    return null;
  }

  const handleSwitchOrganization = (orgId?: string) => {
    setIsSwitching(true);
    switchOrganization(orgId).finally(() => {
      setIsSwitching(false);
      setOpen(false);
    });
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    setIsSwitching(true);
    switchWorkspace(workspaceId).finally(() => {
      setIsSwitching(false);
      setOpen(false);
    });
  };

  const toggleOrgExpanded = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DefaultStylesProvider>
      <Container ref={dropdownRef}>
        <SwitcherButton
          onClick={() => {
            setOpen(!open);
            if (!open) {
              setLeaveError(null);
            }
          }}
          disabled={isSwitching}
        >
          <ButtonContent>
            <Avatar>
              {currentDisplay.image_url ? (
                <AvatarImage
                  src={currentDisplay.image_url}
                  alt={currentDisplay.name}
                />
              ) : currentDisplay.isPersonal ? (
                <User size={12} />
              ) : (
                getInitials(currentDisplay.name)
              )}
            </Avatar>
            <OrgName>{currentDisplay.name}</OrgName>
          </ButtonContent>
          <ChevronDown size={16} style={{ color: "#666666" }} />
        </SwitcherButton>

        <Dropdown $isOpen={open}>
          {organizationLoading || workspacesLoading ? (
            <ShimmerWrapper>
              {/* Show current active item shimmer */}
              <ShimmerItem>
                <ShimmerAvatar />
                <ShimmerContent>
                  <ShimmerLine width="120px" />
                  <ShimmerSmallLine width="80px" />
                </ShimmerContent>
              </ShimmerItem>
              <Separator />

              {/* Show 2-3 organization shimmers */}
              <ShimmerItem>
                <ShimmerAvatar />
                <ShimmerContent>
                  <ShimmerLine width="100px" />
                </ShimmerContent>
              </ShimmerItem>
              <Separator />

              <ShimmerItem>
                <ShimmerAvatar />
                <ShimmerContent>
                  <ShimmerLine width="140px" />
                  <ShimmerSmallLine width="60px" />
                </ShimmerContent>
              </ShimmerItem>
              <Separator />

              <ShimmerItem>
                <ShimmerAvatar />
                <ShimmerContent>
                  <ShimmerLine width="110px" />
                </ShimmerContent>
              </ShimmerItem>
            </ShimmerWrapper>
          ) : (
            <div>
              {/* Show active item first */}
              {isPersonalActive ? (
                <MenuItem
                  as="button"
                  $isActive={true}
                  onClick={() => handleSwitchOrganization()}
                  disabled={isSwitching}
                >
                  <ActiveIndicator />
                  <MenuItemContent>
                    <PersonalIcon>
                      {session?.active_signin?.user?.profile_picture_url ? (
                        <PersonalAvatar
                          src={session.active_signin.user.profile_picture_url}
                          alt="Personal account"
                        />
                      ) : (
                        <User size={12} />
                      )}
                    </PersonalIcon>
                    <MenuItemInfo>
                      <MenuItemName>Personal account</MenuItemName>
                    </MenuItemInfo>
                  </MenuItemContent>
                </MenuItem>
              ) : (
                activeOrganization && (
                  <MenuItem
                    $isActive={true}
                    onClick={() => {
                      if (workspacesEnabled) {
                        toggleOrgExpanded(activeOrganization.id);
                      }
                    }}
                    style={
                      isSwitching
                        ? { pointerEvents: "none", opacity: 0.7 }
                        : undefined
                    }
                  >
                    <ActiveIndicator />
                    <MenuItemContent>
                      {workspacesEnabled && (
                        <ChevronDown
                          size={14}
                          style={{
                            marginRight: "4px",
                            transform: expandedOrgs.has(activeOrganization.id)
                              ? "rotate(0deg)"
                              : "rotate(-90deg)",
                            transition: "transform 0.2s ease",
                            color: "#666666",
                          }}
                        />
                      )}
                      <MenuItemAvatar>
                        {activeOrganization.image_url ? (
                          <MenuItemAvatarImage
                            src={activeOrganization.image_url}
                            alt={activeOrganization.name}
                          />
                        ) : (
                          getInitials(activeOrganization.name)
                        )}
                      </MenuItemAvatar>
                      <MenuItemInfo>
                        <MenuItemName>{activeOrganization.name}</MenuItemName>
                        {(() => {
                          const membership = organizationMemberships?.find(
                            (m) => m.organization.id === activeOrganization.id,
                          );
                          if (membership?.role && membership.role.length > 0) {
                            return (
                              <MenuItemRole>
                                {membership.role[0].name === "owner"
                                  ? "Owner"
                                  : membership.role[0].name === "admin"
                                    ? "Admin"
                                    : "Member"}
                              </MenuItemRole>
                            );
                          }
                          return null;
                        })()}
                      </MenuItemInfo>
                    </MenuItemContent>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <ManageButton
                        onClick={(e) => {
                          e.stopPropagation();
                          manageOrgDialog.open();
                          setOpen(false);
                        }}
                        title="Manage organization"
                      >
                        <Settings size={14} />
                      </ManageButton>
                      <LogoutButton
                        onClick={async (e) => {
                          e.stopPropagation();
                          setLeavingOrg(true);
                          setLeaveError(null);
                          try {
                            await leaveOrganization();
                            await refetchOrganizations();
                            setTimeout(() => {
                              setOpen(false);
                              setLeavingOrg(false);
                            }, 500);
                          } catch (error) {
                            setLeaveError(
                              error instanceof Error
                                ? error.message
                                : "Failed to leave organization",
                            );
                            setLeavingOrg(false);
                          }
                        }}
                        disabled={leavingOrg}
                        title="Leave organization"
                      >
                        <LogOut size={14} />
                      </LogoutButton>
                    </div>
                  </MenuItem>
                )
              )}

              {/* Show workspaces if active org is expanded */}
              {activeOrganization &&
                workspacesEnabled &&
                expandedOrgs.has(activeOrganization.id) && (
                  <>
                    {workspaceList
                      ?.filter(
                        (w: WorkspaceWithOrganization) =>
                          w.organization.id === activeOrganization.id,
                      )
                      .map((workspace: WorkspaceWithOrganization) => {
                        const isWorkspaceActive =
                          activeWorkspace?.id === workspace.id;
                        return (
                          <WorkspaceItem
                            as={isWorkspaceActive ? undefined : "button"}
                            key={workspace.id}
                            $isActive={isWorkspaceActive}
                            onClick={
                              isWorkspaceActive
                                ? undefined
                                : () => handleSwitchWorkspace(workspace.id)
                            }
                            {...(isWorkspaceActive
                              ? {
                                  style: isSwitching
                                    ? { pointerEvents: "none", opacity: 0.7 }
                                    : undefined,
                                }
                              : { disabled: isSwitching })}
                          >
                            {isWorkspaceActive && <ActiveIndicator />}
                            <MenuItemContent>
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
                            </MenuItemContent>
                            {isWorkspaceActive ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <ManageButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    manageWorkspaceDialog.open();
                                    setOpen(false);
                                  }}
                                  title="Manage workspace"
                                >
                                  <Settings size={14} />
                                </ManageButton>
                                <LogoutButton
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      if (leaveWorkspace) {
                                        await leaveWorkspace();
                                        setOpen(false);
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Failed to leave workspace",
                                        error,
                                      );
                                    }
                                  }}
                                  title="Leave workspace"
                                >
                                  <LogOut size={14} />
                                </LogoutButton>
                              </div>
                            ) : (
                              <HoverArrow className="hover-arrow" size={16} />
                            )}
                          </WorkspaceItem>
                        );
                      })}
                    <WorkspaceItem
                      as="button"
                      onClick={() => {
                        setSelectedOrgForWorkspace(activeOrganization.id);
                        createWorkspaceDialog.open();
                        setOpen(false);
                      }}
                      disabled={isSwitching}
                    >
                      <MenuItemContent>
                        <PlusIcon style={{ width: "16px", height: "16px" }}>
                          <Plus size={12} />
                        </PlusIcon>
                        <MenuItemInfo>
                          <MenuItemName>Create workspace</MenuItemName>
                        </MenuItemInfo>
                      </MenuItemContent>
                    </WorkspaceItem>
                  </>
                )}

              {/* Show status messages */}
              {(leavingOrg || leaveError) && (
                <>
                  {leavingOrg && (
                    <StatusMessage>
                      <Spinner />
                      Leaving organization...
                    </StatusMessage>
                  )}
                  {leaveError && (
                    <StatusMessage $isError>
                      <span>⚠️</span>
                      {leaveError}
                    </StatusMessage>
                  )}
                </>
              )}

              <Separator />

              {/* Show personal account if not active */}
              {!isPersonalActive && (
                <>
                  <MenuItem
                    as="button"
                    $isActive={false}
                    onClick={() => handleSwitchOrganization()}
                    disabled={isSwitching}
                  >
                    <MenuItemContent>
                      <PersonalIcon>
                        {session?.active_signin?.user?.profile_picture_url ? (
                          <PersonalAvatar
                            src={session.active_signin.user.profile_picture_url}
                            alt="Personal account"
                          />
                        ) : (
                          <User size={12} />
                        )}
                      </PersonalIcon>
                      <MenuItemInfo>
                        <MenuItemName>Personal account</MenuItemName>
                      </MenuItemInfo>
                    </MenuItemContent>
                    <HoverArrow className="hover-arrow" size={16} />
                  </MenuItem>
                  <Separator />
                </>
              )}

              {/* Show other organizations */}
              {organizationMemberships &&
                organizationMemberships.length > 0 && (
                  <>
                    {organizationMemberships
                      .filter(
                        (m) => m.organization.id !== activeOrganization?.id,
                      )
                      .map((membership, index, filteredArray) => {
                        const org = membership.organization;
                        const orgWorkspaces =
                          workspaceList?.filter(
                            (w: WorkspaceWithOrganization) =>
                              w.organization.id === org.id,
                          ) || [];
                        const isExpanded = expandedOrgs.has(org.id);

                        return (
                          <React.Fragment key={org.id}>
                            <MenuItem
                              as="button"
                              $isActive={false}
                              onClick={() => {
                                if (workspacesEnabled) {
                                  toggleOrgExpanded(org.id);
                                } else {
                                  handleSwitchOrganization(org.id);
                                }
                              }}
                              disabled={isSwitching}
                            >
                              <MenuItemContent>
                                {workspacesEnabled && (
                                  <ChevronDown
                                    size={14}
                                    style={{
                                      marginRight: "4px",
                                      transform: isExpanded
                                        ? "rotate(0deg)"
                                        : "rotate(-90deg)",
                                      transition: "transform 0.2s ease",
                                      color: "#666666",
                                    }}
                                  />
                                )}
                                <MenuItemAvatar>
                                  {org.image_url ? (
                                    <MenuItemAvatarImage
                                      src={org.image_url}
                                      alt={org.name}
                                    />
                                  ) : (
                                    getInitials(org.name)
                                  )}
                                </MenuItemAvatar>
                                <MenuItemInfo>
                                  <MenuItemName>{org.name}</MenuItemName>
                                  {membership.role &&
                                    membership.role.length > 0 && (
                                      <MenuItemRole>
                                        {membership.role[0].name === "owner"
                                          ? "Owner"
                                          : membership.role[0].name === "admin"
                                            ? "Admin"
                                            : "Member"}
                                      </MenuItemRole>
                                    )}
                                </MenuItemInfo>
                              </MenuItemContent>
                              <HoverArrow className="hover-arrow" size={16} />
                            </MenuItem>

                            {workspacesEnabled && isExpanded && (
                              <>
                                {orgWorkspaces.map(
                                  (workspace: WorkspaceWithOrganization) => {
                                    const isWorkspaceActive =
                                      activeWorkspace?.id === workspace.id;
                                    return (
                                      <WorkspaceItem
                                        as={
                                          isWorkspaceActive
                                            ? undefined
                                            : "button"
                                        }
                                        key={workspace.id}
                                        $isActive={isWorkspaceActive}
                                        onClick={
                                          isWorkspaceActive
                                            ? undefined
                                            : () =>
                                                handleSwitchWorkspace(
                                                  workspace.id,
                                                )
                                        }
                                        {...(isWorkspaceActive
                                          ? {
                                              style: isSwitching
                                                ? {
                                                    pointerEvents: "none",
                                                    opacity: 0.7,
                                                  }
                                                : undefined,
                                            }
                                          : { disabled: isSwitching })}
                                      >
                                        {isWorkspaceActive && (
                                          <ActiveIndicator />
                                        )}
                                        <MenuItemContent>
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
                                              getInitials(
                                                workspace.name,
                                              ).charAt(0)
                                            )}
                                          </WorkspaceAvatar>
                                          <MenuItemInfo>
                                            <MenuItemName>
                                              {workspace.name}
                                            </MenuItemName>
                                          </MenuItemInfo>
                                        </MenuItemContent>
                                        {isWorkspaceActive ? (
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "8px",
                                            }}
                                          >
                                            <ManageButton
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                manageWorkspaceDialog.open();
                                                setOpen(false);
                                              }}
                                              title="Manage workspace"
                                            >
                                              <Settings size={14} />
                                            </ManageButton>
                                            <LogoutButton
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                  if (leaveWorkspace) {
                                                    await leaveWorkspace();
                                                    setOpen(false);
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Failed to leave workspace",
                                                    error,
                                                  );
                                                }
                                              }}
                                              title="Leave workspace"
                                            >
                                              <LogOut size={14} />
                                            </LogoutButton>
                                          </div>
                                        ) : (
                                          <HoverArrow
                                            className="hover-arrow"
                                            size={16}
                                          />
                                        )}
                                      </WorkspaceItem>
                                    );
                                  },
                                )}
                                <WorkspaceItem
                                  as="button"
                                  onClick={() => {
                                    setSelectedOrgForWorkspace(org.id);
                                    createWorkspaceDialog.open();
                                    setOpen(false);
                                  }}
                                  disabled={isSwitching}
                                >
                                  <MenuItemContent>
                                    <PlusIcon
                                      style={{ width: "16px", height: "16px" }}
                                    >
                                      <Plus size={12} />
                                    </PlusIcon>
                                    <MenuItemInfo>
                                      <MenuItemName>
                                        Create workspace
                                      </MenuItemName>
                                    </MenuItemInfo>
                                  </MenuItemContent>
                                </WorkspaceItem>
                              </>
                            )}
                            {index < filteredArray.length - 1 && <Separator />}
                          </React.Fragment>
                        );
                      })}
                  </>
                )}

              {/* Always show create organization button at bottom */}
              {allowUsersToCreateOrgs && (
                <>
                  <Separator />
                  <CreateOrgButton
                    onClick={() => {
                      createOrgDialog.open();
                      setOpen(false);
                    }}
                    disabled={isSwitching}
                  >
                    <MenuItemContent>
                      <PlusIcon>
                        <Plus size={14} />
                      </PlusIcon>
                      <MenuItemInfo>
                        <MenuItemName>Create organization</MenuItemName>
                      </MenuItemInfo>
                    </MenuItemContent>
                  </CreateOrgButton>
                </>
              )}
            </div>
          )}
        </Dropdown>

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

        <ManageWorkspaceDialog
          isOpen={manageWorkspaceDialog.isOpen}
          onClose={manageWorkspaceDialog.close}
        />

        {selectedOrgForWorkspace && (
          <CreateWorkspaceDialog
            isOpen={createWorkspaceDialog.isOpen}
            onClose={() => {
              createWorkspaceDialog.close();
              setSelectedOrgForWorkspace(null);
            }}
            organizationId={selectedOrgForWorkspace}
          />
        )}
      </Container>
    </DefaultStylesProvider>
  );
};

export default OrganizationSwitcher;
