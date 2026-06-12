import React from "react";
import { UserButton } from "./user-button";
import { NotificationBell } from "../notifications/notification-bell";

interface UserControlsProps {
  showName?: boolean;
  showNotifications?: boolean;
}

export const UserControls: React.FC<UserControlsProps> = ({
  showName = true,
  showNotifications = true,
}) => {
  return (
    <div className="w-flex w-items-center w-gap-2">
      {showNotifications && <NotificationBell />}
      <UserButton showName={showName} />
    </div>
  );
};
