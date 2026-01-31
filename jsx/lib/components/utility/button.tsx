import styled, { css } from "styled-components";

interface ButtonProps {
  $primary?: boolean;
  $outline?: boolean;
  $destructive?: boolean;
}

export const Button = styled.button<ButtonProps & { $fullWidth?: boolean; $size?: "sm" | "md" | "lg" }>`
  width: ${(props) => (props.$fullWidth ? "100%" : "auto")};
  padding: ${(props) => {
    if (props.$size === "sm") return "4px 12px";
    if (props.$size === "lg") return "12px 24px";
    return "var(--space-sm) var(--space-md)";
  }};
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: ${(props) => (props.$size === "sm" ? "12px" : "var(--font-xs)")};
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-xs);
  min-height: ${(props) => (props.$size === "sm" ? "32px" : "36px")};
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${(props) =>
    props.$outline &&
    css`
      background-color: transparent;
      color: var(--color-foreground);
      border: 1px solid var(--color-border);

      &:hover:not(:disabled) {
        background-color: var(--color-background-alt);
        border-color: var(--color-border-hover);
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
        color: white;
      }
    `}
`;
