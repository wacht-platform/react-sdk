import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import styled from "styled-components";
import {
  Building,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Globe,
  Copy,
  ExternalLink,
  Trash,
  FileText,
  Check,
  Edit,
  Shield,
  Users,
  Search,
  Save,
  UserPlus,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { Spinner } from "../utility";
import { match } from "ts-pattern";
import { FormGroup, Label } from "../utility/form";
import { Input } from "../utility/input";
import { AddDomainPopover } from "./add-domain-popover";
import { Dropdown, DropdownItem } from "@/components/utility/dropdown";
import useSWR from "swr";
import { InviteMemberPopover } from "./invite-member-popover";
import { OrganizationRole } from "@/types/organization";
import { ComboBox } from "@/components/utility/combo-box";
import { Switch } from "@/components/utility/switch";
import { AddRolePopover } from "./add-role-popover";

interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  current: boolean;
}

interface BillingInvoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  pdf_url: string;
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
  gap: 16px;
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: #e2e8f0;
  margin: 6px 0;
  width: 100%;
`;

type Screen =
  | "general"
  | "members"
  | "domains"
  | "billing"
  | "security"
  | "roles"
  | null;

type ScreenContextType = {
  screen: Screen;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
};

const ScreenContext = createContext<ScreenContextType>({
  screen: null,
  setScreen: () => {},
});

const OrganizationManagementSection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();
  const { setScreen } = useContext(ScreenContext);

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

  const organization = selectedOrganization;

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
          <InfoLabel>Manage Members</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage existing members and their roles
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>

        <InfoItem onClick={() => setScreen("roles")}>
          <InfoLabel>Organization Roles</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage access to your organization resources
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>

        <SectionTitle style={{ marginTop: "32px", marginBottom: "16px" }}>
          Administration
        </SectionTitle>

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

        <InfoItem onClick={() => setScreen("security")}>
          <InfoLabel>Audit Logs</InfoLabel>
          <InfoContent>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Track organization activity and changes
            </div>
            <ArrowRight size={14} style={{ color: "#64748b" }} />
          </InfoContent>
        </InfoItem>
      </ProfileSection>
    </>
  );
};

const SectionHeader = ({
  title,
  actionLabel,
  onAction,
  buttonIcon,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  buttonIcon?: React.ReactNode;
}) => {
  const { setScreen } = useContext(ScreenContext);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: 16,
          cursor: "pointer",
        }}
        onClick={() => setScreen(null)}
      >
        <ArrowLeft size={16} />
        <SectionTitle>{title}</SectionTitle>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {buttonIcon}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

const GeneralSettingsSection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();
  const [name, setName] = useState(selectedOrganization?.name || "");
  const [description, setDescription] = useState(
    selectedOrganization?.description || ""
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedOrganization?.image_url || null
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [_, setIsSubmitting] = useState(false);
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
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization) return;

    try {
      setIsSubmitting(true);

      // Create form data if we have an image
      let payload: any = { name, description };

      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("name", name);
        formData.append("description", description || "");
        payload = formData;
      }

      // Mock implementation since updateOrganization doesn't exist
      console.log("Updating organization", payload);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage("Organization details updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update organization", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SectionHeader
        title="Organization Settings"
        actionLabel="Save changes"
        onAction={console.log}
        buttonIcon={<Save size={14} />}
      />

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
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Organization Logo"
                  style={{
                    objectFit: "cover",

                    width: "84px",
                    height: "84px",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <Building size={36} color="#64748b" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageChange}
              />
            </button>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
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
              required
            />
          </FormGroup>
        </div>

        <div style={{ marginTop: "16px" }}>
          <FormGroup>
            <Label>Description</Label>
            <Input
              id="description"
              as="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter organization description"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#fff",
                minHeight: "100px",
                resize: "vertical",
              }}
            />
          </FormGroup>
        </div>
      </form>
    </>
  );
};

const Badge = styled.span`
  background: #fff8e6;
  color: #854d0e;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DomainItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }
`;

const DomainContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const DomainInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #64748b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #1e293b;
`;

const DomainsSection = () => {
  const {
    activeOrganization,
    loading,
    getDomains: getOrganizationDomains,
  } = useActiveOrganization();

  const {
    data: domains = [],
    isLoading,
    mutate,
  } = useSWR(
    activeOrganization?.id ? `/domains/${activeOrganization.id}` : null,
    () => getOrganizationDomains?.() || [],
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );

  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [domainInVerification, setDomainInVerification] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter domains based on search query
  const filteredDomains = React.useMemo(() => {
    if (!searchQuery) return domains;
    return domains.filter((domain) =>
      domain.fqdn.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [domains, searchQuery]);

  const handleDeleteDomain = async (domainId: string) => {
    console.log(domainId);
    mutate();
  };

  const handleVerifyDomain = async (domainId: string) => {
    setDomainInVerification(domainId);
  };

  if (loading || isLoading) {
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
    <>
      <div style={{ position: "relative" }}>
        <SectionHeader
          title="Organization Domains"
          actionLabel="New Domain"
          onAction={() => setIsAddingDomain(true)}
          buttonIcon={<Globe size={14} />}
        />
        {isAddingDomain && (
          <AddDomainPopover onClose={() => setIsAddingDomain(false)} />
        )}
      </div>

      {/* Search bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px 12px",
          backgroundColor: "#fff",
        }}
      >
        <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
        <input
          type="text"
          placeholder="Search domains"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "14px",
            color: "#1e293b",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!filteredDomains?.length ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#64748b",
            }}
          >
            {searchQuery ? "No domains match your search" : "No domains added"}
          </div>
        ) : (
          filteredDomains.map((domain) => (
            <DomainItem key={domain.id}>
              <DomainContent>
                <IconWrapper>
                  <Globe size={18} />
                </IconWrapper>
                <DomainInfo>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1e293b",
                    }}
                  >
                    {domain.fqdn}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Badge>
                      <AlertTriangle size={12} />
                      Pending Verification
                    </Badge>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Added {new Date(domain.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </DomainInfo>
              </DomainContent>
              <div style={{ position: "relative" }}>
                <IconButton
                  onClick={() =>
                    setActiveDomain(
                      activeDomain === domain.id ? null : domain.id
                    )
                  }
                >
                  <MoreVertical size={16} />
                </IconButton>
                {domainInVerification === domain.id && (
                  <AddDomainPopover
                    domain={domain}
                    onClose={() => setDomainInVerification(null)}
                  />
                )}
                {domainInVerification !== domain.id && (
                  <Dropdown
                    isOpen={activeDomain === domain.id}
                    onClose={() => setActiveDomain(null)}
                    position={{ right: 0 }}
                  >
                    {!domain.verified && (
                      <DropdownItem
                        style={{ width: 180 }}
                        onClick={() => {
                          handleVerifyDomain(domain.id);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <CheckCircle size={16} color="#6366f1" />
                          Verify Domain
                        </div>
                      </DropdownItem>
                    )}
                    <DropdownItem
                      onClick={() => console.log("copy", domain.fqdn)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Copy size={16} color="#64748b" />
                        Copy Domain
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() =>
                        window.open(`https://${domain.fqdn}`, "_blank")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <ExternalLink size={16} color="#64748b" />
                        Visit Domain
                      </div>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                      $destructive
                      onClick={() => handleDeleteDomain(domain.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Trash size={16} color="#ef4444" />
                        Remove Domain
                      </div>
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>
            </DomainItem>
          ))
        )}
      </div>
    </>
  );
};

const RoleDropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  width: 150px;
  background: #f8fafc;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const RoleDropdownContainer = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  transform: ${(props) => (props.isOpen ? "scale(1)" : "scale(0.95)")};
  transform-origin: top right;
  pointer-events: ${(props) => (props.isOpen ? "auto" : "none")};
  transition: all 0.2s ease;
  width: 220px;
`;

const RoleDropdownItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  background: ${(props) => (props.isActive ? "#f1f5f9" : "transparent")};
  transition: background 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
`;

const RoleHeading = styled.div`
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
`;

const MembersSection = () => {
  const {
    activeOrganization: selectedOrganization,
    loading,
    getMembers,
    getInvitations,
    getRoles,
    addRole,
    removeRole,
    discardInvitation,
  } = useActiveOrganization();

  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: members = [],
    isLoading: membersLoading,
    mutate: reloadMembers,
  } = useSWR(
    selectedOrganization
      ? `/api/organizations/${selectedOrganization.id}/members`
      : null,
    () => getMembers?.() || []
  );

  const {
    data: invitations = [],
    isLoading: invitationsLoading,
    mutate: reloadInvitations,
  } = useSWR(
    selectedOrganization
      ? `/api/organizations/${selectedOrganization.id}/invitations`
      : null,
    () => getInvitations?.() || []
  );

  const { data: roles = [], isLoading: rolesLoading } = useSWR(
    selectedOrganization
      ? `/api/organizations/${selectedOrganization.id}/roles`
      : null,
    () => getRoles?.() || []
  );

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery) return members;
    return members.filter((member: any) => {
      if (!member.user) return false;

      const firstName = member.user.first_name || "";
      const lastName = member.user.last_name || "";
      const email = member.user.primary_email_address?.email || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return (
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [members, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const dropdown = dropdownRefs.current[activeDropdown];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  const handleInvitationSuccess = () => {
    setMessage({ text: "Invitation sent successfully", type: "success" });
    reloadInvitations();
    setIsInviting(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (
      !selectedOrganization ||
      !confirm("Are you sure you want to remove this member?")
    )
      return;

    try {
      console.log("Removing member", memberId);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      reloadMembers();
      setMessage({ text: "Member removed successfully", type: "success" });
    } catch (error) {
      console.error("Failed to remove member", error);
      setMessage({ text: "Failed to remove member", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await discardInvitation(invitationId);
      reloadInvitations();
      setMessage({
        text: "Invitation cancelled successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to cancel invitation", error);
      setMessage({ text: "Failed to cancel invitation", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleRole = async (
    memberId: string,
    roleId: string,
    hasRole: boolean
  ) => {
    try {
      if (hasRole) {
        await removeRole(memberId, roleId);
        setMessage({ text: "Role removed successfully", type: "success" });
      } else {
        await addRole(memberId, roleId);
        setMessage({ text: "Role added successfully", type: "success" });
      }
      reloadMembers();
    } catch (error) {
      console.error("Failed to update role", error);
      setMessage({ text: "Failed to update role", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getInitials = (firstName: string = "", lastName: string = "") => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  const memberHasRole = (member: any, roleId: string) => {
    return member.roles?.some((role: any) => role.id === roleId) || false;
  };

  if (loading || membersLoading || invitationsLoading || rolesLoading) {
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
    <>
      <div style={{ position: "relative" }}>
        <SectionHeader
          title="Organization Members"
          actionLabel="Invite Member"
          onAction={() => setIsInviting(true)}
          buttonIcon={<UserPlus size={14} />}
        />
        {isInviting && (
          <InviteMemberPopover
            onClose={() => setIsInviting(false)}
            onSuccess={handleInvitationSuccess}
            roles={roles}
          />
        )}
      </div>

      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px",
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#b91c1c",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {message.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px 12px",
          backgroundColor: "#fff",
        }}
      >
        <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
        <input
          type="text"
          placeholder="Search members"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "14px",
            color: "#1e293b",
          }}
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#64748b",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
          }}
        >
          {searchQuery ? "No members match your search" : "No members yet"}
        </div>
      ) : (
        <div>
          {filteredMembers.map((member: any) => (
            <div
              key={member.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    fontWeight: 500,
                    fontSize: "16px",
                    overflow: "hidden",
                  }}
                >
                  {member.user && member.user.profile_picture_url ? (
                    <img
                      src={member.user.profile_picture_url}
                      alt={`${member.user.first_name || ""} ${
                        member.user.last_name || ""
                      }`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    getInitials(member.user?.first_name, member.user?.last_name)
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1e293b",
                    }}
                  >
                    {member.user
                      ? `${member.user.first_name || ""} ${
                          member.user.last_name || ""
                        }`.trim() ||
                        member.user.primary_email_address?.email ||
                        "User"
                      : "User"}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                    >
                      {member.roles?.map((role: any) => (
                        <span
                          key={role.id}
                          style={{
                            fontSize: "12px",
                            padding: "2px 8px",
                            background: "#f1f5f9",
                            borderRadius: "20px",
                          }}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div
                  style={{ position: "relative" }}
                  ref={(el) => {
                    dropdownRefs.current[member.id] = el;
                  }}
                >
                  <RoleDropdownButton
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === member.id ? null : member.id
                      )
                    }
                  >
                    <span>Manage Roles</span>
                    {activeDropdown === member.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </RoleDropdownButton>

                  <RoleDropdownContainer isOpen={activeDropdown === member.id}>
                    <RoleHeading>Available Roles</RoleHeading>
                    {roles.map((role) => {
                      const hasRole = memberHasRole(member, role.id);
                      return (
                        <RoleDropdownItem
                          key={role.id}
                          isActive={hasRole}
                          onClick={() =>
                            toggleRole(member.id, role.id, hasRole)
                          }
                        >
                          <span>{role.name}</span>
                          {hasRole && <Check size={14} color="#16a34a" />}
                        </RoleDropdownItem>
                      );
                    })}
                  </RoleDropdownContainer>
                </div>

                <button
                  onClick={() => handleRemoveMember(member.id)}
                  style={{
                    width: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#ef4444",
                  }}
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {invitations?.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3
            style={{
              fontSize: "15px",
              color: "#64748b",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Pending Invitations ({invitations?.length})
          </h3>

          <div>
            {invitations?.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <Plus size={16} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {invitation.email}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          background: "#fff8e6",
                          color: "#854d0e",
                          borderRadius: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <AlertTriangle size={12} />
                        Pending
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {invitation.initial_organization_role?.name}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvitation(invitation.id)}
                  style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#ef4444",
                  }}
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const BillingSection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();

  const [currentTab, setCurrentTab] = useState<"plans" | "invoices">("plans");

  const plans: BillingPlan[] = [
    {
      id: "free",
      name: "Free",
      description: "Basic features for small teams",
      price: 0,
      features: ["Up to 5 team members", "Basic analytics", "1 GB storage"],
      current: true,
    },
    {
      id: "pro",
      name: "Professional",
      description: "Advanced features for growing teams",
      price: 19.99,
      features: [
        "Unlimited team members",
        "Advanced analytics",
        "10 GB storage",
        "Premium support",
      ],
      current: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Full features for large organizations",
      price: 49.99,
      features: [
        "Unlimited everything",
        "Dedicated support",
        "Custom integrations",
        "Advanced security",
      ],
      current: false,
    },
  ];

  const invoices: BillingInvoice[] = [
    {
      id: "inv-001",
      amount: 19.99,
      status: "paid",
      date: "2023-05-15",
      pdf_url: "#",
    },
    {
      id: "inv-002",
      amount: 19.99,
      status: "paid",
      date: "2023-04-15",
      pdf_url: "#",
    },
    {
      id: "inv-003",
      amount: 19.99,
      status: "paid",
      date: "2023-03-15",
      pdf_url: "#",
    },
  ];

  const handleChangePlan = (planId: string) => {
    // Would implement API call to change plan
    console.log(`Changing to plan: ${planId}`);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // Would implement logic to download invoice
    console.log(`Downloading invoice: ${invoiceId}`);
  };

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
      <SectionHeader title="Billing & Usage" />

      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          <button
            style={{
              padding: "8px 16px",
              background: currentTab === "plans" ? "#6366f1" : "transparent",
              color: currentTab === "plans" ? "white" : "#64748b",
              border: "none",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
            }}
            onClick={() => setCurrentTab("plans")}
          >
            Subscription Plans
          </button>
          <button
            style={{
              padding: "8px 16px",
              background: currentTab === "invoices" ? "#6366f1" : "transparent",
              color: currentTab === "invoices" ? "white" : "#64748b",
              border: "none",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
            }}
            onClick={() => setCurrentTab("invoices")}
          >
            Billing History
          </button>
        </div>

        {currentTab === "plans" && (
          <div>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "16px",
              }}
            >
              Select a subscription plan that fits your organization's needs
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    border: `1px solid ${plan.current ? "#6366f1" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    padding: "16px",
                    background: plan.current ? "#f5f7ff" : "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {plan.name}
                        {plan.current && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "12px",
                              background: "#6366f1",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "20px",
                            }}
                          >
                            Current Plan
                          </span>
                        )}
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "14px",
                          color: "#64748b",
                        }}
                      >
                        {plan.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        ${plan.price}
                        <span style={{ fontSize: "14px", fontWeight: 400 }}>
                          /month
                        </span>
                      </div>
                      {!plan.current && (
                        <button
                          onClick={() => handleChangePlan(plan.id)}
                          style={{
                            marginTop: "8px",
                            padding: "6px 12px",
                            background: "#6366f1",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 500,
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      Features:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            marginBottom: "4px",
                          }}
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === "invoices" && (
          <div>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "16px",
              }}
            >
              View and download your billing history
            </p>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: "#64748b",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                <div></div>
              </div>

              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "14px",
                    color: "#1e293b",
                    alignItems: "center",
                  }}
                >
                  <div>{new Date(invoice.date).toLocaleDateString()}</div>
                  <div>${invoice.amount.toFixed(2)}</div>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        background:
                          invoice.status === "paid" ? "#dcfce7" : "#fee2e2",
                        color:
                          invoice.status === "paid" ? "#166534" : "#b91c1c",
                      }}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <IconButton
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <FileText size={16} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SecuritySection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();

  const [security, setSecurity] = useState({
    mfa_required: false,
    ip_restrictions: false,
    allowed_ips: "",
    default_workspace_id: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [_, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock workspaces for the combobox
  const workspaces = [
    { id: "ws1", name: "Engineering" },
    { id: "ws2", name: "Marketing" },
    { id: "ws3", name: "Sales" },
    { id: "ws4", name: "Product" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization) return;

    try {
      setIsSubmitting(true);
      console.log("Updating security settings:", security);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage("Security settings updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update security settings", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMfa = () => {
    setSecurity((prev) => ({ ...prev, mfa_required: !prev.mfa_required }));
  };

  const handleToggleIpRestrictions = () => {
    setSecurity((prev) => ({
      ...prev,
      ip_restrictions: !prev.ip_restrictions,
    }));
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) return;

    try {
      console.log("Deleting organization:", selectedOrganization.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.href = "/"; // Redirect after deletion
    } catch (error) {
      console.error("Failed to delete organization", error);
    }
  };

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
    <>
      <SectionHeader
        title="Security & Access"
        actionLabel="Save Settings"
        onAction={console.log}
        buttonIcon={<Save size={14} />}
      />

      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px 12px",
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

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          paddingBottom: "32px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              Multi-Factor Authentication (MFA)
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Require all members to set up MFA for added security
            </div>
          </div>
          <Switch>
            <input
              type="checkbox"
              checked={security.mfa_required}
              onChange={handleToggleMfa}
            />
            <span></span>
          </Switch>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: security.ip_restrictions ? "16px" : "0",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "14px",
                }}
              >
                IP Restrictions
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                Limit access to specific IP addresses
              </div>
            </div>
            <Switch>
              <input
                type="checkbox"
                checked={security.ip_restrictions}
                onChange={handleToggleIpRestrictions}
              />
              <span></span>
            </Switch>
          </div>

          {security.ip_restrictions && (
            <div style={{ marginTop: "16px", marginBottom: "16px" }}>
              <FormGroup>
                <Label>Allowed IP Addresses</Label>
                <Input
                  as="textarea"
                  value={security.allowed_ips}
                  onChange={(e) =>
                    setSecurity((prev) => ({
                      ...prev,
                      allowed_ips: e.target.value,
                    }))
                  }
                  placeholder="Enter IP addresses (one per line)"
                  style={{
                    minHeight: "80px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginTop: "8px",
                  }}
                >
                  Enter one IP address or CIDR range per line (e.g., 192.168.1.1
                  or 192.168.1.0/24)
                </div>
              </FormGroup>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              Default Workspace
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              New members will be added to this workspace
            </div>
          </div>
          <div style={{ width: "180px" }}>
            <ComboBox
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: workspace.name,
              }))}
              value={security.default_workspace_id}
              onChange={(value) =>
                setSecurity((prev) => ({
                  ...prev,
                  default_workspace_id: value,
                }))
              }
              placeholder="Select workspace"
            />
          </div>
        </div>
      </form>

      <div>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#ef4444",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={16} />
          Danger Zone
        </h3>

        <div
          style={{
            padding: "16px",
            background: "#fff",
            borderLeft: "3px solid #ef4444",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: "4px",
                  fontSize: "14px",
                  color: "#b91c1c",
                }}
              >
                Delete Organization
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                This action cannot be undone. All data will be permanently
                deleted.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "6px 12px",
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: "4px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "#fee2e2",
                borderTop: "1px solid #fecaca",
              }}
            >
              <div style={{ marginBottom: "16px", color: "#b91c1c" }}>
                Are you sure you want to delete this organization? This action
                cannot be undone.
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: "6px 12px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  style={{
                    padding: "6px 12px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: 500,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const RolesSection = () => {
  const { activeOrganization, loading, getRoles } = useActiveOrganization();

  const [rolePopover, setRolePopover] = useState<{
    isOpen: boolean;
    role?: OrganizationRole;
  }>({ isOpen: false });
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: roles = [],
    isLoading: rolesLoading,
    mutate: reloadRoles,
  } = useSWR(
    activeOrganization
      ? `/api/organizations/${activeOrganization.id}/roles`
      : null,
    () => getRoles?.() || []
  );

  const filteredRoles = React.useMemo(() => {
    if (!searchQuery) return roles;
    return roles.filter((role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  const handleRoleSaved = async (role: {
    id?: string;
    name: string;
    description?: string;
  }) => {
    try {
      // Check if we're editing or creating
      if (role.id) {
        // Updating existing role
        console.log("Updating role:", role);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setMessage({
          text: "Role updated successfully",
          type: "success",
        });
      } else {
        // Creating new role
        console.log("Creating new role:", role);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setMessage({
          text: "Role created successfully",
          type: "success",
        });
      }

      setRolePopover({ isOpen: false });
      reloadRoles();
    } catch (error) {
      // Handle error based on whether we were editing or creating
      if (role.id) {
        console.error("Failed to update role", error);
        setMessage({
          text: "Failed to update role",
          type: "error",
        });
      } else {
        console.error("Failed to create role", error);
        setMessage({
          text: "Failed to create role",
          type: "error",
        });
      }
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      // Mock implementation for deleting a role
      console.log("Deleting role:", roleId);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage({ text: "Role deleted successfully", type: "success" });
      reloadRoles();
    } catch (error) {
      console.error("Failed to delete role", error);
      setMessage({ text: "Failed to delete role", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getRoleIcon = (roleName: string) => {
    const lowerName = roleName.toLowerCase();
    if (lowerName === "admin") {
      return (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "8px",
            backgroundColor: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#EF4444",
          }}
        >
          <Shield size={20} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "8px",
          backgroundColor: "#F0F7FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3B82F6",
        }}
      >
        <Users size={20} />
      </div>
    );
  };

  if (loading || rolesLoading) {
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
    <>
      <div style={{ position: "relative" }}>
        <SectionHeader
          title="Organization Roles"
          actionLabel="Create Role"
          onAction={() => setRolePopover({ isOpen: true })}
          buttonIcon={<Plus size={14} />}
        />
        {rolePopover.isOpen && (
          <AddRolePopover
            role={rolePopover.role}
            onClose={() => setRolePopover({ isOpen: false })}
            onSuccess={handleRoleSaved}
          />
        )}
      </div>

      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px",
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#b91c1c",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {message.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px 12px",
          backgroundColor: "#fff",
        }}
      >
        <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
        <input
          type="text"
          placeholder="Search roles"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "14px",
            color: "#1e293b",
          }}
        />
      </div>

      {filteredRoles.length === 0 ? (
        <div
          style={{
            padding: "20px 0",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          {searchQuery
            ? "No roles match your search"
            : "No roles defined yet. Create your first role to get started."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {getRoleIcon(role.name)}

              <div style={{ marginLeft: "16px", flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {role.name}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  {role.permissions.join(", ")}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <IconButton
                  onClick={() => setRolePopover({ isOpen: true, role })}
                >
                  <Edit size={18} />
                </IconButton>
                <IconButton
                  style={{ color: "#ef4444" }}
                  onClick={() => handleDeleteRole(role.id)}
                >
                  <Trash size={18} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export const ManageOrganization = () => {
  const { loading } = useActiveOrganization();
  const [screen, setScreen] = useState<Screen>(null);

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
      <ScreenContext.Provider value={{ screen, setScreen }}>
        <Container>
          <Layout>
            <div
              style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <MainContent $isAdding={!!screen}>
                <OrganizationManagementSection />
              </MainContent>

              <AddItemForm $isVisible={!!screen}>
                {match(screen)
                  .with("general", () => <GeneralSettingsSection />)
                  .with("domains", () => <DomainsSection />)
                  .with("members", () => <MembersSection />)
                  .with("billing", () => <BillingSection />)
                  .with("security", () => <SecuritySection />)
                  .with("roles", () => <RolesSection />)
                  .otherwise(() => null)}
              </AddItemForm>
            </div>
          </Layout>
        </Container>
      </ScreenContext.Provider>
    </TypographyProvider>
  );
};

export default ManageOrganization;
