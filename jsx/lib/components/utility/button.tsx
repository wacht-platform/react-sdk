import styled, { css } from "styled-components";

interface ButtonProps {
  $primary?: boolean;
  $outline?: boolean;
  $destructive?: boolean;
}

export const Button = styled.button<ButtonProps>`
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-xs);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-xs);
  height: 36px;
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  ${(props) =>
    props.$outline &&
    css`
      background-color: var(--color-input-background);
      color: var(--color-foreground);
      border: 1px solid var(--color-border);

      &:hover:not(:disabled) {
        background-color: var(--color-border);
      }
    `}

  ${(props) =>
    props.$destructive &&
    css`
      background-color: var(--color-error-background);
      color: var(--color-error);
      border-color: var(--color-error-border);

      &:hover:not(:disabled) {
        background-color: var(--color-error);
        color: var(--color-background);
      }
    `}
`;
