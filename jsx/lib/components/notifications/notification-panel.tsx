import { useState, useRef, useEffect, forwardRef } from "react";
import { BellSlash, Checks, DotsThree, Archive, Funnel, Check } from "@phosphor-icons/react";
import { NotificationItem, type NotificationAction } from "./notification-item";
import { Spinner } from "../utility/spinner";
import { EmptyState } from "../utility/empty-state";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationListParams } from "@/types";

export interface NotificationPanelProps {
    scope?: NotificationListParams["scope"];
    onAction?: (payload: any) => void;
    fullWidth?: boolean;
    maxHeight?: string;
    className?: string;
}

export const NotificationPanel = forwardRef<HTMLDivElement, NotificationPanelProps>(
    ({ scope = "all", onAction, fullWidth, maxHeight, className }, ref) => {
        const [activeTab, setActiveTab] = useState<"inbox" | "archive" | "starred">("inbox");
        const [unreadOnly, setUnreadOnly] = useState(false);
        const [showMenu, setShowMenu] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);

        const notificationParams = {
            scope,
            limit: 20,
            is_archived: activeTab === "archive",
            is_starred: activeTab === "starred",
            is_read: unreadOnly ? false : undefined,
        };

        const {
            notifications,
            loading,
            error,
            hasMore,
            loadMore,
            markAsRead,
            markAsUnread,
            markAllAsRead,
            archiveAllRead,
            archiveNotification,
            starNotification,
        } = useNotifications(notificationParams);

        useEffect(() => {
            if (!showMenu) return;
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setShowMenu(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [showMenu]);

        const handleAction = async (action: NotificationAction) => {
            switch (action.type) {
                case 'read':
                    await markAsRead(action.id);
                    break;
                case 'unread':
                    await markAsUnread(action.id);
                    break;
                case 'archive':
                    await archiveNotification(action.id);
                    break;
                case 'star':
                    await starNotification(action.id);
                    break;
                case 'custom':
                    onAction?.(action.payload);
                    break;
            }
        };

        const handleMarkAllRead = () => {
            markAllAsRead();
            setShowMenu(false);
        };

        const handleArchiveAllRead = () => {
            archiveAllRead();
            setShowMenu(false);
        };

        return (
            <div
                ref={ref}
                className={`w-flex-col w-relative w-notif-panel${fullWidth ? " w-notif-panel--fill" : ""}${className ? ` ${className}` : ""}`}
                style={{ maxHeight: maxHeight || "100%" }}
            >
                <div className="w-flex w-items-center w-justify-between w-gap-2 w-none w-notif-head">
                    <div className="w-tabs w-grow">
                        <button
                            className={`w-tab${activeTab === 'inbox' ? ' w-tab--active' : ''}`}
                            onClick={() => setActiveTab('inbox')}
                        >
                            Inbox
                        </button>
                        <button
                            className={`w-tab${activeTab === 'archive' ? ' w-tab--active' : ''}`}
                            onClick={() => setActiveTab('archive')}
                        >
                            Archive
                        </button>
                        <button
                            className={`w-tab${activeTab === 'starred' ? ' w-tab--active' : ''}`}
                            onClick={() => setActiveTab('starred')}
                        >
                            Starred
                        </button>
                    </div>

                    <button
                        className="w-btn w-btn--icon w-none w-relative"
                        onClick={() => setShowMenu(!showMenu)}
                        title="Options"
                    >
                        <DotsThree size={16} />
                        {unreadOnly && <span className="w-notif-filter-dot" />}
                    </button>

                    {showMenu && (
                        <div ref={menuRef} className="w-menu w-notif-menu">
                            <button
                                className="w-menu-item"
                                onClick={() => {
                                    setUnreadOnly(!unreadOnly);
                                    setShowMenu(false);
                                }}
                            >
                                <Funnel /> Unread only
                                {unreadOnly && <Check className="w-menu-check" />}
                            </button>
                            {activeTab === 'inbox' && (
                                <button className="w-menu-item" onClick={handleMarkAllRead}>
                                    <Checks /> Mark all as read
                                </button>
                            )}
                            <button className="w-menu-item" onClick={handleArchiveAllRead}>
                                <Archive /> Archive all read
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-grow w-notif-body">
                    {loading ? (
                        <div className="w-loading">
                            <Spinner />
                        </div>
                    ) : error ? (
                        <EmptyState
                            icon={<BellSlash size={20} className="w-text-error" />}
                            title="Failed to load notifications"
                            description={error.message || "An unexpected error occurred."}
                        />
                    ) : notifications.length === 0 ? (
                        <EmptyState
                            icon={<BellSlash size={20} />}
                            title="No notifications"
                            description="You're all caught up!"
                        />
                    ) : (
                        <>
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onAction={handleAction}
                                />
                            ))}
                            {hasMore && (
                                <div className="w-flex w-justify-center" style={{ padding: 12 }}>
                                    <button className="w-btn w-btn--ghost w-btn--sm" onClick={loadMore}>
                                        Load more
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }
);
