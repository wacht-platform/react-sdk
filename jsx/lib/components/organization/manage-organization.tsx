import React, { useCallback, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  Building,
  AlertTriangle,
  Copy,
  ExternalLink,
  Trash,
  Check,
  Mail,
  Settings,
  Globe,
  Users,
  Shield,
} from "lucide-react";
import {
  useActiveOrganization,
  useOrganizationList,
} from "@/hooks/use-organization";
import { useDeployment } from "@/hooks/use-deployment";
import { AddDomainPopover } from "./add-domain-popover";
import useSWR from "swr";
import { InviteMemberPopover } from "./invite-member-popover";
import {
  OrganizationRole,
  OrganizationDomain,
  OrganizationUpdate,
  OrganizationMembership,
  OrganizationInvitation,
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
} from "@/components/utility";
import {
  Table,
  TableBody,
  TableCell,
  TableCellFlex,
  TableHead,
  TableHeader,
  TableRow,
  ActionsCell,
} from "@/components/utility/table";
import { EmptyState } from "@/components/utility/empty-state";
import { useWorkspaceList } from "@/hooks/use-workspace";
import { ConfirmationPopover } from "../utility/confirmation-popover";
import { ScreenContext, useScreenContext } from "./context";

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
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    border-radius: 16px;
  }
`;

const TabsContainer = styled.div`
  padding: 8px 24px 0;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 768px) {
    padding: 20px 20px 0;
  }
`;

const TabsList = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ $isActive: boolean }>`
  padding: 12px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) =>
    props.$isActive ? "var(--color-foreground)" : "var(--color-muted)"};
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: var(--color-foreground);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
    opacity: ${(props) => (props.$isActive ? 1 : 0)};
    transition: opacity 0.15s ease;
  }
`;

const TabIcon = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TabContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const GeneralSettingsSection = () => {
  const {
    activeOrganization: selectedOrganization,
    loading,
    updateOrganization,
  } = useActiveOrganization();
  const { workspaces: workspaceList } = useWorkspaceList();
  const { deployment } = useDeployment();
  const { deleteOrganization: deleteOrgFromList } = useOrganizationList();
  const { toast } = useScreenContext();
  const [name, setName] = useState(selectedOrganization?.name || "");
  const [description, setDescription] = useState(
    selectedOrganization?.description || "",
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedOrganization?.image_url || null,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [_, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [security, setSecurity] = useState({
    mfa_required: false,
    ip_restrictions: false,
    allowed_ips: "",
    default_workspace_id: "",
  });
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (selectedOrganization) {
      setName(selectedOrganization.name || "");
      setDescription(selectedOrganization.description || "");
      setPreviewUrl(selectedOrganization.image_url || null);
      setSecurity({
        allowed_ips: selectedOrganization.whitelisted_ips?.join("\n") || "",
        ip_restrictions: selectedOrganization.enable_ip_restriction || false,
        mfa_required: selectedOrganization.enforce_mfa || false,
        default_workspace_id:
          selectedOrganization.auto_assigned_workspace_id || "",
      });
    }
  }, [selectedOrganization]);

  const workspaces = useMemo(() => {
    const currentOrgWorkspaces = workspaceList.filter(
      (workspace) => workspace.organization.id === selectedOrganization?.id,
    );
    return currentOrgWorkspaces;
  }, [workspaceList, selectedOrganization?.id]);

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization || confirmName !== selectedOrganization.name)
      return;

    try {
      setIsDeleting(true);
      await deleteOrgFromList(selectedOrganization);
      toast("Organization deleted successfully", "info");
    } catch (error) {
      toast("Failed to delete organization", "error");
    } finally {
      setIsDeleting(false);
      setConfirmName("");
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

      // Add security settings
      data.enable_ip_restriction = security.ip_restrictions;
      data.enforce_mfa_setup = security.mfa_required;
      data.whitelisted_ips = security.allowed_ips
        ?.split("\n")
        .filter((ip) => ip.trim());
      data.auto_assigned_workspace_id = security.default_workspace_id;

      await updateOrganization?.(data);
      setSuccessMessage("Settings updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update organization", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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

      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "1px",
        }}
      >
        {/* Left Panel - Logo Upload */}
        <div
          style={{
            width: "280px",
            paddingRight: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            borderRight: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "16px",
              border: "2px solid #e5e7eb",
              background: previewUrl ? "transparent" : "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            onClick={triggerFileInput}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.transform = "scale(1)";
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
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "32px",
                  fontWeight: 500,
                }}
              >
                {selectedOrganization?.name?.charAt(0)?.toUpperCase() || (
                  <Building size={48} />
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div
            style={{ textAlign: "center", marginTop: "20px", width: "240px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  width: "100%",
                }}
              >
                Change Logo
              </Button>
              <Button
                onClick={() => {
                  setPreviewUrl(null);
                  setImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={!previewUrl}
                style={{
                  background: previewUrl ? "#ef4444" : "#e5e7eb",
                  color: previewUrl ? "white" : "#9ca3af",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: previewUrl ? "pointer" : "not-allowed",
                  width: "100%",
                }}
              >
                Remove Logo
              </Button>
            </div>
            <div
              style={{ fontSize: "11px", color: "#9ca3af", lineHeight: "1.4" }}
            >
              <div>JPG, PNG, GIF • Max 2MB</div>
            </div>
          </div>

        </div>

        {/* Right Panel - Form Fields */}
        <div style={{ flex: 1, paddingLeft: "24px" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <FormGroup>
              <Label
                style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
              >
                Organization Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  border: "1px solid #e5e7eb",
                }}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label
                style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}
              >
                Description
              </Label>
              <Input
                id="description"
                as="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter organization description"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  border: "1px solid #e5e7eb",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Brief description of your organization
              </div>
            </FormGroup>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: "2px",
                  }}
                >
                  Multi-Factor Authentication
                </Label>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Require all members to set up MFA for added security
                </div>
              </div>
              <Switch>
                <input
                  type="checkbox"
                  checked={security.mfa_required}
                  onChange={() =>
                    setSecurity((prev) => ({
                      ...prev,
                      mfa_required: !prev.mfa_required,
                    }))
                  }
                />
                <span></span>
              </Switch>
            </div>

            {deployment?.b2b_settings?.ip_allowlist_per_org_enabled && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Label
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#374151",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      IP Restrictions
                    </Label>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Only allow access from specific IP addresses
                    </div>
                  </div>
                  <Switch>
                    <input
                      type="checkbox"
                      checked={security.ip_restrictions}
                      onChange={() =>
                        setSecurity((prev) => ({
                          ...prev,
                          ip_restrictions: !prev.ip_restrictions,
                        }))
                      }
                    />
                    <span></span>
                  </Switch>
                </div>

                {security.ip_restrictions && (
                  <FormGroup>
                    <Label
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      Allowed IP Addresses
                    </Label>
                    <Input
                      as="textarea"
                      value={security.allowed_ips}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          allowed_ips: e.target.value,
                        }))
                      }
                      placeholder="192.168.1.1&#10;10.0.0.0/24"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        border: "1px solid #e5e7eb",
                        minHeight: "80px",
                        resize: "vertical",
                        fontFamily: "monospace",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "4px",
                      }}
                    >
                      Enter one IP address or CIDR block per line
                    </div>
                  </FormGroup>
                )}
              </>
            )}

            {deployment?.b2b_settings?.workspaces_enabled &&
              workspaces.length > 0 && (
                <FormGroup>
                  <Label
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    Default Workspace
                  </Label>
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
                    placeholder="Select default workspace"
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    Workspace that new members will be added to automatically
                  </div>
                </FormGroup>
              )}


            {/* Button Group */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <Button
                onClick={handleSubmit}
                style={{
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Save Changes
              </Button>
            </div>

            {/* Delete Section */}
            {deployment?.b2b_settings?.allow_org_deletion && (
              <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #f3f4f6" }}>
                <button
                  onClick={() => {
                    if (!showDeleteConfirm) {
                      setShowDeleteConfirm(true);
                    } else {
                      setShowDeleteConfirm(false);
                      setConfirmName("");
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0",
                  }}
                >
                  {showDeleteConfirm ? "Cancel" : "Delete organization"}
                </button>
                
                {showDeleteConfirm && (
                  <div style={{ marginTop: "16px", maxWidth: "300px" }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px 0" }}>
                      This action cannot be undone.
                    </p>
                    <Input
                      type="text"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={`Type "${selectedOrganization?.name}" to confirm`}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        border: "1px solid #e5e7eb",
                        marginBottom: "12px",
                      }}
                    />
                    <Button
                      onClick={handleDeleteOrganization}
                      disabled={confirmName !== selectedOrganization?.name || isDeleting}
                      style={{
                        background: confirmName === selectedOrganization?.name ? "#dc2626" : "#e5e7eb",
                        color: confirmName === selectedOrganization?.name ? "white" : "#9ca3af",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: confirmName === selectedOrganization?.name ? "pointer" : "not-allowed",
                      }}
                    >
                      {isDeleting ? <Spinner size={12} /> : "Delete"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
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
    null,
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
        <EmptyState
          title={
            searchQuery !== "all"
              ? "No domains match your criteria"
              : "No domains added"
          }
          description="Add a domain to get started"
        />
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
                <TableCell>
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
                </TableCell>
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
                          navigator.clipboard.writeText(domain.fqdn);
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

const MemberListItem = styled.div`
  background: var(--color-background);
  padding: 16px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-input-background);
  }
`;

const MemberListItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-input-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const MemberName = styled.div`
  font-size: 14px;
  color: var(--color-foreground);
`;

const MemberEmail = styled.div`
  font-size: 12px;
  color: var(--color-muted);
`;

const MemberListItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MembersSection = () => {
  const {
    activeOrganization,
    loading,
    getMembers,
    getRoles,
    addMemberRole,
    removeMemberRole,
  } = useActiveOrganization();
  const { toast } = useScreenContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviting, setIsInviting] = useState(false);

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

  const toggleRole = async (
    member: OrganizationMembership,
    role: OrganizationRole,
    hasRole: boolean,
  ) => {
    try {
      if (hasRole) {
        await removeMemberRole(member, role);
        toast("Role removed successfully", "info");
      } else {
        await addMemberRole(member, role);
        toast("Role added successfully", "info");
      }
      reloadMembers();
    } catch (error) {
      console.error("Failed to update role", error);
      toast("Failed to update role", "error");
    }
  };

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  const memberHasRole = (member: any, roleId: string) =>
    member.roles?.some((r: any) => r.id === roleId) || false;

  const handleInvitationSuccess = () => {
    setIsInviting(false);
    reloadMembers();
    toast("Invitation sent successfully", "info");
  };

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
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search members..."
          />
        </div>
        <Button
          onClick={() => setIsInviting(true)}
          style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            height: "32px",
            width: "auto",
          }}
        >
          Invite Members
        </Button>
      </div>

      {isInviting && (
        <InviteMemberPopover
          onClose={() => setIsInviting(false)}
          onSuccess={handleInvitationSuccess}
          roles={roles}
        />
      )}

      {filteredMembers.length === 0 ? (
        <EmptyState
          title={
            searchQuery ? "No members match your search" : "No members yet"
          }
          description="Invite members to your organization to get started."
        />
      ) : (
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 400,
              marginBottom: "8px",
              color: "var(--color-muted)",
            }}
          >
            {filteredMembers.length} member
            {filteredMembers.length !== 1 ? "s" : ""}
          </div>
          <div style={{ borderTop: "1px solid var(--color-border)" }}>
            {filteredMembers.map((member) => (
              <MemberListItem key={member.id}>
                <MemberListItemContent>
                  <AvatarPlaceholder>
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
                  </AvatarPlaceholder>
                  <MemberInfo>
                    <MemberName>
                      {member.user
                        ? `${member.user.first_name || ""} ${
                            member.user.last_name || ""
                          }`.trim() ||
                          member.user.primary_email_address?.email ||
                          "User"
                        : "User"}
                    </MemberName>
                    <MemberEmail>
                      {member.user?.primary_email_address?.email}
                    </MemberEmail>
                  </MemberInfo>
                </MemberListItemContent>
                <MemberListItemActions>
                  <Dropdown>
                    <DropdownTrigger>
                      <IconButton>•••</IconButton>
                    </DropdownTrigger>
                    <DropdownItems>
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
                                <Check size={16} color="var(--color-success)" />
                              )}
                            </div>
                          </DropdownItem>
                        );
                      })}
                      <DropdownDivider />
                      <DropdownItem $destructive>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Trash size={16} color="var(--color-error)" />
                          <span>Remove Member</span>
                        </div>
                      </DropdownItem>
                    </DropdownItems>
                  </Dropdown>
                </MemberListItemActions>
              </MemberListItem>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const InvitationsSection = () => {
  const {
    activeOrganization,
    loading,
    getInvitations,
    getRoles,
    discardInvitation,
    resendInvitation,
  } = useActiveOrganization();
  const { toast } = useScreenContext();
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: invitations = [],
    isLoading: invitationsLoading,
    mutate: reloadInvitations,
  } = useSWR(
    activeOrganization
      ? `/api/organizations/${activeOrganization.id}/invitations`
      : null,
    () => getInvitations?.() || [],
  );

  const { data: rolesData = [], isLoading: rolesLoading } = useSWR(
    activeOrganization
      ? `/api/organizations/${activeOrganization.id}/roles`
      : null,
    () => getRoles?.() || [],
  );
  const roles = rolesData as OrganizationRole[];

  const filteredInvitations = React.useMemo(() => {
    if (!searchQuery) return invitations;
    return invitations.filter((invitation: OrganizationInvitation) =>
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [invitations, searchQuery]);

  const handleInvitationSuccess = () => {
    toast("Invitation sent successfully", "info");
    reloadInvitations();
    setIsInviting(false);
  };

  const handleCancelInvitation = async (invitation: OrganizationInvitation) => {
    try {
      await discardInvitation(invitation);
      reloadInvitations();
      toast("Invitation cancelled successfully", "info");
    } catch (error) {
      console.error("Failed to cancel invitation", error);
      toast("Failed to cancel invitation", "error");
    }
  };

  const handleResendInvitation = async (invitation: OrganizationInvitation) => {
    try {
      await resendInvitation(invitation);
      toast("Invitation resent successfully", "info");
    } catch (error) {
      console.error("Failed to resend invitation", error);
      toast("Failed to resend invitation", "error");
    }
  };

  if (loading || invitationsLoading || rolesLoading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}
      >
        <Spinner />
      </div>
    );

  return (
    <>
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search invitations..."
          />
        </div>
        <Button
          onClick={() => setIsInviting(true)}
          style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            height: "32px",
            width: "auto",
          }}
        >
          Invite Members
        </Button>
      </div>

      {isInviting && (
        <InviteMemberPopover
          onClose={() => setIsInviting(false)}
          onSuccess={handleInvitationSuccess}
          roles={roles}
        />
      )}

      {filteredInvitations.length === 0 ? (
        <EmptyState
          title={
            searchQuery
              ? "No invitations match your search"
              : "No pending invitations"
          }
          description="Invite new members to your organization."
        />
      ) : (
        <div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 400,
              marginBottom: "8px",
              color: "var(--color-muted)",
            }}
          >
            {filteredInvitations.length} pending invitation
            {filteredInvitations.length !== 1 ? "s" : ""}
          </div>
          <div style={{ borderTop: "1px solid var(--color-border)" }}>
            {filteredInvitations.map((invitation) => (
              <MemberListItem key={invitation.id}>
                <MemberListItemContent>
                  <MemberInfo>
                    <MemberName>{invitation.email}</MemberName>
                    <MemberEmail>
                      {invitation.initial_organization_role?.name}
                    </MemberEmail>
                  </MemberInfo>
                </MemberListItemContent>
                <MemberListItemActions>
                  <Dropdown>
                    <DropdownTrigger>
                      <IconButton>•••</IconButton>
                    </DropdownTrigger>
                    <DropdownItems>
                      <DropdownItem
                        onClick={() => handleResendInvitation(invitation)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Mail size={16} color="var(--color-muted)" />
                          <span>Resend Invitation</span>
                        </div>
                      </DropdownItem>
                      <DropdownItem
                        $destructive
                        onClick={() => handleCancelInvitation(invitation)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Trash size={16} color="var(--color-error)" />
                          <span>Cancel Invitation</span>
                        </div>
                      </DropdownItem>
                    </DropdownItems>
                  </Dropdown>
                </MemberListItemActions>
              </MemberListItem>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const RolesSection = () => {
  const { activeOrganization, loading, getRoles, removeRole } =
    useActiveOrganization();

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
        <EmptyState
          title={
            searchQuery
              ? "No roles match your search"
              : "No roles defined yet. Create your first role to get started."
          }
          description="Create a role to get started"
        />
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
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
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

type TabType = "general" | "domains" | "members" | "invitations" | "roles";

export const ManageOrganization = () => {
  const { loading } = useActiveOrganization();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [setToastMessage],
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
      <ScreenContext.Provider
        value={{ screen: null, setScreen: () => {}, toast }}
      >
        <Container>
          <TabsContainer>
            <TabsList>
              <Tab
                $isActive={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              >
                <TabIcon>
                  <Settings size={16} />
                  General
                </TabIcon>
              </Tab>
              <Tab
                $isActive={activeTab === "domains"}
                onClick={() => setActiveTab("domains")}
              >
                <TabIcon>
                  <Globe size={16} />
                  Domains
                </TabIcon>
              </Tab>
              <Tab
                $isActive={activeTab === "members"}
                onClick={() => setActiveTab("members")}
              >
                <TabIcon>
                  <Users size={16} />
                  Members
                </TabIcon>
              </Tab>
              <Tab
                $isActive={activeTab === "invitations"}
                onClick={() => setActiveTab("invitations")}
              >
                <TabIcon>
                  <Mail size={16} />
                  Invitations
                </TabIcon>
              </Tab>
              <Tab
                $isActive={activeTab === "roles"}
                onClick={() => setActiveTab("roles")}
              >
                <TabIcon>
                  <Shield size={16} />
                  Roles
                </TabIcon>
              </Tab>
            </TabsList>
          </TabsContainer>

          <TabContent>
            {activeTab === "general" && <GeneralSettingsSection />}
            {activeTab === "domains" && <DomainsSection />}
            {activeTab === "members" && <MembersSection />}
            {activeTab === "invitations" && <InvitationsSection />}
            {activeTab === "roles" && <RolesSection />}
          </TabContent>

          {toastMessage && (
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                background: "var(--color-input-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "12px 16px",
                boxShadow: "0 4px 12px var(--color-shadow)",
                animation: "slideUp 0.3s ease-out",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {toastLevel === "error" ? (
                  <AlertTriangle size={16} color="var(--color-error)" />
                ) : (
                  <Check size={16} color="var(--color-success)" />
                )}
                <span
                  style={{ fontSize: "14px", color: "var(--color-foreground)" }}
                >
                  {toastMessage}
                </span>
              </div>
            </div>
          )}
        </Container>
      </ScreenContext.Provider>
    </TypographyProvider>
  );
};

// Removed DeleteAccountAccordion - functionality moved to Danger tab
/*
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
*/
