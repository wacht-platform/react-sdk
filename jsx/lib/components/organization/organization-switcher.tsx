"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import {
  ChevronsUpDown,
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
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { ManageOrganizationDialog } from "./manage-organization-dialog";
import { CreateWorkspaceDialog } from "../workspace/create-workspace-dialog";
import { ManageWorkspaceDialog } from "../workspace/manage-workspace-dialog";
import { useDialog } from "../utility/use-dialog";
import type { WorkspaceWithOrganization } from "@/types";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";
import { canManageOrganization, canManageWorkspace } from "@/utils/permissions";

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
  padding: 8px 10px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-foreground);
  transition: background 0.1s ease;
  min-width: 200px;
  min-height: 42px;
  width: 100%;

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
  background: var(--color-primary);
  color: white;
  font-size: 11px;
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
  font-weight: 400;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-foreground);
`;

const Dropdown = styled.div<{
  $isOpen: boolean;
  $position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
}>`
  position: fixed;
  ${(props) => (props.$position?.top !== undefined ? `top: ${props.$position.top}px;` : "")}
  ${(props) => (props.$position?.bottom !== undefined ? `bottom: ${props.$position.bottom}px;` : "")}
  ${(props) => (props.$position?.left !== undefined ? `left: ${props.$position.left}px;` : "")}
  ${(props) => (props.$position?.right !== undefined ? `right: ${props.$position.right}px;` : "")}
  width: 300px;
  max-height: ${(props) => (props.$position?.maxHeight ? `${props.$position.maxHeight}px` : "400px")};
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  box-shadow:
    0 2px 8px var(--color-shadow),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  z-index: 99999;
  overflow-y: auto;
  visibility: ${(props) =>
    props.$position && props.$isOpen ? "visible" : "hidden"};
  opacity: ${(props) => (props.$isOpen && props.$position ? 1 : 0)};
  transform: ${(props) =>
    props.$isOpen ? "translateY(0)" : "translateY(-8px)"};
  pointer-events: ${(props) => (props.$isOpen ? "auto" : "none")};
  transition:
    opacity 0.15s ease,
    transform 0.15s ease,
    visibility 0s linear ${(props) => (props.$isOpen ? "0s" : "0.15s")};
`;

const MenuItem = styled.div<{ $isActive?: boolean; as?: React.ElementType }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px 10px 22px;
  text-align: left;
  font-size: 13px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground);
  transition: background 0.1s ease;
  position: relative;

  &:hover {
    background: var(--color-background-hover);

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
  color: var(--color-secondary-text);
`;

const Separator = styled.div`
  height: 1px;
  background: var(--color-border);
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
  background: var(--color-primary);
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
  flex: 1;
`;

const MenuItemName = styled.span`
  font-weight: 400;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-foreground);
`;


const ManageButton = styled.button`
  padding: 3px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-secondary-text);
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground);
  }
`;

const LogoutButton = styled(ManageButton)`
  &:hover:not(:disabled) {
    background: var(--color-error-background);
    color: var(--color-error);
    border-color: var(--color-error);
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
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground);
  transition: background 0.1s ease;
  position: relative;

  &:hover {
    background: var(--color-background-hover);
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
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
  background: var(--color-background-hover);
`;

const ActiveIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
`;

const PersonalIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
  overflow: hidden;
`;

const PersonalAvatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const WorkspaceItem = styled(MenuItem)`
  padding-left: 40px;
  font-size: 11px;
`;

const WorkspaceAvatar = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border);
  color: var(--color-secondary-text);
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 10px;
  background: ${(props) =>
    props.$isError
      ? "var(--color-error-background)"
      : "var(--color-primary-background)"};
  color: ${(props) =>
    props.$isError ? "var(--color-error)" : "var(--color-primary)"};
  border: 1px solid
    ${(props) =>
    props.$isError ? "var(--color-error)" : "var(--color-primary)"};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Spinner = styled.div`
  width: 12px;
  height: 12px;
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
  padding: 8px 0;
`;

const ShimmerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-border);
`;

const ShimmerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ShimmerLine = styled.div<{ width?: string }>`
  height: 12px;
  background: var(--color-border);
  border-radius: 4px;
  width: ${(props) => props.width || "100%"};
`;

const ShimmerSmallLine = styled.div<{ width?: string }>`
  height: 10px;
  background: var(--color-border);
  border-radius: 4px;
  width: ${(props) => props.width || "60%"};
`;

const SkeletonButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  min-width: 200px;
  min-height: 42px;
  width: 100%;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const SkeletonAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-border);
`;

const SkeletonText = styled.div`
  height: 14px;
  width: 120px;
  background: var(--color-border);
  border-radius: 4px;
`;

const SkeletonIcon = styled.div`
  width: 16px;
  height: 16px;
  background: var(--color-border);
  border-radius: 2px;
`;

interface OrganizationSwitcherProps {
  showPersonal?: boolean;
}

export const OrganizationSwitcher = ({
  showPersonal = true,
}: OrganizationSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dropdownPosition = usePopoverPosition({
    triggerRef: buttonRef,
    isOpen: open,
    minWidth: 300,
  });

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
  const { activeOrganization, activeMembership: activeOrgMembership, leave: leaveOrganization } =
    useActiveOrganization();
  const { activeWorkspace, activeMembership: activeWsMembership, leave: leaveWorkspace } = useActiveWorkspace();
  const { workspaces: workspaceList, loading: workspacesLoading } =
    useWorkspaceList();
  const {
    session,
    loading: sessionLoading,
    switchOrganization,
    switchWorkspace,
  } = useSession();
  const { deployment } = useDeployment();
  const { toast } = useScreenContext();

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
    if (!open) return;

    let cleanupFn: (() => void) | null = null;

    const timer = setTimeout(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        if (buttonRef.current?.contains(target)) {
          return;
        }

        if (dropdownRef.current?.contains(target)) {
          return;
        }

        setOpen(false);
        setLeaveError(null);
      };

      document.addEventListener("mousedown", handleClickOutside);

      cleanupFn = () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, 50);

    return () => {
      clearTimeout(timer);
      cleanupFn?.();
    };
  }, [open]);


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

  if (!organizationsEnabled) {
    return null;
  }

  const handleSwitchOrganization = (orgId?: string) => {
    setIsSwitching(true);
    switchOrganization(orgId).finally(() => {
      setIsSwitching(false);
    });
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    setIsSwitching(true);
    switchWorkspace(workspaceId).finally(() => {
      setIsSwitching(false);
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

  // Show loading if:
  // 1. organizationLoading or sessionLoading is true
  // 2. Session has an active org membership but organizationMemberships hasn't loaded yet (cache was cleared)
  const hasActiveOrgInSession = !!session?.active_signin?.active_organization_membership_id;
  const membershipsNotLoaded = !organizationMemberships && hasActiveOrgInSession;

  if (organizationLoading || sessionLoading || membershipsNotLoaded) {
    return (
      <DefaultStylesProvider>
        <Container>
          <SkeletonButton>
            <ButtonContent>
              <SkeletonAvatar />
              <SkeletonText />
            </ButtonContent>
            <SkeletonIcon />
          </SkeletonButton>
        </Container>
      </DefaultStylesProvider>
    );
  }

  return (
    <DefaultStylesProvider>
      <Container>
        <SwitcherButton
          ref={buttonRef}
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
          <ChevronsUpDown size={16} />
        </SwitcherButton>

        {typeof window !== "undefined" &&
          ReactDOM.createPortal(
            <DefaultStylesProvider>
              <Dropdown
                ref={dropdownRef}
                $isOpen={open}
                $position={dropdownPosition}
              >
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
                    {/* Show personal account first if enabled */}
                    {showPersonal && (
                      <>
                        <MenuItem
                          as="button"
                          $isActive={isPersonalActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isPersonalActive) {
                              handleSwitchOrganization();
                            }
                          }}
                          disabled={isSwitching || isPersonalActive}
                        >
                          {isPersonalActive && <ActiveIndicator />}
                          <MenuItemContent>
                            <PersonalIcon>
                              {session?.active_signin?.user
                                ?.profile_picture_url ? (
                                <PersonalAvatar
                                  src={
                                    session.active_signin.user
                                      .profile_picture_url
                                  }
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
                          {!isPersonalActive && (
                            <HoverArrow className="hover-arrow" size={14} />
                          )}
                        </MenuItem>

                        {/* Show separator after personal account if we're going to show an active organization */}
                        {!isPersonalActive && activeOrganization && (
                          <Separator />
                        )}
                      </>
                    )}

                    {/* Show active organization if not personal */}
                    {!isPersonalActive && activeOrganization && (
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
                              size={12}
                              style={{
                                marginRight: "4px",
                                transform: expandedOrgs.has(
                                  activeOrganization.id,
                                )
                                  ? "rotate(0deg)"
                                  : "rotate(-90deg)",
                                transition: "transform 0.2s ease",
                                color: "var(--color-secondary-text)",
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
                            <MenuItemName>
                              {activeOrganization.name}
                            </MenuItemName>
                          </MenuItemInfo>
                        </MenuItemContent>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {canManageOrganization(activeOrgMembership) && (
                            <ManageButton
                              onClick={(e) => {
                                e.stopPropagation();
                                manageOrgDialog.open();
                              }}
                              title="Manage organization"
                            >
                              <Settings size={12} />
                            </ManageButton>
                          )}
                          <LogoutButton
                            onClick={async (e) => {
                              e.stopPropagation();
                              setLeavingOrg(true);
                              setLeaveError(null);
                              try {
                                await leaveOrganization();
                                await refetchOrganizations();
                                setTimeout(() => {
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
                            <LogOut size={12} />
                          </LogoutButton>
                        </div>
                      </MenuItem>
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
                                      : () =>
                                        handleSwitchWorkspace(workspace.id)
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
                                      {canManageWorkspace(activeWsMembership) && (
                                        <ManageButton
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            manageWorkspaceDialog.open();
                                          }}
                                          title="Manage workspace"
                                        >
                                          <Settings size={12} />
                                        </ManageButton>
                                      )}
                                      <LogoutButton
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            if (leaveWorkspace) {
                                              await leaveWorkspace();
                                            }
                                          } catch (error: any) {
                                            const errorMessage =
                                              error.message ||
                                              "Failed to leave workspace. Please try again.";
                                            toast(errorMessage, "error");
                                          }
                                        }}
                                        title="Leave workspace"
                                      >
                                        <LogOut size={12} />
                                      </LogoutButton>
                                    </div>
                                  ) : (
                                    <HoverArrow
                                      className="hover-arrow"
                                      size={14}
                                    />
                                  )}
                                </WorkspaceItem>
                              );
                            })}
                          <WorkspaceItem
                            as="button"
                            onClick={() => {
                              setSelectedOrgForWorkspace(activeOrganization.id);
                              createWorkspaceDialog.open();
                            }}
                            disabled={isSwitching}
                          >
                            <MenuItemContent>
                              <PlusIcon
                                style={{ width: "14px", height: "14px" }}
                              >
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

                    {organizationMemberships &&
                      organizationMemberships.length > 0 && (
                        <>
                          {organizationMemberships
                            .filter(
                              (m) =>
                                m.organization.id !== activeOrganization?.id,
                            )
                            .map((membership) => {
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
                                          size={12}
                                          style={{
                                            marginRight: "4px",
                                            transform: isExpanded
                                              ? "rotate(0deg)"
                                              : "rotate(-90deg)",
                                            transition: "transform 0.2s ease",
                                            color:
                                              "var(--color-secondary-text)",
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
                                      </MenuItemInfo>
                                    </MenuItemContent>
                                    <HoverArrow
                                      className="hover-arrow"
                                      size={14}
                                    />
                                  </MenuItem>

                                  {workspacesEnabled && isExpanded && (
                                    <>
                                      {orgWorkspaces.map(
                                        (
                                          workspace: WorkspaceWithOrganization,
                                        ) => {
                                          const isWorkspaceActive =
                                            activeWorkspace?.id ===
                                            workspace.id;
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
                                                  {canManageWorkspace(activeWsMembership) && (
                                                    <ManageButton
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        manageWorkspaceDialog.open();
                                                      }}
                                                      title="Manage workspace"
                                                    >
                                                      <Settings size={12} />
                                                    </ManageButton>
                                                  )}
                                                  <LogoutButton
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      try {
                                                        if (leaveWorkspace) {
                                                          await leaveWorkspace();
                                                        }
                                                      } catch (error: any) {
                                                        const errorMessage =
                                                          error.message ||
                                                          "Failed to leave workspace. Please try again.";
                                                        toast(
                                                          errorMessage,
                                                          "error",
                                                        );
                                                      }
                                                    }}
                                                    title="Leave workspace"
                                                  >
                                                    <LogOut size={12} />
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
                                        }}
                                        disabled={isSwitching}
                                      >
                                        <MenuItemContent>
                                          <PlusIcon
                                            style={{
                                              width: "14px",
                                              height: "14px",
                                            }}
                                          >
                                            <Plus size={10} />
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
                                  <Separator />
                                </React.Fragment>
                              );
                            })}
                        </>
                      )}

                    {/* Show create button at bottom - workspace if enabled, otherwise organization */}
                    {workspacesEnabled
                      ? activeOrganization && (
                        <CreateOrgButton
                          onClick={() => {
                            setSelectedOrgForWorkspace(activeOrganization.id);
                            createWorkspaceDialog.open();
                          }}
                          disabled={isSwitching}
                        >
                          <MenuItemContent>
                            <PlusIcon>
                              <Plus size={12} />
                            </PlusIcon>
                            <MenuItemInfo>
                              <MenuItemName>Create workspace</MenuItemName>
                            </MenuItemInfo>
                          </MenuItemContent>
                        </CreateOrgButton>
                      )
                      : allowUsersToCreateOrgs && (
                        <CreateOrgButton
                          onClick={() => {
                            createOrgDialog.open();
                          }}
                          disabled={isSwitching}
                        >
                          <MenuItemContent>
                            <PlusIcon>
                              <Plus size={12} />
                            </PlusIcon>
                            <MenuItemInfo>
                              <MenuItemName>Create organization</MenuItemName>
                            </MenuItemInfo>
                          </MenuItemContent>
                        </CreateOrgButton>
                      )}
                  </div>
                )}
              </Dropdown>
            </DefaultStylesProvider>,
            document.body,
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
