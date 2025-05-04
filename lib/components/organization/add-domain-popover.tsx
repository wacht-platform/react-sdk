import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../utility/form";
import { OrganizationDomain } from "@/types/organization";
import { useActiveOrganization } from "@/hooks/use-organization";

const PopoverContainer = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid #e2e8f0;
  padding: 16px;
  width: 380px;
  z-index: 10;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${(props) => (props.$primary ? "#6366f1" : "white")};
  color: ${(props) => (props.$primary ? "white" : "#64748b")};
  border: 1px solid ${(props) => (props.$primary ? "#6366f1" : "#e2e8f0")};
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$primary ? "#4f46e5" : "#f8fafc")};
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
  color: #1e293b;
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

  const handleDoaminCreation = async () => {
    if (!newFqdn.trim()) return;

    const res = await addDomain!(newFqdn);
    if (res?.errors?.length) return;

    console.log(res);

    setCurrentDomain(res!.data);
  };

  const handleDomainVerification = async () => {
    if (!currentDomain || loading) return;
    setLoading(true);
    try {
      await verifyDomain!(currentDomain.id);
      onClose?.();
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
          <Title>Verify your domain</Title>
          <div
            style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}
          >
            Add the following DNS record to your domain
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
