import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { Copy, Download } from "lucide-react";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  max-width: calc(100vw - 48px);
  z-index: 1001;
  
  @media (max-width: 600px) {
    width: calc(100vw - 48px);
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${(props) =>
    props.$primary ? "var(--color-primary)" : "var(--color-background)"};
  color: ${(props) =>
    props.$primary ? "white" : "var(--color-secondary-text)"};
  border: 1px solid
    ${(props) =>
      props.$primary ? "var(--color-primary)" : "var(--color-border)"};
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$primary
        ? "var(--color-primary-hover)"
        : "var(--color-input-background)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

const CodesContainer = styled.div`
  background: var(--color-input-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  margin: 16px 0;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Calculate position after a short delay
    const timer = setTimeout(() => {
      if (!popoverRef.current || !triggerRef?.current) return;
      
      const triggerButton = triggerRef.current;
      
      if (triggerButton) {
        const rect = triggerButton.getBoundingClientRect();
        const popoverWidth = 380;
        const popoverHeight = 300; // Approximate height for backup codes popover
        const spacing = 8;
        
        let top = 0;
        let left = 0;
        
        // Check available space
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceTop = rect.top;
        
        // Prefer to open below if there's space
        if (spaceBottom >= popoverHeight + spacing) {
          top = rect.bottom + spacing;
          // Align to right edge of button (bottom-right)
          left = rect.right - popoverWidth;
          
          // If it goes off left edge, align to left edge of button instead (bottom-left)
          if (left < spacing) {
            left = rect.left;
            
            // If that also goes off right edge, center it on screen
            if (left + popoverWidth > window.innerWidth - spacing) {
              left = (window.innerWidth - popoverWidth) / 2;
            }
          }
        }
        // Otherwise open above
        else if (spaceTop >= popoverHeight + spacing) {
          top = rect.top - popoverHeight - spacing;
          // Align to right edge of button (top-right)
          left = rect.right - popoverWidth;
          
          // If it goes off left edge, align to left edge of button instead (top-left)
          if (left < spacing) {
            left = rect.left;
            
            // If that also goes off right edge, center it on screen
            if (left + popoverWidth > window.innerWidth - spacing) {
              left = (window.innerWidth - popoverWidth) / 2;
            }
          }
        }
        // If no space above or below, position it at the best available spot
        else {
          // Position at bottom with scrolling if needed
          top = rect.bottom + spacing;
          left = rect.right - popoverWidth;
          
          if (left < spacing) {
            left = rect.left;
          }
        }
        
        setPosition({ top, left });
      }
    }, 10);
    
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
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, triggerRef]);

  if (!mounted) {
    return null;
  }

  return (
    <PopoverContainer 
      ref={popoverRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: position.top > 0 ? 'visible' : 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Title>Backup Codes</Title>
      <div
        style={{
          fontSize: "14px",
          color: "var(--color-muted)",
          marginBottom: "16px",
        }}
      >
        Save these backup codes in a secure location. Each code can only be used once.
      </div>

      <CodesContainer>
        {codes.map((code, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            {code}
          </div>
        ))}
      </CodesContainer>

      <div style={{ 
        fontSize: "12px", 
        color: "var(--color-warning)", 
        marginBottom: "16px",
        padding: "8px",
        background: "var(--color-warning-background)",
        borderRadius: "var(--radius-sm)"
      }}>
        ⚠️ Keep these codes safe! They won't be shown again.
      </div>

      <ButtonGroup>
        <Button onClick={onCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Copy size={14} />
          Copy
        </Button>
        <Button onClick={onDownload} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Download size={14} />
          Download
        </Button>
        <Button $primary onClick={onClose}>
          Done
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};