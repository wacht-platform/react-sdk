import React from "react";
import styled from "styled-components";

const SwitchContainer = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  position: relative;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

const SwitchSlider = styled.span<{ checked: boolean }>`
  position: relative;
  width: var(--size-20u);
  height: var(--size-12u);
  border-radius: var(--radius-lg);
  background-color: ${(props) =>
    props.checked ? "var(--color-primary)" : "var(--color-border)"};
  transition: background-color 0.2s ease;
  border: var(--border-width-thin) solid
    ${(props) =>
      props.checked ? "var(--color-primary)" : "var(--color-border)"};

  &::before {
    content: "";
    position: absolute;
    width: calc(var(--space-1u) * 9);
    height: calc(var(--space-1u) * 9);
    border-radius: var(--radius-full);
    background-color: ${(props) =>
      props.checked
        ? "var(--color-foreground-inverse)"
        : "var(--color-muted)"};
    top: var(--space-1u);
    left: ${(props) =>
      props.checked ? "var(--space-10u)" : "var(--space-1u)"};
    transition: left 0.2s ease;
  }
`;

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <SwitchContainer>
      <SwitchInput type="checkbox" checked={checked} onChange={handleChange} />
      <SwitchSlider checked={checked} />
    </SwitchContainer>
  );
};
