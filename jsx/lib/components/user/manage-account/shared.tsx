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
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 1000px;
      transform: translateY(0);
    }
  }
`;

export const Container = styled.div`
  width: 100%;
  height: 600px;
  background: var(--color-background);
  border-radius: 20px;
  box-shadow: 0 8px 30px var(--color-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
  position: relative;

  @media (max-width: 768px) {
    border-radius: 16px;
    padding-bottom: 20px;
  }

  /* Blur effect at the bottom */
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--color-background) 70%
    );
    pointer-events: none;
    z-index: 1;
  }
`;

export const TabsContainer = styled.div`
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

export const TabsList = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Tab = styled.button<{ $isActive: boolean }>`
  padding: 12px 12px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 400;
  color: ${(props) =>
    props.$isActive ? "var(--color-foreground)" : "var(--color-muted)"};
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
  white-space: nowrap;
  min-width: fit-content;

  &:hover {
    color: var(--color-foreground);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
    opacity: ${(props) => (props.$isActive ? 1 : 0)};
    transition: opacity 0.15s ease;
  }
`;

export const TabIcon = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const TabContent = styled.div`
  flex: 1;
  padding: 24px 24px 0 24px;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px 20px 0 20px;
  }
`;

export const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-secondary-text);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-input-background);
    color: var(--color-foreground);
  }
`;

export const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 0;
`;

export const ProfileSectionLayout = styled.div`
  display: flex;
  gap: var(--space-2xl);
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    text-align: center;
  }
`;

export const ProfileImageContainer = styled.div`
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    margin-bottom: var(--space-md);
  }
`;

export const SecurityItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  gap: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const SecurityItemContent = styled.div`
  flex: 1;
  min-width: 0; /* Allow text truncate */
  
  @media (max-width: 600px) {
    width: 100%;
  }
`;

export const SecurityItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

export const ResponsiveHeaderContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

export const DesktopTableContainer = styled.div`
  display: block;
  @media (max-width: 600px) {
    display: none;
  }
`;

export const MobileListContainer = styled.div`
  display: none;
  @media (max-width: 600px) {
    display: flex;
    flex-direction: column;
  }
`;

export const FormRow = styled.div`
  display: flex;
  gap: var(--space-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-lg);
  }
`;

export const ConnectionItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  min-height: 58px;
  gap: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px; /* Reduced gap */
    min-height: auto; /* Allow shrinking */
  }
`;

export const ConnectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-foreground);
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

export const ConnectionRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  
  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-between; /* Spread Status and Menu */
  }
`;

export const IconWrapper = styled.div`
  width: 20px;
  height: 20px;
  min-width: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: block;
  }
`;

export const ButtonActions = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: center;
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
