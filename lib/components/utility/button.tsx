import styled from "styled-components";

export const Button = styled.button`
  width: 100%;
  padding: var(--space-xs) var(--space-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-xs);
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
