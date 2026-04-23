import React from "react";
import styled from "styled-components";
import { CaretRight } from "@phosphor-icons/react";

const StyledButton = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    width: 100%;
    min-height: var(--size-18u);
    padding: var(--space-4u) var(--space-5u);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover:not(:disabled) {
        background: var(--color-accent);
        border-color: var(--color-border-hover);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) .method-arrow {
        opacity: 1;
        transform: translateX(0);
    }

    svg:not(.method-arrow) {
        width: var(--size-8u);
        height: var(--size-8u);
        color: var(--color-secondary-text);
        flex-shrink: 0;
    }
`;

const Content = styled.span`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1u);
`;

const MethodLabel = styled.span`
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-card-foreground);
    line-height: 1.3;
`;

const MethodDescription = styled.span`
    font-size: var(--font-size-sm);
    color: var(--color-secondary-text);
    line-height: 1.3;
`;

const Arrow = styled(CaretRight)`
    width: var(--space-6u);
    height: var(--space-6u);
    color: var(--color-secondary-text);
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
`;

interface MethodButtonProps {
    icon: React.ReactNode;
    label: string;
    description?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
}

export function MethodButton({ icon, label, description, onClick, disabled, type = "button" }: MethodButtonProps) {
    return (
        <StyledButton type={type} onClick={onClick} disabled={disabled}>
            {icon}
            <Content>
                <MethodLabel>{label}</MethodLabel>
                {description && <MethodDescription>{description}</MethodDescription>}
            </Content>
            <Arrow className="method-arrow" />
        </StyledButton>
    );
}
