import { Client, Workspace, WorkspaceRole } from "@/types";
import { useClient } from "./use-client";
import useSWR from "swr";
import { responseMapper } from "@/utils/response-mapper";
import { WorkspaceMembership, WorkspaceWithOrganization } from "@/types";
import { useCallback, useMemo } from "react";
import { useSession, clearTokenCache } from "./use-session";
import { useDeployment } from "./use-deployment";

async function fetchWorkspaceMemberships(client: Client) {
  const response = await responseMapper<WorkspaceMembership[]>(
    await client("/me/workspace-memberships"),
  );
  return response.data;
}

async function leaveWorkspace(
  client: Client,
  workspaceId: string,
  userId: string,
) {
  const response = await responseMapper<void>(
    await client(`/workspaces/${workspaceId}/members/${userId}/remove`, {
      method: "POST",
    }),
  );
  return response.data;
}

export const useWorkspaceMemberships = () => {
  const { client, loading: clientLoading } = useClient();
  const { deployment } = useDeployment();

  const {
    data,
    isLoading: swrLoading,
    error,
    mutate,
  } = useSWR(
    !clientLoading && deployment?.b2b_settings.workspaces_enabled
      ? "/me/workspace-memberships"
      : null,
    () => fetchWorkspaceMemberships(client),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
    },
  );

  const refetch = useCallback(async () => {
    await mutate(undefined, { revalidate: true });
  }, [mutate]);

  return {
    workspaceMemberships: data,
    loading: clientLoading || swrLoading,
    error,
    refetch,
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
      eligibility_restriction: membership.eligibility_restriction,
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
      const response = await responseMapper<{
        workspace: Workspace;
        membership: WorkspaceMembership;
      }>(
        await client("/workspaces", {
          method: "POST",
          body: formData,
        }),
      );
      clearTokenCache();
      await refetch();
      return response.data;
    },
    [client, refetch],
  );

  const leaveWorkspaceCallback = useCallback(
    async (id: string, userId: string) => {
      const result = await leaveWorkspace(client, id, userId);
      await refetch();
      return result;
    },
    [client, refetch],
  );

  const updateWorkspace = useCallback(
    async (
      workspace: Workspace,
      data: {
        name?: string;
        description?: string;
        image?: File;
        enforce_2fa?: boolean;
        enable_ip_restriction?: boolean;
        whitelisted_ips?: string[];
      },
    ) => {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.image) formData.append("image", data.image);
      if (data.enforce_2fa !== undefined) {
        formData.append("enforce_2fa", String(data.enforce_2fa));
      }
      if (data.enable_ip_restriction !== undefined) {
        formData.append("enable_ip_restriction", String(data.enable_ip_restriction));
      }
      if (data.whitelisted_ips) {
        data.whitelisted_ips.forEach((ip) => formData.append("whitelisted_ips", ip));
      }
      const response = await responseMapper(
        await client(`/workspaces/${workspace.id}/update`, {
          method: "POST",
          body: formData,
        }),
      );
      await refetch();
      return response.data;
    },
    [client, refetch],
  );

  const deleteWorkspace = useCallback(
    async (workspace: Workspace) => {
      const response = await responseMapper(
        await client(`/workspaces/${workspace.id}/delete`, {
          method: "POST",
        }),
      );
      clearTokenCache();
      await refetch();
      return response.data;
    },
    [client, refetch],
  );

  const getWorkspaceMembers = useCallback(
    async (workspace: Workspace) => {
      const response = await responseMapper<WorkspaceMembership[]>(
        await client(`/workspaces/${workspace.id}/members`, {
          method: "GET",
        }),
      );
      return response.data;
    },
    [client],
  );

  const getWorkspaceRoles = useCallback(
    async (workspace: Workspace) => {
      const response = await responseMapper<WorkspaceRole[]>(
        await client(`/workspaces/${workspace.id}/roles`, {
          method: "GET",
        }),
      );
      return response.data;
    },
    [client],
  );

  const createWorkspaceRole = useCallback(
    async (workspace: Workspace, name: string, permissions: string[]) => {
      const response = await responseMapper<WorkspaceRole>(
        await client(`/workspaces/${workspace.id}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, permissions }),
        }),
      );
      return response.data;
    },
    [client],
  );

  const deleteWorkspaceRole = useCallback(
    async (workspace: Workspace, role: WorkspaceRole) => {
      const response = await responseMapper(
        await client(`/workspaces/${workspace.id}/roles/${role.id}/delete`, {
          method: "POST",
        }),
      );
      return response.data;
    },
    [client],
  );

  const inviteWorkspaceMember = useCallback(
    async (workspace: Workspace, email: string, roleId?: string) => {
      const response = await responseMapper(
        await client(`/workspaces/${workspace.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role_id: roleId }),
        }),
      );
      return response.data;
    },
    [client],
  );

  const removeWorkspaceMember = useCallback(
    async (workspace: Workspace, memberId: string) => {
      const response = await responseMapper(
        await client(`/workspaces/${workspace.id}/members/${memberId}/remove`, {
          method: "POST",
        }),
      );
      await refetch();
      return response.data;
    },
    [client, refetch],
  );

  const addWorkspaceMemberRole = useCallback(
    async (workspace: Workspace, membershipId: string, roleId: string) => {
      const response = await responseMapper(
        await client(
          `/workspaces/${workspace.id}/members/${membershipId}/roles/${roleId}/add`,
          {
            method: "POST",
          },
        ),
      );
      return response.data;
    },
    [client],
  );

  const removeWorkspaceMemberRole = useCallback(
    async (workspace: Workspace, membershipId: string, roleId: string) => {
      const response = await responseMapper(
        await client(
          `/workspaces/${workspace.id}/members/${membershipId}/roles/${roleId}/remove`,
          {
            method: "POST",
          },
        ),
      );
      return response.data;
    },
    [client],
  );

  return {
    workspaces: workspaces || [],
    loading,
    error,
    refetch,
    leaveWorkspace: leaveWorkspaceCallback,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceMembers,
    getWorkspaceRoles,
    createWorkspaceRole,
    deleteWorkspaceRole,
    inviteWorkspaceMember,
    removeWorkspaceMember,
    addWorkspaceMemberRole,
    removeWorkspaceMemberRole,
  };
};

export const useActiveWorkspace = () => {
  const {
    refetch,
    loading,
    error: listError,
    leaveWorkspace: leaveWorkspaceFromList,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceMembers,
    getWorkspaceRoles,
    createWorkspaceRole,
    deleteWorkspaceRole,
    inviteWorkspaceMember,
    removeWorkspaceMember,
    addWorkspaceMemberRole,
    removeWorkspaceMemberRole,
  } = useWorkspaceList();
  const { workspaceMemberships } = useWorkspaceMemberships();
  const {
    session,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();

  const activeMembership = useMemo(() => {
    return (
      workspaceMemberships?.find(
        (membership) =>
          membership.id ===
          session?.active_signin?.active_workspace_membership_id,
      ) || null
    );
  }, [workspaceMemberships, session]);

  const activeWorkspace = useMemo(() => {
    return activeMembership?.workspace || null;
  }, [activeMembership]);

  const leaveCurrentWorkspace = useCallback(async () => {
    if (!activeWorkspace || !session?.active_signin?.user_id) return;
    return await leaveWorkspaceFromList(
      activeWorkspace.id,
      session.active_signin.user_id,
    );
  }, [activeWorkspace, leaveWorkspaceFromList, session]);

  const updateCurrentWorkspace = useCallback(
    async (data: { name?: string; description?: string; image?: File }) => {
      if (!activeWorkspace) return;
      return await updateWorkspace(activeWorkspace, data);
    },
    [activeWorkspace, updateWorkspace],
  );

  const deleteCurrentWorkspace = useCallback(async () => {
    if (!activeWorkspace) return;
    return await deleteWorkspace(activeWorkspace);
  }, [activeWorkspace, deleteWorkspace]);

  const getCurrentWorkspaceMembers = useCallback(async () => {
    if (!activeWorkspace) return [];
    return await getWorkspaceMembers(activeWorkspace);
  }, [activeWorkspace, getWorkspaceMembers]);

  const getCurrentWorkspaceRoles = useCallback(async () => {
    if (!activeWorkspace) return [];
    return await getWorkspaceRoles(activeWorkspace);
  }, [activeWorkspace, getWorkspaceRoles]);

  const createCurrentWorkspaceRole = useCallback(
    async (name: string, permissions: string[]) => {
      if (!activeWorkspace) return;
      return await createWorkspaceRole(activeWorkspace, name, permissions);
    },
    [activeWorkspace, createWorkspaceRole],
  );

  const deleteCurrentWorkspaceRole = useCallback(
    async (role: WorkspaceRole) => {
      if (!activeWorkspace) return;
      return await deleteWorkspaceRole(activeWorkspace, role);
    },
    [activeWorkspace, deleteWorkspaceRole],
  );

  const inviteCurrentWorkspaceMember = useCallback(
    async (email: string, roleId?: string) => {
      if (!activeWorkspace) return;
      return await inviteWorkspaceMember(activeWorkspace, email, roleId);
    },
    [activeWorkspace, inviteWorkspaceMember],
  );

  const removeCurrentWorkspaceMember = useCallback(
    async (memberId: string) => {
      if (!activeWorkspace) return;
      return await removeWorkspaceMember(activeWorkspace, memberId);
    },
    [activeWorkspace, removeWorkspaceMember],
  );

  const addRoleToCurrentWorkspaceMember = useCallback(
    async (membershipId: string, roleId: string) => {
      if (!activeWorkspace) return;
      return await addWorkspaceMemberRole(
        activeWorkspace,
        membershipId,
        roleId,
      );
    },
    [activeWorkspace, addWorkspaceMemberRole],
  );

  const removeRoleFromCurrentWorkspaceMember = useCallback(
    async (membershipId: string, roleId: string) => {
      if (!activeWorkspace) return;
      return await removeWorkspaceMemberRole(
        activeWorkspace,
        membershipId,
        roleId,
      );
    },
    [activeWorkspace, removeWorkspaceMemberRole],
  );

  const currentLoading = loading || sessionLoading;
  const currentError = listError || sessionError;

  if (currentLoading) {
    return {
      activeWorkspace: null,
      activeMembership: null,
      loading: true,
      error: currentError,
      refetch,
      leave: null as never,
      updateWorkspace: null as never,
      deleteWorkspace: null as never,
      getMembers: null as never,
      getRoles: null as never,
      createRole: null as never,
      deleteRole: null as never,
      inviteMember: null as never,
      removeMember: null as never,
      addMemberRole: null as never,
      removeMemberRole: null as never,
    };
  }

  return {
    activeWorkspace,
    activeMembership,
    loading: false,
    error: currentError,
    refetch,
    leave: leaveCurrentWorkspace,
    updateWorkspace: updateCurrentWorkspace,
    deleteWorkspace: deleteCurrentWorkspace,
    getMembers: getCurrentWorkspaceMembers,
    getRoles: getCurrentWorkspaceRoles,
    createRole: createCurrentWorkspaceRole,
    deleteRole: deleteCurrentWorkspaceRole,
    inviteMember: inviteCurrentWorkspaceMember,
    removeMember: removeCurrentWorkspaceMember,
    addMemberRole: addRoleToCurrentWorkspaceMember,
    removeMemberRole: removeRoleFromCurrentWorkspaceMember,
  };
};
