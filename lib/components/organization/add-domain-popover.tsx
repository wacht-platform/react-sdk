import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { OrganizationDomain } from "@/types/organization";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useScreenContext } from "./context";

const PopoverContainer = styled.div`
  position: absolute;
  right: 0;
  margin-top: 8px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 380px;
  z-index: 10;
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
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

interface AddDomainPopoverProps {
  onClose?: () => void;
  domain?: OrganizationDomain;
}

export const AddDomainPopover = ({
  onClose,
  domain,
}: AddDomainPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [currentDomain, setCurrentDomain] = useState<OrganizationDomain>();
  const [newFqdn, setNewFqdn] = useState("");
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!domain) return;
    setCurrentDomain(domain);
  }, [domain]);

  return (
    <PopoverContainer ref={popoverRef}>
      {!currentDomain ? (
        <>
          <Title>Add email address</Title>
          <FormGroup>
            <Label>Enter FQDN</Label>
            <Input
              type="text"
              placeholder="Enter your domain"
              value={newFqdn}
              onChange={(e) => setNewFqdn(e.target.value)}
            />
          </FormGroup>
          <ButtonGroup>
            <Button
              $primary
              onClick={handleDoaminCreation}
              disabled={!newFqdn || loading}
              style={{ width: "100%" }}
            >
              {loading ? "Adding..." : "Continue"}
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <div style={{ textAlign: "left" }}>
            <Title>Verify your domain</Title>
            <div
              style={{
                fontSize: "14px",
                color: "var(--color-muted)",
                marginBottom: "16px",
              }}
            >
              Add the following DNS record to your domain
            </div>
          </div>
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
          <ButtonGroup>
            <Button
              $primary
              onClick={handleDomainVerification}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Adding..." : "Continue"}
            </Button>
          </ButtonGroup>
        </>
      )}
    </PopoverContainer>
  );
};
