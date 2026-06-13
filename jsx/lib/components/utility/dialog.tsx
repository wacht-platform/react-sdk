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
import { X } from "@phosphor-icons/react";
import { useThemeOverrideVars } from "./root";

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
// Dialog Root Component
interface DialogProps {
    isOpen: boolean;
    onClose?: () => void;
    children: ReactNode;
}

const DialogRoot: FC<DialogProps> = ({ isOpen, onClose, children }) => {
    const [isMounted, setIsMounted] = useState(false);
    const themeOverrides = useThemeOverrideVars();

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

    // Portal outside the parent DOM hierarchy; the `.wacht-root` class scopes
    // the token vars (styles are already injected document-wide by the host),
    // and themeOverrides re-applies the deployment's inline `--wa-ov-*` overrides
    // which don't inherit across the portal boundary.
    return ReactDOM.createPortal(
        <div className="wacht-root" style={themeOverrides}>
            <DialogContext.Provider value={{ isOpen, onClose }}>
                {children}
            </DialogContext.Provider>
        </div>,
        document.body,
    );
};

// Dialog Overlay Component
const DialogOverlay: FC<{ children?: ReactNode }> = ({ children }) => {
    const { onClose } = useDialogContext();
    const contentRef = useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (
            contentRef.current &&
            !contentRef.current.contains(e.target as Node)
        ) {
            onClose?.();
        }
    };

    return (
        <div className="w-modal" onClick={handleOverlayClick}>
            <div ref={contentRef} style={{ maxWidth: "100%", minWidth: 0 }}>
                {children}
            </div>
        </div>
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
        <div
            className={`w-dialog${className ? ` ${className}` : ""}`}
            style={{ maxHeight: "90vh", overflowY: "auto", ...style }}
        >
            {children}
        </div>
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
        <div className="w-dialog-head">
            {typeof children === "string" ? (
                <h2 className="w-dialog-title">{children}</h2>
            ) : (
                children
            )}
            {showCloseButton && (
                <button className="w-btn w-btn--icon" onClick={onClose}>
                    <X size={18} />
                </button>
            )}
        </div>
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
        <div
            className={`w-dialog-body${className ? ` ${className}` : ""}`}
            style={style}
        >
            {children}
        </div>
    );
};

// Dialog Footer Component
interface DialogFooterProps {
    children: ReactNode;
}

const DialogFooter: FC<DialogFooterProps> = ({ children }) => {
    return <div className="w-dialog-foot">{children}</div>;
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
    renderDialog: (props: {
        isOpen: boolean;
        onClose: () => void;
    }) => ReactNode;
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
