import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Bell } from "@phosphor-icons/react";
import { DefaultStylesProvider } from "../utility/root";
import { useNotificationUnreadCount } from "@/hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";
import { usePopoverPosition } from "@/hooks/use-popover-position";
import type { NotificationListParams } from "@/types";

interface NotificationBellProps {
    className?: string;
    showBadge?: boolean;
    scope?: NotificationListParams["scope"];
    onAction?: (payload: any) => void;
}

export function NotificationBell({
    className,
    showBadge = true,
    scope = "all",
    onAction,
}: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { count: unreadCount, refetch: refetchUnread } = useNotificationUnreadCount({
        scope,
    });

    const handleAction = async (action: any) => {
        // Only handle unread count refetching, actual actions are now in NotificationPanel
        await refetchUnread();
        onAction?.(action.payload);
    };

    const popoverPosition = usePopoverPosition({
        triggerRef: buttonRef,
        isOpen,
        minWidth: Math.min(
            450,
            typeof window !== "undefined" ? window.innerWidth - 32 : 300,
        ),
        defaultMaxHeight: 550,
    });

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Node;

                if (containerRef.current?.contains(target)) {
                    return;
                }

                if (popoverRef.current?.contains(target)) {
                    return;
                }

                setIsOpen(false);
            };

            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, 50);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen]);

    return (
        <DefaultStylesProvider>
            <div
                ref={containerRef}
                className={`w-inline w-relative${className ? ` ${className}` : ""}`}
            >
                <button
                    ref={buttonRef}
                    className="w-btn w-btn--icon"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={
                        unreadCount > 0
                            ? `${unreadCount} unread notifications`
                            : "Notifications"
                    }
                >
                    <Bell strokeWidth={1} />
                    {showBadge && unreadCount > 0 && (
                        <span
                            className="w-notif-badge"
                            data-dot={unreadCount <= 9 ? "" : undefined}
                        >
                            {unreadCount > 9 ? "9+" : ""}
                        </span>
                    )}
                </button>

                {typeof window !== "undefined" &&
                    isOpen &&
                    ReactDOM.createPortal(
                        <div className="wacht-root">
                            <NotificationPopover
                                ref={popoverRef}
                                position={popoverPosition}
                                scope={scope}
                                onAction={handleAction}
                                onClose={() => setIsOpen(false)}
                            />
                        </div>,
                        document.body,
                    )}
            </div>
        </DefaultStylesProvider>
    );
}
