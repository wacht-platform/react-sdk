"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  KeyboardEvent,
} from "react";

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
      <div
        className={className}
        style={{
          display: "flex",
          flexDirection: orientation === "vertical" ? "row" : "column",
          width: "100%",
        }}
      >
        {children}
      </div>
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

  const isVertical = orientation === "vertical";

  return (
    <div
      className={`${isVertical ? "w-vtabs" : "w-tabs"}${className ? ` ${className}` : ""}`}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      style={
        isVertical
          ? { minWidth: 200, paddingRight: 16 }
          : {
              borderBottom: "0.5px solid var(--wa-border)",
              marginBottom: 0,
            }
      }
    >
      {children}
    </div>
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
  const isVertical = orientation === "vertical";

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const base = isVertical ? "w-vtab" : "w-tab";
  const activeCls = isActive && !isVertical ? " w-tab--active" : "";

  return (
    <button
      className={`${base}${activeCls}${className ? ` ${className}` : ""}`}
      onClick={handleClick}
      disabled={disabled}
      data-on={isVertical && isActive ? "" : undefined}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </button>
  );
};

// TabPanels component
export const TabPanels: React.FC<TabPanelsProps> = ({
  children,
  className,
}) => {
  const { orientation } = useTabsContext();

  return (
    <div
      className={className}
      style={{
        flex: 1,
        padding: orientation === "vertical" ? "0 0 0 24px" : "24px 0 0 0",
        minHeight: 200,
      }}
    >
      {children}
    </div>
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

  if (!isActive) return null;

  return (
    <div
      className={className}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      id={`tabpanel-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
};
