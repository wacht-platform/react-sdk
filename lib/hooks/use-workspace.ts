import { Client } from "@/types/client";
import { useClient } from "./use-client";
import useSWR from "swr";
import { responseMapper } from "@/utils/response-mapper";
import {
  WorkspaceMembership,
  WorkspaceWithOrganization,
} from "@/types/organization";
import { useCallback, useMemo } from "react";
import { useSession } from "./use-session";

async function fetchWorkspaceMemberships(client: Client) {
  const response = await responseMapper<WorkspaceMembership[]>(
    await client("/me/workspace-memberships"),
  );
  return response.data;
}

async function leaveWorkspace(client: Client, workspaceId: string) {
  const response = await responseMapper<void>(
    await client(`/workspace-memberships/${workspaceId}`, {
      method: "DELETE",
    }),
  );
  return response.data;
}

export const useWorkspaceMemberships = () => {
  const { client, loading: clientLoading } = useClient();

  const {
    data,
    isLoading: swrLoading,
    error,
    mutate,
  } = useSWR(
    !clientLoading ? "/me/workspace-memberships" : null,
    () => fetchWorkspaceMemberships(client),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
    },
  );

  return {
    workspaceMemberships: data,
    loading: clientLoading || swrLoading,
    error,
    refetch: mutate,
  };
};

export const useWorkspaceList = () => {
  const { workspaceMemberships, refetch, loading, error } =
    useWorkspaceMemberships();
  const { client } = useClient();

  const workspaces = useMemo(() => {
    return workspaceMemberships?.map((membership) => ({
      ...membership.workspace,
      organization: membership.organization,
    })) as WorkspaceWithOrganization[];
  }, [workspaceMemberships]);

  const createWorkspace = useCallback(
    async (
      organizationId: string,
      name: string,
      image?: File,
      description?: string,
    ) => {
      const formData = new FormData();
      formData.append("name", name);
      if (image) {
        formData.append("image", image);
      }
      if (description) {
        formData.append("description", description);
      }
      formData.append("organization_id", organizationId);
      const result = await client("/workspaces", {
        method: "POST",
        body: formData,
      });
      await refetch();
      return result;
    },
    [client, refetch],
  );

  const leaveWorkspaceCallback = useCallback(
    async (id: string) => {
      const result = await leaveWorkspace(client, id);
      await refetch();
      return result;
    },
    [client, refetch],
  );

  return {
    workspaces: workspaces || [],
    loading,
    error,
    refetch,
    leaveWorkspace: leaveWorkspaceCallback,
    createWorkspace,
  };
};

export const useActiveWorkspace = () => {
  const {
    workspaces,
    refetch,
    loading,
    error: listError,
    leaveWorkspace: leaveWorkspaceFromList,
  } = useWorkspaceList();
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();

  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find(
        (workspace) =>
          workspace.id === session?.active_signin?.active_workspace_id,
      ) || null
    );
  }, [workspaces, session]);

  const leaveCurrentWorkspace = useCallback(async () => {
    if (!activeWorkspace) return;
    return await leaveWorkspaceFromList(activeWorkspace.id);
  }, [activeWorkspace, leaveWorkspaceFromList]);

  const currentLoading = loading || sessionLoading;
  const currentError = listError || sessionError;

  if (currentLoading) {
    return {
      activeWorkspace: null,
      loading: true,
      error: currentError,
      refetch,
      leave: null as never,
    };
  }

  return {
    activeWorkspace,
    loading: false,
    error: currentError,
    refetch,
    leave: leaveCurrentWorkspace,
  };
};
