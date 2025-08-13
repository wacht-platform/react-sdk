import React from "react";
import styled from "styled-components";
import { UserButton } from "./user-button";
import { NotificationBell } from "../notifications/notification-bell";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface UserControlsProps {
  showName?: boolean;
  showNotifications?: boolean;
}

export const UserControls: React.FC<UserControlsProps> = ({ 
  showName = true, 
  showNotifications = true 
}) => {
  return (
    <Container>
      {showNotifications && <NotificationBell />}
      <UserButton showName={showName} />
    </Container>
  );
};