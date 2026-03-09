import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-6u);
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2u);
`;

export const Label = styled.label`
  font-size: var(--font-size-md);
  text-align: left;
  font-weight: 400;
  color: var(--color-foreground);
`;
