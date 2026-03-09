import styled from "styled-components";

const breakpoints = {
	sm: "36rem",
	md: "48rem",
	lg: "62rem",
	xl: "75rem",
};

export const Input = styled.input`
  padding: var(--space-4u) var(--space-6u);
  width: 100%;
  height: var(--size-18u);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  color: var(--color-foreground);
  background: transparent;
  transition: all 0.2s;

  &:not(:placeholder-shown):invalid {
    outline: none;
    border: 0.0625rem solid var(--color-error);
    background: transparent;
  }

  &:not(:placeholder-shown):valid {
    outline: none;
    background: transparent;
  }

  &:focus:valid {
    outline: none;
    border-color: var(--color-success);
    box-shadow: 0 0 0 0.1875rem var(--color-success-background);
    background: transparent;
  }

  &:focus:invalid {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.1875rem var(--color-input-focus-border);
    background: transparent;
  }

  &::placeholder {
    color: var(--color-secondary-text);
  }

  @media (max-width: ${breakpoints.sm}) {
    height: var(--size-16u);
    font-size: var(--font-size-xs);
    padding: var(--space-2u) var(--space-4u);
  }
`;
