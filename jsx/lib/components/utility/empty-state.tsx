import React from "react";
import { Tray } from "@phosphor-icons/react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) => {
  return (
    <div className="w-empty">
      <div className="w-empty-ic">{icon ?? <Tray size={20} />}</div>
      <div className="w-empty-text">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {action && <div className="w-empty-action">{action}</div>}
    </div>
  );
};
