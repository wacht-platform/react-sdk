import useSWR from "swr";
import { useClient } from "./use-client";
import type { Client } from "@/types";
import type {
  NewDomain,
  NewOrgnization,
  Organization,
  OrganizationDomain,
  OrganizationInvitation,
  OrganizationInvitationPayload,
  OrganizationMembership,
  OrganizationMembershipWithOrganization,
  OrganizationRole,
  OrganizationUpdate,
  RoleCreate,
  EnterpriseConnection,
  CreateEnterpriseConnectionPayload,
  UpdateEnterpriseConnectionPayload,
  SCIMTokenInfo,
  PaginatedResponse,
} from "@/types";
import { responseMapper } from "@/utils/response-mapper";
import { useSession, clearTokenCache } from "./use-session";
import { useCallback, useMemo } from "react";

export const useOrganizationList = () => {
  const { organizationMemberships, refetch, loading } =
    useOrganizationMemberships();
  const { client } = useClient();
  const { refetch: refetchSession } = useSession();

  const getOrganizationRoles = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<OrganizationRole[]>(
        await client(`/organizations/${organization.id}/roles`, {
          method: "GET",
        })
      );
      return response.data;
    },
    [client]
  );

  const getOrganizationMembers = useCallback(
    async (
      organization: Organization,
      params?: { page: number; limit: number; search?: string }
    ) => {
      const searchParams = new URLSearchParams();
      if (params) {
        searchParams.set("page", params.page.toString());
        searchParams.set("limit", params.limit.toString());
        if (params.search) {
          searchParams.set("search", params.search);
        }
      }

      const response = await responseMapper<PaginatedResponse<OrganizationMembership[]>>(
        await client(
          `/organizations/${organization.id}/members?${searchParams.toString()}`,
          {
            method: "GET",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const getOrganizationInvitations = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<OrganizationInvitation[]>(
        await client(`/organizations/${organization.id}/invitations`, {
          method: "GET",
        })
      );
      return response.data;
    },
    [client]
  );

  const getOrganizationDomains = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<OrganizationDomain[]>(
        await client(`/organizations/${organization.id}/domains`, {
          method: "GET",
        })
      );
      return response.data;
    },
    [client]
  );

  const removeOrganizationMember = useCallback(
    async (organization: Organization, member: OrganizationMembership) => {
      await client(`/organizations/${organization.id}/members/${member.id}/remove`, {
        method: "POST",
      });
    },
    [client]
  );

  const createOrganization = useCallback(
    async (organization: NewOrgnization) => {
      const formData = new FormData();
      formData.append("name", organization.name);
      if (organization.image) {
        formData.append("image", organization.image);
      }
      if (organization.description) {
        formData.append("description", organization.description);
      }
      const response = await responseMapper<{
        organization: Organization,
        membership: OrganizationMembership
      }>(
        await client("/organizations", {
          method: "POST",
          body: formData,
        })
      );
      clearTokenCache();
      await refetch();
      await refetchSession();
      return response;
    },
    [refetchSession, refetch, client]
  );

  const updateOrganization = useCallback(
    async (organization: Organization, update: OrganizationUpdate) => {
      const form = Object.entries(update).reduce((prev, [key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => prev.append(key, v));
          } else {
            prev.append(key, value as string | Blob);
          }
        }
        return prev;
      }, new FormData());
      const response = await responseMapper<Organization>(
        await client(`/organizations/${organization.id}/update`, {
          method: "POST",
          body: form,
        })
      );
      await refetch();
      return response;
    },
    [refetch, client]
  );

  const removeOrganizationRoles = useCallback(
    async (organization: Organization, role: OrganizationRole) => {
      await client(`/organizations/${organization.id}/roles/${role.id}/remove`, {
        method: "POST",
      });
    },
    [client]
  );

  const addOrganizationDomain = useCallback(
    async (organization: Organization, domain: NewDomain) => {
      const form = new FormData();
      form.append("domain", domain.fqdn);

      const response = await responseMapper<OrganizationDomain>(
        await client(`/organizations/${organization.id}/domains`, {
          method: "POST",
          body: form,
        })
      );

      return response;
    },
    [client]
  );

  const verifyOrganizationDomain = useCallback(
    async (organization: Organization, domain: OrganizationDomain) => {
      const response = await responseMapper<OrganizationDomain>(
        await client(
          `/organizations/${organization.id}/domains/${domain.id}/verify`,
          {
            method: "POST",
          }
        )
      );

      return response;
    },
    [client]
  );

  const removeOrganizationDomain = useCallback(
    async (organization: Organization, domain: OrganizationDomain) => {
      const response = await responseMapper<OrganizationDomain>(
        await client(`/organizations/${organization.id}/domains/${domain.id}/delete`, {
          method: "POST",
        })
      );

      return response;
    },
    [client]
  );

  const getEnterpriseConnections = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<EnterpriseConnection[]>(
        await client(`/organizations/${organization.id}/enterprise-connections`, {
          method: "GET",
        })
      );
      return response.data;
    },
    [client]
  );

  const createEnterpriseConnection = useCallback(
    async (organization: Organization, payload: CreateEnterpriseConnectionPayload) => {
      const form = new FormData();
      form.append("protocol", payload.protocol);

      // Domain is optional
      if (payload.domain_id) {
        form.append("domain_id", payload.domain_id);
      }

      if (payload.idp_entity_id) form.append("idp_entity_id", payload.idp_entity_id);
      if (payload.idp_sso_url) form.append("idp_sso_url", payload.idp_sso_url);
      if (payload.idp_certificate) form.append("idp_certificate", payload.idp_certificate);
      if (payload.oidc_client_id) form.append("oidc_client_id", payload.oidc_client_id);
      if (payload.oidc_client_secret) form.append("oidc_client_secret", payload.oidc_client_secret);
      if (payload.oidc_issuer_url) form.append("oidc_issuer_url", payload.oidc_issuer_url);
      if (payload.oidc_scopes) form.append("oidc_scopes", payload.oidc_scopes);

      if (payload.jit_enabled !== undefined) {
        form.append("jit_enabled", String(payload.jit_enabled));
      }

      if (payload.attribute_mapping) {
        form.append("attribute_mapping", JSON.stringify(payload.attribute_mapping));
      }

      const response = await responseMapper<EnterpriseConnection>(
        await client(`/organizations/${organization.id}/enterprise-connections`, {
          method: "POST",
          body: form,
        })
      );
      return response.data;
    },
    [client]
  );

  const updateEnterpriseConnection = useCallback(
    async (
      organization: Organization,
      connectionId: string,
      payload: UpdateEnterpriseConnectionPayload
    ) => {
      const form = new FormData();

      if (payload.domain_id) form.append("domain_id", payload.domain_id);
      if (payload.idp_entity_id) form.append("idp_entity_id", payload.idp_entity_id);
      if (payload.idp_sso_url) form.append("idp_sso_url", payload.idp_sso_url);
      if (payload.idp_certificate) form.append("idp_certificate", payload.idp_certificate);
      if (payload.oidc_client_id) form.append("oidc_client_id", payload.oidc_client_id);
      if (payload.oidc_client_secret) form.append("oidc_client_secret", payload.oidc_client_secret);
      if (payload.oidc_issuer_url) form.append("oidc_issuer_url", payload.oidc_issuer_url);
      if (payload.oidc_scopes) form.append("oidc_scopes", payload.oidc_scopes);

      if (payload.attribute_mapping) {
        form.append("attribute_mapping", JSON.stringify(payload.attribute_mapping));
      }

      const response = await responseMapper<EnterpriseConnection>(
        await client(
          `/organizations/${organization.id}/enterprise-connections/${connectionId}/update`,
          {
            method: "POST",
            body: form,
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const deleteEnterpriseConnection = useCallback(
    async (organization: Organization, connectionId: string) => {
      await client(
        `/organizations/${organization.id}/enterprise-connections/${connectionId}/delete`,
        {
          method: "POST",
        }
      );
    },
    [client]
  );

  const testEnterpriseConnectionConfig = useCallback(
    async (
      organization: Organization,
      payload: {
        protocol: "saml" | "oidc";
        idp_entity_id?: string;
        idp_sso_url?: string;
        idp_certificate?: string;
        oidc_issuer_url?: string;
        oidc_client_id?: string;
        oidc_client_secret?: string;
      }
    ) => {
      const form = new FormData();
      form.append("protocol", payload.protocol);

      if (payload.idp_entity_id) form.append("idp_entity_id", payload.idp_entity_id);
      if (payload.idp_sso_url) form.append("idp_sso_url", payload.idp_sso_url);
      if (payload.idp_certificate) form.append("idp_certificate", payload.idp_certificate);
      if (payload.oidc_issuer_url) form.append("oidc_issuer_url", payload.oidc_issuer_url);
      if (payload.oidc_client_id) form.append("oidc_client_id", payload.oidc_client_id);
      if (payload.oidc_client_secret) form.append("oidc_client_secret", payload.oidc_client_secret);

      const response = await responseMapper<{
        success: boolean;
        protocol: string;
        checks: Record<string, boolean>;
        errors?: Record<string, string>;
      }>(
        await client(`/organizations/${organization.id}/enterprise-connections/test`, {
          method: "POST",
          body: form,
        })
      );
      return response.data;
    },
    [client]
  );

  // Test an existing enterprise connection (post-validation)
  const testEnterpriseConnection = useCallback(
    async (organization: Organization, connectionId: string) => {
      const response = await responseMapper<{
        success: boolean;
        protocol: string;
        checks: Record<string, boolean>;
        errors?: Record<string, string>;
      }>(
        await client(`/organizations/${organization.id}/enterprise-connections/${connectionId}/test`, {
          method: "POST",
        })
      );
      return response.data;
    },
    [client]
  );

  // SCIM Token Management
  const generateSCIMToken = useCallback(
    async (organization: Organization, connectionId: string) => {
      const response = await responseMapper<SCIMTokenInfo>(
        await client(
          `/organizations/${organization.id}/enterprise-connections/${connectionId}/scim/token`,
          {
            method: "POST",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const getSCIMToken = useCallback(
    async (organization: Organization, connectionId: string) => {
      const response = await responseMapper<SCIMTokenInfo>(
        await client(
          `/organizations/${organization.id}/enterprise-connections/${connectionId}/scim/token`,
          {
            method: "GET",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const revokeSCIMToken = useCallback(
    async (organization: Organization, connectionId: string) => {
      await client(
        `/organizations/${organization.id}/enterprise-connections/${connectionId}/scim/token/revoke`,
        {
          method: "POST",
        }
      );
    },
    [client]
  );

  const addRole = useCallback(
    async (organization: Organization, newRole: RoleCreate) => {
      const form = new FormData();
      form.append("name", newRole.name);
      if (newRole.permissions) {
        newRole.permissions.forEach((permission, index) => {
          form.append(`permissions[${index}]`, permission);
        });
      }

      const response = await responseMapper<OrganizationRole>(
        await client(`/organizations/${organization.id}/roles`, {
          method: "POST",
          body: form,
        })
      );

      return response;
    },
    [client]
  );

  const leaveOrganization = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<void>(
        await client(`/organizations/${organization.id}/leave`, {
          method: "POST",
        })
      );
      return response.data;
    },
    [client]
  );

  const deleteOrganization = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<void>(
        await client(`/organizations/${organization.id}/delete`, {
          method: "POST",
        })
      );
      clearTokenCache();
      await refetch();
      await refetchSession();
      return response.data;
    },
    [client, refetch, refetchSession]
  );

  const addRoleToOrganizationMember = useCallback(
    async (
      organization: Organization,
      member: OrganizationMembership,
      role: OrganizationRole
    ) => {
      const response = await responseMapper<OrganizationMembership>(
        await client(
          `/organizations/${organization.id}/members/${member.id}/roles/${role.id}/add`,
          {
            method: "POST",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const removeRoleFromOrganizationMember = useCallback(
    async (
      organization: Organization,
      member: OrganizationMembership,
      role: OrganizationRole
    ) => {
      const response = await responseMapper<OrganizationMembership>(
        await client(
          `/organizations/${organization.id}/members/${member.id}/roles/${role.id}/remove`,
          {
            method: "POST",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const inviteOrganizationMember = useCallback(
    async (
      organization: Organization,
      invitation: OrganizationInvitationPayload
    ) => {
      const form = new FormData();
      form.append("email", invitation.email);
      form.append("role_id", invitation.organizationRole.id);
      if (invitation.workspace?.id) {
        form.append("workspace_id", invitation.workspace.id);
      }
      if (invitation.workspaceRole?.id) {
        form.append("workspace_role_id", invitation.workspaceRole.id);
      }

      const response = await responseMapper<OrganizationInvitation>(
        await client(`/organizations/${organization.id}/invitations`, {
          method: "POST",
          body: form,
        })
      );
      return response.data;
    },
    [client]
  );

  const discardOrganizationInvitation = useCallback(
    async (organization: Organization, invitation: OrganizationInvitation) => {
      const response = await responseMapper<OrganizationInvitation>(
        await client(
          `/organizations/${organization.id}/invitations/${invitation.id}/discard`,
          {
            method: "POST",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const resendOrganizationInvitation = useCallback(
    async (organization: Organization, invitation: OrganizationInvitation) => {
      const response = await responseMapper<OrganizationInvitation>(
        await client(
          `/organizations/${organization.id}/invitations/${invitation.id}/resend`,
          {
            method: "POST",
          }
        )
      );
      return response.data;
    },
    [client]
  );

  const organizations = useMemo(() => {
    return organizationMemberships?.map(
      (membership) => membership.organization
    );
  }, [organizationMemberships]);

  return {
    organizations,
    loading,
    error: null,
    refetch,
    leaveOrganization,
    getOrganizationRoles,
    getOrganizationMembers,
    removeOrganizationMember,
    createOrganization,
    getOrganizationInvitations,
    getOrganizationDomains,
    addOrganizationDomain,
    verifyOrganizationDomain,
    removeOrganizationDomain,
    addRoleToOrganizationMember,
    removeRoleFromOrganizationMember,
    inviteOrganizationMember,
    discardOrganizationInvitation,
    resendOrganizationInvitation,
    updateOrganization,
    addRole,
    removeOrganizationRoles,
    deleteOrganization,
    getEnterpriseConnections,
    createEnterpriseConnection,
    updateEnterpriseConnection,
    deleteEnterpriseConnection,
    testEnterpriseConnectionConfig,
    testEnterpriseConnection,
    generateSCIMToken,
    getSCIMToken,
    revokeSCIMToken,
  };
};

export const useActiveOrganization = () => {
  const {
    loading,
    error: organizationLoadingError,
    refetch: refetchOrganizations,
    getOrganizationMembers,
    getOrganizationRoles,
    leaveOrganization,
    removeOrganizationMember,
    getOrganizationInvitations,
    getOrganizationDomains,
    removeOrganizationDomain,
    addOrganizationDomain,
    verifyOrganizationDomain,
    addRoleToOrganizationMember,
    removeRoleFromOrganizationMember,
    inviteOrganizationMember,
    discardOrganizationInvitation,
    resendOrganizationInvitation,
    updateOrganization,
    removeOrganizationRoles,
    getEnterpriseConnections,
    createEnterpriseConnection,
    updateEnterpriseConnection,
    deleteEnterpriseConnection,
    testEnterpriseConnectionConfig,
    testEnterpriseConnection,
    generateSCIMToken,
    getSCIMToken,
    revokeSCIMToken,
  } = useOrganizationList();
  const {
    session,
    error: sessionLoadingError,
    loading: sessionLoading,
  } = useSession();
  const { organizationMemberships } = useOrganizationMemberships();

  const activeMembership = useMemo(() => {
    return (
      organizationMemberships?.find(
        (membership) =>
          membership.id ===
          session?.active_signin?.active_organization_membership_id
      ) || null
    );
  }, [organizationMemberships, session]);

  const activeOrganization = useMemo(() => {
    return activeMembership?.organization || null;
  }, [activeMembership]);

  const updateActiveOrganization = useCallback(
    async (update: OrganizationUpdate) => {
      if (!activeOrganization) return [];
      const data = await updateOrganization(activeOrganization, update);
      return data;
    },
    [activeOrganization, updateOrganization]
  );

  const getCurrentOrganizationMembers = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationMembers(activeOrganization);
    return data;
  }, [activeOrganization, getOrganizationMembers]);

  const getCurrentOrganizationRoles = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationRoles(activeOrganization);
    return data;
  }, [activeOrganization, getOrganizationRoles]);

  const removeCurrentOrganizationMember = useCallback(
    async (member: OrganizationMembership) => {
      if (!activeOrganization) return [];
      const data = await removeOrganizationMember(activeOrganization, member);
      return data;
    },
    [activeOrganization, removeOrganizationMember]
  );

  const removeActiveOrganizationRole = useCallback(
    async (role: OrganizationRole) => {
      if (!activeOrganization) return;
      const data = await removeOrganizationRoles(activeOrganization, role);
      return data;
    },
    [activeOrganization, removeOrganizationRoles]
  );

  const getCurrentOrganizationDomains = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationDomains(activeOrganization);
    return data;
  }, [activeOrganization, getOrganizationDomains]);

  const addDomainToActiveOrganization = useCallback(
    async (domain: NewDomain) => {
      if (!activeOrganization) return;
      const data = await addOrganizationDomain(activeOrganization, domain);
      return data;
    },
    [activeOrganization, addOrganizationDomain]
  );

  const verifyActiveOrganizationDomain = useCallback(
    async (domain: OrganizationDomain) => {
      if (!activeOrganization) return;
      const data = await verifyOrganizationDomain(activeOrganization, domain);
      return data;
    },
    [activeOrganization, verifyOrganizationDomain]
  );

  const removeActiveOrganizationDomain = useCallback(
    async (domain: OrganizationDomain) => {
      if (!activeOrganization) return;

      const data = await removeOrganizationDomain(activeOrganization, domain);
      return data;
    },
    [activeOrganization, removeOrganizationDomain]
  );

  const addRoleToCurrentOrganizationMember = useCallback(
    async (member: OrganizationMembership, role: OrganizationRole) => {
      if (!activeOrganization) return;
      const data = await addRoleToOrganizationMember(
        activeOrganization,
        member,
        role
      );
      return data;
    },
    [activeOrganization, addRoleToOrganizationMember]
  );

  const removeRoleFromCurrentOrganizationMember = useCallback(
    async (member: OrganizationMembership, role: OrganizationRole) => {
      if (!activeOrganization) return;
      const data = await removeRoleFromOrganizationMember(
        activeOrganization,
        member,
        role
      );
      return data;
    },
    [activeOrganization, removeRoleFromOrganizationMember]
  );

  const inviteMemberToOrganization = useCallback(
    async (invitationPayload: OrganizationInvitationPayload) => {
      if (!activeOrganization) return;
      const data = await inviteOrganizationMember(
        activeOrganization,
        invitationPayload
      );
      return data;
    },
    [activeOrganization, inviteOrganizationMember]
  );

  const discardInvitationToOrganization = useCallback(
    async (invitation: OrganizationInvitation) => {
      if (!activeOrganization) return;
      const data = await discardOrganizationInvitation(
        activeOrganization,
        invitation
      );
      return data;
    },
    [activeOrganization, discardOrganizationInvitation]
  );

  const resendInvitationToOrganization = useCallback(
    async (invitation: OrganizationInvitation) => {
      if (!activeOrganization) return;
      const data = await resendOrganizationInvitation(
        activeOrganization,
        invitation
      );
      return data;
    },
    [activeOrganization, resendOrganizationInvitation]
  );

  const leaveCurrentOrganization = useCallback(async () => {
    if (!activeOrganization) return;
    await leaveOrganization(activeOrganization);
  }, [activeOrganization, leaveOrganization]);

  const getCurrentOrganizationInvitations = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationInvitations(activeOrganization);
    return data;
  }, [activeOrganization, getOrganizationInvitations]);

  const getCurrentEnterpriseConnections = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getEnterpriseConnections(activeOrganization);
    return data;
  }, [activeOrganization, getEnterpriseConnections]);

  const createActiveEnterpriseConnection = useCallback(
    async (payload: CreateEnterpriseConnectionPayload) => {
      if (!activeOrganization) return;
      return await createEnterpriseConnection(activeOrganization, payload);
    },
    [activeOrganization, createEnterpriseConnection]
  );

  const updateActiveEnterpriseConnection = useCallback(
    async (connectionId: string, payload: UpdateEnterpriseConnectionPayload) => {
      if (!activeOrganization) return;
      return await updateEnterpriseConnection(activeOrganization, connectionId, payload);
    },
    [activeOrganization, updateEnterpriseConnection]
  );

  const deleteActiveEnterpriseConnection = useCallback(
    async (connectionId: string) => {
      if (!activeOrganization) return;
      await deleteEnterpriseConnection(activeOrganization, connectionId);
    },
    [activeOrganization, deleteEnterpriseConnection]
  );

  const testActiveEnterpriseConnectionConfig = useCallback(
    async (payload: Parameters<typeof testEnterpriseConnectionConfig>[1]) => {
      if (!activeOrganization) return null;
      return await testEnterpriseConnectionConfig(activeOrganization, payload);
    },
    [activeOrganization, testEnterpriseConnectionConfig]
  );

  const testActiveEnterpriseConnection = useCallback(
    async (connectionId: string) => {
      if (!activeOrganization) return null;
      return await testEnterpriseConnection(activeOrganization, connectionId);
    },
    [activeOrganization, testEnterpriseConnection]
  );

  const generateActiveSCIMToken = useCallback(
    async (connectionId: string) => {
      if (!activeOrganization) return;
      return await generateSCIMToken(activeOrganization, connectionId);
    },
    [activeOrganization, generateSCIMToken]
  );

  const getActiveSCIMToken = useCallback(
    async (connectionId: string) => {
      if (!activeOrganization) return;
      return await getSCIMToken(activeOrganization, connectionId);
    },
    [activeOrganization, getSCIMToken]
  );

  const revokeActiveSCIMToken = useCallback(
    async (connectionId: string) => {
      if (!activeOrganization) return;
      await revokeSCIMToken(activeOrganization, connectionId);
    },
    [activeOrganization, revokeSCIMToken]
  );

  if (sessionLoading || loading) {
    return {
      activeOrganization: null,
      activeMembership: null,
      loading: true,
      error: sessionLoadingError || organizationLoadingError,
      updateOrganization: null as never,
      getRoles: null as never,
      getMembers: null as never,
      getDomains: null as never,
      addDomain: null as never,
      verifyDomain: null as never,
      removeDomain: null as never,
      removeRole: null as never,
      getInvitations: null as never,
      removeMember: null as never,
      addMemberRole: null as never,
      removeMemberRole: null as never,
      inviteMember: null as never,
      discardInvitation: null as never,
      resendInvitation: null as never,
      leave: null as never,
      getEnterpriseConnections: null as never,
      createEnterpriseConnection: null as never,
      updateEnterpriseConnection: null as never,
      deleteEnterpriseConnection: null as never,
      generateSCIMToken: null as never,
      getSCIMToken: null as never,
      revokeSCIMToken: null as never,
    };
  }

  return {
    activeOrganization: activeOrganization,
    activeMembership: activeMembership,
    loading: false,
    refetch: refetchOrganizations,
    getRoles: getCurrentOrganizationRoles,
    updateOrganization: updateActiveOrganization,
    getMembers: getCurrentOrganizationMembers,
    getDomains: getCurrentOrganizationDomains,
    addDomain: addDomainToActiveOrganization,
    verifyDomain: verifyActiveOrganizationDomain,
    removeDomain: removeActiveOrganizationDomain,
    getInvitations: getCurrentOrganizationInvitations,
    removeMember: removeCurrentOrganizationMember,
    leave: leaveCurrentOrganization,
    removeRole: removeActiveOrganizationRole,
    addMemberRole: addRoleToCurrentOrganizationMember,
    removeMemberRole: removeRoleFromCurrentOrganizationMember,
    inviteMember: inviteMemberToOrganization,
    discardInvitation: discardInvitationToOrganization,
    resendInvitation: resendInvitationToOrganization,
    getEnterpriseConnections: getCurrentEnterpriseConnections,
    createEnterpriseConnection: createActiveEnterpriseConnection,
    updateEnterpriseConnection: updateActiveEnterpriseConnection,
    deleteEnterpriseConnection: deleteActiveEnterpriseConnection,
    testEnterpriseConnectionConfig: testActiveEnterpriseConnectionConfig,
    testEnterpriseConnection: testActiveEnterpriseConnection,
    generateSCIMToken: generateActiveSCIMToken,
    getSCIMToken: getActiveSCIMToken,
    revokeSCIMToken: revokeActiveSCIMToken,
    error: null,
  };
};

async function fetchOrganizationMemberships(client: Client) {
  const response = await responseMapper<
    OrganizationMembershipWithOrganization[]
  >(await client("/me/organization-memberships"));
  return response.data;
}

export const useOrganizationMemberships = () => {
  const { client, loading } = useClient();

  const { data, isLoading, error, mutate } = useSWR(
    !loading ? "/me/organization-memberships" : null,
    () => fetchOrganizationMemberships(client),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
    }
  );

  const refetch = useCallback(async () => {
    await mutate(data, { revalidate: true });
  }, [mutate]);

  return {
    organizationMemberships: data,
    loading: loading || isLoading,
    error,
    refetch,
  };
};
