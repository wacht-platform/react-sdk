import styled from "styled-components";

const breakpoints = {
	sm: "36rem",
	md: "48rem",
	lg: "62rem",
	xl: "75rem",
};

export const Input = styled.input`
  padding: 0.5rem 0.75rem;
  width: 100%;
  height: 2.5rem;
  border: 0.0625rem solid var(--color-border);
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
    border-color: #22c55e;
    box-shadow: 0 0 0 0.1875rem rgba(34, 197, 94, 0.1);
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
    height: 2.25rem;
    font-size: 0.8125rem;
    padding: 0.375rem 0.625rem;
  }
`;
