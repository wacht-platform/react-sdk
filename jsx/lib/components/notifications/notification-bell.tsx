import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { BellRing } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";

const Container = styled.div`
  position: relative;
`;

const CircularContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
  }
`;

const NotificationButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 100%;
  height: 100%;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-secondary-text);
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: var(--color-primary);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--color-error);
  color: white;
  border-radius: 50%;
  padding: 0 4px;
  font-size: var(--font-2xs);
  font-weight: 500;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-background);
  box-shadow: 0 1px 3px var(--color-shadow);
`;

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  channels?: string[];
  organizationIds?: number[];
  workspaceIds?: number[];
}

export function NotificationBell({
  className,
  showBadge = true,
  channels = ["user"],
  organizationIds,
  workspaceIds,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<
    { top?: number; bottom?: number; left?: number; right?: number } | undefined
  >();
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const notificationParams = {
    channels,
    organization_ids: organizationIds,
    workspace_ids: workspaceIds,
    limit: 20,
  };

  const {
    unreadCount,
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(notificationParams);

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

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 400;
      const popoverHeight = 600;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const spaceRight = windowWidth - rect.left;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Determine horizontal position
      let left: number | undefined;
      let right: number | undefined;

      if (spaceRight >= popoverWidth) {
        left = rect.left;
      } else {
        right = windowWidth - rect.right;
      }

      let top: number | undefined;
      let bottom: number | undefined;

      if (spaceBelow >= popoverHeight + 8) {
        top = rect.bottom + 8;
      } else if (spaceAbove >= popoverHeight + 8) {
        bottom = windowHeight - rect.top + 8;
      } else {
        top = rect.bottom + 8;
      }

      setPopoverPosition({ top, bottom, left, right });
    } else {
      setPopoverPosition(undefined);
    }
  }, [isOpen]);

  return (
    <DefaultStylesProvider>
      <Container ref={containerRef} className={className}>
        <CircularContainer>
          <NotificationButton onClick={() => setIsOpen(!isOpen)}>
            <BellRing size={16} />
            {showBadge && unreadCount > 0 && (
              <Badge>{unreadCount > 9 ? "9+" : unreadCount}</Badge>
            )}
          </NotificationButton>
        </CircularContainer>

        {typeof window !== "undefined" &&
          isOpen &&
          ReactDOM.createPortal(
            <DefaultStylesProvider>
              <NotificationPopover
                ref={popoverRef}
                position={popoverPosition}
                notifications={notifications}
                loading={loading}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
              />
            </DefaultStylesProvider>,
            document.body,
          )}
      </Container>
    </DefaultStylesProvider>
  );
}
