import {
  createContext,
  CSSProperties,
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface DropdownProps {
  children: ReactNode;
  open?: boolean;
  openChange?: (open: boolean) => void;
  style?: CSSProperties;
}

type DropdownContextProps = {
  open: boolean;
  openChange: (open: boolean) => void;
};

const DropdownContext = createContext<DropdownContextProps | undefined>(
  undefined
);

const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error(
      "useDropdownContext must be used within a DropdownProvider"
    );
  }
  return context;
};

export const Dropdown = ({
  children,
  open,
  openChange,
  style,
}: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [_open, _setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        _setOpen(false);
      }
    };

    if (_open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [_open, openChange]);

  useEffect(() => {
    openChange?.(_open);
  }, [_open]);

  useEffect(() => {
    _setOpen(!!open);
  }, [open]);

  return (
    <DropdownContext.Provider
      value={{
        open: _open,
        openChange: (v) => _setOpen(v),
      }}
    >
      <div style={{ width: "fit-content", ...style }} ref={dropdownRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownItems = ({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => {
  const { open } = useDropdownContext();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && containerRef.current) {
      setIsPositioned(false);

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const parent = containerRef.current?.parentElement;
        if (!parent) return;

        // Find the trigger element (should be the first child of the dropdown container)
        const triggerEl = parent.querySelector('[data-dropdown-trigger]') || parent.firstElementChild;

        if (triggerEl && triggerEl !== containerRef.current) {
          const triggerRect = triggerEl.getBoundingClientRect();
          const dropdownRect = containerRef.current?.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          let top = triggerRect.bottom + 4;
          // align right edge of dropdown with right edge of trigger
          let left = triggerRect.right - (dropdownRect?.width || 200);

          // If it goes off the left edge, align with left edge of trigger instead
          if (left < 8) {
            left = triggerRect.left;
          }

          // If it still goes off the right edge (e.g. on mobile with left align), constrain it
          if (left + (dropdownRect?.width || 200) > viewportWidth - 8) {
            left = viewportWidth - (dropdownRect?.width || 200) - 8;
          }

          // Adjust if dropdown would go off the bottom edge
          if (dropdownRect && top + dropdownRect.height > viewportHeight - 8) {
            top = triggerRect.top - (dropdownRect.height + 4); // Show above trigger
          }

          setPosition({ top, left });
          setIsPositioned(true);
        }
      });
    } else {
      setIsPositioned(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={className ? `w-menu ${className}` : "w-menu"}
      ref={containerRef}
      style={{
        position: "fixed",
        zIndex: 1000,
        width: "max-content",
        minWidth: 140,
        maxWidth: 240,
        ...style,
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: isPositioned ? "visible" : "hidden",
        opacity: isPositioned ? 1 : 0,
        transition: isPositioned ? "opacity 0.15s ease-in-out" : "none",
      }}
    >
      {children}
    </div>
  );
};

export const DropdownTrigger = ({ children }: { children: ReactNode }) => {
  const { openChange, open } = useDropdownContext();

  const toggleDropdown = useCallback(() => {
    openChange(!open);
  }, [open, openChange]);

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onClick={toggleDropdown}
      data-dropdown-trigger
    >
      {children}
    </div>
  );
};

interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  $destructive?: boolean;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ $destructive, className, ...rest }, ref) => (
    <button
      ref={ref}
      className={`w-menu-item${$destructive ? " w-menu-item--danger" : ""}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  ),
);
DropdownItem.displayName = "DropdownItem";

export const DropdownDivider = () => (
  <div
    style={{
      height: "0.5px",
      background: "var(--wa-border)",
      width: "100%",
      margin: "4px 0",
    }}
  />
);
