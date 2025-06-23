import styled from "styled-components";

const breakpoints = {
	sm: "36rem",
	md: "48rem",
	lg: "62rem",
	xl: "75rem",
};

export const Input = styled.input`
  padding: var(--space-sm) var(--space-md);
  width: 100%;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-xs);
  color: var(--color-foreground);
  background: var(--color-input-background);
  transition: all 0.2s;

  &:not(:placeholder-shown):invalid {
    outline: none;
    border: 0.0625rem solid var(--color-error);
    background: var(--color-background);
  }

  &:not(:placeholder-shown):valid {
    outline: none;
    background: var(--color-background);
  }

  &:focus:valid {
    outline: none;
    border-color: var(--color-success);
    box-shadow: 0 0 0 0.1875rem var(--color-success-background);
    background: var(--color-background);
  }

  &:focus:invalid {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.1875rem var(--color-input-focus-border);
    background: var(--color-background);
  }

  &::placeholder {
    color: var(--color-secondary-text);
  }

  @media (max-width: ${breakpoints.sm}) {
    height: 32px;
    font-size: var(--font-2xs);
    padding: var(--space-xs) var(--space-sm);
  }
`;
