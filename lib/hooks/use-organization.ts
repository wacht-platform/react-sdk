import useSWR from "swr";
import { useClient } from "./use-client";
import { Client } from "@/types/client";
import { Organization, OrganizationMembership } from "@/types/organization";
import { mapResponse } from "@/utils/response-mapper";
import { useSession } from "./use-session";
import { useMemo } from "react";

export const useOrganizationList = () => {
  const { organizationMemberships, refetch, loading } =
    useOrganizationMemberships();

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
  };
};

export const useOrganization = () => {
  const { client } = useClient();
  const {
    organizations,
    loading,
    error: organizationLoadingError,
    refetch: refetchOrganizations,
  } = useOrganizationList();
  const {
    session,
    error: sessionLoadingError,
    loading: sessionLoading,
    refetch: refetchSession,
  } = useSession();

  const selectedOrganization = useMemo(() => {
    return (
      organizations?.find(
        (organization) =>
          organization.id === session?.active_signin?.active_organization_id
      ) || null
    );
  }, [organizations, session]);

  if (sessionLoading || loading) {
    return {
      selectedOrganization: null,
      loading,
      error: sessionLoadingError || organizationLoadingError,
      createOrganization: null as never,
    };
  }

  return {
    selectedOrganization,
    loading,
    refetch: refetchOrganizations,
    createOrganization: async (
      name: string,
      image?: File,
      description?: string
    ) => {
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
        })
      );
      if (response.data) {
        await refetchSession();
        await refetchOrganizations();
      }
    },
    error: null,
  };
};

async function fetchOrganizationMemberships(client: Client) {
  const response = await mapResponse<OrganizationMembership[]>(
    await client("/me/organization-memberships")
  );
  return response.data;
}

async function leaveOrganization(client: Client, organizationId: string) {
  const response = await mapResponse<void>(
    await client(`/organization-memberships/${organizationId}`, {
      method: "DELETE",
    })
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
    }
  );

  return {
    organizationMemberships: data,
    loading: loading || isLoading,
    error,
    leaveOrganization,
    refetch: mutate,
  };
};
