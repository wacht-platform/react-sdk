import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import styled, { keyframes, css } from "styled-components";
import { Bell } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useScopeUnread } from "@/hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const Container = styled.div`
  position: relative;
  display: inline-flex;
`;

const ringAnimation = keyframes`
  0% { transform: rotate(0); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-10deg); }
  50% { transform: rotate(5deg); }
  60% { transform: rotate(-5deg); }
  100% { transform: rotate(0); }
`;

const NotificationButton = styled.button<{ $hasUnread: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: var(--color-foreground);

  &:hover {
    background: var(--color-background-hover);
    color: var(--color-primary);
  }

  &:hover svg {
    animation: ${props => props.$hasUnread ? css`${ringAnimation} 2s ease` : 'none'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Badge = styled.span<{ $dotOnly?: boolean }>`
  position: absolute;
  top: ${props => props.$dotOnly ? '6px' : '4px'};
  right: ${props => props.$dotOnly ? '6px' : '4px'};
  background: var(--color-error);
  color: white;
  border-radius: 10px;
  min-width: ${props => props.$dotOnly ? '8px' : '16px'};
  height: ${props => props.$dotOnly ? '8px' : '16px'};
  padding: ${props => props.$dotOnly ? '0' : '0 4px'};
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--color-background);
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
  line-height: 1;
  transition: all 0.2s ease;
`;

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  scope?: "all" | "current" | "user";
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

  const { count: unreadCount, refetch: refetchUnread } = useScopeUnread({ scope });

  const handleAction = async (action: any) => {
    // Only handle unread count refetching, actual actions are now in NotificationPanel
    await refetchUnread();
    onAction?.(action.payload);
  };

  const popoverPosition = usePopoverPosition({
    triggerRef: buttonRef,
    isOpen,
    minWidth: Math.min(450, typeof window !== 'undefined' ? window.innerWidth - 32 : 300),
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
      <Container ref={containerRef} className={className}>
        <NotificationButton
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          $hasUnread={unreadCount > 0}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <Bell />
          {showBadge && unreadCount > 0 && (
            <Badge $dotOnly={unreadCount <= 9}>
              {unreadCount > 9 ? "9+" : ""}
            </Badge>
          )}
        </NotificationButton>

        {typeof window !== "undefined" &&
          isOpen &&
          ReactDOM.createPortal(
            <DefaultStylesProvider>
              <NotificationPopover
                ref={popoverRef}
                position={popoverPosition}
                scope={scope}
                onAction={handleAction}
                onClose={() => setIsOpen(false)}
              />
            </DefaultStylesProvider>,
            document.body,
          )}
      </Container>
    </DefaultStylesProvider>
  );
}
