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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
`;

const TopButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const CodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin: 12px 0;
`;

const CodeItem = styled.div`
  background: var(--color-input-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  font-size: 12px;
  text-align: center;
  color: var(--color-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-input-background-hover);
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
      <Header>
        <Title>Backup Codes</Title>
        <TopButtons>
          <Button onClick={onCopy} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Copy size={14} />
            Copy
          </Button>
          <Button onClick={onDownload} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Download size={14} />
            Download
          </Button>
        </TopButtons>
      </Header>
      <div
        style={{
          fontSize: "13px",
          color: "var(--color-muted)",
          marginBottom: "8px",
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
        fontSize: "12px", 
        color: "var(--color-warning)", 
        padding: "6px 10px",
        background: "var(--color-warning-background)",
        border: "1px solid var(--color-warning-border)",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        alignItems: "center",
        gap: "6px"
      }}>
        <span style={{ fontSize: "14px" }}>⚠️</span>
        <span>Keep these codes safe! They won't be shown again.</span>
      </div>
    </PopoverContainer>
  );
};