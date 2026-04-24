import styled, { css } from "styled-components";

interface ButtonProps {
    $primary?: boolean;
    $outline?: boolean;
    $destructive?: boolean;
    $fullWidth?: boolean;
    $size?: "sm" | "md" | "lg";
}

export const Button = styled.button<ButtonProps>`
    width: ${(props) => (props.$fullWidth ? "100%" : "auto")};
    padding: ${(props) => {
        if (props.$size === "sm") return "var(--space-2u) var(--space-6u)";
        if (props.$size === "lg") return "var(--space-6u) var(--space-12u)";
        return "var(--space-4u) var(--space-6u)";
    }};
    border: var(--border-width-thin) solid transparent;
    border-radius: var(--radius-md);
    font-weight: 500;
    font-size: var(--font-size-md);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-2u);
    min-height: ${(props) =>
        props.$size === "sm" ? "calc(var(--size-8u) * 2)" : "var(--size-18u)"};
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-primary-foreground);

    &:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    ${(props) =>
        props.$outline &&
        css`
            background-color: transparent;
            color: var(--color-foreground);
            border: var(--border-width-thin) solid var(--color-border);

            &:hover:not(:disabled) {
                background-color: var(--color-background-subtle);
                border-color: var(--color-border-hover);
            }
        `}

    ${(props) =>
        props.$destructive &&
        css`
            background-color: var(--color-error-background);
            color: var(--color-error);
            border-color: var(--color-error-border);

            &:hover:not(:disabled) {
                background-color: var(--color-error);
                color: var(--color-foreground-inverse);
            }
        `}
`;
