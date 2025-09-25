import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
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
  ChevronDown,
} from "lucide-react";
import {
  useActiveOrganization,
  useOrganizationList,
} from "@/hooks/use-organization";
import { useDeployment } from "@/hooks/use-deployment";
import { useSession } from "@/hooks/use-session";
import { AddDomainPopover } from "./add-domain-popover";
import useSWR from "swr";
import { InviteMemberPopover } from "./invite-member-popover";
import {
  OrganizationRole,
  OrganizationDomain,
  OrganizationMembership,
  OrganizationInvitation,
} from "@/types";
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
import OrganizationSwitcher from "./organization-switcher";

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
  padding-bottom: 24px;
  position: relative;

  @media (max-width: 768px) {
    border-radius: 16px;
    padding-bottom: 20px;
  }

  /* Blur effect at the bottom */
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--color-background) 70%
    );
    pointer-events: none;
    z-index: 1;
  }
`;

const TabsContainer = styled.div`
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

const TabsList = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button<{ $isActive: boolean }>`
  padding: 12px 12px;
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
  min-width: fit-content;

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
  padding: 24px 24px 0 24px;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px 20px 0 20px;
  }
`;

const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;

const GeneralSettingsSection = () => {
  const { activeOrganization: selectedOrganization, loading } =
    useActiveOrganization();
  const { switchOrganization, refetch } = useSession();
  const { workspaces: workspaceList } = useWorkspaceList();
  const { deployment } = useDeployment();
  const { deleteOrganization: deleteOrgFromList, updateOrganization } =
    useOrganizationList();
  const { toast } = useScreenContext();
  const [name, setName] = useState(selectedOrganization?.name || "");
  const [description, setDescription] = useState(
    selectedOrganization?.description || "",
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedOrganization?.image_url || null,
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [security, setSecurity] = useState({
    mfa_required: false,
    ip_restrictions: false,
    allowed_ips: "",
    default_workspace_id: "",
  });
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const autoSave = React.useCallback(async () => {
    if (!selectedOrganization || isSaving) return;

    try {
      setIsSaving(true);
      await updateOrganization(selectedOrganization, {
        name,
        description,
      });
      toast("Changes saved", "info");
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to save changes. Please try again.";
      toast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedOrganization,
    name,
    description,
    previewUrl,
    security,
    updateOrganization,
    toast,
  ]);

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
      await switchOrganization("");
      await deleteOrgFromList(selectedOrganization);
      await refetch();
      toast("Organization deleted successfully", "info");
    } catch (error) {
      toast("Failed to delete organization", "error");
    } finally {
      setIsDeleting(false);
      setConfirmName("");
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (loading) {
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

      // Validate file size
      if (file.size > 2 * 1024 * 1024) {
        toast("File size cannot exceed 2MB", "error");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast("Please select a valid image file", "error");
        return;
      }

      // Revoke previous object URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(file));
      // Auto-save image immediately after selection
      setTimeout(() => autoSave(), 100);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2xl)",
        }}
      >
        {/* Logo Section - Two Column Layout */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2xl)",
            alignItems: "center",
          }}
        >
          {/* Left Column - Logo Preview */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "2px dashed var(--color-border)",
                background: previewUrl
                  ? "transparent"
                  : "var(--color-input-background)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
              onClick={triggerFileInput}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
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
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <Building size={32} color="var(--color-muted)" />
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageChange}
                aria-label="Upload organization logo"
              />
            </div>
          </div>

          {/* Right Column - Content and Controls */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <h3
                style={{
                  fontSize: "var(--font-sm)",
                  color: "var(--color-foreground)",
                  margin: "0 0 var(--space-2xs) 0",
                }}
              >
                Organization Logo
              </h3>
              <p
                style={{
                  fontSize: "var(--font-xs)",
                  color: "var(--color-secondary-text)",
                  margin: 0,
                }}
              >
                Upload an image to represent your organization
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--space-sm)",
                marginBottom: "var(--space-sm)",
              }}
            >
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "var(--space-xs) var(--space-md)",
                  fontSize: "var(--font-xs)",
                  height: "32px",
                  width: "100px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Building size={14} />
                {previewUrl ? "Change" : "Upload"}
              </Button>
              <Button
                onClick={() => {
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                style={{
                  background: "transparent",
                  color: "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                  padding: "var(--space-xs) var(--space-md)",
                  fontSize: "var(--font-xs)",
                  height: "32px",
                  width: "100px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Trash size={14} />
                Remove
              </Button>
            </div>

            {/* <p style={{
              fontSize: "var(--font-2xs)",
              color: "var(--color-muted)",
              margin: 0,
              lineHeight: 1.4,
            }}>
              Recommended: Square image, at least 200x200px. Supported formats: JPG, PNG, GIF • Max 2MB
            </p> */}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            position: "relative",
            height: "1px",
            background: "var(--color-divider)",
            margin: "0",
          }}
        />

        {/* Organization Details */}
        <div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3
              style={{
                fontSize: "var(--font-sm)",
                color: "var(--color-foreground)",
                margin: "0 0 var(--space-2xs) 0",
              }}
            >
              Organization Details
            </h3>
            <p
              style={{
                fontSize: "var(--font-xs)",
                color: "var(--color-secondary-text)",
                margin: 0,
              }}
            >
              Basic information about your organization
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
            }}
          >
            <FormGroup>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={autoSave}
                placeholder="Enter organization name"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                as="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={autoSave}
                placeholder="Enter organization description"
                style={{
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <p
                style={{
                  fontSize: "var(--font-2xs)",
                  color: "var(--color-muted)",
                  margin: "var(--space-2xs) 0 0 0",
                }}
              >
                Brief description of your organization
              </p>
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
                    fontSize: "var(--font-xs)",
                    color: "var(--color-foreground)",
                    display: "block",
                    marginBottom: "var(--space-2xs)",
                  }}
                >
                  Multi-Factor Authentication
                </Label>
                <div
                  style={{
                    fontSize: "var(--font-2xs)",
                    color: "var(--color-muted)",
                  }}
                  id="mfa-description"
                >
                  Require all members to set up MFA for added security
                </div>
              </div>
              <Switch
                checked={security.mfa_required}
                onChange={() => {
                  setSecurity((prev) => ({
                    ...prev,
                    mfa_required: !prev.mfa_required,
                  }));
                  setTimeout(() => autoSave(), 100);
                }}
              />
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
                        fontSize: "var(--font-xs)",
                        color: "var(--color-foreground)",
                        display: "block",
                        marginBottom: "var(--space-2xs)",
                      }}
                    >
                      IP Restrictions
                    </Label>
                    <div
                      style={{
                        fontSize: "var(--font-2xs)",
                        color: "var(--color-muted)",
                      }}
                      id="ip-restrictions-description"
                    >
                      Only allow access from specific IP addresses
                    </div>
                  </div>
                  <Switch
                    checked={security.ip_restrictions}
                    onChange={() => {
                      setSecurity((prev) => ({
                        ...prev,
                        ip_restrictions: !prev.ip_restrictions,
                      }));
                      setTimeout(() => autoSave(), 100);
                    }}
                    aria-label="Enable IP address restrictions"
                    aria-describedby="ip-restrictions-description"
                  />
                </div>

                {security.ip_restrictions && (
                  <FormGroup>
                    <Label htmlFor="allowed_ips">Allowed IP Addresses</Label>
                    <Input
                      id="allowed_ips"
                      as="textarea"
                      value={security.allowed_ips}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          allowed_ips: e.target.value,
                        }))
                      }
                      onBlur={autoSave}
                      placeholder="192.168.1.1&#10;10.0.0.0/24"
                      style={{
                        minHeight: "80px",
                        resize: "vertical",
                        fontFamily: "monospace",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "var(--font-2xs)",
                        color: "var(--color-muted)",
                        margin: "var(--space-2xs) 0 0 0",
                      }}
                    >
                      Enter one IP address or CIDR block per line
                    </p>
                  </FormGroup>
                )}
              </>
            )}

            {deployment?.b2b_settings?.workspaces_enabled &&
              workspaces.length > 0 && (
                <FormGroup>
                  <Label htmlFor="default_workspace">Default Workspace</Label>
                  <ComboBox
                    options={workspaces.map((workspace) => ({
                      value: workspace.id,
                      label: workspace.name,
                    }))}
                    value={security.default_workspace_id}
                    onChange={(value) => {
                      setSecurity((prev) => ({
                        ...prev,
                        default_workspace_id: value,
                      }));
                      setTimeout(() => autoSave(), 100);
                    }}
                    placeholder="Select default workspace"
                  />
                  <p
                    style={{
                      fontSize: "var(--font-2xs)",
                      color: "var(--color-muted)",
                      margin: "var(--space-2xs) 0 0 0",
                    }}
                  >
                    Workspace that new members will be added to automatically
                  </p>
                </FormGroup>
              )}
          </div>
        </div>

        {/* Delete Section */}
        {deployment?.b2b_settings?.allow_org_deletion && (
          <>
            <div
              style={{
                position: "relative",
                height: "1px",
                background: "var(--color-divider)",
                margin: "0",
              }}
            />

            <div>
              <div style={{ marginBottom: "16px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    color: "var(--color-foreground)",
                    margin: "0 0 4px 0",
                  }}
                >
                  Danger Zone
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-muted)",
                    margin: 0,
                  }}
                >
                  Irreversible and destructive actions
                </p>
              </div>

              <div
                style={{
                  padding: "20px",
                  border: "1px solid var(--color-error)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: showDeleteConfirm ? "20px" : "0",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "var(--color-foreground)",
                        marginBottom: "4px",
                        fontWeight: "500",
                      }}
                    >
                      Delete Organization
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-muted)",
                      }}
                    >
                      Once you delete this organization, there is no going back.
                      Please be certain.
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (!showDeleteConfirm) {
                        setShowDeleteConfirm(true);
                      } else {
                        setShowDeleteConfirm(false);
                        setConfirmName("");
                      }
                    }}
                    style={{
                      background: "var(--color-error)",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      fontSize: "13px",
                      height: "32px",
                      width: "auto",
                    }}
                  >
                    {showDeleteConfirm ? "Cancel" : "Delete"}
                  </Button>
                </div>

                {showDeleteConfirm && (
                  <div>
                    <FormGroup>
                      <Label htmlFor="confirm_name">
                        Confirm by typing the organization name
                      </Label>
                      <Input
                        id="confirm_name"
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder={`Type "${selectedOrganization?.name}" to confirm`}
                      />
                    </FormGroup>
                    <Button
                      onClick={handleDeleteOrganization}
                      disabled={
                        confirmName !== selectedOrganization?.name || isDeleting
                      }
                      style={{
                        background:
                          confirmName === selectedOrganization?.name
                            ? "var(--color-error)"
                            : "transparent",
                        color:
                          confirmName === selectedOrganization?.name
                            ? "white"
                            : "var(--color-muted)",
                        border: "1px solid var(--color-border)",
                        padding: "8px 16px",
                        fontSize: "14px",
                        height: "36px",
                        cursor:
                          confirmName === selectedOrganization?.name
                            ? "pointer"
                            : "not-allowed",
                        opacity:
                          confirmName === selectedOrganization?.name ? 1 : 0.6,
                        marginTop: "12px",
                      }}
                    >
                      {isDeleting ? <Spinner size={12} /> : "Delete Forever"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const Badge = styled.span`
  background: var(--color-primary-background);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: center;
  max-width: max-content;
  gap: 4px;
  border: 1px solid var(--color-border);
  white-space: nowrap;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  cursor: pointer;
  color: var(--color-muted);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
  min-width: 32px;
  height: 32px;

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
  const addDomainButtonRef = useRef<HTMLButtonElement>(null);

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
            ref={addDomainButtonRef}
            onClick={() => setIsAddingDomain(!isAddingDomain)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px",
            }}
          >
            New Domain
          </Button>
          {isAddingDomain && (
            <AddDomainPopover
              onClose={() => {
                setIsAddingDomain(false);
                mutate();
              }}
              triggerRef={addDomainButtonRef}
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
                <TableCell>{domain.fqdn}</TableCell>
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
                  <div style={{ position: "relative" }}>
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
                            <ExternalLink
                              size={16}
                              color="var(--color-muted)"
                            />{" "}
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
                            <Trash size={16} color="var(--color-error)" />{" "}
                            Remove Domain
                          </div>
                        </DropdownItem>
                      </DropdownItems>
                    </Dropdown>
                    {domainForDeletion === domain.id && (
                      <ConfirmationPopover
                        title="Are you sure you want to delete this domain?"
                        onConfirm={() => handleDeleteDomain(domain)}
                        onCancel={() => setDomainForDeletion(null)}
                      />
                    )}
                    {domainInVerification === domain.id && (
                      <AddDomainPopover
                        domain={domain}
                        onClose={() => setDomainInVerification(null)}
                      />
                    )}
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

const MembersSection = () => {
  const {
    activeOrganization,
    loading,
    getMembers,
    getRoles,
    addMemberRole,
    removeMemberRole,
    removeMember,
  } = useActiveOrganization();
  const { session } = useSession();
  const { toast } = useScreenContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const inviteMemberButtonRef = useRef<HTMLButtonElement>(null);

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
    return members.filter((member: OrganizationMembership) => {
      const userData = member.user;
      if (!userData) return false;
      const firstName = userData.first_name || "";
      const lastName = userData.last_name || "";
      const email = userData.primary_email_address?.email || "";
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
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to update role. Please try again.";
      toast(errorMessage, "error");
    }
  };

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  const memberHasRole = (member: OrganizationMembership, roleId: string) =>
    member.roles?.some((r: OrganizationRole) => r.id === roleId) || false;

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
          marginBottom: "24px",
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
          ref={inviteMemberButtonRef}
          onClick={() => setIsInviting(!isInviting)}
          style={{
            background: "var(--color-primary)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            height: "36px",
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
          triggerRef={inviteMemberButtonRef}
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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Member</TableHeader>
              <TableHeader>Joined</TableHeader>
              <TableHeader>Roles</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.map((member) => {
              const memberRoles = member.roles || [];
              const userData = member.user;
              const isCurrentUser =
                userData?.id === session?.active_signin?.user_id;

              return (
                <TableRow key={member.id}>
                  <TableCellFlex>
                    <div>
                      <AvatarPlaceholder>
                        {userData?.profile_picture_url ? (
                          <img
                            src={userData.profile_picture_url}
                            alt={`${userData.first_name || ""} ${
                              userData.last_name || ""
                            }`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(
                            userData?.first_name,
                            userData?.last_name,
                          ) || "?"
                        )}
                      </AvatarPlaceholder>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "var(--color-foreground)",
                            }}
                          >
                            {(() => {
                              if (!userData) return "Unknown User";

                              const fullName =
                                `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
                              if (fullName) return fullName;

                              return (
                                userData.primary_email_address?.email ||
                                "Unknown User"
                              );
                            })()}
                          </span>
                          {isCurrentUser && (
                            <span
                              style={{
                                fontSize: "12px",
                                padding: "2px 8px",
                                background: "var(--color-background-alt)",
                                borderRadius: "4px",
                                color: "var(--color-secondary-text)",
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--color-secondary-text)",
                          }}
                        >
                          {userData?.primary_email_address?.email}
                        </div>
                      </div>
                    </div>
                  </TableCellFlex>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <ActionsCell>
                    <div style={{ position: "relative" }}>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            style={{
                              background: "var(--color-background)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "14px",
                              color: "var(--color-foreground)",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              minWidth: "120px",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              {memberRoles.length > 0
                                ? memberRoles[0].name
                                : "No role"}
                            </span>
                            <ChevronDown size={14} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownItems>
                          {roles.map((role) => {
                            const hasRole = memberHasRole(member, role.id);
                            return (
                              <DropdownItem
                                key={role.id}
                                onClick={() =>
                                  toggleRole(member, role, hasRole)
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
                          <DropdownDivider />
                          <DropdownItem
                            $destructive
                            onClick={() => removeMember(member)}
                          >
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
                    </div>
                  </ActionsCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
  const inviteMemberButtonRef = useRef<HTMLButtonElement>(null);

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
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to cancel invitation. Please try again.";
      toast(errorMessage, "error");
    }
  };

  const handleResendInvitation = async (invitation: OrganizationInvitation) => {
    try {
      await resendInvitation(invitation);
      toast("Invitation resent successfully", "info");
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to resend invitation. Please try again.";
      toast(errorMessage, "error");
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
          marginBottom: "24px",
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
          ref={inviteMemberButtonRef}
          onClick={() => setIsInviting(!isInviting)}
          style={{
            background: "var(--color-primary)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            height: "36px",
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
          triggerRef={inviteMemberButtonRef}
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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Invited</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>
                  {invitation.initial_organization_role?.name || "No role"}
                </TableCell>
                <TableCell>
                  {new Date(invitation.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <ActionsCell>
                  <div style={{ position: "relative" }}>
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
  const addRoleButtonRef = useRef<HTMLButtonElement>(null);

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
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setMessage({
          text: "Role updated successfully",
          type: "success",
        });
      } else {
        // Creating new role
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
      const errorMessage =
        (error as any)?.message ||
        (role.id
          ? "Failed to update role. Please try again."
          : "Failed to create role. Please try again.");
      if (role.id) {
        setMessage({
          text: errorMessage,
          type: "error",
        });
      } else {
        setMessage({
          text: errorMessage,
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
            ref={addRoleButtonRef}
            onClick={() => setRolePopover({ isOpen: !rolePopover.isOpen })}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px",
            }}
          >
            Add role
          </Button>
          {rolePopover.isOpen && !rolePopover.role && (
            <AddRolePopover
              role={rolePopover.role}
              onClose={() => setRolePopover({ isOpen: false })}
              onSuccess={handleRoleSaved}
              triggerRef={addRoleButtonRef}
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
                <TableCell>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {role.name}
                  </div>
                </TableCell>
                <TableCell style={{ color: "var(--color-secondary-text)" }}>
                  {role.permissions.join(", ")}
                </TableCell>
                <ActionsCell>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      position: "relative",
                    }}
                  >
                    <Dropdown
                      open={roleForOptionPopover === role.id}
                      openChange={(open) =>
                        setRoleForOptionPopover(open ? role.id : null)
                      }
                    >
                      <DropdownTrigger>
                        <IconButton
                          disabled={!role.organization_id}
                          data-role-dropdown-trigger={role.id}
                        >
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
                    {roleForDeletion === role.id && (
                      <ConfirmationPopover
                        title="Are you sure you want to delete this role?"
                        onConfirm={() => handleDeleteRole(role)}
                        onCancel={() => setRoleForDeletion(null)}
                      />
                    )}
                    {rolePopover.isOpen && rolePopover.role?.id === role.id && (
                      <AddRolePopover
                        role={rolePopover.role}
                        onClose={() => {
                          setRolePopover({ isOpen: false });
                          setRoleForOptionPopover(null);
                        }}
                        onSuccess={handleRoleSaved}
                      />
                    )}
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
  const { loading, activeOrganization } = useActiveOrganization();
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

  if (!activeOrganization)
    return (
      <TypographyProvider>
        <Container>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--color-input-background)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                border: "2px dashed var(--color-border)",
              }}
            >
              <Building size={32} color="var(--color-muted)" />
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--color-foreground)",
                margin: "0 0 8px 0",
              }}
            >
              No Organization Selected
            </h3>

            <OrganizationSwitcher />
          </div>
        </Container>
      </TypographyProvider>
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
