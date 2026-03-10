import { css } from "styled-components";

export const standaloneAuthShell = css`
  max-width: calc(calc(var(--size-50u) * 4) - var(--size-10u));
  width: calc(calc(var(--size-50u) * 4) - var(--size-10u));
  padding: var(--space-12u);
  background: var(--color-card);
  color: var(--color-card-foreground);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
`;
