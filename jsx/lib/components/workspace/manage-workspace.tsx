import React, { useState, useCallback, useEffect, useContext, useRef } from "react";
import styled from "styled-components";
import { Building, Settings, Users, Mail, Trash2, Send, Check, Shield, AlertTriangle, ChevronDown } from "lucide-react";
import { useActiveWorkspace, useWorkspaceList } from "@/hooks/use-workspace";
import { useSession } from "@/hooks/use-session";
import type { WorkspaceRole, WorkspaceWithOrganization } from "@/types";
import { InviteMemberPopover } from "./invite-member-popover";
import { AddWorkspaceRolePopover } from "./add-role-popover";
import { ConfirmationPopover } from "../utility/confirmation-popover";
import useSWR from "swr";
import { ScreenContext } from "../user/context";
import {
  Button,
  Input,
  Spinner,
  FormGroup,
  Label,
  SearchInput,
  Dropdown,
  DropdownItems,
  DropdownItem,
  DropdownTrigger,
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
import { useClient } from "@/hooks/use-client";
import { responseMapper } from "@/utils/response-mapper";
import { EmptyState } from "@/components/utility/empty-state";

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
    content: '';
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
  gap: 8px;
  margin-bottom: 20px;
`;

interface WorkspaceUpdate {
  name?: string;
  description?: string;
  image?: File;
}


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




const InvitationsSection = () => {
  const { activeWorkspace, loading, getRoles } = useActiveWorkspace();
  const { workspaces } = useWorkspaceList();
  const { client } = useClient();

  const workspaceWithOrg = workspaces?.find(w => w.id === activeWorkspace?.id) as WorkspaceWithOrganization | undefined;
  const [rolesLoading, setRolesLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [showInvitePopover, setShowInvitePopover] = useState(false);
  const inviteButtonRef = useRef<HTMLButtonElement>(null);

  // Invitation operations - using organization invitations with workspace assignment
  const getInvitations = useCallback(async () => {
    if (!activeWorkspace || !workspaceWithOrg) return [];
    try {
      const response = await responseMapper(
        await client(`/organizations/${workspaceWithOrg.organization.id}/invitations`, {
          method: "GET",
        }),
      );
      const allInvitations = response.data as any[];
      return allInvitations.filter(inv => inv.workspace_id === activeWorkspace.id);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      return [];
    }
  }, [client, activeWorkspace, workspaceWithOrg]);

  const createInvitation = useCallback(
    async (email: string, roleId: string) => {
      if (!activeWorkspace || !workspaceWithOrg) return;
      const orgRolesResponse = await responseMapper(
        await client(`/organizations/${workspaceWithOrg.organization.id}/roles`, {
          method: "GET",
        }),
      );
      const orgRoles = orgRolesResponse.data as any[];
      const defaultOrgRole = orgRoles.find(r => !r.organization_id) || orgRoles[0];

      const response = await responseMapper(
        await client(`/organizations/${workspaceWithOrg.organization.id}/invitations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            role_id: defaultOrgRole?.id,
            workspace_id: activeWorkspace.id,
            workspace_role_id: roleId
          }),
        }),
      );
      return response.data;
    },
    [client, activeWorkspace, workspaceWithOrg],
  );

  const discardInvitation = useCallback(
    async (invitationId: string) => {
      if (!activeWorkspace || !workspaceWithOrg) return;
      const response = await responseMapper(
        await client(`/organizations/${workspaceWithOrg.organization.id}/invitations/${invitationId}`, {
          method: "DELETE",
        }),
      );
      return response.data;
    },
    [client, activeWorkspace, workspaceWithOrg],
  );

  // Fetch roles and invitations on mount
  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchData = async () => {
      setRolesLoading(true);
      setInvitationsLoading(true);
      try {
        const [rolesData, invitationsData] = await Promise.all([
          getRoles(),
          getInvitations()
        ]);
        setRoles(rolesData);
        setInvitations(invitationsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setRolesLoading(false);
        setInvitationsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id]);

  const handleCancelInvitation = async (invitation: any) => {
    try {
      await discardInvitation(invitation.id);
      // Refresh invitations
      const updatedInvitations = await getInvitations();
      setInvitations(updatedInvitations);
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  const handleResendInvitation = async (invitation: any) => {
    try {
      // Resend is typically done by canceling and creating a new invitation
      await discardInvitation(invitation.id);
      await createInvitation(invitation.email, invitation.workspace_role_id || invitation.initial_workspace_role?.id || invitation.role_id);
      // Refresh invitations
      const updatedInvitations = await getInvitations();
      setInvitations(updatedInvitations);
      setInviteSuccess("Invitation resent successfully");
      setTimeout(() => setInviteSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to resend invitation:", error);
    }
  };

  const handleInviteSuccess = async () => {
    setShowInvitePopover(false);
    // Refresh invitations
    const updatedInvitations = await getInvitations();
    setInvitations(updatedInvitations);
    setInviteSuccess("Invitation sent successfully");
    setTimeout(() => setInviteSuccess(""), 3000);
  };

  const filteredInvitations = React.useMemo(() => {
    if (!searchQuery) return invitations;
    return invitations.filter((invitation: any) => {
      const email = invitation.email || "";
      return email.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [invitations, searchQuery]);

  if (loading || rolesLoading || invitationsLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {inviteSuccess && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "var(--color-success-background)",
            color: "var(--color-success)",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          ✓ {inviteSuccess}
        </div>
      )}


      <HeaderCTAContainer>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Invitation"
        />
        <div>
          <Button
            ref={inviteButtonRef}
            onClick={() => setShowInvitePopover(!showInvitePopover)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px"
            }}
          >
            Invite Members
          </Button>
          {showInvitePopover && (
            <InviteMemberPopover
              onClose={() => setShowInvitePopover(false)}
              onSuccess={handleInviteSuccess}
              roles={roles}
              createInvitation={createInvitation}
              triggerRef={inviteButtonRef}
            />
          )}
        </div>
      </HeaderCTAContainer>

      <div>
        {filteredInvitations.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No invitations match your search" : "No pending invitations"}
            description="Invite new members to your workspace."
          />
        ) : (
          <div style={{ borderTop: "1px solid var(--color-border)" }}>
            {filteredInvitations.map((invitation) => (
              <MemberListItem key={invitation.id}>
                <MemberListItemContent>
                  <MemberInfo>
                    <MemberName>{invitation.email}</MemberName>
                    <MemberEmail>{invitation.initial_workspace_role?.name || invitation.initial_organization_role?.name || invitation.role?.name}</MemberEmail>
                  </MemberInfo>
                </MemberListItemContent>
                <MemberListItemActions>
                  <Dropdown>
                    <DropdownTrigger>
                      <IconButton>•••</IconButton>
                    </DropdownTrigger>
                    <DropdownItems>
                      <DropdownItem onClick={() => handleResendInvitation(invitation)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Mail size={16} color="var(--color-muted)" />
                          <span>Resend Invitation</span>
                        </div>
                      </DropdownItem>
                      <DropdownItem
                        $destructive
                        onClick={() => handleCancelInvitation(invitation)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Trash2 size={16} color="var(--color-error)" />
                          <span>Cancel Invitation</span>
                        </div>
                      </DropdownItem>
                    </DropdownItems>
                  </Dropdown>
                </MemberListItemActions>
              </MemberListItem>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const MembersSection = () => {
  const { activeWorkspace, loading, getMembers, getRoles, removeMember, addMemberRole, removeMemberRole } = useActiveWorkspace();
  const { session } = useSession();
  const { toast } = useContext(ScreenContext) || {};
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members = [], isLoading: membersLoading, mutate: reloadMembers } = useSWR(
    activeWorkspace ? `/api/workspaces/${activeWorkspace.id}/members` : null,
    () => getMembers() || [],
  );

  const { data: rolesData = [], isLoading: rolesLoading } = useSWR(
    activeWorkspace ? `/api/workspaces/${activeWorkspace.id}/roles` : null,
    () => getRoles() || [],
  );

  const roles = rolesData as WorkspaceRole[];

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery) return members;
    return members.filter((member: any) => {
      const user = member.public_user_data || member.user;
      if (!user) return false;
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const email = user.primary_email_address?.email || user.email || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return (
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [members, searchQuery]);

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      toast?.("Member removed successfully", "info");
      reloadMembers();
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast?.("Failed to remove member", "error");
    }
  };

  const handleToggleRole = async (membershipId: string, roleId: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeMemberRole(membershipId, roleId);
        toast?.("Role removed successfully", "info");
      } else {
        await addMemberRole(membershipId, roleId);
        toast?.("Role added successfully", "info");
      }
      reloadMembers();
    } catch (error) {
      console.error("Failed to toggle role:", error);
      toast?.("Failed to update role", "error");
    }
  };

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  const memberHasRole = (member: any, roleId: string) =>
    member.roles?.some((r: any) => r.id === roleId) || false;

  if (loading || membersLoading || rolesLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
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
          placeholder="Search members..."
        />
      </HeaderCTAContainer>

      {filteredMembers.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No members match your search" : "No members yet"}
          description="Invite members to your workspace to get started."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Member</TableHeader>
              <TableHeader>Joined</TableHeader>
              <TableHeader>Role</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.map((member: any) => {
              const user = member.public_user_data || member.user;
              const memberRoles = member.roles || [];
              const isCurrentUser = user?.id === session?.active_signin?.user_id;

              return (
                <TableRow key={member.id}>
                  <TableCellFlex>
                    <div>
                      <AvatarPlaceholder>
                        {user && user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={`${user.first_name || ""} ${user.last_name || ""}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(user?.first_name, user?.last_name) || "?"
                        )}
                      </AvatarPlaceholder>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-foreground)" }}>
                            {(() => {
                              if (!user) return "Unknown User";

                              const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                              if (fullName) return fullName;

                              return user.primary_email_address?.email ||
                                "Unknown User";
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
                        <div style={{ fontSize: "13px", color: "var(--color-secondary-text)" }}>
                          {user?.primary_email_address?.email}
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
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          style={{
                            background: "var(--color-background)",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontSize: "14px",
                            color: "var(--color-foreground)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            minWidth: "120px",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{memberRoles.length > 0 ? memberRoles[0].name : "No role"}</span>
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownItems>
                        {roles.map((role) => {
                          const hasRole = memberHasRole(member, role.id);
                          return (
                            <DropdownItem
                              key={role.id}
                              onClick={() => handleToggleRole(member.id, role.id, hasRole)}
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
                        <DropdownItem
                          $destructive
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Trash2 size={16} color="var(--color-error)" />
                            <span>Remove Member</span>
                          </div>
                        </DropdownItem>
                      </DropdownItems>
                    </Dropdown>
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


const GeneralSettingsSection = () => {
  const { activeWorkspace, loading, updateWorkspace } = useActiveWorkspace();
  const { deleteWorkspace } = useWorkspaceList();
  const { toast } = useContext(ScreenContext) || {};
  const [name, setName] = useState(activeWorkspace?.name || "");
  const [description, setDescription] = useState(
    activeWorkspace?.description || "",
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    activeWorkspace?.image_url || null,
  );
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || "");
      setDescription(activeWorkspace.description || "");
      setPreviewUrl(activeWorkspace.image_url || null);
    }
  }, [activeWorkspace]);

  if (loading || !activeWorkspace) {
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
      // Auto-save image immediately
      setTimeout(() => autoSave(), 100);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const autoSave = React.useCallback(async () => {
    if (!activeWorkspace || isAutoSaving) return;

    try {
      setIsAutoSaving(true);
      const data: WorkspaceUpdate = {};

      if (image) {
        data.image = image;
        setImage(null); // Reset after saving
      }
      if (name !== activeWorkspace.name) {
        data.name = name;
      }
      if (description !== activeWorkspace.description) {
        data.description = description;
      }

      // Only save if there are actual changes
      if (Object.keys(data).length > 0) {
        await updateWorkspace(data);
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 3000);
      }
    } catch (error) {
      console.error("Failed to auto-save workspace", error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [activeWorkspace, updateWorkspace, name, description, image, isAutoSaving]);

  const scheduleAutoSave = React.useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000); // Auto-save after 1 second of inactivity
  }, [autoSave]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    scheduleAutoSave();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    scheduleAutoSave();
  };

  const handleNameBlur = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSave();
  };

  const handleDescriptionBlur = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSave();
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace || confirmName !== activeWorkspace.name) return;

    try {
      setIsDeleting(true);
      await deleteWorkspace(activeWorkspace);
      toast?.("Workspace deleted successfully", "info");
    } catch (error: any) {
      toast?.(error.message || "Failed to delete workspace", "error");
    } finally {
      setIsDeleting(false);
      setConfirmName("");
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xl)" }}>
        {/* Logo Section - Two Column Layout */}
        <div style={{ display: "flex", gap: "var(--space-2xl)", alignItems: "center" }}>
          {/* Left Column - Logo Preview */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "2px dashed var(--color-border)",
                background: previewUrl ? "transparent" : "var(--color-input-background)",
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
                  alt="Workspace Logo"
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
              />
            </div>
          </div>

          {/* Right Column - Content and Controls */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <h3 style={{ 
                fontSize: "var(--font-sm)", 
                color: "var(--color-foreground)", 
                margin: "0 0 var(--space-2xs) 0" 
              }}>
                Workspace Logo
              </h3>
              <p style={{ 
                fontSize: "var(--font-xs)", 
                color: "var(--color-secondary-text)", 
                margin: 0 
              }}>
                Upload an image to represent your workspace
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
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
                  setImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                  // Auto-save the removal
                  setTimeout(() => autoSave(), 100);
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
                <Trash2 size={14} />
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

        {/* Workspace Details */}
        <div>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <h3 style={{ 
              fontSize: "var(--font-sm)", 
              color: "var(--color-foreground)", 
              margin: "0 0 var(--space-2xs) 0" 
            }}>
              Workspace Details
            </h3>
            <p style={{ 
              fontSize: "var(--font-xs)", 
              color: "var(--color-secondary-text)", 
              margin: 0 
            }}>
              Basic information about your workspace
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
            <FormGroup>
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="Enter workspace name"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                as="textarea"
                value={description}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="Tell us about your workspace"
                style={{
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <p style={{ 
                fontSize: "var(--font-2xs)", 
                color: "var(--color-muted)", 
                margin: "var(--space-2xs) 0 0 0" 
              }}>
                Brief description of your workspace and its purpose
              </p>
            </FormGroup>
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

        {/* Danger Zone */}
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{
              fontSize: "16px",
              color: "var(--color-foreground)",
              margin: "0 0 4px 0"
            }}>
              Danger Zone
            </h3>
            <p style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              margin: 0
            }}>
              Irreversible and destructive actions
            </p>
          </div>

          <div style={{ 
            padding: "20px", 
            border: "1px solid var(--color-error)",
            borderRadius: "8px"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              marginBottom: showDeleteConfirm ? "20px" : "0"
            }}>
              <div>
                <div style={{ 
                  fontSize: "14px", 
                  color: "var(--color-foreground)", 
                  marginBottom: "4px", 
                  fontWeight: "500" 
                }}>
                  Delete Workspace
                </div>
                <div style={{ 
                  fontSize: "13px", 
                  color: "var(--color-muted)" 
                }}>
                  Once you delete this workspace, there is no going back. Please be certain.
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
                  width: "auto"
                }}
              >
                {showDeleteConfirm ? "Cancel" : "Delete"}
              </Button>
            </div>

            {showDeleteConfirm && (
              <div style={{ maxWidth: "400px" }}>
                <FormGroup>
                  <Label htmlFor="confirm_workspace_name">Confirm by typing the workspace name</Label>
                  <Input
                    id="confirm_workspace_name"
                    type="text"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={`Type "${activeWorkspace?.name}" to confirm`}
                  />
                </FormGroup>
                <Button
                  onClick={handleDeleteWorkspace}
                  disabled={confirmName !== activeWorkspace?.name || isDeleting}
                  style={{
                    background: confirmName === activeWorkspace?.name ? "var(--color-error)" : "transparent",
                    color: confirmName === activeWorkspace?.name ? "white" : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                    padding: "8px 16px",
                    fontSize: "14px",
                    height: "36px",
                    cursor: confirmName === activeWorkspace?.name ? "pointer" : "not-allowed",
                    opacity: confirmName === activeWorkspace?.name ? 1 : 0.6,
                    marginTop: "12px",
                  }}
                >
                  {isDeleting ? <Spinner size={12} /> : "Delete Forever"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Save Notification */}
      {showSaveNotification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-success-background)",
            color: "var(--color-success)",
            padding: "var(--space-sm) var(--space-lg)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 4px 12px var(--color-shadow)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            fontSize: "var(--font-xs)",
            fontWeight: 500,
            zIndex: 1000,
            animation: "slideUp 0.3s ease-out",
          }}
        >
          ✓ Changes saved automatically
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

const RolesSection = () => {
  const { activeWorkspace, loading, getRoles, createRole, deleteRole } = useActiveWorkspace();
  const { toast } = useContext(ScreenContext) || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [rolePopover, setRolePopover] = useState<{
    isOpen: boolean;
    role?: WorkspaceRole;
    triggerElement?: HTMLElement | null;
  }>({ isOpen: false });
  const [roleForOptionPopover, setRoleForOptionPopover] = useState<string | null>(null);
  const [roleForDeletion, setRoleForDeletion] = useState<string | null>(null);
  const addRoleButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const { data: roles = [], isLoading: rolesLoading, mutate: reloadRoles } = useSWR(
    activeWorkspace ? `/api/workspaces/${activeWorkspace.id}/roles` : null,
    () => getRoles() || [],
  );

  const filteredRoles = React.useMemo(() => {
    if (!searchQuery) return roles;
    return roles.filter((role: WorkspaceRole) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [roles, searchQuery]);

  const handleRoleSaved = async (role: {
    id?: string;
    name: string;
    permissions?: string[];
  }) => {
    try {
      await createRole(role.name, role.permissions || []);

      toast?.("Role created successfully", "info");
      setRolePopover({ isOpen: false });
      reloadRoles();
    } catch (error) {
      console.error("Failed to save role", error);
      toast?.("Failed to create role", "error");
    }
  };

  const handleDeleteRole = async (role: WorkspaceRole) => {
    try {
      await deleteRole(role);

      toast?.("Role deleted successfully", "info");
      setRoleForDeletion(null);
      reloadRoles();
    } catch (error) {
      console.error("Failed to delete role", error);
      toast?.("Failed to delete role", "error");
    }
  };

  if (loading || rolesLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <HeaderCTAContainer>
        <SearchInput
          placeholder="Search roles"
          onChange={setSearchQuery}
          value={searchQuery}
        />
        <div style={{ position: "relative" }}>
          <Button
            ref={addRoleButtonRef}
            onClick={() => setRolePopover({ isOpen: true, triggerElement: addRoleButtonRef.current })}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              height: "36px"
            }}
          >
            Add role
          </Button>
          {rolePopover.isOpen && !rolePopover.role && (
            <AddWorkspaceRolePopover
              role={rolePopover.role}
              triggerRef={{ current: rolePopover.triggerElement || null }}
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
              : "No roles available"
          }
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Contact your administrator to set up workspace roles."
          }
        />
      ) : (
        <div style={{ position: "relative", overflowX: "auto", overflowY: "visible" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Role</TableHeader>
                <TableHeader>Permissions</TableHeader>
                <TableHeader></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoles.map((role: WorkspaceRole) => (
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
                    {role.permissions && role.permissions.length > 0 ? role.permissions.join(", ") : ""}
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
                            ref={(el) => {
                              if (el) dropdownButtonRefs.current.set(role.id, el);
                            }}
                            disabled={!(role as any).workspace_id}
                            data-role-dropdown-trigger={role.id}
                          >
                            •••
                          </IconButton>
                        </DropdownTrigger>
                        <DropdownItems>
                          <DropdownItem
                            onClick={() => {
                              setRoleForOptionPopover(null);
                              const triggerBtn = dropdownButtonRefs.current.get(role.id);
                              setRolePopover({ isOpen: true, role, triggerElement: triggerBtn || null });
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
                        <AddWorkspaceRolePopover
                          role={rolePopover.role}
                          triggerRef={{ current: rolePopover.triggerElement || null }}
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
        </div>
      )}
    </>
  );
};


export const ManageWorkspace = () => {
  const { activeWorkspace, loading } = useActiveWorkspace();
  const [activeTab, setActiveTab] = useState<"general" | "members" | "invitations" | "roles">("general");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastLevel, setToastLevel] = useState<"info" | "error">("info");

  const toast = useCallback(
    (message: string, level: "info" | "error" = "info") => {
      setToastMessage(message);
      setToastLevel(level);
      setTimeout(() => setToastMessage(null), 3000);
    },
    [],
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

  if (!activeWorkspace) return null;

  return (
    <ScreenContext.Provider value={{ screen: null, setScreen: () => { }, toast }}>
      <TypographyProvider>
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
                  <Send size={16} />
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
                padding: "12px 16px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px var(--color-shadow)",
                zIndex: 50,
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
      </TypographyProvider>
    </ScreenContext.Provider>
  );
};