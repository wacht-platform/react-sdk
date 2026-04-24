import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    JSX,
} from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import {
    SignOut,
    GearSix,
    Plus,
    Check,
    CaretDown,
    CaretLeft,
    User,
    WarningCircle,
} from "@phosphor-icons/react";
import { DefaultStylesProvider } from "../utility/root";
import { useSession, useDeployment, useNavigation } from "@/hooks";
import {
    useActiveOrganization,
    useOrganizationMemberships,
} from "@/hooks/use-organization";
import { useWorkspaceList, useActiveWorkspace } from "@/hooks/use-workspace";
import { ManageAccountDialog } from "./manage-account-dialog";
import { CreateOrganizationDialog } from "../organization/create-organization-dialog";
import { ManageOrganizationDialog } from "../organization/manage-organization-dialog";
import { CreateWorkspaceDialog } from "../workspace/create-workspace-dialog";
import { ManageWorkspaceDialog } from "../workspace/manage-workspace-dialog";
import { useDialog } from "../utility/use-dialog";
import { usePopoverPosition } from "@/hooks/use-popover-position";
import { canManageOrganization, canManageWorkspace } from "@/utils/permissions";
import type { WorkspaceWithOrganization } from "@/types";

// ─── Trigger ──────────────────────────────────────────────────────────────────

const Container = styled.div`
    position: relative;
`;

const AccountButton = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-3u);
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-full);
    padding: var(--space-1u);
    transition: background-color 0.2s ease;
    &:hover {
        background: var(--color-accent);
    }
`;

const Avatar = styled.div`
    width: calc(var(--size-12u) + var(--space-4u));
    height: calc(var(--size-12u) + var(--space-4u));
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-secondary-text);
    flex-shrink: 0;
    border: var(--border-width-thin) solid var(--color-border);
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const TriggerName = styled.div`
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-secondary-text);
`;

// ─── Dropdown shell ───────────────────────────────────────────────────────────

const DropdownContainer = styled.div<{
    $position?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
    };
    $isOpen: boolean;
    $maxHeight?: number;
}>`
    position: fixed;
    ${(p) =>
        p.$position?.top !== undefined ? `top: ${p.$position.top}px;` : ""}
    ${(p) =>
        p.$position?.bottom !== undefined
            ? `bottom: ${p.$position.bottom}px;`
            : ""}
    ${(p) =>
        p.$position?.left !== undefined ? `left: ${p.$position.left}px;` : ""}
    ${(p) =>
        p.$position?.right !== undefined
            ? `right: ${p.$position.right}px;`
            : ""}
    visibility: ${(p) => (p.$position && p.$isOpen ? "visible" : "hidden")};
    opacity: ${(p) => (p.$isOpen && p.$position ? 1 : 0)};
    transition:
        opacity 0.15s ease,
        visibility 0s linear ${(p) => (p.$isOpen ? "0s" : "0.15s")};
    border-radius: var(--radius-md);
    border: var(--border-width-thin) solid var(--color-border);
    background: var(--color-popover);
    box-shadow: var(--shadow-md);
    z-index: 99999;
    overflow: hidden;
    width: 300px;
    max-width: calc(100vw - var(--space-12u));
    max-height: ${(p) =>
        p.$maxHeight ? `${p.$maxHeight}px` : "calc(100vh - 48px)"};
    overflow-y: auto;
`;

const SidePanel = styled.div<{
    $top: number;
    $left: number;
    $isOpen: boolean;
    $maxHeight: number;
}>`
    position: fixed;
    top: ${(p) => p.$top}px;
    left: ${(p) => p.$left}px;
    visibility: ${(p) => (p.$isOpen ? "visible" : "hidden")};
    opacity: ${(p) => (p.$isOpen ? 1 : 0)};
    transition:
        opacity 0.15s ease,
        visibility 0s linear ${(p) => (p.$isOpen ? "0s" : "0.15s")};
    border-radius: var(--radius-md);
    border: var(--border-width-thin) solid var(--color-border);
    background: var(--color-popover);
    box-shadow: var(--shadow-md);
    z-index: 99999;
    overflow: hidden;
    width: 300px;
    max-width: calc(100vw - var(--space-12u));
    max-height: ${(p) => p.$maxHeight}px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
`;

const Divider = styled.div`
    height: var(--border-width-thin);
    background: var(--color-border);
    flex-shrink: 0;
`;

// ─── Profile block ────────────────────────────────────────────────────────────

const ProfileBlock = styled.div`
    padding: var(--space-6u) var(--space-5u) var(--space-3u);
    margin-bottom: var(--space-4u);
`;

const ProfileHeader = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
`;

const LargeAvatar = styled(Avatar)`
    width: 40px;
    height: 40px;
    font-size: var(--font-size-md);
    flex-shrink: 0;
`;

const ProfileInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

const ProfileName = styled.div`
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-popover-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
`;

const ProfileEmail = styled.div`
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-secondary-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
`;

// ─── Org chip ─────────────────────────────────────────────────────────────────

const OrgChip = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: var(--space-3u);
    width: 100%;
    padding: calc(var(--space-4u));
    background: ${(p) => (p.$active ? "var(--color-accent)" : "transparent")};
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: background-color 0.15s ease;
    &:hover {
        background: var(--color-accent);
    }
`;

const InitialBox = styled.div`
    width: 18px;
    height: 18px;
    border-radius: var(--radius-2xs);
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 400;
    color: var(--color-popover-foreground);
    overflow: hidden;
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const OrgChipName = styled.div`
    flex: 1;
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-popover-foreground);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const OrgChipRole = styled.div`
    font-size: var(--font-size-xs);
    font-weight: 400;
    color: var(--color-secondary-text);
    flex-shrink: 0;
`;

// ─── Menu items ───────────────────────────────────────────────────────────────

const MenuList = styled.div`
    padding: var(--space-2u) var(--space-2u) var(--space-3u);
`;

const MenuItem = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    width: 100%;
    padding: var(--space-3u) var(--space-4u);
    background: transparent;
    border: none;
    border-radius: var(--radius-xs);
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-popover-foreground);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
    &:hover {
        background: var(--color-accent);
    }
    svg {
        width: 15px;
        height: 15px;
        color: var(--color-secondary-text);
        flex-shrink: 0;
    }
`;

const MenuItemLabel = styled.span`
    flex: 1;
`;

const MenuItemShortcut = styled.span`
    font-size: 11px;
    font-weight: 400;
    color: var(--color-secondary-text);
`;

// ─── Accounts section ─────────────────────────────────────────────────────────

const AccountsBlock = styled.div`
    padding: var(--space-2u) var(--space-2u) var(--space-3u);
`;

const SectionLabel = styled.div`
    font-size: 10px;
    font-weight: 400;
    color: var(--color-secondary-text);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: var(--space-2u) var(--space-4u) var(--space-2u);
`;

const AccountRow = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: var(--space-3u);
    width: 100%;
    padding: var(--space-3u) var(--space-4u);
    background: transparent;
    border: none;
    border-radius: var(--radius-xs);
    cursor: ${(p) => (p.$active ? "default" : "pointer")};
    transition: background-color 0.15s ease;
    text-align: left;
    &:hover {
        background: ${(p) =>
            p.$active ? "transparent" : "var(--color-accent)"};
    }
`;

const RowCheck = styled.div`
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    svg {
        width: 13px;
        height: 13px;
    }
`;

const RowSpacer = styled.div`
    width: 14px;
    flex-shrink: 0;
`;

const RowEmail = styled.div`
    flex: 1;
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-popover-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RowCurrent = styled.div`
    font-size: var(--font-size-xs);
    font-weight: 400;
    color: var(--color-secondary-text);
    flex-shrink: 0;
`;

// ─── Sign out ─────────────────────────────────────────────────────────────────

const SignOutBlock = styled.div`
    padding: var(--space-2u) var(--space-2u) var(--space-3u);
`;

const SignOutButton = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    width: 100%;
    padding: var(--space-3u) var(--space-4u);
    background: transparent;
    border: none;
    border-radius: var(--radius-xs);
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-error);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
    &:hover {
        background: color-mix(in srgb, var(--color-error) 10%, transparent);
    }
    svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
    }
`;

// ─── Side panel: slick list (mirrors OrganizationSwitcher) ────────────────────

const SPBack = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-bottom: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-popover-foreground);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    flex-shrink: 0;
    transition: background 0.12s ease;
    &:hover {
        background: color-mix(
            in srgb,
            var(--color-popover-foreground) 6%,
            transparent
        );
    }
`;

const SPList = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 6px;
`;

const sprowBase = styled.button<{ $active?: boolean }>`
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

    .sp-actions {
        display: none;
    }
    .sp-check {
        display: inline-flex;
    }

    &:hover:not(:disabled) {
        background: color-mix(
            in srgb,
            var(--color-popover-foreground) 6%,
            transparent
        );
    }

    ${(p) =>
        p.$active &&
        `
        font-weight: 500;
        &:hover:not(:disabled) {
            background: color-mix(in srgb, var(--color-popover-foreground) 4%, transparent);
        }
        &:hover:not(:disabled) .sp-actions { display: inline-flex; }
        &:hover:not(:disabled) .sp-check { display: none; }
    `}

    &:disabled {
        cursor: default;
    }
`;

const SPRow = sprowBase;

const SPWsRow = styled(sprowBase)`
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

const SPOrgAvatar = styled.div<{ $personal?: boolean }>`
    width: 24px;
    height: 24px;
    min-width: 24px;
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
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const SPWsAvatar = styled.div`
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
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const SPRowName = styled.span`
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--color-popover-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const SPWsName = styled(SPRowName)`
    font-size: 12px;
`;

const SPRowRight = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
`;

const SPExpandCaret = styled(CaretDown)<{ $open: boolean }>`
    color: var(--color-secondary-text);
    flex-shrink: 0;
    transition: transform 0.2s ease;
    transform: ${(p) => (p.$open ? "rotate(0deg)" : "rotate(-90deg)")};
`;

const SPCheckMark = styled(Check)`
    color: var(--color-primary);
    flex-shrink: 0;
`;

const SPSelectedBlock = styled.div`
    padding: 10px 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
`;

const SPSegmented = styled.div`
    display: flex;
    padding: 2px;
    background: color-mix(in srgb, var(--color-popover-foreground) 5%, transparent);
    border-radius: 7px;
`;

const SPSegmentedTab = styled.button<{ $active?: boolean }>`
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

const SPContextRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 4px 2px;
    min-width: 0;
`;

const SPContextAvatar = styled.div`
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 6px;
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

const SPContextText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
`;

const SPContextName = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: var(--color-popover-foreground);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const SPContextRole = styled.div`
    font-size: 11px;
    color: var(--color-secondary-text);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const SPContextActions = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
`;

const SPHeaderIconButton = styled.button<{ $destructive?: boolean }>`
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

const SPFooter = styled.div`
    border-top: 1px solid var(--color-border);
    padding: 6px;
    flex-shrink: 0;
`;

const SPCreateRow = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 34px;
    padding: 0 8px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-secondary-text);
    font-size: 13px;
    font-weight: 400;
    text-align: left;
    transition:
        background 0.12s ease,
        color 0.12s ease;
    &:hover:not(:disabled) {
        background: color-mix(
            in srgb,
            var(--color-popover-foreground) 6%,
            transparent
        );
        color: var(--color-popover-foreground);
    }
    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

const SPCreateIcon = styled.div`
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

// ─── Component ────────────────────────────────────────────────────────────────

interface UserButtonProps {
    showName?: boolean;
    onCreateOrg?: () => void;
    /** Show the org/workspace chip row and side panel. Defaults to true. */
    showOrgSwitcher?: boolean;
    /** Viewport width threshold (px) below which the side panel replaces the main dropdown. Defaults to 640. */
    narrowBreakpoint?: number;
}

export const UserButton: React.FC<UserButtonProps> = ({
    showName = true,
    onCreateOrg,
    showOrgSwitcher = true,
    narrowBreakpoint = 640,
}): JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [isNarrow, setIsNarrow] = useState(
        typeof window !== "undefined" && window.innerWidth < narrowBreakpoint,
    );
    const [switching, setSwitching] = useState(false);
    const [contextTab, setContextTab] = useState<"org" | "ws">("org");
    const [leavingType, setLeavingType] = useState<"org" | "ws" | null>(null);
    const [sidePanelPos, setSidePanelPos] = useState({
        top: 0,
        left: 0,
        maxHeight: 400,
    });
    const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
    const [selectedOrgForWorkspace, setSelectedOrgForWorkspace] = useState<
        string | null
    >(null);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const sidePanelRef = useRef<HTMLDivElement>(null);

    const dropdownPosition = usePopoverPosition({
        triggerRef: buttonRef,
        isOpen,
        minWidth: 300,
    });
    const manageAccountDialog = useDialog(false);
    const createOrgDialog = useDialog(false);
    const manageOrgDialog = useDialog(false);
    const createWorkspaceDialog = useDialog(false);
    const manageWorkspaceDialog = useDialog(false);

    const {
        session,
        signOut,
        switchSignIn,
        switchOrganization,
        switchWorkspace,
        refetch,
    } = useSession();
    const { navigateToSignIn } = useNavigation();
    const { deployment } = useDeployment();
    const {
        activeOrganization,
        activeMembership: activeOrgMembership,
        leave: leaveOrganization,
    } = useActiveOrganization();
    const { organizationMemberships } = useOrganizationMemberships();
    const { workspaces } = useWorkspaceList();
    const {
        activeWorkspace,
        activeMembership: activeWsMembership,
        leave: leaveWorkspace,
    } = useActiveWorkspace();

    const selectedAccount = session?.active_signin?.user;
    const isMultiSession =
        deployment?.auth_settings?.multi_session_support?.enabled ?? false;
    const workspacesEnabled =
        deployment?.b2b_settings?.workspaces_enabled ?? false;
    const canCreateOrg =
        deployment?.b2b_settings?.allow_users_to_create_orgs ?? false;
    const isPersonalActive = !activeOrganization;

    const workspacesByOrg = useMemo(() => {
        const map: Record<string, typeof workspaces> = {};
        for (const ws of workspaces || []) {
            const orgId = ws.organization?.id;
            if (!orgId) continue;
            if (!map[orgId]) map[orgId] = [];
            map[orgId].push(ws);
        }
        return map;
    }, [workspaces]);

    const filteredMemberships = organizationMemberships || [];

    const updateSidePanelPos = useCallback(() => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        const sidePanelWidth = 300;
        const gap = 8;
        const narrow = window.innerWidth < narrowBreakpoint;
        setIsNarrow(narrow);
        if (narrow) {
            // Replace main dropdown in-place on narrow viewports.
            setSidePanelPos({
                top: rect.top,
                left: rect.left,
                maxHeight: rect.height,
            });
            return;
        }
        const maxHeight = Math.min(
            Math.max(rect.height, 520),
            window.innerHeight - rect.top - 16,
        );
        const fitsRight =
            rect.right + gap + sidePanelWidth <= window.innerWidth - 8;
        setSidePanelPos({
            top: rect.top,
            left: fitsRight
                ? rect.right + gap
                : rect.left - gap - sidePanelWidth,
            maxHeight,
        });
    }, [narrowBreakpoint]);

    const openSwitcher = useCallback(() => {
        updateSidePanelPos();
        setShowSwitcher(true);
    }, [updateSidePanelPos]);

    const toggleOrgExpanded = useCallback((orgId: string) => {
        setExpandedOrgs((prev) => {
            const next = new Set(prev);
            if (next.has(orgId)) next.delete(orgId);
            else next.add(orgId);
            return next;
        });
    }, []);

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
        const onResize = () => {
            setIsNarrow(window.innerWidth < narrowBreakpoint);
            if (showSwitcher) updateSidePanelPos();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [narrowBreakpoint, showSwitcher, updateSidePanelPos]);

    useEffect(() => {
        if (!isOpen) {
            setShowSwitcher(false);
            setSwitching(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            const onOutside = (e: MouseEvent) => {
                const t = e.target as Node;
                if (
                    buttonRef.current?.contains(t) ||
                    dropdownRef.current?.contains(t) ||
                    sidePanelRef.current?.contains(t)
                )
                    return;
                setIsOpen(false);
            };
            document.addEventListener("mousedown", onOutside);
            return () => document.removeEventListener("mousedown", onOutside);
        }, 50);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const getInitials = (name: string) =>
        name
            .split(" ")
            .filter(Boolean)
            .map((p) => p[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const renderAvatar = (
        hasPic: boolean | string | undefined,
        picUrl: string | undefined,
        first: string | undefined,
        last: string | undefined,
        Comp: typeof Avatar | typeof LargeAvatar,
    ) => (
        <Comp>
            {hasPic ? (
                <img src={picUrl} alt={first} />
            ) : (
                getInitials(`${first || ""} ${last || ""}`)
            )}
        </Comp>
    );

    const handleSignOut = async (signInId: string) => {
        try {
            await signOut(signInId);
            await refetch();
            setIsOpen(false);
        } catch {}
    };

    const handleSwitch = async (signInId: string) => {
        try {
            await switchSignIn(signInId);
            await refetch();
            setIsOpen(false);
        } catch {}
    };

    const handleSwitchOrg = async (orgId?: string) => {
        if (switching) return;
        setSwitching(true);
        try {
            await switchOrganization(orgId);
            await refetch();
            setShowSwitcher(false);
        } catch {
        } finally {
            setSwitching(false);
        }
    };

    const handleSwitchWorkspace = async (workspaceId: string) => {
        if (switching) return;
        setSwitching(true);
        try {
            await switchWorkspace(workspaceId);
            await refetch();
            setShowSwitcher(false);
        } catch {
        } finally {
            setSwitching(false);
        }
    };

    const openManage = () => {
        manageAccountDialog.open();
        setIsOpen(false);
    };

    const sorted = [...(session?.signins || [])].sort((a, b) => {
        const aA = a.user.id === selectedAccount?.id;
        const bA = b.user.id === selectedAccount?.id;
        return aA === bA ? 0 : aA ? -1 : 1;
    });

    const activeSignInId =
        sorted.find((s) => s.user.id === selectedAccount?.id)?.id || "";
    const roleLabel = activeOrgMembership?.roles?.[0]?.name ?? null;

    return (
        <DefaultStylesProvider>
            <Container>
                <AccountButton
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {renderAvatar(
                        selectedAccount?.has_profile_picture,
                        selectedAccount?.profile_picture_url,
                        selectedAccount?.first_name,
                        selectedAccount?.last_name,
                        Avatar,
                    )}
                    {showName && (
                        <TriggerName>
                            {`${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""}`.trim()}
                        </TriggerName>
                    )}
                </AccountButton>

                {typeof window !== "undefined" &&
                    ReactDOM.createPortal(
                        <DefaultStylesProvider>
                            {/* Main popover */}
                            <DropdownContainer
                                ref={dropdownRef}
                                $position={dropdownPosition}
                                $isOpen={isOpen && !(isNarrow && showSwitcher)}
                                $maxHeight={dropdownPosition?.maxHeight}
                            >
                                {/* Profile */}
                                <ProfileBlock>
                                    <ProfileHeader>
                                        {renderAvatar(
                                            selectedAccount?.has_profile_picture,
                                            selectedAccount?.profile_picture_url,
                                            selectedAccount?.first_name,
                                            selectedAccount?.last_name,
                                            LargeAvatar,
                                        )}
                                        <ProfileInfo>
                                            <ProfileName>
                                                {`${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""}`.trim()}
                                            </ProfileName>
                                            <ProfileEmail>
                                                {
                                                    selectedAccount
                                                        ?.primary_email_address
                                                        ?.email
                                                }
                                            </ProfileEmail>
                                        </ProfileInfo>
                                    </ProfileHeader>
                                </ProfileBlock>

                                {/* Org chip + menu — same container so widths are identical */}
                                <MenuList>
                                    {showOrgSwitcher && (
                                        <OrgChip
                                            $active={showSwitcher}
                                            onClick={openSwitcher}
                                            style={{
                                                marginBottom: "var(--space-2u)",
                                            }}
                                        >
                                            <InitialBox>
                                                {activeOrganization ? (
                                                    activeOrganization.image_url ? (
                                                        <img
                                                            src={
                                                                activeOrganization.image_url
                                                            }
                                                            alt={
                                                                activeOrganization.name
                                                            }
                                                        />
                                                    ) : (
                                                        activeOrganization.name
                                                            ?.charAt(0)
                                                            .toUpperCase()
                                                    )
                                                ) : selectedAccount?.has_profile_picture ? (
                                                    <img
                                                        src={
                                                            selectedAccount.profile_picture_url
                                                        }
                                                        alt={
                                                            selectedAccount.first_name
                                                        }
                                                    />
                                                ) : (
                                                    getInitials(
                                                        `${selectedAccount?.first_name || ""} ${selectedAccount?.last_name || ""}`,
                                                    )
                                                )}
                                            </InitialBox>
                                            <OrgChipName>
                                                {activeOrganization?.name ??
                                                    "Personal account"}
                                            </OrgChipName>
                                            {roleLabel && (
                                                <OrgChipRole>
                                                    {roleLabel}
                                                </OrgChipRole>
                                            )}
                                        </OrgChip>
                                    )}
                                    <MenuItem onClick={openManage}>
                                        <GearSix />
                                        <MenuItemLabel>
                                            Manage account
                                        </MenuItemLabel>
                                        <MenuItemShortcut>⌘,</MenuItemShortcut>
                                    </MenuItem>
                                </MenuList>

                                {/* Accounts */}
                                <Divider />
                                <AccountsBlock>
                                    <SectionLabel>Accounts</SectionLabel>

                                    {isMultiSession
                                        ? sorted.map(
                                              ({ user: acc, id: signInId }) => {
                                                  const active =
                                                      acc.id ===
                                                      selectedAccount?.id;
                                                  return (
                                                      <AccountRow
                                                          key={acc.id}
                                                          $active={active}
                                                          onClick={
                                                              active
                                                                  ? undefined
                                                                  : () =>
                                                                        handleSwitch(
                                                                            signInId,
                                                                        )
                                                          }
                                                      >
                                                          {active ? (
                                                              <RowCheck>
                                                                  <Check />
                                                              </RowCheck>
                                                          ) : (
                                                              <RowSpacer />
                                                          )}
                                                          <RowEmail>
                                                              {
                                                                  acc
                                                                      .primary_email_address
                                                                      ?.email
                                                              }
                                                          </RowEmail>
                                                          {active && (
                                                              <RowCurrent>
                                                                  Current
                                                              </RowCurrent>
                                                          )}
                                                      </AccountRow>
                                                  );
                                              },
                                          )
                                        : selectedAccount && (
                                              <AccountRow $active>
                                                  <RowCheck>
                                                      <Check />
                                                  </RowCheck>
                                                  <RowEmail>
                                                      {
                                                          selectedAccount
                                                              .primary_email_address
                                                              ?.email
                                                      }
                                                  </RowEmail>
                                                  <RowCurrent>
                                                      Current
                                                  </RowCurrent>
                                              </AccountRow>
                                          )}

                                    {isMultiSession && (
                                        <AccountRow
                                            onClick={() => {
                                                navigateToSignIn();
                                                setIsOpen(false);
                                            }}
                                        >
                                            <RowCheck
                                                style={{
                                                    color: "var(--color-secondary-text)",
                                                }}
                                            >
                                                <Plus />
                                            </RowCheck>
                                            <RowEmail
                                                style={{
                                                    color: "var(--color-secondary-text)",
                                                }}
                                            >
                                                Add account
                                            </RowEmail>
                                        </AccountRow>
                                    )}
                                </AccountsBlock>

                                {/* Sign out */}
                                <Divider />
                                <SignOutBlock>
                                    <SignOutButton
                                        onClick={() =>
                                            handleSignOut(activeSignInId)
                                        }
                                    >
                                        <SignOut />
                                        Sign out
                                    </SignOutButton>
                                </SignOutBlock>
                            </DropdownContainer>

                            {/* Org/workspace switcher side panel */}
                            <SidePanel
                                ref={sidePanelRef}
                                $top={sidePanelPos.top}
                                $left={sidePanelPos.left}
                                $isOpen={isOpen && showSwitcher}
                                $maxHeight={sidePanelPos.maxHeight}
                            >
                                {isNarrow && (
                                    <SPBack
                                        onClick={() => setShowSwitcher(false)}
                                    >
                                        <CaretLeft size={13} />
                                        Back
                                    </SPBack>
                                )}
                                {(() => {
                                    if (isPersonalActive) return null;
                                    const activeIsWorkspace =
                                        workspacesEnabled && !!activeWorkspace;
                                    const orgRestricted =
                                        !!activeOrgMembership
                                            ?.eligibility_restriction?.type &&
                                        activeOrgMembership
                                            .eligibility_restriction.type !==
                                            "none";
                                    const canManageOrg =
                                        !!activeOrganization &&
                                        !orgRestricted &&
                                        canManageOrganization(
                                            activeOrgMembership,
                                        );
                                    const canManageWs =
                                        activeIsWorkspace &&
                                        !orgRestricted &&
                                        canManageWorkspace(activeWsMembership);
                                    const viewingTab: "org" | "ws" =
                                        activeIsWorkspace ? contextTab : "org";
                                    const orgRole =
                                        activeOrgMembership?.roles?.[0]?.name;
                                    const wsRole =
                                        activeWsMembership?.roles?.[0]?.name;

                                    const handleLeaveOrgBtn = async () => {
                                        if (!leaveOrganization) return;
                                        setLeavingType("org");
                                        try {
                                            await leaveOrganization();
                                            await refetch();
                                            setShowSwitcher(false);
                                        } catch {
                                        } finally {
                                            setLeavingType(null);
                                        }
                                    };
                                    const handleLeaveWsBtn = async () => {
                                        if (!leaveWorkspace) return;
                                        setLeavingType("ws");
                                        try {
                                            await leaveWorkspace();
                                            setShowSwitcher(false);
                                        } catch {
                                        } finally {
                                            setLeavingType(null);
                                        }
                                    };

                                    return (
                                        <SPSelectedBlock>
                                            {activeIsWorkspace && (
                                                <SPSegmented>
                                                    <SPSegmentedTab
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
                                                    </SPSegmentedTab>
                                                    <SPSegmentedTab
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
                                                    </SPSegmentedTab>
                                                </SPSegmented>
                                            )}

                                            {viewingTab === "org" &&
                                                activeOrganization && (
                                                    <SPContextRow>
                                                        <SPContextAvatar>
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
                                                        </SPContextAvatar>
                                                        <SPContextText>
                                                            <SPContextName>
                                                                {
                                                                    activeOrganization.name
                                                                }
                                                            </SPContextName>
                                                            {orgRole && (
                                                                <SPContextRole>
                                                                    {orgRole}
                                                                </SPContextRole>
                                                            )}
                                                        </SPContextText>
                                                        <SPContextActions>
                                                            {canManageOrg && (
                                                                <SPHeaderIconButton
                                                                    onClick={() => {
                                                                        manageOrgDialog.open();
                                                                        setIsOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                    title="Organization settings"
                                                                    aria-label="Organization settings"
                                                                >
                                                                    <GearSix
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </SPHeaderIconButton>
                                                            )}
                                                            <SPHeaderIconButton
                                                                $destructive
                                                                onClick={
                                                                    handleLeaveOrgBtn
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
                                                            </SPHeaderIconButton>
                                                        </SPContextActions>
                                                    </SPContextRow>
                                                )}

                                            {viewingTab === "ws" &&
                                                activeIsWorkspace && (
                                                    <SPContextRow>
                                                        <SPContextAvatar>
                                                            {(
                                                                activeWorkspace as WorkspaceWithOrganization
                                                            ).image_url ? (
                                                                <img
                                                                    src={
                                                                        (
                                                                            activeWorkspace as WorkspaceWithOrganization
                                                                        )
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
                                                        </SPContextAvatar>
                                                        <SPContextText>
                                                            <SPContextName>
                                                                {
                                                                    activeWorkspace!
                                                                        .name
                                                                }
                                                            </SPContextName>
                                                            {wsRole && (
                                                                <SPContextRole>
                                                                    {wsRole}
                                                                </SPContextRole>
                                                            )}
                                                        </SPContextText>
                                                        <SPContextActions>
                                                            {canManageWs && (
                                                                <SPHeaderIconButton
                                                                    onClick={() => {
                                                                        manageWorkspaceDialog.open();
                                                                        setIsOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                    title="Workspace settings"
                                                                    aria-label="Workspace settings"
                                                                >
                                                                    <GearSix
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </SPHeaderIconButton>
                                                            )}
                                                            <SPHeaderIconButton
                                                                $destructive
                                                                onClick={
                                                                    handleLeaveWsBtn
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
                                                            </SPHeaderIconButton>
                                                        </SPContextActions>
                                                    </SPContextRow>
                                                )}
                                        </SPSelectedBlock>
                                    );
                                })()}

                                <SPList>
                                    {/* Personal account */}
                                    <SPRow
                                        $active={isPersonalActive}
                                        onClick={() => {
                                            if (!isPersonalActive)
                                                handleSwitchOrg(undefined);
                                        }}
                                        disabled={switching}
                                        style={
                                            isPersonalActive
                                                ? { cursor: "default" }
                                                : undefined
                                        }
                                    >
                                        <SPOrgAvatar $personal>
                                            {selectedAccount?.has_profile_picture ? (
                                                <img
                                                    src={
                                                        selectedAccount.profile_picture_url
                                                    }
                                                    alt={
                                                        selectedAccount.first_name
                                                    }
                                                />
                                            ) : (
                                                <User size={12} />
                                            )}
                                        </SPOrgAvatar>
                                        <SPRowName>Personal account</SPRowName>
                                        {isPersonalActive && (
                                            <SPRowRight>
                                                <span
                                                    className="sp-check"
                                                    style={{
                                                        display: "inline-flex",
                                                    }}
                                                >
                                                    <SPCheckMark size={13} />
                                                </span>
                                            </SPRowRight>
                                        )}
                                    </SPRow>

                                    {/* All orgs */}
                                    {filteredMemberships.map((membership) => {
                                        const org = membership.organization;
                                        const isActive =
                                            org.id === activeOrganization?.id;
                                        const isExpanded = expandedOrgs.has(
                                            org.id,
                                        );
                                        const orgWorkspaces = workspacesEnabled
                                            ? workspacesByOrg[org.id] || []
                                            : [];
                                        const memRestricted =
                                            !!membership.eligibility_restriction
                                                ?.type &&
                                            membership.eligibility_restriction
                                                .type !== "none";

                                        return (
                                            <React.Fragment key={org.id}>
                                                <SPRow
                                                    $active={isActive}
                                                    onClick={() => {
                                                        if (memRestricted)
                                                            return;
                                                        if (workspacesEnabled)
                                                            toggleOrgExpanded(
                                                                org.id,
                                                            );
                                                        else if (!isActive)
                                                            handleSwitchOrg(
                                                                org.id,
                                                            );
                                                    }}
                                                    disabled={switching}
                                                    style={
                                                        memRestricted
                                                            ? {
                                                                  opacity: 0.55,
                                                                  cursor: "not-allowed",
                                                              }
                                                            : isActive &&
                                                                !workspacesEnabled
                                                              ? {
                                                                    cursor: "default",
                                                                }
                                                              : undefined
                                                    }
                                                    title={
                                                        membership
                                                            .eligibility_restriction
                                                            ?.message
                                                    }
                                                >
                                                    <SPOrgAvatar>
                                                        {org.image_url ? (
                                                            <img
                                                                src={
                                                                    org.image_url
                                                                }
                                                                alt={org.name}
                                                            />
                                                        ) : (
                                                            getInitials(
                                                                org.name,
                                                            )
                                                        )}
                                                    </SPOrgAvatar>
                                                    <SPRowName>
                                                        {org.name}
                                                    </SPRowName>
                                                    <SPRowRight>
                                                        {memRestricted && (
                                                            <WarningCircle
                                                                size={12}
                                                                color="var(--color-error)"
                                                            />
                                                        )}
                                                        {isActive &&
                                                            !workspacesEnabled && (
                                                                <SPCheckMark
                                                                    size={13}
                                                                />
                                                            )}
                                                        {workspacesEnabled && (
                                                            <SPExpandCaret
                                                                size={11}
                                                                $open={
                                                                    isExpanded
                                                                }
                                                            />
                                                        )}
                                                    </SPRowRight>
                                                </SPRow>

                                                {workspacesEnabled &&
                                                    isExpanded && (
                                                        <>
                                                            {orgWorkspaces.map(
                                                                (ws) => {
                                                                    const isActiveWs =
                                                                        isActive &&
                                                                        activeWorkspace?.id ===
                                                                            ws.id;
                                                                    const wsAny =
                                                                        ws as WorkspaceWithOrganization;
                                                                    const wsRestr =
                                                                        wsAny
                                                                            .eligibility_restriction
                                                                            ?.type &&
                                                                        wsAny
                                                                            .eligibility_restriction
                                                                            .type !==
                                                                            "none";

                                                                    return (
                                                                        <SPWsRow
                                                                            key={
                                                                                ws.id
                                                                            }
                                                                            $active={
                                                                                isActiveWs
                                                                            }
                                                                            onClick={() => {
                                                                                if (
                                                                                    !isActiveWs &&
                                                                                    !wsRestr
                                                                                )
                                                                                    handleSwitchWorkspace(
                                                                                        ws.id,
                                                                                    );
                                                                            }}
                                                                            disabled={
                                                                                switching
                                                                            }
                                                                            style={
                                                                                wsRestr ||
                                                                                memRestricted
                                                                                    ? {
                                                                                          opacity: 0.55,
                                                                                          cursor: "not-allowed",
                                                                                      }
                                                                                    : isActiveWs
                                                                                      ? {
                                                                                            cursor: "default",
                                                                                        }
                                                                                      : undefined
                                                                            }
                                                                            title={
                                                                                wsAny
                                                                                    .eligibility_restriction
                                                                                    ?.message
                                                                            }
                                                                        >
                                                                            <SPWsAvatar>
                                                                                {wsAny.image_url ? (
                                                                                    <img
                                                                                        src={
                                                                                            wsAny.image_url
                                                                                        }
                                                                                        alt={
                                                                                            wsAny.name
                                                                                        }
                                                                                    />
                                                                                ) : (
                                                                                    getInitials(
                                                                                        wsAny.name,
                                                                                    ).charAt(
                                                                                        0,
                                                                                    )
                                                                                )}
                                                                            </SPWsAvatar>
                                                                            <SPWsName>
                                                                                {
                                                                                    wsAny.name
                                                                                }
                                                                            </SPWsName>
                                                                            <SPRowRight>
                                                                                {wsRestr && (
                                                                                    <WarningCircle
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                        color="var(--color-error)"
                                                                                    />
                                                                                )}
                                                                                {isActiveWs && (
                                                                                    <SPCheckMark
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                    />
                                                                                )}
                                                                            </SPRowRight>
                                                                        </SPWsRow>
                                                                    );
                                                                },
                                                            )}
                                                            {!memRestricted && (
                                                                <SPWsRow
                                                                    onClick={() => {
                                                                        setSelectedOrgForWorkspace(
                                                                            org.id,
                                                                        );
                                                                        createWorkspaceDialog.open();
                                                                    }}
                                                                    disabled={
                                                                        switching
                                                                    }
                                                                >
                                                                    <SPWsAvatar
                                                                        style={{
                                                                            background:
                                                                                "transparent",
                                                                            border: "1px dashed var(--color-border)",
                                                                        }}
                                                                    >
                                                                        <Plus
                                                                            size={
                                                                                10
                                                                            }
                                                                        />
                                                                    </SPWsAvatar>
                                                                    <SPWsName>
                                                                        New
                                                                        workspace
                                                                    </SPWsName>
                                                                </SPWsRow>
                                                            )}
                                                        </>
                                                    )}
                                            </React.Fragment>
                                        );
                                    })}
                                </SPList>

                                {/* Footer create button */}
                                {(() => {
                                    const hasOrgs =
                                        (organizationMemberships?.length ?? 0) >
                                        0;

                                    const renderCreateOrg = () =>
                                        canCreateOrg && (
                                            <SPFooter>
                                                <SPCreateRow
                                                    onClick={() => {
                                                        if (onCreateOrg) {
                                                            onCreateOrg();
                                                            setIsOpen(false);
                                                        } else
                                                            createOrgDialog.open();
                                                    }}
                                                    disabled={switching}
                                                >
                                                    <SPCreateIcon>
                                                        <Plus size={12} />
                                                    </SPCreateIcon>
                                                    New organization
                                                </SPCreateRow>
                                            </SPFooter>
                                        );

                                    if (!workspacesEnabled)
                                        return renderCreateOrg();

                                    if (!hasOrgs) return renderCreateOrg();

                                    const orgRestrictedForCreate =
                                        !!activeOrgMembership
                                            ?.eligibility_restriction?.type &&
                                        activeOrgMembership
                                            .eligibility_restriction.type !==
                                            "none";
                                    const fallbackOrgId =
                                        organizationMemberships?.[0]
                                            ?.organization?.id ?? null;
                                    const targetOrgId =
                                        activeOrganization &&
                                        !orgRestrictedForCreate
                                            ? activeOrganization.id
                                            : fallbackOrgId;

                                    return (
                                        <SPFooter>
                                            <SPCreateRow
                                                onClick={() => {
                                                    setSelectedOrgForWorkspace(
                                                        targetOrgId,
                                                    );
                                                    createWorkspaceDialog.open();
                                                }}
                                                disabled={switching}
                                            >
                                                <SPCreateIcon>
                                                    <Plus size={12} />
                                                </SPCreateIcon>
                                                New workspace
                                            </SPCreateRow>
                                        </SPFooter>
                                    );
                                })()}
                            </SidePanel>
                        </DefaultStylesProvider>,
                        document.body,
                    )}

                <ManageAccountDialog
                    isOpen={manageAccountDialog.isOpen}
                    onClose={manageAccountDialog.close}
                />
                {showOrgSwitcher && (
                    <>
                        <CreateOrganizationDialog
                            isOpen={createOrgDialog.isOpen}
                            onClose={createOrgDialog.close}
                        />
                        <ManageOrganizationDialog
                            isOpen={manageOrgDialog.isOpen}
                            onClose={manageOrgDialog.close}
                        />
                        {workspacesEnabled && (
                            <>
                                <CreateWorkspaceDialog
                                    isOpen={createWorkspaceDialog.isOpen}
                                    onClose={() => {
                                        createWorkspaceDialog.close();
                                        setSelectedOrgForWorkspace(null);
                                    }}
                                    organizationId={
                                        selectedOrgForWorkspace || undefined
                                    }
                                />
                                <ManageWorkspaceDialog
                                    isOpen={manageWorkspaceDialog.isOpen}
                                    onClose={manageWorkspaceDialog.close}
                                />
                            </>
                        )}
                    </>
                )}
            </Container>
        </DefaultStylesProvider>
    );
};
