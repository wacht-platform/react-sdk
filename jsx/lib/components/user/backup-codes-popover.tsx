import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { Copy, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/utility/button";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-popover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--space-8u);
  width: calc(calc(var(--size-50u) * 3) + var(--size-40u));
  max-width: calc(100vw - var(--space-24u));
  z-index: 1001;
  
  @media (max-width: 600px) {
    width: calc(100vw - var(--space-24u));
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4u);
`;

const Title = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-popover-foreground);
`;

const TopButtons = styled.div`
  display: flex;
  gap: var(--space-4u);
`;

const CodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3u);
  margin: var(--space-6u) 0;
`;

const CodeItem = styled.div`
  background: var(--color-input-background);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-2xs);
  padding: var(--space-3u) var(--space-5u);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: var(--font-size-sm);
  text-align: center;
  color: var(--color-popover-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-accent);
    border-color: var(--color-primary);
  }
`;

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
    <PopoverContainer 
      ref={popoverRef}
      style={{
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Header>
        <Title>Backup Codes</Title>
        <TopButtons>
          <Button $outline $size="sm" onClick={onCopy} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2u)' }}>
            <Copy size={14} />
            Copy
          </Button>
          <Button $outline $size="sm" onClick={onDownload} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2u)' }}>
            <DownloadSimple size={14} />
            DownloadSimple
          </Button>
        </TopButtons>
      </Header>
      <div
        style={{
          fontSize: "var(--font-size-md)",
          color: "var(--color-muted)",
          marginBottom: "var(--space-4u)",
        }}
      >
        Save these backup codes in a secure location. Each code can only be used once.
      </div>

      <CodesGrid>
        {codes.map((code, index) => (
          <CodeItem 
            key={index}
            onClick={() => {
              navigator.clipboard.writeText(code);
              // Optional: Add a toast notification here
            }}
            title="Click to copy"
          >
            {code}
          </CodeItem>
        ))}
      </CodesGrid>

      <div style={{ 
        fontSize: "var(--font-size-sm)", 
        color: "var(--color-warning)", 
        padding: "var(--space-3u) var(--space-5u)",
        background: "var(--color-warning-background)",
        border: "var(--border-width-thin) solid var(--color-warning-border)",
        borderRadius: "var(--radius-2xs)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3u)"
      }}>
        <span style={{ fontSize: "var(--font-size-lg)" }}>⚠️</span>
        <span>Keep these codes safe! They won't be shown again.</span>
      </div>
    </PopoverContainer>
  );
};
