import React, { createContext, useContext, useMemo, useState } from "react";
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
  Copy,
  ExternalLink,
  Trash,
  FileText,
  Check,
  Save,
  UserPlus2,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { match } from "ts-pattern";
import { AddDomainPopover } from "./add-domain-popover";
import useSWR from "swr";
import { InviteMemberPopover } from "./invite-member-popover";
import { OrganizationRole, OrganizationDomain } from "@/types/organization";
import { AddRolePopover } from "./add-role-popover";
import {
  Button,
  Input,
  SearchInput,
  Spinner,
  Switch,
  ComboBox,
  Dropdown,
  DropdownItems,
  DropdownItem,
  DropdownTrigger,
  FormGroup,
  Label,
  DropdownDivider,
  Form,
} from "@/components/utility";
import { useWorkspaceList } from "@/hooks/use-workspace";

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
  width: 100%;
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
  overflow-x: hidden;
  transform: translateX(${(props) => (props.$isVisible ? "-100%" : "0")});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

type Screen =
  | "general"
  | "members"
  | "domains"
  | "billing"
  | "security"
  | "roles"
  | "audit-logs"
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
          <Avatar src={organization.image_url} alt="Organization Logo" />
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

        <InfoItem onClick={() => setScreen("audit-logs")}>
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
          gap: "8px",
          fontSize: 16,
          cursor: "pointer",
        }}
        onClick={() => setScreen(null)}
      >
        <ArrowLeft size={16} />
        <SectionTitle style={{ fontSize: 14 }}>{title}</SectionTitle>
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
    selectedOrganization?.description || "",
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedOrganization?.image_url || null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

      <Form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          gap: "16px",
          paddingBottom: "32px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ position: "relative" }}>
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
      </Form>

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
                Leave Organization
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                Your membership will be revoked and you will not be able to join
                back unless you are invited by an admin
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
                  onClick={console.log}
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

const Badge = styled.span`
  background: #fff8e6;
  color: #854d0e;
  padding: 0px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: center;
  max-width: max-content;
  gap: 2px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid #e2e8f0;
  padding: 3px;
  cursor: pointer;
  color: #64748b;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 11px;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }
`;

const DomainsSection = () => {
  const {
    activeOrganization,
    loading,
    getDomains: getOrganizationDomains,
  } = useActiveOrganization();

  const {
    data: domainsFromAPI = [],
    isLoading,
    mutate,
  } = useSWR(
    activeOrganization?.id ? `/domains/${activeOrganization.id}` : null,
    async () => {
      const realDomains = (await getOrganizationDomains?.()) || [];
      return realDomains.map((domain, index) => ({
        ...domain,
        verified:
          domain.verified !== undefined ? domain.verified : index % 2 === 0,
      }));
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    },
  );
  const domains = domainsFromAPI as Array<
    OrganizationDomain & { verified: boolean }
  >;

  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [domainInVerification, setDomainInVerification] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainInAction, setSelectedDomainAction] = useState<
    string | null
  >(null);

  const filteredDomains = React.useMemo(() => {
    let tempDomains = domains;
    if (searchQuery.trim() !== "") {
      const lowercasedQuery = searchQuery.toLowerCase();
      tempDomains = tempDomains.filter((domain) =>
        domain.fqdn.toLowerCase().includes(lowercasedQuery),
      );
    }
    return tempDomains;
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
        style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <SectionHeader title="Organization Domains" />
      <HeaderCTAContainer>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Domain"
        />
        <div>
          <Button onClick={() => setIsAddingDomain(true)}>New Domain</Button>
          {isAddingDomain && (
            <AddDomainPopover onClose={() => setIsAddingDomain(false)} />
          )}
        </div>
      </HeaderCTAContainer>

      {!filteredDomains?.length ? (
        <EmptyTableMessage>
          {searchQuery !== "all"
            ? "No domains match your criteria"
            : "No domains added"}
        </EmptyTableMessage>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Domain</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Date Added</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDomains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCellFlex>{domain.fqdn}</TableCellFlex>
                <StatusCell>
                  {domain.verified ? (
                    <Badge style={{ background: "#E6F9F0", color: "#0A7156" }}>
                      <CheckCircle size={12} /> Verified
                    </Badge>
                  ) : (
                    <Badge
                      style={{
                        background: "#FEF9C3",
                        color: "#854D0E",
                        border: "1px solid #FEF08A",
                      }}
                    >
                      <AlertTriangle size={9} /> Pending Verification
                    </Badge>
                  )}
                </StatusCell>
                <TableCell>
                  {new Date(domain.created_at).toLocaleDateString()}
                </TableCell>
                <ActionsCell>
                  <Dropdown
                    style={{ marginLeft: "auto" }}
                    open={selectedDomainInAction === domain.id}
                    openChange={(v) =>
                      setSelectedDomainAction(v ? domain.id : null)
                    }
                  >
                    <DropdownTrigger>
                      <IconButton>
                        <MoreVertical size={14} />
                      </IconButton>
                    </DropdownTrigger>
                    {domainInVerification === domain.id && (
                      <AddDomainPopover
                        domain={domain}
                        onClose={() => setDomainInVerification(null)}
                      />
                    )}

                    <DropdownItems>
                      {!domain.verified && (
                        <DropdownItem
                          onClick={() => {
                            handleVerifyDomain(domain.id);
                            setSelectedDomainAction(null);
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <CheckCircle size={16} color="#6366f1" /> Verify
                            Domain
                          </div>
                        </DropdownItem>
                      )}
                      <DropdownItem
                        onClick={() => {
                          setSelectedDomainAction(null);
                          console.log("copy", domain.fqdn);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Copy size={16} color="#64748b" /> Copy Domain
                        </div>
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => {
                          window.open(`https://${domain.fqdn}`, "_blank");
                          setSelectedDomainAction(null);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <ExternalLink size={16} color="#64748b" /> Visit
                          Domain
                        </div>
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        $destructive
                        onClick={() => {
                          handleDeleteDomain(domain.id);
                          setSelectedDomainAction(null);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Trash size={16} color="#ef4444" /> Remove Domain
                        </div>
                      </DropdownItem>
                    </DropdownItems>
                  </Dropdown>
                </ActionsCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

const RoleDropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  width: 140px;
  background: #f8fafc;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const MembersSection = () => {
  const {
    activeOrganization,
    loading,
    getMembers,
    // getInvitations,
    getRoles,
    addRole,
    removeRole,
  } = useActiveOrganization();
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [activeMemberRoleDropdown, setActiveMemberRoleDropdown] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: members = [],
    isLoading: membersLoading,
    mutate: reloadMembers,
  } = useSWR(
    activeOrganization
      ? `/api/organizations/${activeOrganization.id}/members`
      : null,
    () => getMembers?.() || [],
  );
  // const {
  //   data: invitations = [],
  //   isLoading: invitationsLoading,
  //   mutate: reloadInvitations,
  // } = useSWR(
  //   activeOrganization
  //     ? `/api/organizations/${activeOrganization.id}/invitations`
  //     : null,
  //   () => getInvitations?.() || [],
  // );
  const { data: rolesData = [], isLoading: rolesLoading } = useSWR(
    activeOrganization
      ? `/api/organizations/${activeOrganization.id}/roles`
      : null,
    () => getRoles?.() || [],
  );
  const roles = rolesData as OrganizationRole[];

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

  // const handleInvitationSuccess = () => {
  //   setMessage({ text: "Invitation sent successfully", type: "success" });
  //   reloadInvitations();
  //   setIsInviting(false);
  //   setTimeout(() => setMessage(null), 3000);
  // };
  const handleRemoveMember = async (memberId: string) => {
    if (
      !activeOrganization ||
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
  // const handleCancelInvitation = async (invitationId: string) => {
  //   try {
  //     await discardInvitation(invitationId);
  //     reloadInvitations();
  //     setMessage({
  //       text: "Invitation cancelled successfully",
  //       type: "success",
  //     });
  //   } catch (error) {
  //     console.error("Failed to cancel invitation", error);
  //     setMessage({ text: "Failed to cancel invitation", type: "error" });
  //   } finally {
  //     setTimeout(() => setMessage(null), 3000);
  //   }
  // };

  const toggleRole = async (
    memberId: string,
    roleId: string,
    hasRole: boolean,
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
      setActiveMemberRoleDropdown(null); // Close dropdown after role change
    } catch (error) {
      console.error("Failed to update role", error);
      setMessage({ text: "Failed to update role", type: "error" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const getInitials = (firstName = "", lastName = "") =>
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  const memberHasRole = (member: any, roleId: string) =>
    member.roles?.some((r: any) => r.id === roleId) || false;

  if (loading || membersLoading || rolesLoading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}
      >
        <Spinner />
      </div>
    );

  return (
    <>
      <div style={{ position: "relative" }}>
        <SectionHeader title="Organization Members" />
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
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search members"
        />
        <div>
          <Button onClick={() => setIsInviting(true)}>
            <UserPlus2 size={12} />
            <span>Invite Members</span>
          </Button>
          {isInviting && (
            <InviteMemberPopover
              onClose={() => setIsInviting(false)}
              onSuccess={console.log}
              roles={roles}
            />
          )}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <EmptyTableMessage>
          {searchQuery ? "No members match your search" : "No members yet"}
        </EmptyTableMessage>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Member</TableHeader>
              <TableHeader>Roles</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.map((member: any) => (
              <TableRow key={member.id}>
                <TableCellFlex>
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
                      getInitials(
                        member.user?.first_name,
                        member.user?.last_name,
                      )
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "#334155",
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
                      {member.user?.primary_email_address?.email}
                    </div>
                  </div>
                </TableCellFlex>
                <TableCell>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                    }}
                  >
                    {member.roles?.map((role: OrganizationRole) => (
                      <span
                        key={role.id}
                        style={{
                          padding: "1px 5px",
                          background: "#f1f5f9",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          color: "#64748b",
                        }}
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <ActionsCell>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Dropdown>
                      <DropdownTrigger>
                        <RoleDropdownButton
                          onClick={() =>
                            setActiveMemberRoleDropdown(
                              activeMemberRoleDropdown === member.id
                                ? null
                                : member.id,
                            )
                          }
                        >
                          <span>
                            {member.roles?.[0]?.name || "Assign Role"}
                            {member.roles?.length > 1
                              ? ` +${member.roles.length - 1}`
                              : ""}
                          </span>
                          {activeMemberRoleDropdown === member.id ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </RoleDropdownButton>
                      </DropdownTrigger>
                      <DropdownItems>
                        {roles.map((role) => {
                          const hasRole = memberHasRole(member, role.id);
                          return (
                            <DropdownItem
                              key={role.id}
                              onClick={() =>
                                toggleRole(member.id, role.id, hasRole)
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  width: "100%",
                                }}
                              >
                                <span>{role.name}</span>
                                {hasRole && <Check size={16} color="#16a34a" />}
                              </div>
                            </DropdownItem>
                          );
                        })}
                      </DropdownItems>
                    </Dropdown>
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
                </ActionsCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Plan</TableHeader>
                  <TableHeader>Price</TableHeader>
                  <TableHeader>Features</TableHeader>
                  <TableHeader></TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    style={{
                      background: plan.current ? "#f5f7ff" : "white",
                    }}
                  >
                    <TableCellFlex>
                      <div>
                        <div
                          style={{
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
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                          }}
                        >
                          {plan.description}
                        </div>
                      </div>
                    </TableCellFlex>
                    <TableCell>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        ${plan.price}
                        <span style={{ fontSize: "14px", fontWeight: 400 }}>
                          /month
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {!plan.current && (
                        <button
                          onClick={() => handleChangePlan(plan.id)}
                          style={{
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader></TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "1px 6px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          background:
                            invoice.status === "paid" ? "#dcfce7" : "#fee2e2",
                          color:
                            invoice.status === "paid" ? "#166534" : "#b91c1c",
                          border: "1px solid",
                          borderColor:
                            invoice.status === "paid" ? "#86efac" : "#fecaca",
                          fontWeight: 400,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </span>
                    </TableCell>
                    <ActionsCell>
                      <IconButton
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <FileText size={14} />
                      </IconButton>
                    </ActionsCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

const SecuritySection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();
  const { workspaces: workspaceList } = useWorkspaceList();

  const [security, setSecurity] = useState({
    mfa_required: false,
    ip_restrictions: false,
    allowed_ips: "",
    default_workspace_id: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [_, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const workspaces = useMemo(() => {
    const currentOrgWorkspaces = workspaceList.filter(
      (workspace) => workspace.organization.id === selectedOrganization?.id,
    );
    return currentOrgWorkspaces;
  }, [workspaceList, selectedOrganization?.id]);

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

      <Form
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
      </Form>

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
    () => getRoles?.() || [],
  );

  const filteredRoles = React.useMemo(() => {
    if (!searchQuery) return roles;
    return roles.filter((role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
      <SectionHeader title="Organization Roles" />
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

      <HeaderCTAContainer>
        <SearchInput
          placeholder="Search roles"
          onChange={setSearchQuery}
          value={searchQuery}
        />

        <div>
          <Button>
            <Plus size={14} />
            <span>Add role </span>
          </Button>

          {rolePopover.isOpen && (
            <AddRolePopover
              role={rolePopover.role}
              onClose={() => setRolePopover({ isOpen: false })}
              onSuccess={handleRoleSaved}
            />
          )}
        </div>
      </HeaderCTAContainer>

      {filteredRoles.length === 0 ? (
        <EmptyTableMessage>
          {searchQuery
            ? "No roles match your search"
            : "No roles defined yet. Create your first role to get started."}
        </EmptyTableMessage>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Role</TableHeader>
              <TableHeader>Permissions</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCellFlex>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {role.name}
                  </div>
                </TableCellFlex>
                <TableCell>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                    }}
                  >
                    {role.permissions.join(", ")}
                  </div>
                </TableCell>
                <ActionsCell>
                  <Dropdown style={{ marginLeft: "auto" }}>
                    <DropdownTrigger>
                      <IconButton>
                        <MoreVertical size={14} />
                      </IconButton>
                    </DropdownTrigger>

                    <DropdownItems>
                      <DropdownItem
                        onClick={() => {
                          setRolePopover({ isOpen: true, role });
                        }}
                      >
                        Edit Role
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        $destructive
                        onClick={() => {
                          handleDeleteRole(role.id);
                        }}
                      >
                        Remove Role
                      </DropdownItem>
                    </DropdownItems>
                  </Dropdown>
                </ActionsCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};

interface SeverityIndicatorProps {
  severity: "critical" | "warning" | "info";
  style?: React.CSSProperties;
}

const SeverityIndicator = ({ severity, style }: SeverityIndicatorProps) => {
  let bgColor = "";
  let textColor = "";
  let label = "";

  switch (severity) {
    case "critical":
      bgColor = "#FEE2E2";
      textColor = "#B91C1C";
      label = "Critical";
      break;
    case "warning":
      bgColor = "#FEF3C7";
      textColor = "#92400E";
      label = "Warning";
      break;
    case "info":
    default:
      bgColor = "#E0F2FE";
      textColor = "#0369A1";
      label = "Info";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 400,
        padding: "0px 4px",
        borderRadius: "4px",
        backgroundColor: bgColor,
        color: textColor,
        border: "1px solid rgba(0, 0, 0, 0.05)",
        ...style,
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: textColor,
          marginRight: "4px",
        }}
      />
      {label}
    </span>
  );
};

const FilterButton = styled(RoleDropdownButton)`
  padding: 8px 12px;
  gap: 12px;
  width: fit-content;
`;

// Define the AuditLogEntry interface (Restored)
interface AuditLogEntry {
  id: string;
  date: string;
  actor: string;
  action: string;
  description: string;
  severity: "critical" | "warning" | "info";
}

const AuditLogsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<
    "all" | "critical" | "warning" | "info"
  >("all");

  const logs: AuditLogEntry[] = [
    {
      id: "1",
      date: "2024-06-01T10:15:00Z",
      actor: "Alice Smith",
      action: "Added member",
      description: "Added Bob Jones to the organization as Admin.",
      severity: "info",
    },
    {
      id: "2",
      date: "2024-06-02T14:30:00Z",
      actor: "Bob Jones",
      action: "Changed role",
      description: "Changed Charlie Brown's role from Member to Admin.",
      severity: "warning",
    },
    {
      id: "3",
      date: "2024-06-03T09:00:00Z",
      actor: "Alice Smith",
      action: "Removed domain",
      description: "Removed domain example.com from verified domains.",
      severity: "critical",
    },
    {
      id: "4",
      date: "2024-06-04T16:45:00Z",
      actor: "Charlie Brown",
      action: "Updated security settings",
      description: "Enabled MFA requirement for all members.",
      severity: "warning",
    },
    {
      id: "5",
      date: "2024-06-05T11:00:00Z",
      actor: "System",
      action: "Generated report",
      description: "Monthly activity report generated successfully.",
      severity: "info",
    },
  ];

  const filteredLogs = React.useMemo(() => {
    let tempLogs = logs;
    if (selectedSeverity !== "all") {
      tempLogs = tempLogs.filter((log) => log.severity === selectedSeverity);
    }
    if (searchQuery.trim() !== "") {
      const lowercasedQuery = searchQuery.toLowerCase();
      tempLogs = tempLogs.filter(
        (log) =>
          log.action.toLowerCase().includes(lowercasedQuery) ||
          log.actor.toLowerCase().includes(lowercasedQuery) ||
          log.description.toLowerCase().includes(lowercasedQuery),
      );
    }
    return tempLogs;
  }, [searchQuery, selectedSeverity, logs]);

  const severityOptions: { value: typeof selectedSeverity; label: string }[] = [
    { value: "all", label: "All Levels" },
    { value: "critical", label: "Critical" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
  ];

  // *** RESTORED RETURN STATEMENT AND JSX ***
  return (
    <div>
      <SectionHeader title="Audit Logs" />
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "16px",
          marginBottom: "16px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="search by action, actor, or description"
        />
        <Dropdown>
          <DropdownTrigger>
            <FilterButton>
              <span>
                {severityOptions.find((opt) => opt.value === selectedSeverity)
                  ?.label || "Filter by Severity"}
              </span>
              <ChevronDown size={16} color="#16a34a" />
            </FilterButton>
          </DropdownTrigger>
          <DropdownItems>
            {severityOptions.map((option) => (
              <DropdownItem
                key={option.value}
                onClick={() => {
                  setSelectedSeverity(option.value);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span>{option.label}</span>
                  {selectedSeverity === option.value && (
                    <Check size={16} color="#16a34a" />
                  )}
                </div>
              </DropdownItem>
            ))}
          </DropdownItems>
        </Dropdown>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyTableMessage>
          {searchQuery.trim() !== "" || selectedSeverity !== "all"
            ? "No audit logs match your search criteria."
            : "No audit log events found."}
        </EmptyTableMessage>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Severity</TableHeader>
              <TableHeader>Action</TableHeader>
              <TableHeader>Actor</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Timestamp</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <SeverityIndicator severity={log.severity} />
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.actor}</TableCell>
                <TableCell>{log.description}</TableCell>
                <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
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
                  .with("audit-logs", () => <AuditLogsSection />)
                  .otherwise(() => null)}
              </AddItemForm>
            </div>
          </Layout>
        </Container>
      </ScreenContext.Provider>
    </TypographyProvider>
  );
};

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  font-size: 11px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  line-height: 1.4;
`;

const TableHead = styled.thead`
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const TableBody = styled.tbody`
  background-color: white;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const TableCell = styled.td`
  padding: 10px 16px;
  font-size: 12px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;

  ${TableRow}:last-child & {
    border-bottom: none;
  }
`;

const TableCellFlex = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusCell = styled(TableCell)`
  padding: 6px 12px;
`;

const ActionsCell = styled(TableCell)`
  text-align: right;
  width: 50px;
  white-space: nowrap;
  padding: 4px 6px;
`;

const EmptyTableMessage = styled.div`
  text-align: center;
  padding: 12px;
  background-color: #f8fafc;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 11px;
`;

export default ManageOrganization;
