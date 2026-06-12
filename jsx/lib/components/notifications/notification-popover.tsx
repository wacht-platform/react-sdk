import { forwardRef } from "react";
import { NotificationPanel, type NotificationPanelProps } from "./notification-panel";

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
      <div
        ref={ref}
        className={`w-card w-flex-col w-notif-pop${className ? ` ${className}` : ""}`}
        style={{
          top: position?.top !== undefined ? position.top : undefined,
          bottom: position?.bottom !== undefined ? position.bottom : undefined,
          left: position?.left !== undefined ? position.left : undefined,
          right: position?.right !== undefined ? position.right : undefined,
          maxHeight: position?.maxHeight ? position.maxHeight : "90vh",
        }}
      >
        <NotificationPanel
          scope={scope}
          onAction={onAction}
          fullWidth
          maxHeight={position?.maxHeight ? `${position.maxHeight}px` : '100%'}
        />
      </div>
    );
  },
);
