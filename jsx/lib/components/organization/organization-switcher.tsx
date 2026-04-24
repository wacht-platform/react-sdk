"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import styled, { css } from "styled-components";
import {
    CaretDown,
    CaretUpDown,
    Plus,
    User,
    GearSix,
    SignOut,
    WarningCircle,
    Check,
} from "@phosphor-icons/react";
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
import { usePopoverPosition } from "@/hooks/use-popover-position";
import { canManageOrganization, canManageWorkspace } from "@/utils/permissions";

// ─── Trigger ──────────────────────────────────────────────────────────────────

const Container = styled.div`
    position: relative;
    display: block;
    width: 100%;
`;

const SwitcherButton = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    width: 100%;
    height: 36px;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-card);
    color: var(--color-card-foreground);
    transition: background 0.1s ease, border-color 0.1s ease;
    &:hover:not(:disabled) { background: var(--color-accent); border-color: var(--color-border-hover); }
    &:disabled { cursor: not-allowed; opacity: 0.7; }
`;

const TriggerAvatar = styled.div<{ $personal?: boolean }>`
    width: 20px;
    height: 20px;
    min-width: 20px;
    border-radius: ${(p) => p.$personal ? "50%" : "5px"};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const TriggerText = styled.span`
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--color-card-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
`;

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const Dropdown = styled.div<{
    $isOpen: boolean;
    $position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
}>`
    position: fixed;
    ${(p) => p.$position?.top !== undefined ? `top: ${p.$position.top}px;` : ""}
    ${(p) => p.$position?.bottom !== undefined ? `bottom: ${p.$position.bottom}px;` : ""}
    ${(p) => p.$position?.left !== undefined ? `left: ${p.$position.left}px;` : ""}
    ${(p) => p.$position?.right !== undefined ? `right: ${p.$position.right}px;` : ""}
    width: 300px;
    max-width: calc(100vw - 16px);
    max-height: ${(p) => p.$position?.maxHeight ? `${p.$position.maxHeight}px` : "420px"};
    background: var(--color-popover);
    border-radius: 10px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    z-index: 99999;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    visibility: ${(p) => p.$position && p.$isOpen ? "visible" : "hidden"};
    opacity: ${(p) => p.$isOpen && p.$position ? 1 : 0};
    transform: ${(p) => p.$isOpen ? "translateY(0)" : "translateY(-4px)"};
    pointer-events: ${(p) => p.$isOpen ? "auto" : "none"};
    transition:
        opacity 0.15s ease,
        transform 0.15s ease,
        visibility 0s linear ${(p) => p.$isOpen ? "0s" : "0.15s"};
`;

const List = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 6px;
`;

// ─── Selected block ───────────────────────────────────────────────────────────

const SelectedBlock = styled.div`
    padding: 10px 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
`;

const Segmented = styled.div`
    display: flex;
    padding: 2px;
    background: color-mix(in srgb, var(--color-popover-foreground) 5%, transparent);
    border-radius: 7px;
`;

const SegmentedTab = styled.button<{ $active?: boolean }>`
    flex: 1;
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    background: ${(p) => (p.$active ? "var(--color-popover)" : "transparent")};
    color: ${(p) =>
        p.$active
            ? "var(--color-popover-foreground)"
            : "var(--color-secondary-text)"};
    box-shadow: ${(p) =>
        p.$active
            ? "0 1px 2px color-mix(in srgb, black 8%, transparent)"
            : "none"};
    transition: background 0.12s ease, color 0.12s ease;

    &:hover:not([data-active="true"]) {
        color: var(--color-popover-foreground);
    }
`;

const ContextRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 4px 2px;
    min-width: 0;
`;

const ContextAvatar = styled.div<{ $personal?: boolean }>`
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: ${(p) => (p.$personal ? "50%" : "6px")};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const ContextText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
`;

const ContextName = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: var(--color-popover-foreground);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ContextRole = styled.div`
    font-size: 11px;
    color: var(--color-secondary-text);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ContextActions = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
`;

const HeaderIconButton = styled.button<{ $destructive?: boolean }>`
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    border: none;
    background: transparent;
    color: var(--color-secondary-text);
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;

    &:hover:not(:disabled) {
        background: ${(p) =>
            p.$destructive
                ? "color-mix(in srgb, var(--color-error) 14%, transparent)"
                : "color-mix(in srgb, var(--color-popover-foreground) 10%, transparent)"};
        color: ${(p) =>
            p.$destructive
                ? "var(--color-error)"
                : "var(--color-popover-foreground)"};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// ─── Rows ─────────────────────────────────────────────────────────────────────

const rowBase = css<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 36px;
    padding: 0 8px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-popover-foreground);
    font-size: 13px;
    font-weight: 400;
    text-align: left;
    transition: background 0.12s ease;

    .row-actions { display: none; }
    .row-check { display: inline-flex; }

    &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-popover-foreground) 6%, transparent);
    }

    ${(p) => p.$active && css`
        font-weight: 500;
        &:hover:not(:disabled) {
            background: color-mix(in srgb, var(--color-popover-foreground) 4%, transparent);
            .row-actions { display: inline-flex; }
            .row-check { display: none; }
        }
    `}

    &:disabled { cursor: default; }
`;

const Row = styled.button<{ $active?: boolean }>`${rowBase}`;

const WorkspaceRow = styled.button<{ $active?: boolean }>`
    ${rowBase}
    height: 36px;
    padding-left: 34px;
    position: relative;
    &::before {
        content: "";
        position: absolute;
        left: 20px;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--color-border);
    }
`;

// ─── Row internals ────────────────────────────────────────────────────────────

const OrgAvatar = styled.div<{ $personal?: boolean }>`
    width: 24px;
    height: 24px;
    min-width: 24px;
    border-radius: ${(p) => p.$personal ? "50%" : "6px"};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const WsAvatar = styled.div`
    width: 22px;
    height: 22px;
    min-width: 22px;
    border-radius: 5px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-secondary);
    color: var(--color-secondary-text);
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const RowName = styled.span`
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--color-popover-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const WsName = styled(RowName)`
    font-size: 12px;
`;

const RowRight = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
`;

const ExpandCaret = styled(CaretDown)<{ $open: boolean }>`
    color: var(--color-secondary-text);
    flex-shrink: 0;
    transition: transform 0.2s ease;
    transform: ${(p) => p.$open ? "rotate(0deg)" : "rotate(-90deg)"};
`;

const CheckMark = styled(Check)`
    color: var(--color-primary);
    flex-shrink: 0;
`;

// ─── Footer create button ─────────────────────────────────────────────────────

const Footer = styled.div`
    border-top: 1px solid var(--color-border);
    padding: 6px;
    flex-shrink: 0;
`;

const CreateRow = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 32px;
    padding: 0 8px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-secondary-text);
    font-size: 13px;
    font-weight: 400;
    text-align: left;
    transition: background 0.1s ease, color 0.1s ease;
    &:hover:not(:disabled) { background: var(--color-accent); color: var(--color-popover-foreground); }
    &:disabled { cursor: not-allowed; opacity: 0.6; }
`;

const CreateIcon = styled.div`
    width: 22px;
    height: 22px;
    min-width: 22px;
    border-radius: 5px;
    border: 1px dashed var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

// ─── Skeleton / status ────────────────────────────────────────────────────────

const SkeletonButton = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-card);
    width: 100%;
    animation: pulse 1.5s ease-in-out infinite;
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;

const SkeletonBlock = styled.div<{ w?: string; h?: string; r?: string }>`
    width: ${(p) => p.w || "100%"};
    height: ${(p) => p.h || "14px"};
    border-radius: ${(p) => p.r || "4px"};
    background: var(--color-border);
`;

const Shimmer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px;
    height: 34px;
    animation: shimmer 1.5s ease-in-out infinite;
    @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
`;

const ErrorBar = styled.div`
    margin: 0 6px 6px;
    padding: 8px 10px;
    font-size: 12px;
    background: var(--color-error-background);
    color: var(--color-error);
    border: 1px solid var(--color-error);
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface OrganizationSwitcherProps {
    showPersonal?: boolean;
}

export const OrganizationSwitcher = ({ showPersonal = true }: OrganizationSwitcherProps) => {
    const [open, setOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const dropdownPosition = usePopoverPosition({ triggerRef: buttonRef, isOpen: open, minWidth: 300 });

    const createOrgDialog = useDialog(false);
    const manageOrgDialog = useDialog(false);
    const createWorkspaceDialog = useDialog(false);
    const manageWorkspaceDialog = useDialog(false);
    const [selectedOrgForWorkspace, setSelectedOrgForWorkspace] = useState<string | null>(null);
    const [leaveError, setLeaveError] = useState<string | null>(null);
    const [leavingType, setLeavingType] = useState<"org" | "ws" | null>(null);
    const [contextTab, setContextTab] = useState<"org" | "ws">("org");

    const { organizationMemberships, loading: organizationLoading, refetch: refetchOrganizations } = useOrganizationMemberships();
    const { activeOrganization, activeMembership: activeOrgMembership, leave: leaveOrganization } = useActiveOrganization();
    const { activeWorkspace, activeMembership: activeWsMembership, leave: leaveWorkspace } = useActiveWorkspace();
    const { workspaces: workspaceList, loading: workspacesLoading } = useWorkspaceList();
    const { session, switchOrganization, switchWorkspace } = useSession();
    const { deployment } = useDeployment();

    const organizationsEnabled = deployment?.b2b_settings.organizations_enabled;
    const workspacesEnabled = deployment?.b2b_settings.workspaces_enabled;
    const allowUsersToCreateOrgs = deployment?.b2b_settings.allow_users_to_create_orgs;
    const isPersonalActive = !activeOrgMembership;

    const triggerDisplay = useMemo(() => {
        if (isPersonalActive) {
            return {
                name: "Personal account",
                image_url: session?.active_signin?.user?.profile_picture_url,
                isPersonal: true,
            };
        }
        const name = workspacesEnabled && activeWorkspace
            ? `${activeOrganization?.name} / ${activeWorkspace.name}`
            : activeOrganization?.name || "";
        return {
            name,
            image_url: activeOrganization?.image_url,
            isPersonal: false,
        };
    }, [isPersonalActive, activeOrganization, activeWorkspace, session, workspacesEnabled]);

    useEffect(() => {
        if (activeOrganization && workspacesEnabled) {
            setExpandedOrgs((prev) => {
                if (prev.has(activeOrganization.id)) return prev;
                const next = new Set(prev);
                next.add(activeOrganization.id);
                return next;
            });
        }
    }, [activeOrganization, workspacesEnabled]);

    useEffect(() => {
        if (workspacesEnabled && activeWorkspace) setContextTab("ws");
        else setContextTab("org");
    }, [workspacesEnabled, activeWorkspace?.id]);

    useEffect(() => {
        if (!open) return;
        let cleanup: (() => void) | null = null;
        const timer = setTimeout(() => {
            const handler = (e: MouseEvent) => {
                const t = e.target as Node;
                if (buttonRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
                setOpen(false);
                setLeaveError(null);
            };
            document.addEventListener("mousedown", handler);
            cleanup = () => document.removeEventListener("mousedown", handler);
        }, 50);
        return () => { clearTimeout(timer); cleanup?.(); };
    }, [open]);

    useEffect(() => {
        if (!leaveError) return;
        const t = setTimeout(() => setLeaveError(null), 5000);
        return () => clearTimeout(t);
    }, [leaveError]);

    if (!organizationsEnabled) return null;

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const handleSwitchOrganization = (orgId?: string) => {
        setIsSwitching(true);
        switchOrganization(orgId).finally(() => setIsSwitching(false));
    };

    const handleSwitchWorkspace = (workspaceId: string) => {
        setIsSwitching(true);
        switchWorkspace(workspaceId).finally(() => setIsSwitching(false));
    };

    const toggleOrgExpanded = (orgId: string) => {
        setExpandedOrgs((prev) => {
            const next = new Set(prev);
            next.has(orgId) ? next.delete(orgId) : next.add(orgId);
            return next;
        });
    };

    const orgRestricted = !!activeOrgMembership?.eligibility_restriction?.type &&
        activeOrgMembership.eligibility_restriction.type !== "none";

    const isSessionReady = !!session;
    const showSkeleton = !isSessionReady || organizationLoading || (workspacesEnabled && workspacesLoading);

    if (showSkeleton) {
        return (
            <DefaultStylesProvider>
                <Container>
                    <SkeletonButton>
                        <SkeletonBlock w="20px" h="20px" r="5px" />
                        <SkeletonBlock w="120px" h="12px" />
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
                    onClick={() => { setOpen(!open); if (!open) setLeaveError(null); }}
                    disabled={isSwitching}
                >
                    <TriggerAvatar $personal={triggerDisplay.isPersonal}>
                        {triggerDisplay.image_url
                            ? <img src={triggerDisplay.image_url} alt={triggerDisplay.name} />
                            : triggerDisplay.isPersonal
                                ? <User size={11} />
                                : getInitials(triggerDisplay.name)
                        }
                    </TriggerAvatar>
                    <TriggerText>{triggerDisplay.name}</TriggerText>
                    <CaretUpDown size={13} color="var(--color-secondary-text)" />
                </SwitcherButton>

                {typeof window !== "undefined" && ReactDOM.createPortal(
                    <DefaultStylesProvider>
                        <Dropdown ref={dropdownRef} $isOpen={open} $position={dropdownPosition}>
                            {(() => {
                                const activeIsWorkspace =
                                    workspacesEnabled && !!activeWorkspace;
                                const canManageOrg =
                                    !!activeOrganization &&
                                    !orgRestricted &&
                                    canManageOrganization(activeOrgMembership);
                                const canManageWs =
                                    activeIsWorkspace &&
                                    !orgRestricted &&
                                    canManageWorkspace(activeWsMembership);

                                const openOrgSettings = () => {
                                    manageOrgDialog.open();
                                    setOpen(false);
                                };
                                const openWsSettings = () => {
                                    manageWorkspaceDialog.open();
                                    setOpen(false);
                                };

                                const handleLeaveOrg = async () => {
                                    if (!leaveOrganization) return;
                                    setLeavingType("org");
                                    setLeaveError(null);
                                    try {
                                        await leaveOrganization();
                                        await refetchOrganizations();
                                        setOpen(false);
                                    } catch (err) {
                                        setLeaveError(
                                            err instanceof Error
                                                ? err.message
                                                : "Failed to leave organization",
                                        );
                                    } finally {
                                        setLeavingType(null);
                                    }
                                };

                                const handleLeaveWs = async () => {
                                    if (!leaveWorkspace) return;
                                    setLeavingType("ws");
                                    setLeaveError(null);
                                    try {
                                        await leaveWorkspace();
                                        setOpen(false);
                                    } catch (err) {
                                        setLeaveError(
                                            err instanceof Error
                                                ? err.message
                                                : "Failed to leave workspace",
                                        );
                                    } finally {
                                        setLeavingType(null);
                                    }
                                };

                                if (isPersonalActive) {
                                    return (
                                        <SelectedBlock>
                                            <ContextRow>
                                                <ContextAvatar $personal>
                                                    {session?.active_signin
                                                        ?.user
                                                        ?.profile_picture_url ? (
                                                        <img
                                                            src={
                                                                session
                                                                    .active_signin
                                                                    .user
                                                                    .profile_picture_url
                                                            }
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <User size={14} />
                                                    )}
                                                </ContextAvatar>
                                                <ContextText>
                                                    <ContextName>
                                                        Personal account
                                                    </ContextName>
                                                    {session?.active_signin
                                                        ?.user
                                                        ?.primary_email_address
                                                        ?.email && (
                                                        <ContextRole>
                                                            {
                                                                session
                                                                    .active_signin
                                                                    .user
                                                                    .primary_email_address
                                                                    .email
                                                            }
                                                        </ContextRole>
                                                    )}
                                                </ContextText>
                                            </ContextRow>
                                        </SelectedBlock>
                                    );
                                }

                                const showTabs = activeIsWorkspace;
                                const viewingTab: "org" | "ws" = showTabs
                                    ? contextTab
                                    : "org";

                                const orgRole =
                                    activeOrgMembership?.roles?.[0]?.name;
                                const wsRole =
                                    activeWsMembership?.roles?.[0]?.name;

                                return (
                                    <SelectedBlock>
                                        {showTabs && (
                                            <Segmented>
                                                <SegmentedTab
                                                    type="button"
                                                    $active={
                                                        viewingTab === "org"
                                                    }
                                                    data-active={
                                                        viewingTab === "org"
                                                    }
                                                    onClick={() =>
                                                        setContextTab("org")
                                                    }
                                                >
                                                    Organization
                                                </SegmentedTab>
                                                <SegmentedTab
                                                    type="button"
                                                    $active={
                                                        viewingTab === "ws"
                                                    }
                                                    data-active={
                                                        viewingTab === "ws"
                                                    }
                                                    onClick={() =>
                                                        setContextTab("ws")
                                                    }
                                                >
                                                    Workspace
                                                </SegmentedTab>
                                            </Segmented>
                                        )}

                                        {viewingTab === "org" &&
                                            activeOrganization && (
                                                <ContextRow>
                                                    <ContextAvatar>
                                                        {activeOrganization.image_url ? (
                                                            <img
                                                                src={
                                                                    activeOrganization.image_url
                                                                }
                                                                alt={
                                                                    activeOrganization.name
                                                                }
                                                            />
                                                        ) : (
                                                            getInitials(
                                                                activeOrganization.name,
                                                            )
                                                        )}
                                                    </ContextAvatar>
                                                    <ContextText>
                                                        <ContextName>
                                                            {
                                                                activeOrganization.name
                                                            }
                                                        </ContextName>
                                                        {orgRole && (
                                                            <ContextRole>
                                                                {orgRole}
                                                            </ContextRole>
                                                        )}
                                                    </ContextText>
                                                    <ContextActions>
                                                        {canManageOrg && (
                                                            <HeaderIconButton
                                                                onClick={
                                                                    openOrgSettings
                                                                }
                                                                title="Organization settings"
                                                                aria-label="Organization settings"
                                                            >
                                                                <GearSix
                                                                    size={14}
                                                                />
                                                            </HeaderIconButton>
                                                        )}
                                                        <HeaderIconButton
                                                            $destructive
                                                            onClick={
                                                                handleLeaveOrg
                                                            }
                                                            disabled={
                                                                leavingType ===
                                                                "org"
                                                            }
                                                            title="Leave organization"
                                                            aria-label="Leave organization"
                                                        >
                                                            <SignOut
                                                                size={14}
                                                            />
                                                        </HeaderIconButton>
                                                    </ContextActions>
                                                </ContextRow>
                                            )}

                                        {viewingTab === "ws" &&
                                            activeIsWorkspace && (
                                                <ContextRow>
                                                    <ContextAvatar>
                                                        {activeWorkspace!.image_url ? (
                                                            <img
                                                                src={
                                                                    activeWorkspace!
                                                                        .image_url
                                                                }
                                                                alt={
                                                                    activeWorkspace!
                                                                        .name
                                                                }
                                                            />
                                                        ) : (
                                                            getInitials(
                                                                activeWorkspace!
                                                                    .name,
                                                            )
                                                        )}
                                                    </ContextAvatar>
                                                    <ContextText>
                                                        <ContextName>
                                                            {
                                                                activeWorkspace!
                                                                    .name
                                                            }
                                                        </ContextName>
                                                        {wsRole && (
                                                            <ContextRole>
                                                                {wsRole}
                                                            </ContextRole>
                                                        )}
                                                    </ContextText>
                                                    <ContextActions>
                                                        {canManageWs && (
                                                            <HeaderIconButton
                                                                onClick={
                                                                    openWsSettings
                                                                }
                                                                title="Workspace settings"
                                                                aria-label="Workspace settings"
                                                            >
                                                                <GearSix
                                                                    size={14}
                                                                />
                                                            </HeaderIconButton>
                                                        )}
                                                        <HeaderIconButton
                                                            $destructive
                                                            onClick={
                                                                handleLeaveWs
                                                            }
                                                            disabled={
                                                                leavingType ===
                                                                "ws"
                                                            }
                                                            title="Leave workspace"
                                                            aria-label="Leave workspace"
                                                        >
                                                            <SignOut
                                                                size={14}
                                                            />
                                                        </HeaderIconButton>
                                                    </ContextActions>
                                                </ContextRow>
                                            )}
                                    </SelectedBlock>
                                );
                            })()}

                            {leaveError && (
                                <ErrorBar>
                                    <WarningCircle size={13} />
                                    {leaveError}
                                </ErrorBar>
                            )}

                            <List>
                                {organizationLoading || workspacesLoading ? (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <Shimmer key={i}>
                                                <SkeletonBlock w="22px" h="22px" r="5px" />
                                                <SkeletonBlock w={i === 2 ? "60%" : "80%"} h="11px" />
                                            </Shimmer>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {/* Personal */}
                                        {showPersonal && (
                                            <Row
                                                $active={isPersonalActive}
                                                onClick={() => { if (!isPersonalActive) handleSwitchOrganization(); }}
                                                disabled={isSwitching || isPersonalActive}
                                            >
                                                <OrgAvatar $personal>
                                                    {session?.active_signin?.user?.profile_picture_url
                                                        ? <img src={session.active_signin.user.profile_picture_url} alt="Personal" />
                                                        : <User size={12} />
                                                    }
                                                </OrgAvatar>
                                                <RowName>Personal account</RowName>
                                                {isPersonalActive && (
                                                    <RowRight>
                                                        <span className="row-check" style={{ display: "inline-flex" }}>
                                                            <CheckMark size={13} />
                                                        </span>
                                                    </RowRight>
                                                )}
                                            </Row>
                                        )}

                                        {/* All orgs */}
                                        {organizationMemberships?.map((membership) => {
                                            const org = membership.organization;
                                            const isActive = org.id === activeOrganization?.id;
                                            const isExpanded = expandedOrgs.has(org.id);
                                            const orgWorkspaces = workspacesEnabled
                                                ? (workspaceList?.filter((w: WorkspaceWithOrganization) => w.organization.id === org.id) || [])
                                                : [];
                                            const memRestricted = !!membership.eligibility_restriction?.type &&
                                                membership.eligibility_restriction.type !== "none";
                                            return (
                                                <React.Fragment key={org.id}>
                                                    <Row
                                                        $active={isActive}
                                                        onClick={() => {
                                                            if (memRestricted) return;
                                                            if (workspacesEnabled) toggleOrgExpanded(org.id);
                                                            else if (!isActive) handleSwitchOrganization(org.id);
                                                        }}
                                                        disabled={isSwitching}
                                                        style={
                                                            memRestricted
                                                                ? { opacity: 0.55, cursor: "not-allowed" }
                                                                : (isActive && !workspacesEnabled)
                                                                    ? { cursor: "default" }
                                                                    : undefined
                                                        }
                                                        title={membership.eligibility_restriction?.message}
                                                    >
                                                        <OrgAvatar>
                                                            {org.image_url
                                                                ? <img src={org.image_url} alt={org.name} />
                                                                : getInitials(org.name)
                                                            }
                                                        </OrgAvatar>
                                                        <RowName>{org.name}</RowName>
                                                        <RowRight>
                                                            {memRestricted && <WarningCircle size={12} color="var(--color-error)" />}
                                                            {isActive && !workspacesEnabled && (
                                                                <CheckMark size={13} />
                                                            )}
                                                            {workspacesEnabled && (
                                                                <ExpandCaret size={11} $open={isExpanded} />
                                                            )}
                                                        </RowRight>
                                                    </Row>

                                                    {workspacesEnabled && isExpanded && (
                                                        <>
                                                            {orgWorkspaces.map((ws: WorkspaceWithOrganization) => {
                                                                const isWsActive = isActive && activeWorkspace?.id === ws.id;
                                                                const wsRestr = ws.eligibility_restriction?.type &&
                                                                    ws.eligibility_restriction.type !== "none";

                                                                return (
                                                                    <WorkspaceRow
                                                                        key={ws.id}
                                                                        $active={isWsActive}
                                                                        onClick={() => { if (!isWsActive && !wsRestr) handleSwitchWorkspace(ws.id); }}
                                                                        disabled={isSwitching}
                                                                        style={
                                                                            (wsRestr || memRestricted)
                                                                                ? { opacity: 0.55, cursor: "not-allowed" }
                                                                                : isWsActive
                                                                                    ? { cursor: "default" }
                                                                                    : undefined
                                                                        }
                                                                        title={ws.eligibility_restriction?.message}
                                                                    >
                                                                        <WsAvatar>
                                                                            {ws.image_url
                                                                                ? <img src={ws.image_url} alt={ws.name} />
                                                                                : getInitials(ws.name).charAt(0)
                                                                            }
                                                                        </WsAvatar>
                                                                        <WsName>{ws.name}</WsName>
                                                                        <RowRight>
                                                                            {wsRestr && <WarningCircle size={12} color="var(--color-error)" />}
                                                                            {isWsActive && <CheckMark size={12} />}
                                                                        </RowRight>
                                                                    </WorkspaceRow>
                                                                );
                                                            })}
                                                            {!memRestricted && (
                                                                <WorkspaceRow
                                                                    onClick={() => { setSelectedOrgForWorkspace(org.id); createWorkspaceDialog.open(); }}
                                                                    disabled={isSwitching}
                                                                >
                                                                    <WsAvatar style={{ background: "transparent", border: "1px dashed var(--color-border)" }}>
                                                                        <Plus size={10} />
                                                                    </WsAvatar>
                                                                    <WsName>New workspace</WsName>
                                                                </WorkspaceRow>
                                                            )}
                                                        </>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </>
                                )}
                            </List>

                            {workspacesEnabled ? (
                                <Footer>
                                    <CreateRow
                                        onClick={() => {
                                            setSelectedOrgForWorkspace(
                                                activeOrganization && !orgRestricted ? activeOrganization.id : null
                                            );
                                            createWorkspaceDialog.open();
                                        }}
                                        disabled={isSwitching || !activeOrganization || orgRestricted}
                                    >
                                        <CreateIcon><Plus size={12} /></CreateIcon>
                                        New workspace
                                    </CreateRow>
                                </Footer>
                            ) : allowUsersToCreateOrgs && (
                                <Footer>
                                    <CreateRow onClick={() => createOrgDialog.open()} disabled={isSwitching}>
                                        <CreateIcon><Plus size={12} /></CreateIcon>
                                        New organization
                                    </CreateRow>
                                </Footer>
                            )}
                        </Dropdown>
                    </DefaultStylesProvider>,
                    document.body,
                )}

                {organizationsEnabled && allowUsersToCreateOrgs && (
                    <CreateOrganizationDialog isOpen={createOrgDialog.isOpen} onClose={createOrgDialog.close} onCreated={refetchOrganizations} />
                )}
                <ManageOrganizationDialog isOpen={manageOrgDialog.isOpen} onClose={manageOrgDialog.close} />
                {workspacesEnabled && (
                    <>
                        <ManageWorkspaceDialog isOpen={manageWorkspaceDialog.isOpen} onClose={manageWorkspaceDialog.close} />
                        <CreateWorkspaceDialog
                            isOpen={createWorkspaceDialog.isOpen}
                            onClose={() => { createWorkspaceDialog.close(); setSelectedOrgForWorkspace(null); }}
                            organizationId={selectedOrgForWorkspace || undefined}
                        />
                    </>
                )}
            </Container>
        </DefaultStylesProvider>
    );
};

export default OrganizationSwitcher;
