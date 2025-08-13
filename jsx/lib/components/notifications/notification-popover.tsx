import styled from "styled-components";
import { BellOff } from "lucide-react";
import { NotificationItem } from "./notification-item";
import { Spinner } from "../utility/spinner";
import type { Notification } from "@/types/notification";

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 400px;
  max-height: 600px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 4px 12px var(--color-shadow);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    width: 320px;
    max-height: 500px;
  }
`;

const Header = styled.div`
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-background);
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
  margin: 0;
`;

const MarkAllButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-input-background);
    color: var(--color-primary-hover);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 450px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
`;

const EmptyStateContainer = styled.div`
  padding: 40px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-background-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  svg {
    width: 18px;
    height: 18px;
    color: var(--color-secondary-text);
    opacity: 0.6;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
  margin: 0 0 4px 0;
`;

const EmptyDescription = styled.p`
  font-size: var(--font-xs);
  color: var(--color-secondary-text);
  margin: 0;
  line-height: 1.4;
`;

const Footer = styled.div`
  padding: 8px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  text-align: center;
`;

const ViewAllLink = styled.a`
  color: var(--color-primary);
  font-size: var(--font-xs);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }
`;

interface NotificationPopoverProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export function NotificationPopover({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationPopoverProps) {
  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <Popover>
      <Header>
        <Title>Notifications</Title>
        {hasUnread && (
          <MarkAllButton onClick={onMarkAllAsRead}>
            Mark all as read
          </MarkAllButton>
        )}
      </Header>

      <Content>
        {loading ? (
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : notifications.length === 0 ? (
          <EmptyStateContainer>
            <EmptyIcon>
              <BellOff />
            </EmptyIcon>
            <EmptyTitle>No notifications</EmptyTitle>
            <EmptyDescription>You're all caught up!</EmptyDescription>
          </EmptyStateContainer>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </Content>

      {notifications.length > 0 && (
        <Footer>
          <ViewAllLink href="/notifications">
            View all notifications
          </ViewAllLink>
        </Footer>
      )}
    </Popover>
  );
}