import styled, { keyframes } from "styled-components";
import { useEffect, useState } from "react";

export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const TypographyProvider = styled.div`
    * {
        box-sizing: border-box;
        font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            max-height: 0;
            transform: translateY(calc(var(--space-5u) * -1));
        }
        to {
            opacity: 1;
            max-height: calc(var(--size-50u) * 5);
            transform: translateY(0);
        }
    }
`;

export const Container = styled.div`
    width: 100%;
    height: calc(calc(var(--size-50u) * 4) + calc(var(--size-50u) * 2));
    min-height: calc(calc(var(--size-50u) * 4) + calc(var(--size-50u) * 2));
    max-height: calc(calc(var(--size-50u) * 4) + calc(var(--size-50u) * 2));
    background: var(--color-card);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xl);
    transition: all 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-bottom: var(--space-12u);
    position: relative;

    @media (max-width: 768px) {
        border-radius: var(--radius-xl);
        padding-bottom: var(--space-10u);
    }

    /* Blur effect at the bottom */
    &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--size-20u);
        background: linear-gradient(
            to bottom,
            transparent 0%,
            var(--color-card) 70%
        );
        pointer-events: none;
        z-index: 1;
    }
`;

export const TabsContainer = styled.div`
    padding: 0 var(--space-12u);
    border-bottom: var(--border-width-thin) solid var(--color-border);

    @media (max-width: 768px) {
        padding: 0 var(--space-10u);
    }
`;

export const TabsList = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-10u);
    overflow-x: auto;
    overflow-y: hidden;

    &::-webkit-scrollbar {
        display: none;
    }
`;

export const Tab = styled.button<{ $isActive: boolean }>`
    padding: var(--space-6u) var(--space-6u);
    border: none;
    background: none;
    font-size: var(--font-size-lg);
    font-weight: 400;
    color: ${(props) =>
        props.$isActive ? "var(--color-card-foreground)" : "var(--color-muted)"};
    cursor: pointer;
    position: relative;
    transition: color 0.15s ease;
    white-space: nowrap;
    min-width: fit-content;

    &:hover {
        color: var(--color-card-foreground);
    }

    &::after {
        content: "";
        position: absolute;
        bottom: calc(var(--border-width-thin) * -1);
        left: 0;
        right: 0;
        height: var(--border-width-regular);
        background: var(--color-primary);
        opacity: ${(props) => (props.$isActive ? 1 : 0)};
        transition: opacity 0.15s ease;
    }
`;

export const TabIcon = styled.span`
    display: inline-flex;
    align-items: center;
    gap: var(--space-3u);
`;

export const TabContent = styled.div`
    flex: 1;
    padding: var(--space-12u) var(--space-12u) 0 var(--space-12u);
    overflow-y: auto;
    position: relative;

    @media (max-width: 768px) {
        padding: var(--space-10u) var(--space-10u) 0 var(--space-10u);
    }
`;

export const IconButton = styled.button`
    background: none;
    border: none;
    padding: var(--space-2u);
    cursor: pointer;
    color: var(--color-secondary-text);
    border-radius: var(--radius-2xs);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: var(--color-accent);
        color: var(--color-accent-foreground);
    }
`;

export const HeaderCTAContainer = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-6u);
    margin-bottom: var(--space-12u);
`;

export const SectionLayout = styled.div`
    display: flex;
    gap: var(--space-12u);
    align-items: flex-start;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        gap: var(--space-8u);
        text-align: center;
    }
`;

export const ImageContainer = styled.div`
    flex-shrink: 0;

    @media (max-width: 768px) {
        margin-bottom: var(--space-6u);
    }
`;

export const ItemRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-8u) 0;
    gap: var(--space-8u);

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-6u);
    }
`;

export const ItemContent = styled.div`
    flex: 1;
    min-width: 0;

    @media (max-width: 600px) {
        width: 100%;
    }
`;

export const ItemActions = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-6u);

    @media (max-width: 600px) {
        width: 100%;
        justify-content: flex-end;
    }
`;

export const ResponsiveHeaderContainer = styled.div`
    display: flex;
    gap: var(--space-6u);
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: var(--space-10u);

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-8u);
    }
`;

export const DesktopTableContainer = styled.div`
    display: block;
    @media (max-width: 768px) {
        display: none;
    }
`;

export const MobileListContainer = styled.div`
    display: none;
    @media (max-width: 768px) {
        display: flex;
        flex-direction: column;
        gap: var(--space-8u);
        padding-bottom: var(--space-12u);
    }
`;

export const FormRow = styled.div`
    display: flex;
    gap: var(--space-6u);

    @media (max-width: 768px) {
        flex-direction: column;
        gap: var(--space-8u);
    }
`;

export const ButtonActions = styled.div`
    display: flex;
    gap: var(--space-4u);
    flex-wrap: wrap;

    @media (max-width: 768px) {
        justify-content: center;
    }
`;

export const ConnectionItemRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-6u) 0;
    min-height: calc(var(--size-50u) + var(--space-4u));
    gap: var(--space-8u);

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4u);
        min-height: auto;
    }
`;

export const ConnectionLeft = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-6u);
    color: var(--color-card-foreground);
    flex-shrink: 0;
    flex-wrap: wrap;

    @media (max-width: 600px) {
        width: 100%;
    }
`;

export const IconWrapper = styled.div`
    width: var(--size-10u);
    height: var(--size-10u);
    min-width: var(--size-10u);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    svg {
        width: var(--size-10u);
        height: var(--size-10u);
        flex-shrink: 0;
        display: block;
    }
`;

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
};
