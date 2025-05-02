import React, { useState } from "react";
import styled from "styled-components";
import {
  Building,
  Trash2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Globe,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { Spinner } from "../utility";
import { match } from "ts-pattern";
import { FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";
import { Button } from "../user/add-phone-popover";

interface Organization {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  role: string;
  verified_domains: string[];
  members_count: number;
}

const TypographyProvider = styled.div`
  * {
    box-sizing: border-box;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }
`;

const Container = styled.div`
  width: 900px;
  max-width: 100%;
  height: 600px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  padding: 24px;
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }
`;

const MainContent = styled.div<{ $isAdding: boolean }>`
  display: flex;
  flex-direction: column;
  transform: translateX(${(props) => (props.$isAdding ? "-100%" : "0")});
  transition: transform 0.3s ease;
  width: 100%;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  height: 100%;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const ProfileHeader = styled.div`
  display: flex;
  padding: 0 4px;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 24px;
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
`;

const ProfileName = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 16px;
  margin: 0;
  color: #1e293b;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 2px;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8fafc;
  }
`;

const InfoLabel = styled.div`
  color: #64748b;
  font-size: 14px;
  width: 180px;
`;

const InfoContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: none;
  font-size: 14px;
`;

const AddItemForm = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 100%;
  width: 100%;
  height: 100%;
  background: white;
  overflow-y: auto;
  transform: translateX(${(props) => (props.$isVisible ? "-100%" : "0")});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  background: none;
  border: none;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #1e293b;
  }
`;

const Badge = styled.span`
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
`;

const OrganizationManagementSection = ({
  setScreen,
}: {
  setScreen: React.Dispatch<
    React.SetStateAction<
      "general" | "members" | "domains" | "billing" | "security" | null
    >
  >;
}) => {
  const { selectedOrganization, loading } = useOrganization();

  if (loading || !selectedOrganization) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  const organization = selectedOrganization as unknown as Organization;

  return (
    <>
      <SectionTitle style={{ marginBottom: "20px" }}>
        Manage {organization.name}
      </SectionTitle>
      <ProfileSection>
        <ProfileHeader onClick={() => setScreen("general")}>
          <Avatar
            src={
              organization.image_url ||
              "https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300&q=80"
            }
            alt="Organization Logo"
          />
          <ProfileName>
            <Name>{organization.name}</Name>
          </ProfileName>

          <ArrowRight size={14} style={{ color: "#64748b" }} />
        </ProfileHeader>

        <InfoItem onClick={() => setScreen("domains")}>
          <InfoLabel>Verified Domains</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Add verified domains for smooth onboarding
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>

        <InfoItem onClick={() => setScreen("members")}>
          <InfoLabel>Manage Memberships</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage existing memberships and invite new members
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>

        <InfoItem onClick={() => setScreen("members")}>
          <InfoLabel>Manage Roles</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage existing roles and create new ones
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>

        {/* Administration Section */}
        <SectionTitle style={{ marginTop: "32px", marginBottom: "16px" }}>
          Administration
        </SectionTitle>

        <InfoItem onClick={() => setScreen("billing")}>
          <InfoLabel>Manage Billing</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage billing and usage
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>

        <InfoItem onClick={() => setScreen("security")}>
          <InfoLabel>Access & Security</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage organization access and security settings
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>
      </ProfileSection>
    </>
  );
};

// General settings section
const GeneralSettingsSection = () => {
  const { selectedOrganization, loading } = useOrganization();
  const [name, setName] = useState(selectedOrganization?.name || "");
  const [description, setDescription] = useState(
    selectedOrganization?.description || ""
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedOrganization?.image_url || null
  );
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedOrganization) {
      setName(selectedOrganization.name || "");
      setDescription(selectedOrganization.description || "");
      setPreviewUrl(selectedOrganization.image_url || null);
    }
  }, [selectedOrganization]);

  if (loading || !selectedOrganization) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Update organization", { name, description, image });
    setSuccessMessage("Organization details updated successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleLeaveOrg = () => {
    if (
      window.confirm(
        "Are you sure you want to leave this organization? You will lose access to all resources."
      )
    ) {
      alert("You would be removed from the organization");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <SectionTitle>Organization Settings</SectionTitle>
      </div>

      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={16} />
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={triggerFileInput}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Organization Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Building size={36} color="#64748b" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageChange}
              />
            </button>
            <div
              style={{ fontSize: "13px", color: "#64748b", marginTop: "8px" }}
            >
              Click to upload a new logo
            </div>
          </div>
        </div>

        <div>
          <FormGroup>
            <Label>Organization Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization Name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#fff",
              }}
            />
          </FormGroup>
        </div>

        <div style={{ marginTop: "16px" }}>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "9px 16px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            Save Changes
          </button>
        </div>

        <div style={{ marginTop: "40px" }}>
          <LeaveOrgAccordion handleLeaveOrg={handleLeaveOrg} />
        </div>
      </form>
    </div>
  );
};

// Leave Organization Accordion Component
const LeaveOrgAccordion = ({
  handleLeaveOrg,
}: {
  handleLeaveOrg: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        paddingTop: "16px",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "#ef4444",
          fontWeight: 500,
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} />
          Leave Organization
        </div>
        <div style={{ transition: "transform 0.2s ease" }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            padding: "16px",
            background: "#fef2f2",
            borderRadius: "8px",
            marginTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#4b5563",
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            Leaving this organization will remove your access to all resources,
            projects, and data within this organization. This action cannot be
            undone.
          </p>
          <button
            type="button"
            onClick={handleLeaveOrg}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              cursor: "pointer",
            }}
          >
            Leave Organization
          </button>
        </div>
      )}
    </div>
  );
};

// Domains Management Section
const DomainsSection = () => {
  const { selectedOrganization, loading } = useOrganization();

  if (loading || !selectedOrganization) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  const organization = selectedOrganization as unknown as Organization;

  const domains = organization.verified_domains
    ? organization.verified_domains.map((domain: string, index: number) => ({
        id: index + 1,
        domain,
        status: "verified",
        primary: index === 0,
      }))
    : [];

  const [newDomain, setNewDomain] = useState("");

  return (
    <div>
      <SectionTitle>Verified Domains</SectionTitle>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
        Verify domains to allow users with matching email addresses to
        automatically join your organization.
      </p>

      <div style={{ marginBottom: "24px" }}>
        <FormGroup>
          <Label>Add a new domain</Label>
          <div style={{ display: "flex", gap: "8px" }}>
            <Input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              style={{ flex: 1 }}
            />
            <Button $primary type="button">
              Add Domain
            </Button>
          </div>
        </FormGroup>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {domains.map((domain) => (
          <div
            key={domain.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Globe size={16} />
                <span style={{ fontWeight: 500 }}>{domain.domain}</span>
                {domain.primary && <Badge>Primary</Badge>}
              </div>
              <div
                style={{ marginTop: "4px", fontSize: "13px", color: "#64748b" }}
              >
                <span
                  style={{
                    color: domain.status === "verified" ? "#16a34a" : "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <CheckCircle size={14} />
                  Verified
                </span>
              </div>
            </div>
            <div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#ef4444",
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Members Management Section
const MembersSection = () => {
  const { selectedOrganization, loading } = useOrganization();

  if (loading || !selectedOrganization) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Members</SectionTitle>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
        Manage organization members and their roles.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <Button
          $primary
          type="button"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={16} />
          Invite Member
        </Button>
      </div>

      {/* This would be replaced with actual member listing component */}
      <div
        style={{
          color: "#64748b",
          fontSize: "14px",
          textAlign: "center",
          padding: "40px 0",
        }}
      >
        Member management interface would go here
      </div>
    </div>
  );
};

// Billing Management Section
const BillingSection = () => {
  const { selectedOrganization, loading } = useOrganization();

  if (loading || !selectedOrganization) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Billing</SectionTitle>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
        Manage your organization's billing settings and subscription.
      </p>

      {/* This would be replaced with actual billing interface */}
      <div
        style={{
          color: "#64748b",
          fontSize: "14px",
          textAlign: "center",
          padding: "40px 0",
        }}
      >
        Billing management interface would go here
      </div>
    </div>
  );
};

// Security Settings Section
const SecuritySection = () => {
  const { selectedOrganization, loading } = useOrganization();

  if (loading || !selectedOrganization) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Security</SectionTitle>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
        Manage security settings for your organization.
      </p>

      {/* This would be replaced with actual security settings */}
      <div
        style={{
          color: "#64748b",
          fontSize: "14px",
          textAlign: "center",
          padding: "40px 0",
        }}
      >
        Security settings interface would go here
      </div>
    </div>
  );
};

// Main Component
export const ManageOrganization = () => {
  const [intermediateScreen, setIntermediateScreen] = useState<
    "general" | "members" | "domains" | "billing" | "security" | null
  >(null);

  const { loading } = useOrganization();

  if (loading)
    return (
      <Container
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </Container>
    );

  return (
    <TypographyProvider>
      <Container>
        <Layout>
          <div
            style={{ position: "relative", width: "100%", overflow: "hidden" }}
          >
            <MainContent $isAdding={!!intermediateScreen}>
              <OrganizationManagementSection
                setScreen={setIntermediateScreen}
              />
            </MainContent>

            <AddItemForm $isVisible={!!intermediateScreen}>
              <BackButton onClick={() => setIntermediateScreen(null)}>
                <ArrowLeft size={16} />
                Back to Organization
              </BackButton>

              {match(intermediateScreen)
                .with("general", () => <GeneralSettingsSection />)
                .with("domains", () => <DomainsSection />)
                .with("members", () => <MembersSection />)
                .with("billing", () => <BillingSection />)
                .with("security", () => <SecuritySection />)
                .otherwise(() => null)}
            </AddItemForm>
          </div>
        </Layout>
      </Container>
    </TypographyProvider>
  );
};

export default ManageOrganization;
