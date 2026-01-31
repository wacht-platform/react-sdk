"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { X } from "lucide-react";
import { DefaultStylesProvider } from "./root";

// Context for Dialog state
interface DialogContextValue {
  isOpen: boolean;
  onClose?: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
};

// Styled components
const StyledOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: var(--color-dialog-backdrop, rgba(0, 0, 0, 0.5));
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
`;

const StyledContent = styled.div`
  background-color: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px var(--color-shadow);
  width: 100%;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 100000;
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm, 12px) var(--space-md, 16px);
  border-bottom: 1px solid var(--color-border);
`;

const StyledTitle = styled.h2`
  font-size: 16px;
  color: var(--color-foreground);
  margin: 0;
`;

const StyledCloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  color: var(--color-secondary-text);

  &:hover {
    background-color: var(--color-background-hover);
    color: var(--color-foreground);
  }
`;

const StyledBody = styled.div`
  padding: 16px;
`;

const StyledFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--color-border);
`;

// Dialog Root Component
interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

const DialogRoot: FC<DialogProps> = ({ isOpen, onClose, children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  // Use portal to render outside of parent DOM hierarchy
  // Wrap with DefaultStylesProvider to ensure CSS variables are available
  return ReactDOM.createPortal(
    <DefaultStylesProvider>
      <DialogContext.Provider value={{ isOpen, onClose }}>
        {children}
      </DialogContext.Provider>
    </DefaultStylesProvider>,
    document.body,
  );
};

// Dialog Overlay Component
const DialogOverlay: FC<{ children?: ReactNode }> = ({ children }) => {
  const { onClose } = useDialogContext();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose?.();
    }
  };

  return (
    <StyledOverlay onClick={handleOverlayClick}>
      <div ref={contentRef}>{children}</div>
    </StyledOverlay>
  );
};

// Dialog Content Component
interface DialogContentProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const DialogContent: FC<DialogContentProps> = ({
  children,
  style,
  className,
}) => {
  return (
    <StyledContent style={style} className={className}>
      {children}
    </StyledContent>
  );
};

// Dialog Header Component
interface DialogHeaderProps {
  children?: ReactNode;
  showCloseButton?: boolean;
}

const DialogHeader: FC<DialogHeaderProps> = ({
  children,
  showCloseButton = true,
}) => {
  const { onClose } = useDialogContext();

  return (
    <StyledHeader>
      {typeof children === "string" ? (
        <StyledTitle>{children}</StyledTitle>
      ) : (
        children
      )}
      {showCloseButton && (
        <StyledCloseButton onClick={onClose}>
          <X size={18} />
        </StyledCloseButton>
      )}
    </StyledHeader>
  );
};

// Dialog Body Component
interface DialogBodyProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const DialogBody: FC<DialogBodyProps> = ({ children, style, className }) => {
  return (
    <StyledBody style={style} className={className}>
      {children}
    </StyledBody>
  );
};

// Dialog Footer Component
interface DialogFooterProps {
  children: ReactNode;
}

const DialogFooter: FC<DialogFooterProps> = ({ children }) => {
  return <StyledFooter>{children}</StyledFooter>;
};

// Compound Dialog Component
export const Dialog = Object.assign(DialogRoot, {
  Overlay: DialogOverlay,
  Content: DialogContent,
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
});

// Legacy/Simplified Dialog for backward compatibility and simple use cases
interface SimpleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export const SimpleDialog: FC<SimpleDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <Dialog.Overlay>
        <Dialog.Content>
          {title && (
            <Dialog.Header showCloseButton={showCloseButton}>
              {title}
            </Dialog.Header>
          )}
          <Dialog.Body>{children}</Dialog.Body>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog>
  );
};

// DialogTrigger Component
interface DialogTriggerProps {
  trigger: (props: { onClick: () => void }) => ReactNode;
  renderDialog: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
}

export const DialogTrigger: FC<DialogTriggerProps> = ({
  trigger,
  renderDialog,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      {trigger({ onClick: handleOpen })}
      {renderDialog({ isOpen, onClose: handleClose })}
    </>
  );
};
