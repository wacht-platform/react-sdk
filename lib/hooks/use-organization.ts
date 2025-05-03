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
import { mapResponse } from "@/utils/response-mapper";
import { useSession } from "./use-session";
import { useCallback, useMemo } from "react";

export const useOrganizationList = () => {
  const { organizationMemberships, refetch, loading } =
    useOrganizationMemberships();
  const { client } = useClient();
  const { refetch: refetchSession } = useSession();

  const getOrganizationRoles = useCallback(
    async (id: string) => {
      const response = await mapResponse<OrganizationRole[]>(
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
      const response = await mapResponse<OrganizationMembership[]>(
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
      const response = await mapResponse<OrganizationInvitation[]>(
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
      const response = await mapResponse<OrganizationDomain[]>(
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
      const response = await mapResponse<Organization>(
        await client("/organizations", {
          method: "POST",
          body: formData,
        }),
      );
      await refetch();
      await refetchSession();
      return response.data;
    },
    [refetchSession, client],
  );

  const leaveOrganization = useCallback(
    async (id: string) => {
      const response = await mapResponse<void>(
        await client(`/organizations/${id}/leave`, {
          method: "DELETE",
        }),
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
    getOrganizationDomains,
    removeOrganizationMember,
    createOrganization,
    getOrganizationInvitations,
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
    getOrganizationDomains,
    getOrganizationInvitations,
  } = useOrganizationList();
  const {
    session,
    error: sessionLoadingError,
    loading: sessionLoading,
  } = useSession();

  const selectedOrganization = useMemo(() => {
    return (
      organizations?.find(
        (organization) =>
          organization.id === session?.active_signin?.active_organization_id,
      ) || null
    );
  }, [organizations, session]);

  const getCurrentOrganizationMembers = useCallback(async () => {
    if (!selectedOrganization) return [];
    const data = await getOrganizationMembers(selectedOrganization.id);
    return data;
  }, [selectedOrganization, getOrganizationMembers]);

  const getCurrentOrganizationRoles = useCallback(async () => {
    if (!selectedOrganization) return [];
    const data = await getOrganizationRoles(selectedOrganization.id);
    return data;
  }, [selectedOrganization, getOrganizationRoles]);

  const removeCurrentOrganizationMember = useCallback(
    async (memberId: string) => {
      if (!selectedOrganization) return [];
      const data = await removeOrganizationMember(
        memberId,
        selectedOrganization.id,
      );
      return data;
    },
    [selectedOrganization, removeOrganizationMember],
  );

  const getCurrentOrganizationDomains = useCallback(async () => {
    if (!selectedOrganization) return [];
    const data = await getOrganizationDomains(selectedOrganization.id);
    return data;
  }, [selectedOrganization, getOrganizationDomains]);

  const leaveCurrentOrganization = useCallback(async () => {
    if (!selectedOrganization) return;
    await leaveOrganization(selectedOrganization.id);
  }, [selectedOrganization, leaveOrganization]);

  const getCurrentOrganizationInvitations = useCallback(async () => {
    if (!selectedOrganization) return [];
    const data = await getOrganizationInvitations(selectedOrganization.id);
    return data;
  }, [selectedOrganization, getOrganizationInvitations]);

  if (sessionLoading || loading) {
    return {
      selectedOrganization: null,
      loading,
      error: sessionLoadingError || organizationLoadingError,
      createOrganization: null as never,
      getOrganizationRoles: null as never,
      getOrganizationMembers: null as never,
      removeOrganizationMember: null as never,
      getOrganizationInvitations: null as never,
      leaveOrganization: null as never,
    };
  }

  return {
    selectedOrganization,
    loading,
    refetch: refetchOrganizations,
    getOrganizationRoles: getCurrentOrganizationRoles,
    getOrganizationMembers: getCurrentOrganizationMembers,
    getOrganizationDomains: getCurrentOrganizationDomains,
    getOrganizationInvitations: getCurrentOrganizationInvitations,
    removeOrganizationMember: removeCurrentOrganizationMember,
    leaveOrganization: leaveCurrentOrganization,
    error: null,
  };
};

async function fetchOrganizationMemberships(client: Client) {
  const response = await mapResponse<OrganizationMembershipWithOrganization[]>(
    await client("/me/organization-memberships"),
  );
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
    },
  );

  return {
    organizationMemberships: data,
    loading: loading || isLoading,
    error,
    refetch: mutate,
  };
};
