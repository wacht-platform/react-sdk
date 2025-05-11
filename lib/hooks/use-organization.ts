import useSWR from "swr";
import { useClient } from "./use-client";
import { Client } from "@/types/client";
import {
  Organization,
  OrganizationDomain,
  OrganizationInvitation,
  OrganizationMembership,
  OrganizationMembershipWithOrganization,
  OrganizationRole,
} from "@/types/organization";
import { responseMapper } from "@/utils/response-mapper";
import { useSession } from "./use-session";
import { useCallback, useMemo } from "react";

export const useOrganizationList = () => {
  const { organizationMemberships, refetch, loading } =
    useOrganizationMemberships();
  const { client } = useClient();
  const { refetch: refetchSession } = useSession();

  const getOrganizationRoles = useCallback(
    async (id: string) => {
      const response = await responseMapper<OrganizationRole[]>(
        await client(`/organizations/${id}/roles`, {
          method: "GET",
        }),
      );
      return response.data;
    },
    [client],
  );

  const getOrganizationMembers = useCallback(
    async (id: string) => {
      const response = await responseMapper<OrganizationMembership[]>(
        await client(`/organizations/${id}/members`, {
          method: "GET",
        }),
      );
      return response.data;
    },
    [client],
  );

  const getOrganizationInvitations = useCallback(
    async (id: string) => {
      const response = await responseMapper<OrganizationInvitation[]>(
        await client(`/organizations/${id}/invitations`, {
          method: "GET",
        }),
      );
      return response.data;
    },
    [client],
  );

  const getOrganizationDomains = useCallback(
    async (id: string) => {
      const response = await responseMapper<OrganizationDomain[]>(
        await client(`/organizations/${id}/domains`, {
          method: "GET",
        }),
      );
      return response.data;
    },
    [client],
  );

  const removeOrganizationMember = useCallback(
    async (memberId: string, organizationId: string) => {
      await client(`/organizations/${organizationId}/members/${memberId}`, {
        method: "DELETE",
      });
      await refetch();
    },
    [refetch, client],
  );

  const createOrganization = useCallback(
    async (name: string, image?: File, description?: string) => {
      const formData = new FormData();
      formData.append("name", name);
      if (image) {
        formData.append("image", image);
      }
      if (description) {
        formData.append("description", description);
      }
      const response = await responseMapper<Organization>(
        await client("/organizations", {
          method: "POST",
          body: formData,
        }),
      );
      await refetch();
      await refetchSession();
      return response;
    },
    [refetchSession, client],
  );

  // const updateOrganization = useCallback(
  //   async ()
  // )

  const addOrganizationDomain = useCallback(
    async (id: string, fqdn: string) => {
      const response = await responseMapper<OrganizationDomain>(
        await client(`/organizations/${id}/domains`, {
          method: "POST",
          body: JSON.stringify({ domain: fqdn }),
        }),
      );

      return response;
    },
    [client],
  );

  const verifyOrganizationDomain = useCallback(
    async (id: string, domainId: string) => {
      const response = await responseMapper<OrganizationDomain>(
        await client(`/organizations/${id}/domains/${domainId}/verify`, {
          method: "POST",
        }),
      );

      return response;
    },
    [client],
  );

  const removeOrganizationDomain = useCallback(
    async (id: string, domainId: string) => {
      const response = await responseMapper<OrganizationDomain>(
        await client(`/organizations/${id}/domains/${domainId}`, {
          method: "DELETE",
        }),
      );

      return response;
    },
    [client],
  );

  const leaveOrganization = useCallback(
    async (id: string) => {
      const response = await responseMapper<void>(
        await client(`/organizations/${id}/leave`, {
          method: "DELETE",
        }),
      );
      return response.data;
    },
    [client],
  );

  const addRoleToOrganizationMember = useCallback(
    async (organizationId: string, memberId: string, roleId: string) => {
      const response = await responseMapper<OrganizationMembership>(
        await client(
          `/organizations/${organizationId}/members/${memberId}/roles/${roleId}`,
          {
            method: "PUT",
          },
        ),
      );
      return response.data;
    },
    [client],
  );

  const removeRoleFromOrganizationMember = useCallback(
    async (organizationId: string, memberId: string, roleId: string) => {
      const response = await responseMapper<OrganizationMembership>(
        await client(
          `/organizations/${organizationId}/members/${memberId}/roles/${roleId}`,
          {
            method: "DELETE",
          },
        ),
      );
      return response.data;
    },
    [client],
  );

  const inviteOrganizationMember = useCallback(
    async (
      organizationId: string,
      email: string,
      roleId?: string,
      workspaceId?: string,
      workspaceRoleId?: string,
    ) => {
      const response = await responseMapper<OrganizationInvitation>(
        await client(`/organizations/${organizationId}/invitations`, {
          method: "POST",
          body: JSON.stringify({
            email: email,
            role_id: roleId,
            workspace_id: workspaceId,
            workspace_role_id: workspaceRoleId,
          }),
        }),
      );
      return response.data;
    },
    [client],
  );

  const discardOrganizationInvitation = useCallback(
    async (organizationId: string, invitationId: string) => {
      const response = await responseMapper<OrganizationInvitation>(
        await client(
          `/organizations/${organizationId}/invitations/${invitationId}`,
          {
            method: "DELETE",
          },
        ),
      );
      return response.data;
    },
    [client],
  );

  const organizations = useMemo(() => {
    return organizationMemberships?.map(
      (membership) => membership.organization,
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
  };
};

export const useActiveOrganization = () => {
  const {
    organizations,
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
  } = useOrganizationList();
  const {
    session,
    error: sessionLoadingError,
    loading: sessionLoading,
  } = useSession();

  const activeOrganization = useMemo(() => {
    return (
      organizations?.find(
        (organization) =>
          organization.id === session?.active_signin?.active_organization_id,
      ) || null
    );
  }, [organizations, session]);

  const getCurrentOrganizationMembers = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationMembers(activeOrganization.id);
    return data;
  }, [activeOrganization, getOrganizationMembers]);

  const getCurrentOrganizationRoles = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationRoles(activeOrganization.id);
    return data;
  }, [activeOrganization, getOrganizationRoles]);

  const removeCurrentOrganizationMember = useCallback(
    async (memberId: string) => {
      if (!activeOrganization) return [];
      const data = await removeOrganizationMember(
        memberId,
        activeOrganization.id,
      );
      return data;
    },
    [activeOrganization, removeOrganizationMember],
  );

  const getCurrentOrganizationDomains = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationDomains(activeOrganization.id);
    return data;
  }, [activeOrganization, getOrganizationDomains]);

  const addDomainToActiveOrganization = useCallback(
    async (domain: string) => {
      if (!activeOrganization) return;
      const data = await addOrganizationDomain(activeOrganization.id, domain);
      return data;
    },
    [activeOrganization, addOrganizationDomain],
  );

  const verifyActiveOrganizationDomain = useCallback(
    async (domainId: string) => {
      if (!activeOrganization) return;
      const data = await verifyOrganizationDomain(
        activeOrganization.id,
        domainId,
      );
      return data;
    },
    [activeOrganization, verifyOrganizationDomain],
  );

  const removeActiveOrganizationDomain = useCallback(
    async (domainId: string) => {
      if (!activeOrganization) return;

      const data = await removeOrganizationDomain(
        activeOrganization.id,
        domainId,
      );
      return data;
    },
    [activeOrganization, removeOrganizationDomain],
  );

  const addRoleToCurrentOrganizationMember = useCallback(
    async (memberId: string, roleId: string) => {
      if (!activeOrganization) return;
      const data = await addRoleToOrganizationMember(
        activeOrganization.id,
        memberId,
        roleId,
      );
      return data;
    },
    [activeOrganization, addRoleToOrganizationMember],
  );

  const removeRoleFromCurrentOrganizationMember = useCallback(
    async (memberId: string, roleId: string) => {
      if (!activeOrganization) return;
      const data = await removeRoleFromOrganizationMember(
        activeOrganization.id,
        memberId,
        roleId,
      );
      return data;
    },
    [activeOrganization, removeRoleFromOrganizationMember],
  );

  const inviteMemberToOrganization = useCallback(
    async (
      email: string,
      roleId?: string,
      workspaceId?: string,
      workspaceRoleId?: string,
    ) => {
      if (!activeOrganization) return;
      const data = await inviteOrganizationMember(
        activeOrganization.id,
        email,
        roleId,
        workspaceId,
        workspaceRoleId,
      );
      return data;
    },
    [activeOrganization, inviteOrganizationMember],
  );

  const discardInvitationToOrganization = useCallback(
    async (invitationId: string) => {
      if (!activeOrganization) return;
      const data = await discardOrganizationInvitation(
        activeOrganization.id,
        invitationId,
      );
      return data;
    },
    [activeOrganization, discardOrganizationInvitation],
  );

  const leaveCurrentOrganization = useCallback(async () => {
    if (!activeOrganization) return;
    await leaveOrganization(activeOrganization.id);
  }, [activeOrganization, leaveOrganization]);

  const getCurrentOrganizationInvitations = useCallback(async () => {
    if (!activeOrganization) return [];
    const data = await getOrganizationInvitations(activeOrganization.id);
    return data;
  }, [activeOrganization, getOrganizationInvitations]);

  if (sessionLoading || loading) {
    return {
      activeOrganization: null,
      loading: true,
      error: sessionLoadingError || organizationLoadingError,
      getRoles: null as never,
      getMembers: null as never,
      getDomains: null as never,
      addDomain: null as never,
      verifyDomain: null as never,
      removeDomain: null as never,
      getInvitations: null as never,
      removeMember: null as never,
      addRole: null as never,
      removeRole: null as never,
      inviteMember: null as never,
      discardInvitation: null as never,
      leave: null as never,
    };
  }

  return {
    activeOrganization: activeOrganization,
    loading: false,
    refetch: refetchOrganizations,
    getRoles: getCurrentOrganizationRoles,
    getMembers: getCurrentOrganizationMembers,
    getDomains: getCurrentOrganizationDomains,
    addDomain: addDomainToActiveOrganization,
    verifyDomain: verifyActiveOrganizationDomain,
    removeDomain: removeActiveOrganizationDomain,
    getInvitations: getCurrentOrganizationInvitations,
    removeMember: removeCurrentOrganizationMember,
    leave: leaveCurrentOrganization,
    addRole: addRoleToCurrentOrganizationMember,
    removeRole: removeRoleFromCurrentOrganizationMember,
    inviteMember: inviteMemberToOrganization,
    discardInvitation: discardInvitationToOrganization,
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
    },
  );

  return {
    organizationMemberships: data,
    loading: loading || isLoading,
    error,
    refetch: mutate,
  };
};
