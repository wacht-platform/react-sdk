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
} from "@/types";
import { responseMapper } from "@/utils/response-mapper";
import { useSession } from "./use-session";
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
    async (organization: Organization) => {
      const response = await responseMapper<OrganizationMembership[]>(
        await client(`/organizations/${organization.id}/members`, {
          method: "GET",
        })
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
      await client(`/organizations/${organization.id}/members/${member.id}`, {
        method: "DELETE",
      });
      await refetch();
    },
    [refetch, client]
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
      const response = await responseMapper<Organization>(
        await client("/organizations", {
          method: "POST",
          body: formData,
        })
      );
      await refetch();
      await refetchSession();
      return response;
    },
    [refetchSession, refetch, client]
  );

  const updateOrganization = useCallback(
    async (organization: Organization, update: OrganizationUpdate) => {
      const form = Object.entries(update).reduce((prev, [key, value]) => {
        if (value) {
          prev.append(key, value);
        }
        return prev;
      }, new FormData());
      const response = await responseMapper<Organization>(
        await client(`/organizations/${organization.id}`, {
          method: "PATCH",
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
      await client(`/organizations/${organization.id}/roles/${role.id}`, {
        method: "DELETE",
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
        await client(`/organizations/${organization.id}/domains/${domain.id}`, {
          method: "DELETE",
        })
      );

      return response;
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
          method: "DELETE",
        })
      );
      return response.data;
    },
    [client]
  );

  const deleteOrganization = useCallback(
    async (organization: Organization) => {
      const response = await responseMapper<void>(
        await client(`/organizations/${organization.id}`, {
          method: "DELETE",
        })
      );
      return response.data;
    },
    [client]
  );

  const addRoleToOrganizationMember = useCallback(
    async (
      organization: Organization,
      member: OrganizationMembership,
      role: OrganizationRole
    ) => {
      const response = await responseMapper<OrganizationMembership>(
        await client(
          `/organizations/${organization.id}/members/${member.id}/roles/${role.id}`,
          {
            method: "PUT",
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
          `/organizations/${organization.id}/members/${member.id}/roles/${role.id}`,
          {
            method: "DELETE",
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
          `/organizations/${organization.id}/invitations/${invitation.id}`,
          {
            method: "DELETE",
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
  } = useOrganizationList();
  const {
    session,
    error: sessionLoadingError,
    loading: sessionLoading,
  } = useSession();
  const { organizationMemberships } = useOrganizationMemberships();

  const activeOrganization = useMemo(() => {
    return (
      organizationMemberships?.find(
        (organization) =>
          organization.id ===
          session?.active_signin?.active_organization_membership_id
      )?.organization || null
    );
  }, [organizationMemberships, session]);

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

  if (sessionLoading || loading) {
    return {
      activeOrganization: null,
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
    };
  }

  return {
    activeOrganization: activeOrganization,
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

  return {
    organizationMemberships: data,
    loading: loading || isLoading,
    error,
    refetch: mutate,
  };
};
