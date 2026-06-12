import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/utility/input";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface AddPasskeyPopoverProps {
    triggerRef?: React.RefObject<HTMLElement | null>;
    onClose: () => void;
    onAddPasskey: (name: string) => Promise<void>;
}

export const AddPasskeyPopover = ({
    onClose,
    onAddPasskey,
    triggerRef,
}: AddPasskeyPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const position = usePopoverPosition({
        contentRef: popoverRef,
        triggerRef: triggerRef ?? { current: null },
        isOpen: mounted,
        minWidth: 320,
        defaultMaxHeight: 260,
    });

    useEffect(() => {
        setMounted(true);

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const handleSubmit = async () => {
        if (loading) return;

        setLoading(true);
        setError("");
        try {
            await onAddPasskey(name.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to register passkey");
            setLoading(false);
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div
            ref={popoverRef}
            className="w-pop"
            style={{
                position: "fixed",
                zIndex: 1001,
                maxWidth: "calc(100vw - 24px)",
                top: position?.top !== undefined ? `${position.top}px` : undefined,
                bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
                left: position?.left !== undefined ? `${position.left}px` : undefined,
                right: position?.right !== undefined ? `${position.right}px` : undefined,
                maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
                visibility: position ? "visible" : "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-pop-body">
                <div className="w-pop-title">Add Passkey</div>

                <Input
                    type="text"
                    placeholder="e.g., MacBook Pro, iPhone"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                {error && <span className="w-input-err">{error}</span>}
            </div>

            <div className="w-pop-foot">
                <button className="w-btn w-btn--secondary w-btn--sm" onClick={onClose}>Cancel</button>
                <button
                    className="w-btn w-btn--primary w-btn--sm"
                    style={{ width: "auto" }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Continue"}
                </button>
            </div>
        </div>
    );
};
