import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    JSX,
} from "react";
import ReactDOM from "react-dom";
import {
    SignOut,
    GearSix,
    Plus,
    Check,
    CaretDown,
    CaretLeft,
    User,
    WarningCircle,
    ArrowsLeftRight,
} from "@phosphor-icons/react";
import { DefaultStylesProvider, useThemeOverrideVars } from "../utility/root";
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

// ─── Thin className renderers (design-system .w-* classes) ────────────────────

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
type SpanProps = React.HTMLAttributes<HTMLSpanElement>;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const Container = (p: DivProps) => (
    <div {...p} className={cx("w-relative", p.className)} />
);

const AccountButton = React.forwardRef<HTMLButtonElement, BtnProps>(
    (p, ref) => (
        <button
            {...p}
            ref={ref}
            className={cx("w-acct", p.className)}
            style={{ width: "auto", margin: 0, padding: 4, gap: 8, ...p.style }}
        />
    ),
);
AccountButton.displayName = "AccountButton";

const Avatar = ({ children, ...p }: DivProps) => (
    <div
        {...p}
        className={cx("w-avatar", "w-avatar--md", p.className)}
        style={{ width: 28, height: 28, fontSize: 11, ...p.style }}
    >
        {children}
    </div>
);

const TriggerName = (p: DivProps) => (
    <div {...p} className={cx("w-sec", "w-text-secondary", p.className)} />
);

// ─── Dropdown shell ───────────────────────────────────────────────────────────

const DropdownContainer = React.forwardRef<
    HTMLDivElement,
    DivProps & {
        $position?: { top?: number; bottom?: number; left?: number; right?: number };
        $isOpen: boolean;
        $maxHeight?: number;
    }
>(({ $position, $isOpen, $maxHeight, children, ...p }, ref) => (
    <div
        {...p}
        ref={ref}
        className="w-menu"
        style={{
            position: "fixed",
            width: 300,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: $maxHeight ? `${$maxHeight}px` : "calc(100vh - 48px)",
            overflowY: "auto",
            zIndex: 99999,
            top: $position?.top !== undefined ? `${$position.top}px` : undefined,
            bottom: $position?.bottom !== undefined ? `${$position.bottom}px` : undefined,
            left: $position?.left !== undefined ? `${$position.left}px` : undefined,
            right: $position?.right !== undefined ? `${$position.right}px` : undefined,
            visibility: $position && $isOpen ? "visible" : "hidden",
            opacity: $isOpen && $position ? 1 : 0,
            transition: `opacity 0.15s ease, visibility 0s linear ${$isOpen ? "0s" : "0.15s"}`,
            padding: 0,
        }}
    >
        {children}
    </div>
));
DropdownContainer.displayName = "DropdownContainer";

const SidePanel = React.forwardRef<
    HTMLDivElement,
    DivProps & { $top: number; $left: number; $isOpen: boolean; $maxHeight: number }
>(({ $top, $left, $isOpen, $maxHeight, children, ...p }, ref) => (
    <div
        {...p}
        ref={ref}
        className="w-menu"
        style={{
            position: "fixed",
            width: 300,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: `${$maxHeight}px`,
            overflowY: "auto",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            top: `${$top}px`,
            left: `${$left}px`,
            visibility: $isOpen ? "visible" : "hidden",
            opacity: $isOpen ? 1 : 0,
            transition: `opacity 0.15s ease, visibility 0s linear ${$isOpen ? "0s" : "0.15s"}`,
            padding: 0,
        }}
    >
        {children}
    </div>
));
SidePanel.displayName = "SidePanel";

const Divider = (p: DivProps) => (
    <hr {...(p as React.HTMLAttributes<HTMLHRElement>)} className={cx("w-hr", p.className)} />
);

// ─── Profile block ────────────────────────────────────────────────────────────

const ProfileBlock = (p: DivProps) => (
    <div {...p} style={{ padding: "16px 14px 8px", ...p.style }} />
);

const ProfileHeader = (p: DivProps) => (
    <div {...p} className={cx("w-flex", "w-items-center", "w-gap-3", p.className)} />
);

const LargeAvatar = ({ children, ...p }: DivProps) => (
    <div {...p} className={cx("w-avatar", "w-avatar--lg", p.className)}>
        {children}
    </div>
);

const ProfileInfo = (p: DivProps) => (
    <div {...p} className={cx("w-flex-col", "w-grow", p.className)} style={{ gap: 2, ...p.style }} />
);

const ProfileName = (p: DivProps) => (
    <div {...p} className={cx("w-sec", "w-truncate", p.className)} />
);

const ProfileEmail = (p: DivProps) => (
    <div {...p} className={cx("w-secsub", "w-truncate", p.className)} />
);

// ─── Org chip ─────────────────────────────────────────────────────────────────

const OrgChip = ({ $active, ...p }: BtnProps & { $active?: boolean }) => (
    <button
        {...p}
        className="w-menu-item"
        style={{
            border: "0.5px solid var(--wa-border)",
            background: $active ? "var(--wa-surface-subtle)" : undefined,
            ...p.style,
        }}
    />
);

const InitialBox = ({ children, ...p }: DivProps) => (
    <div {...p} className="w-avatar w-avatar--sm">
        {children}
    </div>
);

const OrgChipName = (p: DivProps) => (
    <div {...p} className={cx("w-sec", "w-grow", "w-truncate", p.className)} />
);

const OrgChipRole = (p: DivProps) => (
    <div {...p} className={cx("w-secsub", "w-none", p.className)} />
);

// ─── Menu items ───────────────────────────────────────────────────────────────

const MenuList = (p: DivProps) => (
    <div {...p} style={{ padding: "5px", ...p.style }} />
);

const MenuItem = (p: BtnProps) => <button {...p} className={cx("w-menu-item", p.className)} />;

const MenuItemLabel = (p: SpanProps) => <span {...p} className={cx("w-grow", p.className)} />;

const MenuItemShortcut = (p: SpanProps) => <span {...p} className={cx("w-menu-trail", p.className)} />;

// ─── Accounts section ─────────────────────────────────────────────────────────

const AccountsBlock = (p: DivProps) => (
    <div {...p} style={{ padding: "5px", ...p.style }} />
);

const SectionLabel = (p: DivProps) => (
    <div {...p} className={cx("w-menu-label", p.className)} />
);

const AccountRow = ({ $active, ...p }: BtnProps & { $active?: boolean }) => (
    <button
        {...p}
        className="w-menu-item"
        style={{ cursor: $active ? "default" : "pointer", ...p.style }}
    />
);

const RowCheck = ({ children, ...p }: DivProps) => (
    <div
        {...p}
        className={cx("w-flex", "w-items-center", "w-justify-center", "w-none", p.className)}
        style={{ width: 14, height: 14, color: "var(--wa-primary)", ...p.style }}
    >
        {children}
    </div>
);

const RowSpacer = (p: DivProps) => (
    <div {...p} className="w-none" style={{ width: 14, ...p.style }} />
);

const RowEmail = (p: DivProps) => (
    <div {...p} className={cx("w-sec", "w-grow", "w-truncate", p.className)} />
);

const RowCurrent = (p: DivProps) => (
    <div {...p} className={cx("w-secsub", "w-none", p.className)} />
);

// ─── Sign out ─────────────────────────────────────────────────────────────────

const SignOutBlock = (p: DivProps) => (
    <div {...p} style={{ padding: "5px", ...p.style }} />
);

const SignOutButton = (p: BtnProps) => (
    <button {...p} className={cx("w-menu-item", "w-menu-item--danger", p.className)} />
);

// ─── Side panel: slick list (mirrors OrganizationSwitcher) ────────────────────

const SPBack = (p: BtnProps) => (
    <button
        {...p}
        className={cx("w-menu-item", p.className)}
        style={{ borderBottom: "0.5px solid var(--wa-border)", borderRadius: 0, flex: "none", ...p.style }}
    />
);

const SPList = (p: DivProps) => (
    <div {...p} style={{ flex: "1 1 auto", overflowY: "auto", padding: 5, ...p.style }} />
);

const SPRow = ({ $active, ...p }: BtnProps & { $active?: boolean }) => (
    <button
        {...p}
        className={cx("w-menu-item", "sp-row", $active && "sp-row--active", p.className)}
        style={{ height: 32, ...p.style }}
    />
);

const SPWsRow = ({ $active, ...p }: BtnProps & { $active?: boolean }) => (
    <button
        {...p}
        className={cx("w-menu-item", "sp-row", "sp-ws-row", $active && "sp-row--active", p.className)}
        style={{ height: 32, paddingLeft: 30, position: "relative", ...p.style }}
    >
        {p.children}
    </button>
);

const SPOrgAvatar = ({ $personal, children, ...p }: DivProps & { $personal?: boolean }) => (
    <div
        {...p}
        className={cx("w-avatar", "w-avatar--sm", !$personal && "", p.className)}
    >
        {children}
    </div>
);

const SPWsAvatar = ({ children, ...p }: DivProps) => (
    <div {...p} className={cx("w-avatar", "", "w-avatar--sm", p.className)}>
        {children}
    </div>
);

const SPRowName = (p: SpanProps) => (
    <span {...p} className={cx("w-sec", "w-grow", "w-truncate", p.className)} />
);

const SPWsName = (p: SpanProps) => (
    <span {...p} className={cx("w-secsub", "w-grow", "w-truncate", p.className)} />
);

const SPRowRight = (p: DivProps) => (
    <div {...p} className={cx("w-flex", "w-items-center", "w-none", p.className)} style={{ gap: 4, ...p.style }} />
);

const SPExpandCaret = ({ $open, ...p }: { $open: boolean; size?: number } & React.ComponentProps<typeof CaretDown>) => (
    <CaretDown
        {...p}
        className="w-text-muted"
        style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: $open ? "rotate(0deg)" : "rotate(-90deg)" }}
    />
);

const SPCheckMark = (p: React.ComponentProps<typeof Check>) => (
    <Check {...p} className="w-text-primary" style={{ flexShrink: 0 }} />
);

const SPSelectedBlock = (p: DivProps) => (
    <div
        {...p}
        className={cx("w-flex-col", "w-gap-3", "w-none", p.className)}
        style={{ padding: "12px 12px 16px", borderBottom: "0.5px solid var(--wa-border)", ...p.style }}
    />
);

const SPContextSwitchButton = (p: BtnProps) => (
    <button {...p} className={cx("w-btn", "w-btn--icon", p.className)} style={{ width: 24, height: 24, ...p.style }} />
);

const SPContextRow = (p: DivProps) => (
    <div {...p} className={cx("w-flex", "w-items-center", "w-gap-3", p.className)} style={{ padding: "4px 4px 0", minWidth: 0, ...p.style }} />
);

const SPContextAvatar = ({ children, ...p }: DivProps) => (
    <div {...p} className={cx("w-avatar", "", "w-avatar--md", p.className)}>
        {children}
    </div>
);

const SPContextText = (p: DivProps) => (
    <div {...p} className={cx("w-flex-col", "w-grow", p.className)} style={{ gap: 1, minWidth: 0, ...p.style }} />
);

const SPContextName = (p: DivProps) => (
    <div {...p} className={cx("w-sec", "w-truncate", p.className)} />
);

const SPContextActions = (p: DivProps) => (
    <div {...p} className={cx("w-flex", "w-items-center", "w-none", p.className)} style={{ gap: 2, ...p.style }} />
);

const SPHeaderIconButton = ({ $destructive, ...p }: BtnProps & { $destructive?: boolean }) => (
    <button
        {...p}
        className={cx("w-btn", "w-btn--icon", $destructive && "w-btn--danger", p.className)}
        style={{ width: 24, height: 24, ...p.style }}
    />
);

const SPFooter = (p: DivProps) => (
    <div {...p} className="w-none" style={{ borderTop: "0.5px solid var(--wa-border)", padding: 5, ...p.style }} />
);

const SPCreateRow = (p: BtnProps) => (
    <button {...p} className={cx("w-menu-item", p.className)} style={{ height: 32, color: "var(--wa-text-muted)", ...p.style }} />
);

const SPCreateIcon = (p: DivProps) => (
    <div {...p} className={cx("w-flex", "w-items-center", "w-justify-center", "w-none", p.className)} style={{ width: 20, height: 20, ...p.style }} />
);

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
    const themeOverrides = useThemeOverrideVars();
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
    const canCreateOrg =
        deployment?.b2b_settings?.allow_users_to_create_orgs ?? false;
    const organizationsEnabled =
        deployment?.b2b_settings?.organizations_enabled ?? false;
    const workspacesEnabled =
        organizationsEnabled &&
        (deployment?.b2b_settings?.workspaces_enabled ?? false);
    const orgSwitcherEnabled = showOrgSwitcher && organizationsEnabled;
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
                        <div className="wacht-root" style={themeOverrides}>
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
                                    {orgSwitcherEnabled && (
                                        <OrgChip
                                            $active={showSwitcher}
                                            onClick={openSwitcher}
                                            style={{ marginBottom: 8 }}
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
                                            <RowCheck style={{ color: "var(--wa-text-muted)" }}>
                                                <Plus />
                                            </RowCheck>
                                            <RowEmail style={{ color: "var(--wa-text-muted)" }}>
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

                                    const renderSpContextSwitch = () => {
                                        if (!activeIsWorkspace) return null;
                                        const next: "org" | "ws" =
                                            viewingTab === "org" ? "ws" : "org";
                                        const label =
                                            next === "ws"
                                                ? "Switch to workspace context"
                                                : "Switch to organization context";
                                        return (
                                            <SPContextSwitchButton
                                                type="button"
                                                onClick={() => setContextTab(next)}
                                                title={label}
                                                aria-label={label}
                                            >
                                                <ArrowsLeftRight size={12} />
                                            </SPContextSwitchButton>
                                        );
                                    };

                                    return (
                                        <SPSelectedBlock>
                                            {viewingTab === "org" &&
                                                activeOrganization && (
                                                    <SPContextRow>
                                                        {renderSpContextSwitch()}
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
                                                        {renderSpContextSwitch()}
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
                                                                color="var(--wa-error)"
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
                                                                                        color="var(--wa-error)"
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
                                                                            border: "1px dashed var(--wa-border-strong)",
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
                        </div>,
                        document.body,
                    )}

                <ManageAccountDialog
                    isOpen={manageAccountDialog.isOpen}
                    onClose={manageAccountDialog.close}
                />
                {orgSwitcherEnabled && (
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
