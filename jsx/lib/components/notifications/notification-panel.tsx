import { useState, useRef, useEffect, forwardRef } from "react";
import styled from "styled-components";
import { BellOff, CheckCheck, MoreHorizontal, Archive } from "lucide-react";
import { NotificationItem, type NotificationAction } from "./notification-item";
import { Spinner } from "../utility/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationListParams } from "@/types";

const PanelContainer = styled.div<{ $fullWidth?: boolean; $maxHeight?: string }>`
  width: ${props => props.$fullWidth ? '100%' : 'calc(calc(var(--size-50u) * 4) + var(--space-10u) + var(--space-5u))'};
  max-width: 100%;
  height: 100%;
  max-height: ${props => props.$maxHeight || 'calc(var(--size-50u) * 5)'};
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  overflow: hidden;
`;

const Header = styled.div`
  padding: var(--space-6u) var(--space-8u);
  border-bottom: var(--border-width-thin) solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background);
  flex-shrink: 0;

  @media(max-width: 400px) {
    padding: var(--space-5u) var(--space-6u);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: var(--space-8u);
  margin-right: auto;

  @media(max-width: 400px) {
    gap: var(--space-6u);
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: ${props => props.$active ? 'var(--color-foreground)' : 'var(--color-secondary-text)'};
  cursor: pointer;
  padding: 0 0 var(--space-2u) 0;
  border-bottom: var(--border-width-regular) solid ${props => props.$active ? 'var(--color-primary)' : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-foreground);
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-secondary-text);
  cursor: pointer;
  padding: var(--space-3u);
  border-radius: var(--radius-2xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground);
  }

  &:focus {
    outline: none;
    background: var(--color-background-hover);
  }
`;

const SettingsMenu = styled.div`
  position: absolute;
  top: calc(var(--size-20u) + var(--space-2u) + var(--border-width-thin));
  right: var(--space-6u);
  background: var(--color-background);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  width: calc(calc(var(--size-50u) * 2) + var(--size-10u));
  padding: var(--space-2u);
  z-index: 100000;
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button`
  background: transparent;
  border: none;
  text-align: left;
  padding: var(--space-4u) var(--space-6u);
  font-size: var(--font-size-md);
  color: var(--color-foreground);
  cursor: pointer;
  border-radius: var(--radius-2xs);
  display: flex;
  align-items: center;
  gap: var(--space-4u);
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-background-hover);
  }
  
  svg {
    width: var(--space-7u);
    height: var(--space-7u);
    color: var(--color-secondary-text);
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-4u);
  margin-left: var(--space-4u);
  padding: var(--space-2u) var(--space-4u);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-background-hover);
  }
`;

const ToggleSwitch = styled.div<{ $active: boolean }>`
  width: var(--space-14u);
  height: var(--size-8u);
  background: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: var(--space-5u);
  position: relative;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: var(--space-1u);
    left: ${props => props.$active ? 'var(--space-7u)' : 'var(--space-1u)'};
    width: var(--space-6u);
    height: var(--space-6u);
    background: var(--color-foreground-inverse);
    border-radius: 50%;
    transition: all 0.2s ease;
  }
`;

const ToggleLabel = styled.span`
  font-size: var(--font-size-sm);
  color: var(--color-secondary-text);
  font-weight: 500;
  user-select: none;

  @media(max-width: 480px) {
    display: none;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--color-background);

  &::-webkit-scrollbar {
    width: var(--space-3u);
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: calc(var(--radius-2xs) - var(--border-width-thin));
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--size-20u);
`;

const EmptyStateContainer = styled.div`
  padding: calc(var(--size-20u) + var(--space-10u)) var(--space-10u);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: var(--size-24u);
  height: var(--size-24u);
  border-radius: 50%;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-8u);
  color: var(--color-muted);
`;

const EmptyTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0 0 var(--space-2u) 0;
`;

const EmptyDescription = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-secondary-text);
  margin: 0;
  line-height: 1.4;
`;

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
            <PanelContainer
                ref={ref}
                $fullWidth={fullWidth}
                $maxHeight={maxHeight}
                className={className}
            >
                <Header>
                    <TabsContainer>
                        <TabButton $active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}>
                            Inbox
                        </TabButton>
                        <TabButton $active={activeTab === 'archive'} onClick={() => setActiveTab('archive')}>
                            Archive
                        </TabButton>
                        <TabButton $active={activeTab === 'starred'} onClick={() => setActiveTab('starred')}>
                            Starred
                        </TabButton>
                    </TabsContainer>

                    <ToggleContainer onClick={() => setUnreadOnly(!unreadOnly)}>
                        <ToggleSwitch $active={unreadOnly} />
                        <ToggleLabel>Unread Only</ToggleLabel>
                    </ToggleContainer>

                    <IconButton onClick={() => setShowMenu(!showMenu)} style={{ padding: 'var(--space-2u)' }}>
                        <MoreHorizontal size={16} />
                    </IconButton>

                    {showMenu && (
                        <SettingsMenu ref={menuRef} style={{ top: 'var(--size-18u)', right: 'var(--space-6u)' }}>
                            {activeTab === 'inbox' && (
                                <MenuItem onClick={handleMarkAllRead}>
                                    <CheckCheck /> Mark all as read
                                </MenuItem>
                            )}
                            <MenuItem onClick={handleArchiveAllRead}>
                                <Archive /> Archive all read
                            </MenuItem>
                        </SettingsMenu>
                    )}
                </Header>

                <Content>
                    {loading ? (
                        <LoadingContainer>
                            <Spinner />
                        </LoadingContainer>
                    ) : error ? (
                        <EmptyStateContainer>
                            <EmptyIcon>
                                <BellOff size={24} style={{ color: 'var(--color-error)' }} />
                            </EmptyIcon>
                            <EmptyTitle>Failed to load notifications</EmptyTitle>
                            <EmptyDescription>{error.message || "An unexpected error occurred."}</EmptyDescription>
                        </EmptyStateContainer>
                    ) : notifications.length === 0 ? (
                        <EmptyStateContainer>
                            <EmptyIcon>
                                <BellOff size={24} />
                            </EmptyIcon>
                            <EmptyTitle>No notifications</EmptyTitle>
                            <EmptyDescription>You're all caught up!</EmptyDescription>
                        </EmptyStateContainer>
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
                                <div style={{ padding: 'var(--space-6u)', display: 'flex', justifyContent: 'center' }}>
                                    <TabButton $active={false} onClick={loadMore} style={{ fontSize: 'var(--font-size-sm)' }}>
                                        Load more
                                    </TabButton>
                                </div>
                            )}
                        </>
                    )}
                </Content>
            </PanelContainer>
        );
    }
);
