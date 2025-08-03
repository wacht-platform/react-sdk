import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Building, Settings, Users, Mail, Trash2, Send, Check, Shield } from "lucide-react";
import { useActiveWorkspace, useWorkspaceList } from "@/hooks/use-workspace";
import type { WorkspaceMembership, WorkspaceRole, WorkspaceWithOrganization } from "@/types";
import { InviteMemberPopover } from "./invite-member-popover";
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



// Helper hooks for workspace operations
const useWorkspaceOperations = () => {
  const { client } = useClient();
  const { activeWorkspace } = useActiveWorkspace();
  const { workspaces } = useWorkspaceList();
  
  // Get the full workspace with organization
  const workspaceWithOrg = workspaces?.find(w => w.id === activeWorkspace?.id) as WorkspaceWithOrganization | undefined;

  const updateWorkspace = useCallback(
    async (data: WorkspaceUpdate) => {
      if (!activeWorkspace) return;

      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.image) formData.append("image", data.image);

      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}`, {
          method: "PUT",
          body: formData,
        }),
      );
      return response.data;
    },
    [client, activeWorkspace],
  );

  const getMembers = useCallback(async () => {
    if (!activeWorkspace) return [];
    try {
      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}/members`, {
          method: "GET",
        }),
      );
      return response.data as WorkspaceMembership[];
    } catch (error) {
      console.error("Failed to fetch members:", error);
      return [];
    }
  }, [client, activeWorkspace]);

  const getRoles = useCallback(async () => {
    if (!activeWorkspace) return [];
    try {
      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}/roles`, {
          method: "GET",
        }),
      );
      return response.data as WorkspaceRole[];
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      return [];
    }
  }, [client, activeWorkspace]);

  const inviteMember = useCallback(
    async (email: string, roleId?: string) => {
      if (!activeWorkspace) return;
      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role_id: roleId }),
        }),
      );
      return response.data;
    },
    [client, activeWorkspace],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!activeWorkspace) return;
      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}/members/${memberId}`, {
          method: "DELETE",
        }),
      );
      return response.data;
    },
    [client, activeWorkspace],
  );

  const deleteWorkspace = useCallback(async () => {
    if (!activeWorkspace) return;
    const response = await responseMapper(
      await client(`/workspaces/${activeWorkspace.id}`, {
        method: "DELETE",
      }),
    );
    return response.data;
  }, [client, activeWorkspace]);

  // Invitation operations - using organization invitations with workspace assignment
  const getInvitations = useCallback(async () => {
    if (!activeWorkspace || !workspaceWithOrg) return [];
    try {
      // Get organization invitations and filter for this workspace
      const response = await responseMapper(
        await client(`/organizations/${workspaceWithOrg.organization.id}/invitations`, {
          method: "GET",
        }),
      );
      // Filter invitations that are assigned to this workspace
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
      // Get organization roles to find a default org role
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
            role_id: defaultOrgRole?.id, // Organization role (required)
            workspace_id: activeWorkspace.id, // Assign to this workspace
            workspace_role_id: roleId // Workspace role
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

  // Role management operations
  const addMemberRole = useCallback(
    async (membershipId: string, roleId: string) => {
      if (!activeWorkspace) return;
      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}/members/${membershipId}/roles/${roleId}`, {
          method: "POST",
        }),
      );
      return response.data;
    },
    [client, activeWorkspace],
  );

  const removeMemberRole = useCallback(
    async (membershipId: string, roleId: string) => {
      if (!activeWorkspace) return;
      const response = await responseMapper(
        await client(`/workspaces/${activeWorkspace.id}/members/${membershipId}/roles/${roleId}`, {
          method: "DELETE",
        }),
      );
      return response.data;
    },
    [client, activeWorkspace],
  );

  return {
    updateWorkspace,
    getMembers,
    getRoles,
    inviteMember,
    removeMember,
    deleteWorkspace,
    getInvitations,
    createInvitation,
    discardInvitation,
    addMemberRole,
    removeMemberRole,
  };
};

const InvitationsSection = () => {
  const { activeWorkspace, loading } = useActiveWorkspace();
  const { getRoles, getInvitations, discardInvitation, createInvitation } = useWorkspaceOperations();
  const [rolesLoading, setRolesLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [showInvitePopover, setShowInvitePopover] = useState(false);

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
            onClick={() => setShowInvitePopover(!showInvitePopover)}
            style={{ width: "120px" }}
          >
            Invite Members
          </Button>
          {showInvitePopover && (
            <InviteMemberPopover
              onClose={() => setShowInvitePopover(false)}
              onSuccess={handleInviteSuccess}
              roles={roles}
              createInvitation={createInvitation}
            />
          )}
        </div>
      </HeaderCTAContainer>

      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 400,
            marginBottom: "8px",
            color: "var(--color-muted)",
          }}
        >
          {filteredInvitations.length} pending invitation{filteredInvitations.length !== 1 ? "s" : ""}
        </div>
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
  const { activeWorkspace, loading } = useActiveWorkspace();
  const { getMembers, getRoles, removeMember, addMemberRole, removeMemberRole } = useWorkspaceOperations();
  const [members, setMembers] = useState<WorkspaceMembership[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch members and roles on mount
  useEffect(() => {
    if (!activeWorkspace) return;
    
    const fetchData = async () => {
      setMembersLoading(true);
      try {
        const [membersData, rolesData] = await Promise.all([
          getMembers(),
          getRoles()
        ]);
        setMembers(membersData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Failed to fetch workspace data:", error);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id]);

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery) return members;
    return members.filter((member: any) => {
      const user = member.public_user_data || member.user;
      if (!user) return false;
      const firstName = user.first_name || "";
      const lastName = user.last_name || "";
      const email = user.email || "";
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
      // Refresh members list
      const updatedMembers = await getMembers();
      setMembers(updatedMembers);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleToggleRole = async (membershipId: string, roleId: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeMemberRole(membershipId, roleId);
      } else {
        await addMemberRole(membershipId, roleId);
      }
      // Refresh members list
      const updatedMembers = await getMembers();
      setMembers(updatedMembers);
    } catch (error) {
      console.error("Failed to toggle role:", error);
    }
  };

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  const memberHasRole = (member: any, roleId: string) =>
    member.roles?.some((r: any) => r.id === roleId) || false;

  if (loading || membersLoading) {
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

      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 400,
            marginBottom: "8px",
            color: "var(--color-muted)",
          }}
        >
          {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
        {filteredMembers.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No members match your search" : "No members yet"}
            description="Invite members to your workspace to get started."
          />
        ) : (
          <div style={{ borderTop: "1px solid var(--color-border)" }}>
            {filteredMembers.map((member: any) => {
              const user = member.public_user_data || member.user;
              
              return (
                <MemberListItem key={member.id}>
                  <MemberListItemContent>
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
                    <MemberInfo>
                      <MemberName>
                        {user
                          ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                            user.email ||
                            "User"
                          : "User"}
                      </MemberName>
                      <MemberEmail>{user?.email}</MemberEmail>
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
                  </MemberListItemActions>
                </MemberListItem>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};


const GeneralSettingsSection = () => {
  const { activeWorkspace, loading } = useActiveWorkspace();
  const { updateWorkspace, deleteWorkspace } = useWorkspaceOperations();
  const [name, setName] = useState(activeWorkspace?.name || "");
  const [description, setDescription] = useState(
    activeWorkspace?.description || "",
  );
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    activeWorkspace?.image_url || null,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [_, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeWorkspace) return;

    try {
      setIsSubmitting(true);
      const data: WorkspaceUpdate = {};

      if (image) {
        data.image = image;
      }
      if (name) {
        data.name = name;
      }
      if (description) {
        data.description = description;
      }

      await updateWorkspace(data);
      setSuccessMessage("Settings updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update workspace", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmName !== activeWorkspace?.name || !activeWorkspace) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkspace();
      // Workspace deleted successfully - the UI should handle navigation
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmName("");
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
                alt="Workspace Logo"
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
                {activeWorkspace?.name?.charAt(0)?.toUpperCase() || (
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

          <div style={{ textAlign: "center", marginTop: "20px", width: "240px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
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
                Workspace Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workspace name"
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
                placeholder="Enter workspace description"
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
                Brief description of your workspace
              </div>
            </FormGroup>


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
            <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #f3f4f6" }}>
              <button
                onClick={() => {
                  if (!showDeleteConfirm) {
                    setShowDeleteConfirm(true);
                  } else {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName("");
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
                {showDeleteConfirm ? "Cancel" : "Delete workspace"}
              </button>
              
              {showDeleteConfirm && (
                <div style={{ marginTop: "16px", maxWidth: "300px" }}>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px 0" }}>
                    This action cannot be undone.
                  </p>
                  <Input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={`Type "${activeWorkspace?.name}" to confirm`}
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
                    onClick={handleDeleteWorkspace}
                    disabled={deleteConfirmName !== activeWorkspace?.name || isDeleting}
                    style={{
                      background: deleteConfirmName === activeWorkspace?.name ? "#dc2626" : "#e5e7eb",
                      color: deleteConfirmName === activeWorkspace?.name ? "white" : "#9ca3af",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: deleteConfirmName === activeWorkspace?.name ? "pointer" : "not-allowed",
                    }}
                  >
                    {isDeleting ? <Spinner size={12} /> : "Delete"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const RoleCard = styled.div`
  background: var(--color-background);
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-input-background);
  }
`;

const RoleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const RoleName = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-foreground);
  margin: 0;
`;

const PermissionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const PermissionBadge = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  background: var(--color-primary-background);
  color: var(--color-primary);
  border-radius: 4px;
  font-family: monospace;
`;

const RoleMemberCount = styled.div`
  font-size: 13px;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const RolesSection = () => {
  const { activeWorkspace, loading } = useActiveWorkspace();
  const { getRoles, getMembers } = useWorkspaceOperations();
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [members, setMembers] = useState<WorkspaceMembership[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    
    const fetchData = async () => {
      setRolesLoading(true);
      try {
        const [rolesData, membersData] = await Promise.all([
          getRoles(),
          getMembers()
        ]);
        setRoles(rolesData);
        setMembers(membersData);
      } catch (error) {
        console.error("Failed to fetch roles data:", error);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id]);

  const getMemberCountForRole = (roleId: string) => {
    return members.filter((member: any) => 
      member.roles?.some((r: any) => r.id === roleId)
    ).length;
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
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              margin: "0 0 4px 0",
              color: "var(--color-foreground)",
            }}
          >
            Workspace Roles
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-muted)",
              margin: "0 0 16px 0",
            }}
          >
            Roles define what members can do in your workspace. Roles are managed at the deployment or organization level.
          </p>
        </div>
      </HeaderCTAContainer>

      {roles.length === 0 ? (
        <EmptyState
          title="No roles available"
          description="Contact your administrator to set up workspace roles."
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
            {roles.length} role{roles.length !== 1 ? "s" : ""}
          </div>
          <div>
            {roles.map((role) => {
              const memberCount = getMemberCountForRole(role.id);
              return (
                <RoleCard key={role.id}>
                  <RoleHeader>
                    <div>
                      <RoleName>{role.name}</RoleName>
                    </div>
                    <RoleMemberCount>
                      <Users size={14} />
                      {memberCount} {memberCount === 1 ? "member" : "members"}
                    </RoleMemberCount>
                  </RoleHeader>
                  {role.permissions && role.permissions.length > 0 && (
                    <PermissionsList>
                      {role.permissions.map((permission: string) => (
                        <PermissionBadge key={permission}>
                          {permission}
                        </PermissionBadge>
                      ))}
                    </PermissionsList>
                  )}
                </RoleCard>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};


export const ManageWorkspace = () => {
  const { activeWorkspace, loading } = useActiveWorkspace();
  const [activeTab, setActiveTab] = useState<"general" | "members" | "invitations" | "roles">("general");

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
      </Container>
    </TypographyProvider>
  );
};