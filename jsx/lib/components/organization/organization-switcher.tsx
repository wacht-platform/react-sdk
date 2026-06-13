"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
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
import { DefaultStylesProvider, useThemeOverrideVars } from "../utility/root";
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

    const themeOverrides = useThemeOverrideVars();
    const { organizationMemberships, loading: organizationLoading, refetch: refetchOrganizations } = useOrganizationMemberships();
    const { activeOrganization, activeMembership: activeOrgMembership, leave: leaveOrganization } = useActiveOrganization();
    const { activeWorkspace, activeMembership: activeWsMembership, leave: leaveWorkspace } = useActiveWorkspace();
    const { workspaces: workspaceList, loading: workspacesLoading } = useWorkspaceList();
    const { session, switchOrganization, switchWorkspace } = useSession();
    const { deployment } = useDeployment();

    const organizationsEnabled = deployment?.b2b_settings.organizations_enabled;
    const workspacesEnabled =
        organizationsEnabled && deployment?.b2b_settings.workspaces_enabled;
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

    const openOrgSettings = () => { manageOrgDialog.open(); setOpen(false); };
    const openWsSettings = () => { manageWorkspaceDialog.open(); setOpen(false); };

    const handleLeaveOrg = async () => {
        if (!leaveOrganization) return;
        setLeaveError(null);
        try {
            await leaveOrganization();
            await refetchOrganizations();
            setOpen(false);
        } catch (err) {
            setLeaveError(err instanceof Error ? err.message : "Failed to leave organization");
        }
    };

    const handleLeaveWs = async () => {
        if (!leaveWorkspace) return;
        setLeaveError(null);
        try {
            await leaveWorkspace();
            setOpen(false);
        } catch (err) {
            setLeaveError(err instanceof Error ? err.message : "Failed to leave workspace");
        }
    };

    const orgRestricted = !!activeOrgMembership?.eligibility_restriction?.type &&
        activeOrgMembership.eligibility_restriction.type !== "none";

    const canManageActiveOrg =
        !!activeOrganization && !orgRestricted && canManageOrganization(activeOrgMembership);
    const canManageActiveWs =
        !!workspacesEnabled && !!activeWorkspace && !orgRestricted && canManageWorkspace(activeWsMembership);

    const isSessionReady = !!session;
    const showSkeleton = !isSessionReady || organizationLoading || (workspacesEnabled && workspacesLoading);

    if (showSkeleton) {
        return (
            <DefaultStylesProvider>
                <div className="w-full w-relative">
                    <div className="w-combo">
                        <span className="w-skel" style={{ width: 20, height: 20 }} />
                        <span className="w-skel w-grow" style={{ height: 12 }} />
                    </div>
                </div>
            </DefaultStylesProvider>
        );
    }

    return (
        <DefaultStylesProvider>
            <div className="w-full w-relative">
                <button
                    ref={buttonRef}
                    className="w-orgtrigger"
                    data-open={open ? "" : undefined}
                    onClick={() => { setOpen(!open); if (!open) setLeaveError(null); }}
                    disabled={isSwitching}
                >
                    <span
                        className={`w-avatar w-avatar--sm${triggerDisplay.isPersonal ? "" : ""}`}
                    >
                        {triggerDisplay.image_url
                            ? <img src={triggerDisplay.image_url} alt={triggerDisplay.name} />
                            : triggerDisplay.isPersonal
                                ? <User size={11} />
                                : getInitials(triggerDisplay.name)
                        }
                    </span>
                    <span className="w-grow w-truncate">{triggerDisplay.name}</span>
                    <CaretUpDown size={13} />
                </button>

                {typeof window !== "undefined" && ReactDOM.createPortal(
                        <div
                            ref={dropdownRef}
                            className="wacht-root w-menu w-flex-col"
                            style={{
                                position: "fixed",
                                width: 300,
                                maxWidth: "calc(100vw - 16px)",
                                maxHeight: dropdownPosition?.maxHeight ? `${dropdownPosition.maxHeight}px` : 420,
                                padding: 0,
                                zIndex: 99999,
                                top: dropdownPosition?.top !== undefined ? `${dropdownPosition.top}px` : undefined,
                                bottom: dropdownPosition?.bottom !== undefined ? `${dropdownPosition.bottom}px` : undefined,
                                left: dropdownPosition?.left !== undefined ? `${dropdownPosition.left}px` : undefined,
                                right: dropdownPosition?.right !== undefined ? `${dropdownPosition.right}px` : undefined,
                                visibility: dropdownPosition && open ? "visible" : "hidden",
                                opacity: open && dropdownPosition ? 1 : 0,
                                transform: open ? "translateY(0)" : "translateY(-4px)",
                                pointerEvents: open ? "auto" : "none",
                                transition: `opacity 0.15s ease, transform 0.15s ease, visibility 0s linear ${open ? "0s" : "0.15s"}`,
                                ...themeOverrides,
                            }}
                        >
                            {leaveError && (
                                <div className="w-banner w-banner--error w-switch-banner">
                                    <WarningCircle size={13} />
                                    <span className="w-banner-txt w-text-error">{leaveError}</span>
                                </div>
                            )}

                            <div className="w-grow w-switch-body">
                                {organizationLoading || workspacesLoading ? (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-flex w-items-center w-gap-3" style={{ padding: "0 8px", height: 34 }}>
                                                <span className="w-skel" style={{ width: 22, height: 22 }} />
                                                <span className="w-skel" style={{ width: i === 2 ? "60%" : "80%", height: 11 }} />
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {/* Personal */}
                                        {showPersonal && (
                                            <button
                                                className="w-menu-item"
                                                onClick={() => { if (!isPersonalActive) handleSwitchOrganization(); }}
                                                disabled={isSwitching || isPersonalActive}
                                            >
                                                <span className="w-avatar w-avatar--sm">
                                                    {session?.active_signin?.user?.profile_picture_url
                                                        ? <img src={session.active_signin.user.profile_picture_url} alt="Personal" />
                                                        : <User size={12} />
                                                    }
                                                </span>
                                                <span className="w-grow w-truncate">Personal account</span>
                                                {isPersonalActive && (
                                                    <Check size={13} className="w-text-primary w-none" />
                                                )}
                                            </button>
                                        )}

                                        {(organizationMemberships?.length ?? 0) > 0 && (
                                            <>
                                                <hr className="w-hr" />
                                                <div className="w-menu-label">Organizations</div>
                                            </>
                                        )}

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
                                                    <button
                                                        className="w-menu-item"
                                                        onClick={() => {
                                                            if (memRestricted) return;
                                                            if (workspacesEnabled) toggleOrgExpanded(org.id);
                                                            else if (!isActive) handleSwitchOrganization(org.id);
                                                        }}
                                                        disabled={isSwitching}
                                                        style={memRestricted ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                                                        title={membership.eligibility_restriction?.message}
                                                    >
                                                        <span className="w-avatar w-avatar--sm">
                                                            {org.image_url
                                                                ? <img src={org.image_url} alt={org.name} />
                                                                : getInitials(org.name)
                                                            }
                                                        </span>
                                                        <span className="w-grow w-truncate">{org.name}</span>
                                                        <span className="w-inline w-gap-1 w-none">
                                                            {memRestricted && <WarningCircle size={12} className="w-text-error" />}
                                                            {isActive && canManageActiveOrg && (
                                                                <span className="w-rowact" role="button" title="Organization settings" aria-label="Organization settings" onClick={(e) => { e.stopPropagation(); openOrgSettings(); }}>
                                                                    <GearSix size={13} />
                                                                </span>
                                                            )}
                                                            {isActive && !memRestricted && (
                                                                <span className="w-rowact" role="button" title="Leave organization" aria-label="Leave organization" onClick={(e) => { e.stopPropagation(); handleLeaveOrg(); }}>
                                                                    <SignOut size={13} />
                                                                </span>
                                                            )}
                                                            {isActive && !workspacesEnabled && (
                                                                <Check size={13} className="w-text-primary" />
                                                            )}
                                                            {workspacesEnabled && (
                                                                <CaretDown
                                                                    size={11}
                                                                    className="w-text-muted"
                                                                    style={{ transition: "transform 0.2s ease", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                                                                />
                                                            )}
                                                        </span>
                                                    </button>

                                                    {workspacesEnabled && isExpanded && !memRestricted && (
                                                        <div className="w-switch-nest">
                                                            {orgWorkspaces.map((ws: WorkspaceWithOrganization) => {
                                                                const isWsActive = isActive && activeWorkspace?.id === ws.id;
                                                                const wsRestr = ws.eligibility_restriction?.type &&
                                                                    ws.eligibility_restriction.type !== "none";

                                                                return (
                                                                    <button
                                                                        key={ws.id}
                                                                        className="w-menu-item"
                                                                        onClick={() => { if (!isWsActive && !wsRestr) handleSwitchWorkspace(ws.id); }}
                                                                        disabled={isSwitching}
                                                                        style={wsRestr ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                                                                        title={ws.eligibility_restriction?.message}
                                                                    >
                                                                        <span className="w-avatar w-avatar--sm">
                                                                            {ws.image_url
                                                                                ? <img src={ws.image_url} alt={ws.name} />
                                                                                : getInitials(ws.name).charAt(0)
                                                                            }
                                                                        </span>
                                                                        <span className="w-grow w-truncate">{ws.name}</span>
                                                                        <span className="w-inline w-gap-1 w-none">
                                                                            {wsRestr && <WarningCircle size={12} className="w-text-error" />}
                                                                            {isWsActive && canManageActiveWs && (
                                                                                <span className="w-rowact" role="button" title="Workspace settings" aria-label="Workspace settings" onClick={(e) => { e.stopPropagation(); openWsSettings(); }}>
                                                                                    <GearSix size={13} />
                                                                                </span>
                                                                            )}
                                                                            {isWsActive && (
                                                                                <span className="w-rowact" role="button" title="Leave workspace" aria-label="Leave workspace" onClick={(e) => { e.stopPropagation(); handleLeaveWs(); }}>
                                                                                    <SignOut size={13} />
                                                                                </span>
                                                                            )}
                                                                            {isWsActive && <Check size={12} className="w-text-primary" />}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                            <button
                                                                className="w-menu-item w-menu-item--muted"
                                                                onClick={() => { setSelectedOrgForWorkspace(org.id); createWorkspaceDialog.open(); }}
                                                                disabled={isSwitching}
                                                            >
                                                                <Plus size={13} />
                                                                <span className="w-grow w-truncate">New workspace</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}

                                        {allowUsersToCreateOrgs && (
                                            <>
                                                <hr className="w-hr" />
                                                <button
                                                    className="w-menu-item w-menu-item--muted"
                                                    onClick={() => createOrgDialog.open()}
                                                    disabled={isSwitching}
                                                >
                                                    <Plus size={13} />
                                                    <span className="w-grow w-truncate">New organization</span>
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>,
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
            </div>
        </DefaultStylesProvider>
    );
};

export default OrganizationSwitcher;
