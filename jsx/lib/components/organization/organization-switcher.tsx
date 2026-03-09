"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  User,
  Settings,
  LogOut,
  AlertCircle,
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
  display: block;
  width: 100%;
`;

const SwitcherButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2u);
  padding: var(--space-2u) var(--space-3u);
  font-size: var(--font-size-sm);
  font-weight: 400;
  cursor: pointer;
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  color: var(--color-foreground);
  transition:
    background 0.1s ease,
    border-color 0.1s ease;
  min-width: calc(var(--size-50u) + var(--size-32u));
  min-height: var(--size-18u);
  width: 100%;

  &:hover:not(:disabled) {
    background: var(--color-accent);
    border-color: var(--color-border-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const Avatar = styled.div`
  width: var(--size-8u);
  height: var(--size-8u);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  color: var(--color-secondary-foreground);
  border: var(--border-width-thin) solid var(--color-border);
  font-size: var(--font-size-2xs);
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
  gap: var(--space-2u);
  min-width: 0;
`;

const OrgName = styled.span`
  font-weight: 400;
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-foreground);
`;

const TriggerChevron = styled(ChevronDown)<{ $isOpen: boolean }>`
  color: var(--color-secondary-text);
  transition: transform 0.15s ease;
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0deg)")};
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
  width: calc(var(--size-50u) * 3);
  max-height: ${(props) => (props.$position?.maxHeight ? `${props.$position.maxHeight}px` : "calc(var(--size-50u) * 4)")};
  background: var(--color-popover);
  border-radius: var(--radius-lg);
  border: var(--border-width-thin) solid var(--color-border);
  box-shadow: var(--shadow-md);
  z-index: 99999;
  overflow-y: auto;
  visibility: ${(props) =>
    props.$position && props.$isOpen ? "visible" : "hidden"};
  opacity: ${(props) => (props.$isOpen && props.$position ? 1 : 0)};
  transform: ${(props) =>
    props.$isOpen ? "translateY(0)" : "translateY(calc(var(--space-4u) * -1))"};
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
  padding: var(--space-4u) var(--space-5u) var(--space-4u) calc(var(--space-8u) + var(--space-1u));
  text-align: left;
  font-size: var(--font-size-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-popover-foreground);
  transition: background 0.1s ease;
  position: relative;

  &:hover {
    background: var(--color-accent);

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
  height: var(--border-width-thin);
  background: var(--color-border);
`;

const MenuItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3u);
  flex: 1;
`;

const MenuItemAvatar = styled.div`
  width: var(--size-10u);
  height: var(--size-10u);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  color: var(--color-secondary-foreground);
  border: var(--border-width-thin) solid var(--color-border);
  font-size: var(--font-size-2xs);
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
  gap: var(--space-1u);
  overflow: hidden;
  flex: 1;
`;

const MenuItemName = styled.span`
  font-weight: 400;
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-popover-foreground);
`;


const ManageButton = styled.button`
  padding: calc(var(--space-1u) + var(--border-width-thin));
  border-radius: var(--radius-2xs);
  border: var(--border-width-thin) solid var(--color-border);
  background: transparent;
  color: var(--color-secondary-text);
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-10u);
  height: var(--size-10u);

  &:hover {
    background: var(--color-accent);
    color: var(--color-accent-foreground);
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
  padding: var(--space-4u) var(--space-5u);
  text-align: left;
  font-size: var(--font-size-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-foreground);
  transition: background 0.1s ease;
  position: relative;

  &:hover {
    background: var(--color-accent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const PlusIcon = styled.div`
  width: var(--size-10u);
  height: var(--size-10u);
  border-radius: 50%;
  border: var(--border-width-thin) dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
  background: var(--color-secondary);
`;

const ActiveIndicator = styled.div`
  width: var(--space-4u);
  height: var(--space-4u);
  border-radius: 50%;
  background: var(--color-primary);
  position: absolute;
  left: var(--space-4u);
  top: 50%;
  transform: translateY(-50%);
`;

const PersonalIcon = styled.div`
  width: var(--size-10u);
  height: var(--size-10u);
  border-radius: 50%;
  background: var(--color-secondary);
  border: var(--border-width-thin) solid var(--color-border);
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
  padding-left: calc(var(--size-18u) + var(--space-6u));
  font-size: var(--font-size-xs);
`;

const WorkspaceAvatar = styled.div`
  width: var(--size-8u);
  height: var(--size-8u);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  border: var(--border-width-thin) solid var(--color-border);
  color: var(--color-secondary-text);
  font-size: calc(var(--font-size-2xs) - var(--border-width-thin));
  font-weight: 600;
  flex-shrink: 0;
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  padding: var(--space-4u) var(--space-5u);
  border-radius: var(--radius-2xs);
  font-size: var(--font-size-2xs);
  background: ${(props) =>
    props.$isError
      ? "var(--color-error-background)"
      : "var(--color-primary-background)"};
  color: ${(props) =>
    props.$isError ? "var(--color-error)" : "var(--color-primary)"};
  border: var(--border-width-thin) solid
    ${(props) =>
    props.$isError ? "var(--color-error)" : "var(--color-primary)"};
  display: flex;
  align-items: center;
  gap: var(--space-3u);
`;

const Spinner = styled.div`
  width: var(--size-6u);
  height: var(--size-6u);
  border: var(--border-width-regular) solid transparent;
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
  padding: var(--space-4u) 0;
`;

const ShimmerItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3u);
  padding: var(--space-2u) var(--space-5u) var(--space-2u) var(--space-4u);
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
  width: calc(var(--size-8u) + var(--space-1u));
  height: calc(var(--size-8u) + var(--space-1u));
  border-radius: 50%;
  background: var(--color-border);
`;

const ShimmerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2u);
`;

const ShimmerLine = styled.div<{ width?: string }>`
  height: var(--size-6u);
  background: var(--color-border);
  border-radius: var(--radius-2xs);
  width: ${(props) => props.width || "100%"};
`;

const ShimmerSmallLine = styled.div<{ width?: string }>`
  height: var(--size-5u);
  background: var(--color-border);
  border-radius: var(--radius-2xs);
  width: ${(props) => props.width || "60%"};
`;

const SkeletonButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2u);
  padding: var(--space-2u) var(--space-3u);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-card);
  min-width: calc(var(--size-50u) + var(--size-32u));
  min-height: var(--size-18u);
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
  width: var(--size-8u);
  height: var(--size-8u);
  border-radius: 50%;
  background: var(--color-border);
`;

const SkeletonText = styled.div`
  height: var(--space-7u);
  width: calc(var(--size-50u) + var(--size-10u));
  background: var(--color-border);
  border-radius: var(--radius-2xs);
`;

const SkeletonIcon = styled.div`
  width: var(--size-8u);
  height: var(--size-8u);
  background: var(--color-border);
  border-radius: calc(var(--radius-2xs) - var(--border-width-regular));
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
    switchOrganization,
    switchWorkspace,
  } = useSession();
  const { deployment } = useDeployment();
  const { toast } = useScreenContext();

  const organizationsEnabled = deployment?.b2b_settings.organizations_enabled;
  const workspacesEnabled = deployment?.b2b_settings.workspaces_enabled;
  const allowUsersToCreateOrgs =
    deployment?.b2b_settings.allow_users_to_create_orgs;

  const isPersonalActive = !activeOrgMembership;

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

  const isSessionReady = !!session;
  const showSkeleton = (!isSessionReady) || organizationLoading || (workspacesEnabled && workspacesLoading);

  if (showSkeleton) {
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
          <CreateWorkspaceDialog
            isOpen={createWorkspaceDialog.isOpen}
            onClose={() => {
              createWorkspaceDialog.close();
              setSelectedOrgForWorkspace(null);
            }}
            organizationId={selectedOrgForWorkspace || undefined}
          />
        </Container>
      </DefaultStylesProvider >
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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3u)" }}>
            {((activeOrgMembership?.eligibility_restriction?.type && activeOrgMembership?.eligibility_restriction?.type !== "none") ||
              (activeWsMembership?.eligibility_restriction?.type && activeWsMembership?.eligibility_restriction?.type !== "none")) && (
                <div
                  title={
                    activeWsMembership?.eligibility_restriction?.message ||
                    activeOrgMembership?.eligibility_restriction?.message
                  }
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <AlertCircle size={14} color="var(--color-error)" />
                </div>
              )}
            <TriggerChevron $isOpen={open} size={14} />
          </div>
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
                        <ShimmerLine width="calc(var(--size-50u) + var(--size-10u))" />
                        <ShimmerSmallLine width="var(--size-40u)" />
                      </ShimmerContent>
                    </ShimmerItem>
                    <Separator />

                    {/* Show 2-3 organization shimmers */}
                    <ShimmerItem>
                      <ShimmerAvatar />
                      <ShimmerContent>
                        <ShimmerLine width="var(--size-50u)" />
                      </ShimmerContent>
                    </ShimmerItem>
                    <Separator />

                    <ShimmerItem>
                      <ShimmerAvatar />
                      <ShimmerContent>
                        <ShimmerLine width="calc(var(--size-50u) + var(--size-20u))" />
                        <ShimmerSmallLine width="calc(var(--size-20u) + var(--size-10u))" />
                      </ShimmerContent>
                    </ShimmerItem>
                    <Separator />

                    <ShimmerItem>
                      <ShimmerAvatar />
                      <ShimmerContent>
                        <ShimmerLine width="calc(var(--size-50u) + var(--space-5u))" />
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
                        style={{
                          ...(isSwitching
                            ? { pointerEvents: "none", opacity: 0.7 }
                            : {}),
                          ...(activeOrgMembership?.eligibility_restriction?.type !==
                            "none"
                            ? { opacity: 0.6, cursor: "not-allowed" }
                            : {}),
                        }}
                        title={
                          activeOrgMembership?.eligibility_restriction?.message
                        }
                      >
                        <ActiveIndicator />
                        <MenuItemContent>
                          {workspacesEnabled && (
                            <ChevronDown
                              size={12}
                              style={{
                                marginRight: "var(--space-2u)",
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
                            gap: "var(--space-4u)",
                          }}
                        >
                          {activeOrgMembership?.eligibility_restriction?.type && activeOrgMembership?.eligibility_restriction?.type !== "none" && (
                            <div
                              title={
                                activeOrgMembership?.eligibility_restriction?.message
                              }
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <AlertCircle size={14} color="var(--color-error)" />
                            </div>
                          )}
                          {activeOrgMembership?.eligibility_restriction?.type === "none" &&
                            canManageOrganization(activeOrgMembership) && (
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
                                  style={{
                                    ...(workspace.eligibility_restriction?.type !==
                                      "none" ||
                                      activeOrgMembership?.eligibility_restriction
                                        ?.type !== "none"
                                      ? { opacity: 0.6, cursor: "not-allowed" }
                                      : {}),
                                    ...(isWorkspaceActive && isSwitching
                                      ? { pointerEvents: "none", opacity: 0.7 }
                                      : {}),
                                  }}
                                  title={
                                    workspace.eligibility_restriction?.message ||
                                    activeOrgMembership?.eligibility_restriction
                                      ?.message
                                  }
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
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "var(--space-4u)",
                                    }}
                                  >
                                    {((workspace.eligibility_restriction?.type && workspace.eligibility_restriction?.type !== "none") ||
                                      (activeOrgMembership?.eligibility_restriction?.type && activeOrgMembership?.eligibility_restriction?.type !== "none")) && (
                                        <div
                                          title={
                                            workspace.eligibility_restriction?.message ||
                                            activeOrgMembership?.eligibility_restriction?.message
                                          }
                                          style={{ display: "flex", alignItems: "center" }}
                                        >
                                          <AlertCircle
                                            size={14}
                                            color="var(--color-error)"
                                          />
                                        </div>
                                      )}
                                    {isWorkspaceActive ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "var(--space-4u)",
                                        }}
                                      >
                                        {activeWsMembership?.eligibility_restriction?.type === "none" &&
                                          activeOrgMembership?.eligibility_restriction?.type === "none" &&
                                          canManageWorkspace(activeWsMembership) && (
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
                                  </div>
                                </WorkspaceItem>
                              );
                            })}
                          {activeOrgMembership?.eligibility_restriction?.type === "none" && (
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
                                  style={{ width: "var(--space-7u)", height: "var(--space-7u)" }}
                                >
                                  <Plus size={12} />
                                </PlusIcon>
                                <MenuItemInfo>
                                  <MenuItemName>Create workspace</MenuItemName>
                                </MenuItemInfo>
                              </MenuItemContent>
                            </WorkspaceItem>
                          )}
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
                                    style={
                                      membership.eligibility_restriction?.type !==
                                        "none"
                                        ? { opacity: 0.6, cursor: "not-allowed" }
                                        : undefined
                                    }
                                    title={
                                      membership.eligibility_restriction?.message
                                    }
                                  >
                                    <MenuItemContent>
                                      {workspacesEnabled && (
                                        <ChevronDown
                                          size={12}
                                          style={{
                                            marginRight: "var(--space-2u)",
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
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--space-4u)",
                                      }}
                                    >
                                      {membership.eligibility_restriction?.type && membership.eligibility_restriction?.type !== "none" && (
                                        <div
                                          title={
                                            membership.eligibility_restriction?.message
                                          }
                                          style={{ display: "flex", alignItems: "center" }}
                                        >
                                          <AlertCircle
                                            size={14}
                                            color="var(--color-error)"
                                          />
                                        </div>
                                      )}
                                      <HoverArrow
                                        className="hover-arrow"
                                        size={14}
                                      />
                                    </div>
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
                                              style={{
                                                ...(workspace.eligibility_restriction
                                                  ?.type !== "none" ||
                                                  membership.eligibility_restriction
                                                    ?.type !== "none"
                                                  ? {
                                                    opacity: 0.6,
                                                    cursor: "not-allowed",
                                                  }
                                                  : {}),
                                                ...(isWorkspaceActive && isSwitching
                                                  ? {
                                                    pointerEvents: "none",
                                                    opacity: 0.7,
                                                  }
                                                  : {}),
                                              }}
                                              title={
                                                workspace.eligibility_restriction
                                                  ?.message ||
                                                membership.eligibility_restriction
                                                  ?.message
                                              }
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
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "var(--space-4u)",
                                                }}
                                              >
                                                {((workspace.eligibility_restriction?.type && workspace.eligibility_restriction?.type !== "none") ||
                                                  (membership.eligibility_restriction?.type && membership.eligibility_restriction?.type !== "none")) && (
                                                    <div
                                                      title={
                                                        workspace.eligibility_restriction?.message ||
                                                        membership.eligibility_restriction?.message
                                                      }
                                                      style={{ display: "flex", alignItems: "center" }}
                                                    >
                                                      <AlertCircle
                                                        size={14}
                                                        color="var(--color-error)"
                                                      />
                                                    </div>
                                                  )}
                                                {isWorkspaceActive ? (
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: "var(--space-4u)",
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
                                              </div>
                                            </WorkspaceItem>
                                          );
                                        },
                                      )}
                                      {membership.eligibility_restriction?.type ===
                                        "none" && (
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
                                                  width: "var(--space-7u)",
                                                  height: "var(--space-7u)",
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
                                        )}
                                    </>
                                  )}
                                  <Separator />
                                </React.Fragment>
                              );
                            })}
                        </>
                      )}

                    {/* Show create button at bottom - workspace if enabled, otherwise organization */}
                    {workspacesEnabled && (
                      <CreateOrgButton
                        onClick={() => {
                          if (
                            activeOrganization &&
                            (!activeOrgMembership?.eligibility_restriction?.type ||
                              activeOrgMembership?.eligibility_restriction?.type ===
                              "none")
                          ) {
                            setSelectedOrgForWorkspace(activeOrganization.id);
                          } else {
                            setSelectedOrgForWorkspace(null);
                          }
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
                    )}
                    {!workspacesEnabled && allowUsersToCreateOrgs && (
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

        <CreateWorkspaceDialog
          isOpen={createWorkspaceDialog.isOpen}
          onClose={() => {
            createWorkspaceDialog.close();
            setSelectedOrgForWorkspace(null);
          }}
          organizationId={selectedOrgForWorkspace || undefined}
        />
      </Container>
    </DefaultStylesProvider>
  );
};

export default OrganizationSwitcher;
