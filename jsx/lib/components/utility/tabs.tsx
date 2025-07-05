"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  KeyboardEvent,
} from "react";
import styled from "styled-components";

// Context for Tab state management
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  orientation?: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tab components must be used within a Tabs component");
  }
  return context;
};

// Styled components
const TabsContainer = styled.div<{ $orientation?: "horizontal" | "vertical" }>`
  display: flex;
  flex-direction: ${(props) =>
    props.$orientation === "vertical" ? "row" : "column"};
  width: 100%;
`;

const StyledTabList = styled.div<{ $orientation?: "horizontal" | "vertical" }>`
  display: flex;
  flex-direction: ${(props) =>
    props.$orientation === "vertical" ? "column" : "row"};
  border-bottom: ${(props) =>
    props.$orientation === "vertical" ? "none" : "2px solid var(--color-border)"};
  border-right: ${(props) =>
    props.$orientation === "vertical" ? "2px solid var(--color-border)" : "none"};
  background: ${(props) =>
    props.$orientation === "vertical"
      ? "var(--color-background)"
      : "linear-gradient(to bottom, var(--color-background), rgba(var(--color-border-rgb), 0.1))"};
  gap: ${(props) => (props.$orientation === "vertical" ? "6px" : "0")};
  padding: ${(props) => (props.$orientation === "vertical" ? "12px" : "0 8px")};
  min-width: ${(props) => (props.$orientation === "vertical" ? "220px" : "auto")};
  border-radius: ${(props) =>
    props.$orientation === "vertical" ? "12px 0 0 12px" : "0"};
  box-shadow: ${(props) =>
    props.$orientation === "vertical"
      ? "inset -1px 0 0 var(--color-border)"
      : "inset 0 -1px 0 var(--color-border)"};
`;

const StyledTab = styled.button<{
  $active: boolean;
  $orientation?: "horizontal" | "vertical";
}>`
  padding: ${(props) =>
    props.$orientation === "vertical" ? "14px 18px" : "14px 24px"};
  border: none;
  background: ${(props) =>
    props.$active
      ? props.$orientation === "vertical"
        ? "var(--color-primary-background)"
        : "var(--color-background)"
      : "transparent"};
  color: ${(props) =>
    props.$active ? "var(--color-primary)" : "var(--color-muted)"};
  font-size: 15px;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: ${(props) =>
    props.$orientation === "vertical" ? "10px" : "0"};
  border-bottom: ${(props) =>
    props.$orientation === "vertical"
      ? "none"
      : props.$active
      ? "3px solid var(--color-primary)"
      : "3px solid transparent"};
  white-space: nowrap;
  text-align: left;
  width: ${(props) => (props.$orientation === "vertical" ? "100%" : "auto")};
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.$orientation === "vertical" ? "flex-start" : "center"};
  position: relative;

  &:hover:not(:disabled) {
    color: ${(props) =>
      props.$active ? "var(--color-primary)" : "var(--color-foreground)"};
    background: ${(props) =>
      props.$orientation === "vertical"
        ? props.$active
          ? "var(--color-primary-background)"
          : "var(--color-background-hover)"
        : props.$active
        ? "var(--color-background)"
        : "rgba(var(--color-primary-rgb), 0.05)"};
    transform: ${(props) =>
      props.$orientation === "vertical" ? "none" : "translateY(-1px)"};
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
    border-radius: 8px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active {
    transform: ${(props) =>
      props.$orientation === "vertical" ? "none" : "translateY(0)"};
  }
`;

const StyledTabPanels = styled.div<{ $orientation?: "horizontal" | "vertical" }>`
  flex: 1;
  padding: ${(props) => (props.$orientation === "vertical" ? "0 0 0 32px" : "32px 0 0 0")};
  min-height: 400px;
`;

const StyledTabPanel = styled.div<{ $active: boolean }>`
  display: ${(props) => (props.$active ? "block" : "none")};
  animation: ${(props) => (props.$active ? "fadeInUp 0.3s ease-out" : "none")};

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Component interfaces
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  children: ReactNode;
  className?: string;
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

// Main Tabs component
export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  children,
  className,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultValue || ""
  );

  const activeTab = value !== undefined ? value : internalActiveTab;

  const setActiveTab = useCallback(
    (tabId: string) => {
      if (value === undefined) {
        setInternalActiveTab(tabId);
      }
      onValueChange?.(tabId);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, orientation }}>
      <TabsContainer $orientation={orientation} className={className}>
        {children}
      </TabsContainer>
    </TabsContext.Provider>
  );
};

// TabList component
export const TabList: React.FC<TabListProps> = ({ children, className }) => {
  const { orientation } = useTabsContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll('[role="tab"]:not([disabled])')
    ) as HTMLElement[];
    const currentIndex = tabs.findIndex((tab) => tab === event.target);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
        if (orientation === "horizontal") {
          event.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal") {
          event.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }
        break;
      case "ArrowDown":
        if (orientation === "vertical") {
          event.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical") {
          event.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  };

  return (
    <StyledTabList
      $orientation={orientation}
      className={className}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
    >
      {children}
    </StyledTabList>
  );
};

// Tab component
export const Tab: React.FC<TabProps> = ({
  value,
  children,
  disabled = false,
  className,
}) => {
  const { activeTab, setActiveTab, orientation } = useTabsContext();
  const isActive = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  return (
    <StyledTab
      $active={isActive}
      $orientation={orientation}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </StyledTab>
  );
};

// TabPanels component
export const TabPanels: React.FC<TabPanelsProps> = ({
  children,
  className,
}) => {
  const { orientation } = useTabsContext();

  return (
    <StyledTabPanels $orientation={orientation} className={className}>
      {children}
    </StyledTabPanels>
  );
};

// TabPanel component
export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <StyledTabPanel
      $active={isActive}
      className={className}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      id={`tabpanel-${value}`}
      tabIndex={0}
    >
      {children}
    </StyledTabPanel>
  );
};
