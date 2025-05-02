import { Client } from "@/types/client";
import { useClient } from "./use-client";
import useSWR from "swr";
import { mapResponse } from "@/utils/response-mapper";
import { WorkspaceMembership } from "@/types/organization";
import { useMemo } from "react";
import { useSession } from "./use-session";

export const useWorkspaceList = () => {
  const { workspaceMemberships, refetch, loading } = useWorkspaceMemberships();

  const workspaces = useMemo(() => {
    return workspaceMemberships?.map((membership) => membership.workspace);
  }, [workspaceMemberships]);

  return {
    workspaces: workspaces || [],
    loading,
    error: null,
    refetch,
  };
};

export const useWorkspace = () => {
  const { workspaces, refetch, loading } = useWorkspaceList();
  const { session } = useSession();

  const workspace = useMemo(() => {
    return workspaces.find(
      (workspace) =>
        workspace.id === session?.active_signin?.active_workspace_id
    );
  }, [workspaces, session]);

  return {
    workspace,
    refetch,
    loading,
  };
};

async function fetchWorkspaceMemberships(client: Client) {
  const response = await mapResponse<WorkspaceMembership[]>(
    await client("/me/workspace-memberships")
  );
  return response.data;
}

async function leaveWorkspace(client: Client, workspaceId: string) {
  const response = await mapResponse<void>(
    await client(`/workspace-memberships/${workspaceId}`, {
      method: "DELETE",
    })
  );
  return response.data;
}

export const useWorkspaceMemberships = () => {
  const { client, loading } = useClient();

  const { data, isLoading, error, mutate } = useSWR(
    !loading ? "/me/workspace-memberships" : null,
    () => fetchWorkspaceMemberships(client),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    workspaceMemberships: data,
    loading: loading || isLoading,
    error,
    leaveWorkspace,
    refetch: mutate,
  };
};
