import { useState, useRef, useEffect, forwardRef } from "react";
import styled from "styled-components";
import { BellOff, CheckCheck, MoreHorizontal, Archive } from "lucide-react";
import { NotificationItem, type NotificationAction } from "./notification-item";
import { Spinner } from "../utility/spinner";
import { useNotifications } from "@/hooks/use-notifications";

const PanelContainer = styled.div<{ $fullWidth?: boolean; $maxHeight?: string }>`
  width: ${props => props.$fullWidth ? '100%' : '450px'};
  max-width: 100%;
  height: 100%;
  max-height: ${props => props.$maxHeight || '700px'};
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background);
  flex-shrink: 0;

  @media(max-width: 400px) {
    padding: 10px 12px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-right: auto;

  @media(max-width: 400px) {
    gap: 12px;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$active ? 'var(--color-foreground)' : 'var(--color-secondary-text)'};
  cursor: pointer;
  padding: 0 0 4px 0;
  border-bottom: 2px solid ${props => props.$active ? 'var(--color-primary)' : 'transparent'};
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
  padding: 6px;
  border-radius: 4px;
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
  top: 45px;
  right: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 220px;
  padding: 4px;
  z-index: 100000;
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button`
  background: transparent;
  border: none;
  text-align: left;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-foreground);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-background-hover);
  }
  
  svg {
    width: 14px;
    height: 14px;
    color: var(--color-secondary-text);
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-background-hover);
  }
`;

const ToggleSwitch = styled.div<{ $active: boolean }>`
  width: 28px;
  height: 16px;
  background: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: 10px;
  position: relative;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$active ? '14px' : '2px'};
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
`;

const ToggleLabel = styled.span`
  font-size: 12px;
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
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

const EmptyStateContainer = styled.div`
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--color-muted);
`;

const EmptyTitle = styled.h3`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0 0 4px 0;
`;

const EmptyDescription = styled.p`
  font-size: 13px;
  color: var(--color-secondary-text);
  margin: 0;
  line-height: 1.4;
`;

export interface NotificationPanelProps {
    scope?: "all" | "current" | "user";
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

                    <IconButton onClick={() => setShowMenu(!showMenu)} style={{ padding: '4px' }}>
                        <MoreHorizontal size={16} />
                    </IconButton>

                    {showMenu && (
                        <SettingsMenu ref={menuRef} style={{ top: '36px', right: '12px' }}>
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
                                <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
                                    <TabButton $active={false} onClick={loadMore} style={{ fontSize: '12px' }}>
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
