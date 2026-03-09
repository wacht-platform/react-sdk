import { forwardRef } from "react";
import styled from "styled-components";
import { NotificationPanel, type NotificationPanelProps } from "./notification-panel";

const Popover = styled.div<{
  $position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
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
  width: calc(var(--space-10u) * 22.5);
  max-width: calc(100vw - var(--space-12u));
  max-height: ${(props) => props.$position?.maxHeight ? `${props.$position.maxHeight}px` : 'calc(var(--size-50u) * 7)'};
  background: var(--color-background);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.15s ease-out;
  max-height: 90vh;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(var(--space-1u)); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media(max-width: 480px) {
    border-radius: var(--radius-md);
  }
`;

export interface NotificationPopoverProps extends Omit<NotificationPanelProps, 'fullWidth' | 'maxHeight'> {
  position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
  onClose?: () => void;
}

export const NotificationPopover = forwardRef<
  HTMLDivElement,
  NotificationPopoverProps
>(
  (
    {
      position,
      scope,
      onAction,
      className,
      // onClose is kept for backward compatibility if needed, though unused in the internal trigger
    },
    ref,
  ) => {
    return (
      <Popover ref={ref} $position={position} className={className}>
        <NotificationPanel
          scope={scope}
          onAction={onAction}
          fullWidth
          maxHeight={position?.maxHeight ? `${position.maxHeight}px` : '100%'}
        />
      </Popover>
    );
  },
);
