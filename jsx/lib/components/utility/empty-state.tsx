import React from "react";
import styled from "styled-components";

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16u) var(--space-8u);
  text-align: center;
  background-color: transparent;
  border-radius: var(--radius-lg);
  border: var(--border-width-thin) dashed var(--color-border);
  width: 100%;
`;

const Title = styled.h3`
  font-size: calc(var(--font-size-lg) + var(--border-width-thin));
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0 0 var(--space-3u) 0;
`;

const Description = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-muted);
  margin: 0;
  max-width: calc(calc(var(--size-50u) * 3) + var(--space-10u));
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
      {action && <div style={{ marginTop: "var(--space-12u)" }}>{action}</div>}
    </EmptyStateContainer>
  );
};
