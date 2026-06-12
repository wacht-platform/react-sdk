import { useRef, useEffect, useState } from "react";
import { Copy, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/utility/button";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface BackupCodesPopoverProps {
  codes: string[];
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export const BackupCodesPopover = ({
  codes,
  onClose,
  onCopy,
  onDownload,
  triggerRef,
}: BackupCodesPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const position = usePopoverPosition({
    contentRef: popoverRef,
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 380,
    defaultMaxHeight: 360,
  });

  useEffect(() => {
    setMounted(true);

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Add escape key listener
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
        width: 380,
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
        <div className="w-flex w-items-center w-justify-between w-gap-2">
          <div className="w-pop-title">Backup Codes</div>
          <div className="w-flex w-gap-2 w-none">
            <Button $outline $size="sm" onClick={onCopy}>
              <Copy size={14} />
              Copy
            </Button>
            <Button $outline $size="sm" onClick={onDownload}>
              <DownloadSimple size={14} />
              DownloadSimple
            </Button>
          </div>
        </div>
        <p className="w-pop-sub">
          Save these backup codes in a secure location. Each code can only be used once.
        </p>

        <div className="w-codes">
          {codes.map((code, index) => (
            <span
              key={index}
              role="button"
              style={{ cursor: "pointer" }}
              onClick={() => {
                navigator.clipboard.writeText(code);
                // Optional: Add a toast notification here
              }}
              title="Click to copy"
            >
              {code}
            </span>
          ))}
        </div>

        <div className="w-banner w-banner--warn">
          <span style={{ fontSize: 13.5 }}>⚠️</span>
          <span className="w-banner-txt">Keep these codes safe! They won't be shown again.</span>
        </div>
      </div>
    </div>
  );
};
