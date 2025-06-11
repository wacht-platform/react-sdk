import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import {
  Building,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  Copy,
  ExternalLink,
  Trash,
  FileText,
  Check,
  ChevronUp,
  Info,
  CircleAlert,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks/use-deployment";
import { match } from "ts-pattern";
import { AddDomainPopover } from "./add-domain-popover";
import useSWR from "swr";
import { InviteMemberPopover } from "./invite-member-popover";
import {
  OrganizationRole,
  OrganizationDomain,
  OrganizationUpdate,
  OrganizationMembership,
} from "@/types/organization";
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
import { ConfirmationPopover } from "../utility/confirmation-popover";
import { ScreenContext, Screen, useScreenContext } from "./context";

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
  background: var(--color-background);
  border-radius: 20px;
  box-shadow: 0 8px 30px var(--color-shadow);
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
  color: var(--color-foreground);
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
  color: var(--color-foreground);
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 2px;
  border-bottom: 1px solid var(--color-border);
  gap: 12px;
  color: var(--color-foreground);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--color-input-background);
  }
`;

const InfoLabel = styled.div`
  color: var(--color-secondary-text);
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
  background: var(--color-background);
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

const OrganizationManagementSection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();
  const { setScreen } = useScreenContext();
  const { deployment } = useDeployment();

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

          <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
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
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
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
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
          </InfoContent>
        </InfoItem>

        {deployment?.b2b_settings?.custom_org_role_enabled && (
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
              <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
            </InfoContent>
          </InfoItem>
        )}

        <SectionTitle style={{ marginTop: "32px", marginBottom: "16px" }}>
          Administration
        </SectionTitle>

        <InfoItem onClick={() => setScreen("security")}>
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
              Track usage and manage subscriptions for your organization
            </div>
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
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
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
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
            <ArrowRight size={14} style={{ color: "var(--color-muted)" }} />
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
  const { setScreen } = useScreenContext();

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
        <Button
          onClick={onAction}
          style={{
            width: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {buttonIcon}
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  );
};

const GeneralSettingsSection = () => {
  const {
    activeOrganization: selectedOrganization,
    loading,
    updateOrganization,
  } = useActiveOrganization();
  const [name, setName] = useState(selectedOrganization?.name || "");
  const [description, setDescription] = useState(
    selectedOrganization?.description || ""
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedOrganization?.image_url || null
  );
  const [successMessage] = useState("");
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedOrganization) return;

    try {
      setIsSubmitting(true);
      const data: OrganizationUpdate = {};

      if (image) {
        data.image = image;
      }
      if (name) {
        data.name = name;
      }
      if (description) {
        data.description = description;
      }

      await updateOrganization?.(data);
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
        onAction={handleSubmit}
      />

      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px",
            background: "var(--color-success-background)",
            color: "var(--color-success)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✓{successMessage}
        </div>
      )}

      <Form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          gap: "16px",
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
                <Building size={36} color="var(--color-muted)" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageChange}
              />
            </button>
            <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>
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
              backgroundColor: "var(--color-input-background)",
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
              backgroundColor: "var(--color-input-background)",
              minHeight: "100px",
              resize: "vertical",
            }}
          />
        </FormGroup>
      </Form>

      <DeleteAccountAccordion
        handleDeleteAccount={console.log}
        title="Leave Organization"
        description="Leave this orgnization, you will not be able to join back unless invited by an admin"
      />
    </>
  );
};

const Badge = styled.span`
  background: var(--color-primary-background);
  color: var(--color-primary);
  padding: 0px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: center;
  max-width: max-content;
  gap: 2px;
  border: 1px solid var(--color-border);
  white-space: nowrap;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid var(--color-border);
  padding: 3px;
  cursor: pointer;
  color: var(--color-muted);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 11px;

  &:hover {
    background: var(--color-input-background);
    color: var(--color-foreground);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DomainsSection = () => {
  const {
    activeOrganization,
    loading,
    getDomains: getOrganizationDomains,
    removeDomain,
  } = useActiveOrganization();
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [domainForDeletion, setDomainForDeletion] = useState<string | null>(
    null
  );
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
    }
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
        domain.fqdn.toLowerCase().includes(lowercasedQuery)
      );
    }
    return tempDomains;
  }, [domains, searchQuery]);

  const handleDeleteDomain = async (domain: OrganizationDomain) => {
    await removeDomain(domain);
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
          <Button
            onClick={() => setIsAddingDomain(true)}
            style={{ width: "120px" }}
          >
            New Domain
          </Button>
          {isAddingDomain && (
            <AddDomainPopover
              onClose={() => {
                setIsAddingDomain(false);
                mutate();
              }}
            />
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
        <Table ref={tableRef}>
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
                    <Badge
                      style={{
                        background: "var(--color-primary-background)",
                        color: "var(--color-primary)",
                      }}
                    >
                      ✓ Verified
                    </Badge>
                  ) : (
                    <Badge
                      style={{
                        background: "var(--color-warning-background)",
                        color: "var(--color-warning)",
                        border: "1px solid var(--color-warning-border)",
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
                  {domainForDeletion === domain.id && (
                    <ConfirmationPopover
                      title="Are you sure you want to delete this domain?"
                      onConfirm={() => handleDeleteDomain(domain)}
                      onCancel={() => setDomainForDeletion(null)}
                    />
                  )}
                  <Dropdown
                    style={{ marginLeft: "auto" }}
                    open={selectedDomainInAction === domain.id}
                    openChange={(v) =>
                      setSelectedDomainAction(v ? domain.id : null)
                    }
                  >
                    <DropdownTrigger>
                      <IconButton>•••</IconButton>
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
                            ✓ Verify Domain
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
                          <Copy size={16} color="var(--color-muted)" /> Copy
                          Domain
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
                          <ExternalLink size={16} color="var(--color-muted)" />{" "}
                          Visit Domain
                        </div>
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        $destructive
                        onClick={() => {
                          setSelectedDomainAction(null);
                          setDomainForDeletion(domain.id);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Trash size={16} color="var(--color-error)" /> Remove
                          Domain
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
  background: var(--color-input-background);
  justify-content: space-between;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-border);
  }
`;

const MembersSection = () => {
  const {
    activeOrganization,
    loading,
    getMembers,
    // getInvitations,
    getRoles,
    addMemberRole,
    removeMemberRole,
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
    () => getMembers?.() || []
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
    () => getRoles?.() || []
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
    member: OrganizationMembership,
    role: OrganizationRole,
    hasRole: boolean
  ) => {
    try {
      if (hasRole) {
        await removeMemberRole(member, role);
        setMessage({ text: "Role removed successfully", type: "success" });
      } else {
        await addMemberRole(member, role);
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
            background:
              message.type === "success"
                ? "var(--color-success-background)"
                : "var(--color-error-background)",
            color:
              message.type === "success"
                ? "var(--color-success)"
                : "var(--color-error)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {message.type === "success" ? "✓" : <AlertTriangle size={16} />}
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
          <Button
            onClick={() => setIsInviting(true)}
            style={{ width: "140px" }}
          >
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
              <TableHeader style={{ paddingLeft: 8 }}>Roles</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCellFlex>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--color-input-background)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-muted)",
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
                        member.user?.last_name
                      )
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 400,
                        color: "var(--color-foreground)",
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
                    <div
                      style={{ fontSize: "13px", color: "var(--color-muted)" }}
                    >
                      {member.user?.primary_email_address?.email}
                    </div>
                  </div>
                </TableCellFlex>
                <ActionsCell>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      paddingRight: "8px",
                    }}
                  >
                    <Dropdown>
                      <DropdownTrigger>
                        <RoleDropdownButton
                          onClick={() =>
                            setActiveMemberRoleDropdown(
                              activeMemberRoleDropdown === member.id
                                ? null
                                : member.id
                            )
                          }
                        >
                          <span>
                            {member.roles?.[0]?.name || "Assign Role"}
                            {member.roles?.length > 1
                              ? ` +${member.roles.length - 1}`
                              : ""}
                          </span>
                        </RoleDropdownButton>
                      </DropdownTrigger>
                      <DropdownItems style={{ right: 40 }}>
                        {roles.map((role) => {
                          const hasRole = memberHasRole(member, role.id);
                          return (
                            <DropdownItem
                              key={role.id}
                              onClick={() => toggleRole(member, role, hasRole)}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  width: "100%",
                                }}
                              >
                                <span>{role.name}</span>
                                {hasRole && (
                                  <Check
                                    size={16}
                                    color="var(--color-success)"
                                  />
                                )}
                              </div>
                            </DropdownItem>
                          );
                        })}
                      </DropdownItems>
                    </Dropdown>
                    <Trash size={16} />
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
              background:
                currentTab === "plans" ? "var(--color-primary)" : "transparent",
              color:
                currentTab === "plans"
                  ? "var(--color-background)"
                  : "var(--color-muted)",
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
              background:
                currentTab === "invoices"
                  ? "var(--color-primary)"
                  : "transparent",
              color:
                currentTab === "invoices"
                  ? "var(--color-background)"
                  : "var(--color-muted)",
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
                color: "var(--color-muted)",
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
                      background: plan.current
                        ? "var(--color-primary-background)"
                        : "var(--color-background)",
                    }}
                  >
                    <TableCellFlex>
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {plan.name}
                          {plan.current && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "12px",
                                background: "var(--color-primary)",
                                color: "var(--color-background)",
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
                            color: "var(--color-muted)",
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
                          color: "var(--color-foreground)",
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
                              color: "var(--color-muted)",
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
                            background: "var(--color-primary)",
                            color: "var(--color-background)",
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
                color: "var(--color-muted)",
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
                            invoice.status === "paid"
                              ? "var(--color-success-background)"
                              : "var(--color-error-background)",
                          color:
                            invoice.status === "paid"
                              ? "var(--color-success)"
                              : "var(--color-error)",
                          border: "1px solid",
                          borderColor:
                            invoice.status === "paid"
                              ? "var(--color-success-background)"
                              : "var(--color-error-background)",
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
  const { activeOrganization, loading, updateOrganization } =
    useActiveOrganization();
  const { workspaces: workspaceList } = useWorkspaceList();
  const { deployment } = useDeployment();

  const [security, setSecurity] = useState({
    mfa_required: false,
    ip_restrictions: false,
    allowed_ips: "",
    default_workspace_id: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [_, setIsSubmitting] = useState(false);

  const workspaces = useMemo(() => {
    const currentOrgWorkspaces = workspaceList.filter(
      (workspace) => workspace.organization.id === activeOrganization?.id
    );
    return currentOrgWorkspaces;
  }, [workspaceList, activeOrganization?.id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeOrganization) return;

    try {
      const data: OrganizationUpdate = {};

      data.enable_ip_restriction = security.ip_restrictions;
      data.enforce_mfa_setup = security.mfa_required;
      data.whitelisted_ips = security.allowed_ips?.split("\n");
      data.auto_assigned_workspace_id = security.default_workspace_id;

      await updateOrganization?.(data);
      setSuccessMessage("Security settings updated successfully");
    } catch (error) {
      console.error("Failed to update security settings", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!activeOrganization) return;
    setSecurity({
      allowed_ips: activeOrganization.whitelisted_ips?.join("\n"),
      ip_restrictions: activeOrganization.enable_ip_restriction,
      mfa_required: activeOrganization.enforce_mfa,
      default_workspace_id: activeOrganization.auto_assigned_workspace_id,
    });
  }, [activeOrganization]);

  const handleToggleMfa = () => {
    setSecurity((prev) => ({ ...prev, mfa_required: !prev.mfa_required }));
  };

  const handleToggleIpRestrictions = () => {
    setSecurity((prev) => ({
      ...prev,
      ip_restrictions: !prev.ip_restrictions,
    }));
  };

  if (loading || !activeOrganization) {
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
        onAction={handleSubmit}
      />

      {successMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "8px 12px",
            background: "var(--color-success-background)",
            color: "var(--color-success)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✓{successMessage}
        </div>
      )}

      <Form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          paddingBottom: "32px",
          borderBottom: "1px solid var(--color-border)",
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
            <div style={{ fontSize: "14px", color: "var(--color-muted)" }}>
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

        {deployment?.b2b_settings?.ip_allowlist_per_org_enabled && (
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
                <div style={{ fontSize: "14px", color: "var(--color-muted)" }}>
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
              <div style={{ marginTop: "16px" }}>
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
                      backgroundColor: "var(--color-input-background)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-muted)",
                    }}
                  >
                    Enter one IP address or CIDR range per line (e.g., 192.168.1.1
                    or 192.168.1.0/24)
                  </div>
                </FormGroup>
              </div>
            )}
          </div>
        )}

        {deployment?.b2b_settings?.workspaces_enabled && (
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
              <div style={{ fontSize: "14px", color: "var(--color-muted)" }}>
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
        )}
      </Form>

      {deployment?.b2b_settings?.allow_org_deletion && (
        <DeleteAccountAccordion
          handleDeleteAccount={console.log}
          title="Delete Organization"
          description="Delete this organization, all associated members and workspaces will be deleted, and all associated data will be permanently removed."
        />
      )}
    </>
  );
};

const RolesSection = () => {
  const { activeOrganization, loading, getRoles, removeRole } =
    useActiveOrganization();
  const { deployment } = useDeployment();

  // Don't render if custom roles are disabled
  if (!deployment?.b2b_settings?.custom_org_role_enabled) {
    return null;
  }
  const [rolePopover, setRolePopover] = useState<{
    isOpen: boolean;
    role?: OrganizationRole;
  }>({ isOpen: false });
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [roleForOptionPopover, setRoleForOptionPopover] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleForDeletion, setRoleForDeletion] = useState<string | null>(null);

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
      if (role.id) {
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

  const handleDeleteRole = async (role: OrganizationRole) => {
    try {
      await removeRole(role);
      reloadRoles();
    } catch (error) {
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
            background:
              message.type === "success"
                ? "var(--color-success-background)"
                : "var(--color-error-background)",
            color:
              message.type === "success"
                ? "var(--color-success)"
                : "var(--color-error)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {message.type === "success" ? "✓" : <AlertTriangle size={16} />}
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
          <Button
            onClick={() => setRolePopover({ isOpen: true })}
            style={{ width: "100px" }}
          >
            Add role
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
                      color: "var(--color-muted)",
                    }}
                  >
                    {role.permissions.join(", ")}
                  </div>
                </TableCell>
                <ActionsCell>
                  {roleForDeletion === role.id && (
                    <ConfirmationPopover
                      title="Are you sure you want to delete this domain?"
                      onConfirm={() => handleDeleteRole(role)}
                      onCancel={() => setRoleForDeletion(null)}
                    />
                  )}
                  <Dropdown
                    open={roleForOptionPopover === role.id}
                    openChange={(open) =>
                      setRoleForOptionPopover(open ? role.id : null)
                    }
                    style={{ marginLeft: "auto" }}
                  >
                    <DropdownTrigger>
                      <IconButton disabled={!role.organization_id}>
                        •••
                      </IconButton>
                    </DropdownTrigger>

                    <DropdownItems>
                      <DropdownItem
                        onClick={() => {
                          setRoleForOptionPopover(null);
                          setRolePopover({ isOpen: true, role });
                        }}
                      >
                        Edit Role
                      </DropdownItem>
                      <DropdownItem
                        $destructive
                        onClick={() => {
                          setRoleForOptionPopover(null);
                          setRoleForDeletion(role.id);
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
      bgColor = "var(--color-error-background)";
      textColor = "var(--color-error)";
      label = "Critical";
      break;
    case "warning":
      bgColor = "var(--color-warning-background)";
      textColor = "var(--color-warning)";
      label = "Warning";
      break;
    case "info":
    default:
      bgColor = "var(--color-input-background)";
      textColor = "var(--color-primary)";
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
        border: "1px solid var(--color-border)",
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
          log.description.toLowerCase().includes(lowercasedQuery)
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
              <ChevronDown size={16} color="var(--color-success)" />
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
                    <Check size={16} color="var(--color-success)" />
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [setToastMessage]
  );

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
      <ScreenContext.Provider value={{ screen, setScreen, toast }}>
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

              {toastMessage && (
                <div
                  style={{
                    position: "relative",
                    bottom: "20px",
                    right: "20px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  {toastLevel === "error" && (
                    <CircleAlert size={14} color="var(--color-error)" />
                  )}
                  {toastLevel === "info" && (
                    <Info size={14} color="var(--color-primary)" />
                  )}
                  <span>{toastMessage}</span>
                </div>
              )}
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
  border: 1px solid var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  font-size: 11px;
  box-shadow: 0 1px 2px var(--color-shadow);
  line-height: 1.4;
`;

const TableHead = styled.thead`
  background-color: var(--color-input-background);
  border-bottom: 1px solid var(--color-border);
`;

const TableBody = styled.tbody`
  background-color: var(--color-background);
`;

const TableRow = styled.tr`
  border-bottom: 1px solid var(--color-border);
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 12px;
  color: var(--color-muted);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const TableCell = styled.td`
  padding: 10px 16px;
  font-size: 12px;
  color: var(--color-foreground);
  border-bottom: 1px solid var(--color-border);
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
  background-color: var(--color-input-background);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-top: 12px;
  font-size: 11px;
`;

const DeleteAccountAccordion = ({
  handleDeleteAccount,
  title,
  description,
}: {
  handleDeleteAccount: () => void;
  title: string;
  description: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
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
          color: "var(--color-error)",
          fontWeight: 500,
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} />
          {title}
        </div>
        <div style={{ transition: "transform 0.2s ease" }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            padding: "16px",
            background: "var(--color-error-background)",
            borderRadius: "8px",
            marginTop: "8px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            {description}
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--color-error)",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-background)",
              cursor: "pointer",
            }}
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageOrganization;
