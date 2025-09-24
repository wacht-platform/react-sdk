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
  width: 40px;
  height: 24px;
  border-radius: 12px;
  background-color: ${(props) =>
    props.checked ? "var(--color-primary)" : "var(--color-border)"};
  transition: background-color 0.2s ease;
  border: 1px solid
    ${(props) =>
      props.checked ? "var(--color-primary)" : "var(--color-border)"};

  &::before {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: ${(props) =>
      props.checked ? "white" : "var(--color-muted)"};
    top: 2px;
    left: ${(props) => (props.checked ? "20px" : "2px")};
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
