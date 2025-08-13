import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { Button, Spinner } from "../utility";
import { ComboBox, ComboBoxOption } from "../utility/combo-box";
import { WorkspaceRole } from "@/types";

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

interface InviteMemberPopoverProps {
  onClose?: () => void;
  onSuccess?: () => void;
  roles: WorkspaceRole[];
  createInvitation: (email: string, roleId: string) => Promise<any>;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const InviteMemberPopover = ({
  onClose,
  onSuccess,
  roles,
  createInvitation,
  triggerRef,
}: InviteMemberPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const roleOptions: ComboBoxOption[] = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

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
    
    // Delay adding the listener to prevent immediate closure
    const listenerTimer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(listenerTimer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, triggerRef]);

  const handleInvite = async () => {
    if (!email.trim() || !selectedRole) return;

    setLoading(true);
    try {
      await createInvitation(email, selectedRole.id);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to send invitation", error);
    } finally {
      setLoading(false);
    }
  };

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
        <Title>Invite Member</Title>
        <CloseButton onClick={onClose}>
          <X size={16} />
        </CloseButton>
      </Header>

      <Content>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <FormGroup>
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <Label>Role</Label>
            <ComboBox
              options={roleOptions}
              value={selectedRole?.id}
              onChange={(id) =>
                setSelectedRole(roles.find((role) => role.id === id)!)
              }
              placeholder="Select a role"
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
          onClick={handleInvite}
          disabled={!email || !selectedRole || loading}
          style={{
            width: "auto",
          }}
        >
          {loading ? (
            <>
              <Spinner size={14} /> Sending...
            </>
          ) : (
            "Send Invitation"
          )}
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};