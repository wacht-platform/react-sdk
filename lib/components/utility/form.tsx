import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
`;

export const Label = styled.label`
  font-size: var(--font-xs);
  text-align: left;
  font-weight: 400;
  color: var(--color-foreground);
`;
