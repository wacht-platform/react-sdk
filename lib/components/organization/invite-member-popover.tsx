import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { useActiveOrganization } from "@/hooks/use-organization";
import { Button, Spinner } from "../utility";
import { ComboBox, ComboBoxOption } from "../utility/combo-box";
import { OrganizationRole } from "@/types/organization";

const PopoverContainer = styled.div`
  position: absolute;
  right: 0;
  margin-top: 8px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 24px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  z-index: 10;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 16px;
`;

interface InviteMemberPopoverProps {
  onClose?: () => void;
  onSuccess?: () => void;
  roles: OrganizationRole[];
}

export const InviteMemberPopover = ({
  onClose,
  onSuccess,
  roles,
}: InviteMemberPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { inviteMember } = useActiveOrganization();

  const roleOptions: ComboBoxOption[] = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const handleInvite = async () => {
    if (!email.trim() || !selectedRole) return;

    setLoading(true);
    try {
      await inviteMember({ email, organizationRole: selectedRole });

      onSuccess?.();
    } catch (error) {
      console.error("Failed to send invitation", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <PopoverContainer ref={popoverRef}>
      <Title>Invite a team member</Title>
      <FormGroup>
        <Label>Email Address</Label>
        <Input
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormGroup>
      <FormGroup style={{ marginTop: "12px" }}>
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
      <ButtonGroup>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          $primary
          onClick={handleInvite}
          disabled={!email || !selectedRole || loading}
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
