import { useState } from "react";
import { LogOut } from "lucide-react";
import {
    Dropdown,
    DropdownItem,
    DropdownItems,
    DropdownTrigger,
} from "@/components/utility/dropdown";
import { useUserSignins } from "@/hooks/use-user";
import { useSession } from "@/hooks/use-session";
import { useScreenContext } from "../context";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ActionsCell,
} from "@/components/utility/table";
import { EmptyState } from "@/components/utility/empty-state";
import { Spinner } from "@/components/utility";
import { ChromeIcon as ChromeIconComponent } from "../../icons/chrome";
import { FirefoxIcon } from "../../icons/firefox";
import { SafariIcon } from "../../icons/safari";
import { EdgeIcon } from "../../icons/edge";
import { OperaIcon } from "../../icons/opera";
import { BraveIcon } from "../../icons/brave";
import {
    DesktopTableContainer,
    MobileListContainer,
    IconWrapper,
    IconButton,
    ConnectionItemRow,
    ConnectionLeft,
    useMediaQuery
} from "./shared";

// Local interface
export interface UserSignIn {
    id: string;
    session_id: string;
    user_id: string;
    active_organization_membership_id?: string;
    active_workspace_membership_id?: string;
    expires_at: string;
    last_active_at: string;
    ip_address: string;
    browser: string;
    device: string;
    city: string;
    region: string;
    region_code: string;
    country: string;
    country_code: string;
}

const UnknownBrowserIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "var(--color-secondary-text)" }}
    >
        <circle
            cx="12"
            cy="12"
            r="11"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.6"
        />
        <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
        />
        <path
            d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
            fill="currentColor"
            opacity="0.5"
        />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <text
            x="12"
            y="16.5"
            textAnchor="middle"
            fill="currentColor"
            fontSize="6"
            opacity="0.7"
        >
            ?
        </text>
    </svg>
);

const BrowserIcon = ({ browser }: { browser: string }) => {
    const browserName = browser?.toLowerCase() || "";
    const iconProps = { width: 20, height: 20 };

    if (browserName.includes("chrome")) {
        return <ChromeIconComponent {...iconProps} />;
    }

    if (browserName.includes("firefox")) {
        return <FirefoxIcon {...iconProps} />;
    }

    if (browserName.includes("safari")) {
        return <SafariIcon {...iconProps} />;
    }

    if (browserName.includes("edge")) {
        return <EdgeIcon {...iconProps} />;
    }

    if (browserName.includes("opera")) {
        return <OperaIcon {...iconProps} />;
    }

    if (browserName.includes("brave")) {
        return <BraveIcon {...iconProps} />;
    }

    return <UnknownBrowserIcon />;
};

export const ActiveSessionsSection = () => {
    const [activeSession, setActiveSession] = useState<string | null>(null);
    const { signins, removeSignin, refetch, loading } = useUserSignins();
    const { refetch: refetchSession } = useSession();
    const { toast } = useScreenContext();
    const isMobile = useMediaQuery("(max-width: 600px)");

    // Type the signins data properly
    const typedSignins = signins as UserSignIn[] | undefined;

    const logoutSession = async (sessionId: string) => {
        try {
            await removeSignin(sessionId);
            // Refetch both the signins list and the current session
            await Promise.all([refetch(), refetchSession()]);
            setActiveSession(null);
            toast("Session ended successfully", "info");
        } catch (error: any) {
            toast(
                error.message || "Failed to end session. Please try again.",
                "error",
            );
        }
    };

    const formatLastActive = (lastActiveAt: string) => {
        if (!lastActiveAt || lastActiveAt.trim() === "") return "Unknown";

        const date = new Date(lastActiveAt);
        if (isNaN(date.getTime())) return "Unknown";

        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60),
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div
                style={{ display: "flex", justifyContent: "center", padding: "20px" }}
            >
                <Spinner />
            </div>
        );
    }

    return (
        <>
            <div style={{ marginBottom: "16px" }}>
                <h3
                    style={{
                        fontSize: "16px",
                        color: "var(--color-foreground)",
                        margin: 0,
                    }}
                >
                    Active Sessions
                </h3>
                <p
                    style={{
                        fontSize: "14px",
                        color: "var(--color-muted)",
                        margin: 0,
                    }}
                >
                    Manage your active browser sessions and sign-ins
                </p>
            </div>
            <div>
                {typedSignins && typedSignins.length > 0 ? (
                    <>
                        {!isMobile && (
                            <DesktopTableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableHeader>Browser & Device</TableHeader>
                                            <TableHeader>Location</TableHeader>
                                            <TableHeader>Last Active</TableHeader>
                                            <TableHeader></TableHeader>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {typedSignins.map((signin) => (
                                            <TableRow key={signin.id}>
                                                <TableCell>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                        }}
                                                    >
                                                        <IconWrapper>
                                                            <BrowserIcon browser={signin.browser || "Unknown"} />
                                                        </IconWrapper>
                                                        <div>
                                                            <div>{signin.browser || "Unknown Browser"}</div>
                                                            {signin.device && (
                                                                <div
                                                                    style={{
                                                                        fontSize: "12px",
                                                                        color: "var(--color-muted)",
                                                                    }}
                                                                >
                                                                    {signin.device}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div>
                                                            {signin.city && signin.country
                                                                ? `${signin.city}, ${signin.country}`
                                                                : "Unknown location"}
                                                        </div>
                                                        {signin.ip_address && (
                                                            <div
                                                                style={{
                                                                    fontSize: "12px",
                                                                    color: "var(--color-muted)",
                                                                }}
                                                            >
                                                                {signin.ip_address}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {formatLastActive(signin.last_active_at)}
                                                </TableCell>
                                                <ActionsCell>
                                                    <Dropdown
                                                        open={activeSession === signin.id}
                                                        openChange={(isOpen) =>
                                                            setActiveSession(isOpen ? signin.id : null)
                                                        }
                                                    >
                                                        <DropdownTrigger>
                                                            <IconButton>•••</IconButton>
                                                        </DropdownTrigger>
                                                        <DropdownItems>
                                                            <DropdownItem onClick={() => logoutSession(signin.id)}>
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                    }}
                                                                >
                                                                    <LogOut size={14} />
                                                                    End Session
                                                                </div>
                                                            </DropdownItem>
                                                        </DropdownItems>
                                                    </Dropdown>
                                                </ActionsCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </DesktopTableContainer>
                        )}

                        {isMobile && (
                            <MobileListContainer>
                                {typedSignins.map((signin, index) => (
                                    <div key={signin.id}>
                                        <ConnectionItemRow>
                                            <ConnectionLeft>
                                                <IconWrapper>
                                                    <BrowserIcon browser={signin.browser || "Unknown"} />
                                                </IconWrapper>
                                                <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column" }}>
                                                    <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--color-foreground)" }}>
                                                        {signin.browser || "Unknown"} {signin.device ? `on ${signin.device}` : ""}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                                                        {signin.city && signin.country ? `${signin.city}, ${signin.country}` : "Unknown location"} • {formatLastActive(signin.last_active_at)}
                                                    </div>
                                                </div>

                                                <div style={{ marginLeft: "auto" }}>
                                                    <Dropdown
                                                        open={activeSession === signin.id}
                                                        openChange={(isOpen) =>
                                                            setActiveSession(isOpen ? signin.id : null)
                                                        }
                                                    >
                                                        <DropdownTrigger>
                                                            <IconButton>•••</IconButton>
                                                        </DropdownTrigger>
                                                        <DropdownItems>
                                                            <DropdownItem onClick={() => logoutSession(signin.id)}>
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                    }}
                                                                >
                                                                    <LogOut size={14} />
                                                                    End Session
                                                                </div>
                                                            </DropdownItem>
                                                        </DropdownItems>
                                                    </Dropdown>
                                                </div>
                                            </ConnectionLeft>
                                        </ConnectionItemRow>
                                        {index < typedSignins.length - 1 && (
                                            <div
                                                style={{
                                                    height: "1px",
                                                    background: "var(--color-border)",
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </MobileListContainer>
                        )}
                    </>
                ) : (
                    <EmptyState
                        title="No active sessions"
                        description="You don't have any active sessions at the moment."
                    />
                )}
            </div>
        </>
    );
};
