import {
  createContext,
  CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

const DropdownItemsContainer = styled.div`
  position: absolute;
  margin-top: 4px;
  right: 0;
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  overflow: hidden;
  z-index: 10;
  min-width: 140px;
  display: grid;
`;

const DropdownContainer = styled.div`
  width: fit-content;
`;

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
      <DropdownContainer style={style} ref={dropdownRef}>
        {children}
      </DropdownContainer>
    </DropdownContext.Provider>
  );
};

export const DropdownItems = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) => {
  const { open } = useDropdownContext();

  if (!open) return null;

  return (
    <DropdownItemsContainer style={style}>{children}</DropdownItemsContainer>
  );
};

export const DropdownTrigger = ({ children }: { children: ReactNode }) => {
  const { openChange, open } = useDropdownContext();

  const toggleDropdown = useCallback(() => {
    openChange(!open);
  }, [open, openChange]);

  return (
    <div style={{ position: "relative" }} onClick={toggleDropdown}>
      {children}
    </div>
  );
};

export const DropdownItem = styled.button<{ $destructive?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  width: 200px;
  color: ${(props) =>
    props.$destructive ? "var(--color-error)" : "var(--color-text)"};

  &:hover {
    background: ${(props) =>
      props.$destructive
        ? "var(--color-error-background)"
        : "var(--color-background-hover)"};
  }
`;

export const DropdownDivider = styled.div`
  height: 1px;
  background-color: var(--color-border);
  width: 100%;
`;
