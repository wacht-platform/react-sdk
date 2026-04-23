import { css } from "styled-components";

export const standaloneAuthShell = css`
  max-width: calc(var(--size-50u) * 4);
  width: calc(var(--size-50u) * 4);
  padding: calc(var(--space-unit, 2px) * 18) var(--space-12u) var(--space-12u);
  background: var(--color-card);
  color: var(--color-card-foreground);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
`;
