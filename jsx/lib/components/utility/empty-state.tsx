import React from "react";
import styled from "styled-components";

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  background-color: var(--color-background);
  border-radius: 12px;
  border: 1px dashed var(--color-border);
  width: 100%;
`;

const Title = styled.h3`
  font-size: 15px;
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0 0 6px 0;
`;

const Description = styled.p`
  font-size: 13px;
  color: var(--color-muted);
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
`;

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <EmptyStateContainer>
      <Title>{title}</Title>
      <Description>{description}</Description>
      {action && <div style={{ marginTop: "24px" }}>{action}</div>}
    </EmptyStateContainer>
  );
};
