import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { Button, Spinner } from "../utility";
import { OrganizationDomain } from "@/types";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useScreenContext } from "./context";

const PopoverContainer = styled.div`
  position: fixed;
  width: 360px;
  max-width: calc(100vw - 48px);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 1001;
  
  @media (max-width: 600px) {
    width: calc(100vw - 48px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-foreground);
`;

const Content = styled.div`
  padding: var(--space-md);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background-alt);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: var(--space-xs);
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.15s ease;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--color-foreground);
    background: var(--color-input-background);
  }
`;

interface AddDomainPopoverProps {
  onClose?: () => void;
  domain?: OrganizationDomain;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const AddDomainPopover = ({
  onClose,
  domain,
  triggerRef,
}: AddDomainPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [currentDomain, setCurrentDomain] = useState<OrganizationDomain>();
  const [newFqdn, setNewFqdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { addDomain, verifyDomain } = useActiveOrganization();
  const { toast } = useScreenContext();

  const handleDoaminCreation = async () => {
    if (!newFqdn.trim()) return;

    const res = await addDomain!({ fqdn: newFqdn });
    if (res?.errors?.length) return;

    toast("Domain added successfully", "info");
    setCurrentDomain(res!.data);
  };

  const handleDomainVerification = async () => {
    if (!currentDomain || loading) return;
    setLoading(true);
    try {
      await verifyDomain!(currentDomain);
      onClose?.();
      toast("Domain verified successfully", "info");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Calculate position after a short delay
    const timer = setTimeout(() => {
      if (!popoverRef.current || !triggerRef?.current) return;
      
      const triggerButton = triggerRef.current;
      
      if (triggerButton) {
        const rect = triggerButton.getBoundingClientRect();
        const popoverWidth = 360;
        const popoverHeight = 250; // Approximate height
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
        onClose?.();
      }
    };
    
    // Add escape key listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
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

  useEffect(() => {
    if (!domain) return;
    setCurrentDomain(domain);
  }, [domain]);

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
      {!currentDomain ? (
        <>
          <Header>
            <Title>Add Domain</Title>
            <CloseButton onClick={onClose}>
              <X size={16} />
            </CloseButton>
          </Header>

          <Content>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <FormGroup>
                <Label>Enter FQDN</Label>
                <Input
                  type="text"
                  placeholder="Enter your domain"
                  value={newFqdn}
                  onChange={(e) => setNewFqdn(e.target.value)}
                  autoFocus
                />
              </FormGroup>
            </div>
          </Content>

          <ButtonGroup>
            <Button
              $outline
              onClick={onClose}
              style={{
                width: "auto",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDoaminCreation}
              disabled={!newFqdn || loading}
              style={{
                width: "auto",
              }}
            >
              {loading ? (
                <>
                  <Spinner size={14} /> Adding...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <Header>
            <Title>Verify Domain</Title>
            <CloseButton onClick={onClose}>
              <X size={16} />
            </CloseButton>
          </Header>

          <Content>
            <div style={{ marginBottom: "var(--space-md)" }}>
              <p style={{
                fontSize: "var(--font-xs)",
                color: "var(--color-muted)",
                margin: 0,
              }}>
                Add the following DNS record to your domain
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <FormGroup>
                <Label>Record Type</Label>
                <Input
                  value={currentDomain?.verification_dns_record_type}
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label>Record Name</Label>
                <Input
                  value={currentDomain?.verification_dns_record_name}
                  disabled
                />
              </FormGroup>
              <FormGroup>
                <Label>Record Data</Label>
                <Input
                  type="text"
                  value={currentDomain?.verification_dns_record_data}
                  disabled
                />
              </FormGroup>
            </div>
          </Content>

          <ButtonGroup>
            <Button
              $outline
              onClick={onClose}
              style={{
                width: "auto",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDomainVerification}
              disabled={loading}
              style={{
                width: "auto",
              }}
            >
              {loading ? (
                <>
                  <Spinner size={14} /> Verifying...
                </>
              ) : (
                "Verify Domain"
              )}
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
