import { forwardRef, useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { BellOff, CheckCheck, MoreHorizontal, Archive } from "lucide-react";
import { NotificationItem, type NotificationAction } from "./notification-item";
import { Spinner } from "../utility/spinner";
import type { Notification } from "@/types";

const Popover = styled.div<{
  $position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
  $hasNotifications: boolean;
}>`
  position: fixed;
  ${(props) =>
    props.$position?.top !== undefined ? `top: ${props.$position.top}px;` : ""}
  ${(props) =>
    props.$position?.bottom !== undefined
      ? `bottom: ${props.$position.bottom}px;`
      : ""}
  ${(props) =>
    props.$position?.left !== undefined
      ? `left: ${props.$position.left}px;`
      : ""}
  ${(props) =>
    props.$position?.right !== undefined
      ? `right: ${props.$position.right}px;`
      : ""}
  width: 500px;
  max-width: 100vw;
  max-height: ${(props) => props.$position?.maxHeight ? `${props.$position.maxHeight}px` : '700px'};
  ${(props) => !props.$hasNotifications ? 'min-height: 200px;' : ''}
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.15s ease-out;
  max-height: 90vh;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media(max-width: 480px) {
    width: 320px;
    max-height: 500px;
  }
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background);
  flex-shrink: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-right: auto;
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
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--color-background);

  /* Scrollbar styling */
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

interface NotificationPopoverProps {
  position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
  notifications: Notification[];
  loading: boolean;
  activeTab: "inbox" | "archive" | "starred";
  onTabChange: (tab: "inbox" | "archive" | "starred") => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (active: boolean) => void;
  onAction: (action: NotificationAction) => void;
  onMarkAllAsRead: () => void;
  onArchiveAllRead: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  error?: Error | null;
  onClose?: () => void;
}

export const NotificationPopover = forwardRef<
  HTMLDivElement,
  NotificationPopoverProps
>(
  (
    {
      position,
      activeTab,
      onTabChange,
      unreadOnly,
      onUnreadOnlyChange,
      notifications,
      loading,
      onAction,
      onMarkAllAsRead,
      onArchiveAllRead,
      hasMore,
      onLoadMore,
      error,
      // onClose is unused in the new design
    },
    ref,
  ) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleMarkAllRead = () => {
      onMarkAllAsRead();
      setShowMenu(false);
    };

    return (
      <Popover ref={ref} $position={position} $hasNotifications={(notifications?.length ?? 0) > 0}>
        <Header>
          <TabsContainer>
            <TabButton
              $active={activeTab === 'inbox'}
              onClick={() => onTabChange('inbox')}
            >
              Inbox
            </TabButton>
            <TabButton
              $active={activeTab === 'archive'}
              onClick={() => onTabChange('archive')}
            >
              Archive
            </TabButton>
            <TabButton
              $active={activeTab === 'starred'}
              onClick={() => onTabChange('starred')}
            >
              Starred
            </TabButton>
          </TabsContainer>

          <ToggleContainer onClick={() => onUnreadOnlyChange(!unreadOnly)}>
            <ToggleSwitch $active={unreadOnly} />
            <ToggleLabel>Unread Only</ToggleLabel>
          </ToggleContainer>

          <IconButton onClick={() => setShowMenu(!showMenu)} style={{ padding: '4px' }}>
            <MoreHorizontal size={16} />
          </IconButton>


          {showMenu && (
            <SettingsMenu ref={menuRef} style={{ top: '36px', right: '12px', left: 'auto' }}>
              {activeTab === 'inbox' && (
                <MenuItem onClick={handleMarkAllRead}>
                  <CheckCheck /> Mark all as read
                </MenuItem>
              )}
              <MenuItem onClick={() => { onArchiveAllRead(); setShowMenu(false); }}>
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
                  onAction={onAction}
                />
              ))}
              {hasMore && (
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
                  <TabButton $active={false} onClick={onLoadMore} style={{ fontSize: '12px' }}>
                    Load more
                  </TabButton>
                </div>
              )}
            </>
          )}
        </Content>
      </Popover>
    );
  },
);
