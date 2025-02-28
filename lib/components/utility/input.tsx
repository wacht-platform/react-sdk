import styled from "styled-components";

const breakpoints = {
    sm: '36rem',
    md: '48rem',
    lg: '62rem',
    xl: '75rem'
};

export const Input = styled.input`
  padding: 0.5rem 0.75rem;
  width: 100%;
  height: 2.5rem;
  border: 0.0625rem solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  background: #f9fafb;
  transition: all 0.2s;

  &:not(:placeholder-shown):invalid {
    outline: none;
    border: 0.0625rem solid #ef4444;
    background: white;
  }

  &:not(:placeholder-shown):valid {
    outline: none;
    background: white;
  }

  &:focus:valid {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 0.1875rem rgba(34, 197, 94, 0.1);
    background: white;
  }

  &:focus:invalid {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 0.1875rem rgba(99, 102, 241, 0.1);
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (max-width: ${breakpoints.sm}) {
    height: 2.25rem;
    font-size: 0.8125rem;
    padding: 0.375rem 0.625rem;
  }
`;

