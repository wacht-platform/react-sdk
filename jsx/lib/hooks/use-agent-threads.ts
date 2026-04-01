import { useCallback, useMemo } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type {
  Actor,
  ActorProject,
  AgentThread,
  AppendProjectTaskBoardItemJournalRequest,
  CreateProjectTaskBoardItemRequest,
  CreateActorProjectRequest,
  UpdateActorProjectRequest,
  CreateAgentThreadRequest,
  ProjectTaskBoardItem,
  ProjectTaskBoardItemAssignment,
  ProjectTaskBoardItemEvent,
  ProjectTaskDetail,
  ProjectTaskWorkspaceFileContent,
  ProjectTaskWorkspaceListing,
  ThreadEvent,
  ThreadTaskGraphsResponse,
  UpdateAgentThreadRequest,
  UpdateProjectTaskBoardItemRequest,
} from "@wacht/types";

const EMPTY_WORKSPACE_LISTING: ProjectTaskWorkspaceListing = {
  exists: false,
  files: [],
};

type AgentThreadHookOptions = {
  enabled?: boolean;
};

function buildBoolQuery(key: string, value?: boolean): string {
  if (value === undefined) return "";
  return `?${new URLSearchParams({ [key]: String(value) }).toString()}`;
}

function buildTaskWorkspaceFileQuery(path: string, includeArchived?: boolean): string {
  const params = new URLSearchParams({ path });
  if (includeArchived) {
    params.set("include_archived", "true");
  }
  return `?${params.toString()}`;
}

function buildDirectoryQuery(path?: string, includeArchived?: boolean): string {
  const params = new URLSearchParams();
  if (path) {
    params.set("path", path);
  }
  if (includeArchived) {
    params.set("include_archived", "true");
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function isTextResponseMimeType(mimeType: string): boolean {
  return mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("xml") ||
    mimeType.includes("yaml");
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "string") {
    formData.set(key, value);
    return;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    formData.set(key, String(value));
    return;
  }
}

function appendJsonFormValue(
  formData: FormData,
  key: string,
  value: Record<string, unknown> | undefined,
) {
  if (!value) return;
  formData.set(key, JSON.stringify(value));
}

function buildActorProjectFormData(
  request: CreateActorProjectRequest | UpdateActorProjectRequest,
) {
  const formData = new FormData();
  appendFormValue(formData, "name", request.name);
  appendFormValue(formData, "agent_id", "agent_id" in request ? request.agent_id : undefined);
  appendFormValue(formData, "description", request.description);
  appendFormValue(formData, "status", request.status);
  return formData;
}

function buildCreateAgentThreadFormData(request: CreateAgentThreadRequest) {
  const formData = new FormData();
  appendFormValue(formData, "title", request.title);
  appendFormValue(formData, "agent_id", request.agent_id);
  appendFormValue(formData, "system_instructions", request.system_instructions);
  appendFormValue(formData, "thread_purpose", request.thread_purpose);
  appendFormValue(formData, "responsibility", request.responsibility);
  appendFormValue(formData, "reusable", request.reusable);
  appendFormValue(formData, "accepts_assignments", request.accepts_assignments);
  appendJsonFormValue(formData, "metadata", request.metadata);
  if (Array.isArray(request.capability_tags)) {
    for (const tag of request.capability_tags) {
      formData.append("capability_tags", tag);
    }
  }
  return formData;
}

function buildUpdateAgentThreadFormData(request: UpdateAgentThreadRequest) {
  const formData = new FormData();
  appendFormValue(formData, "title", request.title);
  appendFormValue(formData, "agent_id", request.agent_id);
  appendFormValue(formData, "system_instructions", request.system_instructions);
  return formData;
}

function buildTaskBoardItemFormData(
  request: CreateProjectTaskBoardItemRequest | UpdateProjectTaskBoardItemRequest,
  files: File[] = [],
) {
  const formData = new FormData();
  appendFormValue(formData, "title", request.title);
  appendFormValue(formData, "description", request.description);
  appendFormValue(formData, "status", request.status);
  appendFormValue(formData, "priority", request.priority);
  for (const file of files) {
    formData.append("files", file);
  }
  return formData;
}

export function useActors(options: { includeArchived?: boolean; enabled?: boolean } = {}) {
  const { client } = useClient();
  const { includeArchived = false, enabled = true } = options;
  const key = enabled ? `wacht-ai-actors:${includeArchived}` : null;

  const fetcher = useCallback(async () => {
    const response = await client(`/ai/actors${buildBoolQuery("include_archived", includeArchived)}`);
    const parsed = await responseMapper<Actor[]>(response);
    return parsed.data;
  }, [client, includeArchived]);

  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  return {
    actors: data || [],
    loading: !data && !error,
    error,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useActorProjects(actorId?: string, options: { includeArchived?: boolean; enabled?: boolean } = {}) {
  const { client } = useClient();
  const { includeArchived = false, enabled = true } = options;
  const key = enabled && actorId ? `wacht-ai-actor-projects:${actorId}:${includeArchived}` : null;

  const fetcher = useCallback(async () => {
    if (!actorId) return [] as ActorProject[];
    const response = await client(`/ai/actors/${actorId}/projects${buildBoolQuery("include_archived", includeArchived)}`);
    const parsed = await responseMapper<ActorProject[]>(response);
    return parsed.data;
  }, [actorId, client, includeArchived]);

  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  const createProject = useCallback(async (request: CreateActorProjectRequest) => {
    if (!actorId) throw new Error("actorId is required");
    const response = await client(`/ai/actors/${actorId}/projects`, {
      method: "POST",
      body: buildActorProjectFormData(request),
    });
    const parsed = await responseMapper<ActorProject>(response);
    await mutate();
    return parsed.data;
  }, [actorId, client, mutate]);

  const updateProject = useCallback(async (projectId: string, request: UpdateActorProjectRequest) => {
    const response = await client(`/ai/projects/${projectId}/update`, {
      method: "POST",
      body: buildActorProjectFormData(request),
    });
    const parsed = await responseMapper<ActorProject>(response);
    await mutate();
    return parsed.data;
  }, [client, mutate]);

  return {
    projects: data || [],
    loading: !data && !error,
    error,
    createProject,
    updateProject,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useProjectThreads(projectId?: string, options: { includeArchived?: boolean; enabled?: boolean } = {}) {
  const { client } = useClient();
  const { includeArchived = false, enabled = true } = options;
  const key = enabled && projectId ? `wacht-ai-threads:${projectId}:${includeArchived}` : null;

  const fetcher = useCallback(async () => {
    if (!projectId) return [] as AgentThread[];
    const response = await client(`/ai/projects/${projectId}/threads${buildBoolQuery("include_archived", includeArchived)}`);
    const parsed = await responseMapper<AgentThread[]>(response);
    return parsed.data;
  }, [projectId, client, includeArchived]);

  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  const createThreadForProject = useCallback(async (targetProjectId: string, request: CreateAgentThreadRequest) => {
    const response = await client(`/ai/projects/${targetProjectId}/threads`, {
      method: "POST",
      body: buildCreateAgentThreadFormData(request),
    });
    const parsed = await responseMapper<AgentThread>(response);
    if (targetProjectId === projectId) {
      await mutate();
    }
    return parsed.data;
  }, [projectId, client, mutate]);

  const createThread = useCallback(async (request: CreateAgentThreadRequest) => {
    if (!projectId) throw new Error("projectId is required");
    return createThreadForProject(projectId, request);
  }, [projectId, createThreadForProject]);

  const updateThread = useCallback(async (threadId: string, request: UpdateAgentThreadRequest) => {
    const response = await client(`/ai/threads/${threadId}/update`, {
      method: "POST",
      body: buildUpdateAgentThreadFormData(request),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await mutate();
    return parsed.data;
  }, [client, mutate]);

  const archiveThread = useCallback(async (threadId: string) => {
    const response = await client(`/ai/threads/${threadId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await mutate();
    return parsed.data;
  }, [client, mutate]);

  const unarchiveThread = useCallback(async (threadId: string) => {
    const response = await client(`/ai/threads/${threadId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await mutate();
    return parsed.data;
  }, [client, mutate]);

  return {
    threads: data || [],
    loading: !data && !error,
    error,
    createThread,
    createThreadForProject,
    updateThread,
    archiveThread,
    unarchiveThread,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useAgentThread(threadId?: string, enabled = true) {
  const { client } = useClient();
  const threadKey = enabled && threadId ? `wacht-ai-thread:${threadId}` : null;

  const threadFetcher = useCallback(async () => {
    if (!threadId) return null;
    const response = await client(`/ai/threads/${threadId}`);
    const parsed = await responseMapper<AgentThread>(response);
    return parsed.data;
  }, [threadId, client]);

  const thread = useSWR(threadKey, threadFetcher, { revalidateOnFocus: false });

  const updateThread = useCallback(async (request: UpdateAgentThreadRequest) => {
    if (!threadId) throw new Error("threadId is required");
    const response = await client(`/ai/threads/${threadId}/update`, {
      method: "POST",
      body: buildUpdateAgentThreadFormData(request),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await thread.mutate();
    return parsed.data;
  }, [threadId, client, thread]);

  const archiveThread = useCallback(async () => {
    if (!threadId) throw new Error("threadId is required");
    const response = await client(`/ai/threads/${threadId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await thread.mutate();
    return parsed.data;
  }, [threadId, client, thread]);

  const unarchiveThread = useCallback(async () => {
    if (!threadId) throw new Error("threadId is required");
    const response = await client(`/ai/threads/${threadId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await thread.mutate();
    return parsed.data;
  }, [threadId, client, thread]);

  return {
    thread: thread.data || null,
    loading: !thread.data && !thread.error,
    error: thread.error || null,
    updateThread,
    archiveThread,
    unarchiveThread,
    refetch: async () => {
      await thread.mutate();
    },
  };
}

export function useAgentThreadFilesystem(threadId?: string, enabled = true) {
  const { client } = useClient();
  const filesystemKey = enabled && threadId ? `wacht-ai-thread-filesystem:${threadId}` : null;

  const getFile = useCallback(async (path: string) => {
    if (!threadId) throw new Error("threadId is required");
    const response = await client(
      `/ai/threads/${threadId}/filesystem/file${buildTaskWorkspaceFileQuery(path)}`,
    );
    if (!response.ok) {
      throw new Error("Failed to load file");
    }

    const blob = await response.blob();
    const mimeType = (response.headers.get("content-type") || "application/octet-stream")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const isText = isTextResponseMimeType(mimeType);

    let content: string | undefined;
    if (isText) {
      content = await blob.text();
    }

    return {
      path,
      name: path.split("/").pop() || "file",
      mime_type: mimeType,
      is_text: isText,
      size_bytes: blob.size,
      truncated: false,
      content,
      blob,
    } as ProjectTaskWorkspaceFileContent & { blob: Blob };
  }, [threadId, client]);

  const listDirectory = useCallback(async (path?: string) => {
    if (!threadId) return EMPTY_WORKSPACE_LISTING;
    const response = await client(
      `/ai/threads/${threadId}/filesystem${buildDirectoryQuery(path)}`,
    );
    const parsed = await responseMapper<ProjectTaskWorkspaceListing>(response);
    return parsed.data;
  }, [threadId, client]);

  const filesystem = useSWR(filesystemKey, () => listDirectory(), { revalidateOnFocus: false });

  return {
    filesystem: filesystem.data || EMPTY_WORKSPACE_LISTING,
    filesystemLoading: !filesystem.data && !filesystem.error,
    filesystemError: filesystem.error || null,
    getFile,
    listDirectory,
    refetch: async () => {
      await filesystem.mutate();
    },
  };
}

export function useAgentThreadEvents(threadId?: string, options: AgentThreadHookOptions = {}) {
  const { client } = useClient();
  const { enabled = true } = options;
  const key = enabled && threadId ? `wacht-ai-thread-events:${threadId}` : null;

  const events = useSWR(key, async () => {
    if (!threadId) return [] as ThreadEvent[];
    const response = await client(`/ai/threads/${threadId}/events`);
    const parsed = await responseMapper<ThreadEvent[]>(response);
    return parsed.data;
  }, { revalidateOnFocus: false, refreshInterval: 5000 });

  return {
    events: events.data || [],
    loading: !events.data && !events.error,
    error: events.error || null,
    refetch: async () => {
      await events.mutate();
    },
  };
}

export function useAgentThreadAssignments(threadId?: string, options: AgentThreadHookOptions = {}) {
  const { client } = useClient();
  const { enabled = true } = options;
  const key = enabled && threadId ? `wacht-ai-thread-assignments:${threadId}` : null;

  const assignments = useSWR(key, async () => {
    if (!threadId) return [] as ProjectTaskBoardItemAssignment[];
    const response = await client(`/ai/threads/${threadId}/assignments`);
    const parsed = await responseMapper<ProjectTaskBoardItemAssignment[]>(response);
    return parsed.data;
  }, { revalidateOnFocus: false, refreshInterval: 5000 });

  return {
    assignments: assignments.data || [],
    loading: !assignments.data && !assignments.error,
    error: assignments.error || null,
    refetch: async () => {
      await assignments.mutate();
    },
  };
}

type ProjectTaskListOptions = {
  statuses?: string[];
  includeArchived?: boolean;
};

function buildTaskListQuery(options: ProjectTaskListOptions = {}) {
  const params = new URLSearchParams();
  if (options.statuses && options.statuses.length > 0) {
    params.set("status", options.statuses.join(","));
  }
  if (options.includeArchived) {
    params.set("include_archived", "true");
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
export function useProjectTasks(projectId?: string, enabled = true, options: ProjectTaskListOptions = {}) {
  const { client } = useClient();
  const statusKey = options.statuses?.join(",") || "all";
  const archiveKey = options.includeArchived ? "with-archived" : "active-only";
  const itemsKey = enabled && projectId ? `wacht-ai-project-tasks:${projectId}:${statusKey}:${archiveKey}` : null;

  const itemsFetcher = useCallback(async () => {
    if (!projectId) return [] as ProjectTaskBoardItem[];
    const response = await client(`/ai/projects/${projectId}/board/items${buildTaskListQuery(options)}`);
    const parsed = await responseMapper<ProjectTaskBoardItem[]>(response);
    return parsed.data;
  }, [projectId, client, statusKey, archiveKey]);

  const items = useSWR(itemsKey, itemsFetcher, { revalidateOnFocus: false, refreshInterval: 5000 });

  const createTask = useCallback(async (request: CreateProjectTaskBoardItemRequest, files: File[] = []) => {
    if (!projectId) throw new Error("projectId is required");
    const response = await client(`/ai/projects/${projectId}/board/items`, {
      method: "POST",
      body: buildTaskBoardItemFormData(request, files),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await items.mutate();
    return parsed.data;
  }, [projectId, client, items]);

  const archiveTask = useCallback(async (itemId: string) => {
    const response = await client(`/ai/board-items/${itemId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await items.mutate();
    return parsed.data;
  }, [client, items]);

  const unarchiveTask = useCallback(async (itemId: string) => {
    const response = await client(`/ai/board-items/${itemId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await items.mutate();
    return parsed.data;
  }, [client, items]);

  return {
    tasks: items.data || [],
    loading: !items.data && !items.error,
    error: items.error || null,
    createTask,
    archiveTask,
    unarchiveTask,
    refetch: async () => { await items.mutate(); },
  };
}

type ProjectTaskDetailOptions = {
  includeArchived?: boolean;
};

export function useProjectTaskBoardItem(itemId?: string, enabled = true, options: ProjectTaskDetailOptions = {}) {
  const { client } = useClient();
  const archiveKey = options.includeArchived ? "with-archived" : "active-only";
  const detailQuery = options.includeArchived ? "?include_archived=true" : "";
  const detailKey = enabled && itemId ? `wacht-ai-board-item-detail:${itemId}:${archiveKey}` : null;
  const workspaceKey = enabled && itemId ? `wacht-ai-board-item-workspace:${itemId}:${archiveKey}` : null;

  const detailFetcher = useCallback(async () => {
    if (!itemId) return null;
    const response = await client(`/ai/board-items/${itemId}/detail${detailQuery}`);
    const parsed = await responseMapper<ProjectTaskDetail>(response);
    return parsed.data;
  }, [itemId, client, detailQuery]);

  const detail = useSWR(detailKey, detailFetcher, { revalidateOnFocus: false, refreshInterval: 5000 });

  const workspaceFetcher = useCallback(async () => {
    if (!itemId) return { exists: false, files: [] } as ProjectTaskWorkspaceListing;
    const response = await client(`/ai/board-items/${itemId}/task-workspace${detailQuery}`);
    const parsed = await responseMapper<ProjectTaskWorkspaceListing>(response);
    return parsed.data;
  }, [itemId, client, detailQuery]);

  const workspace = useSWR(workspaceKey, workspaceFetcher, { revalidateOnFocus: false, refreshInterval: 5000 });

  const updateItem = useCallback(async (request: UpdateProjectTaskBoardItemRequest, files: File[] = []) => {
    if (!itemId) throw new Error("itemId is required");
    const response = await client(`/ai/board-items/${itemId}/update`, {
      method: "POST",
      body: buildTaskBoardItemFormData(request, files),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await detail.mutate();
    await workspace.mutate();
    return parsed.data;
  }, [itemId, client, detail, workspace]);

  const archiveItem = useCallback(async () => {
    if (!itemId) throw new Error("itemId is required");
    const response = await client(`/ai/board-items/${itemId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await detail.mutate();
    return parsed.data;
  }, [itemId, client, detail]);

  const unarchiveItem = useCallback(async () => {
    if (!itemId) throw new Error("itemId is required");
    const response = await client(`/ai/board-items/${itemId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await detail.mutate();
    return parsed.data;
  }, [itemId, client, detail]);

  const getTaskWorkspaceFile = useCallback(async (path: string) => {
    if (!itemId) throw new Error("itemId is required");
    const response = await client(
      `/ai/board-items/${itemId}/task-workspace/file${buildTaskWorkspaceFileQuery(path, options.includeArchived)}`,
    );
    const parsed = await responseMapper<ProjectTaskWorkspaceFileContent>(response);
    return parsed.data;
  }, [itemId, client, options.includeArchived]);

  const listTaskWorkspaceDirectory = useCallback(async (path?: string) => {
    if (!itemId) throw new Error("itemId is required");
    const response = await client(
      `/ai/board-items/${itemId}/task-workspace${buildDirectoryQuery(path, options.includeArchived)}`,
    );
    const parsed = await responseMapper<ProjectTaskWorkspaceListing>(response);
    return parsed.data;
  }, [itemId, client, options.includeArchived]);

  const appendJournal = useCallback(async (
    request: AppendProjectTaskBoardItemJournalRequest,
    files: File[] = [],
  ) => {
    if (!itemId) throw new Error("itemId is required");

    const response = await client(`/ai/board-items/${itemId}/journal`, {
      method: "POST",
      body: (() => {
        const formData = new FormData();
        formData.set("summary", request.summary);
        if (request.body_markdown) {
          formData.set("body_markdown", request.body_markdown);
        }
        if (request.details) {
          formData.set("details", request.details);
        }
        for (const file of files) {
          formData.append("files", file);
        }
        return formData;
      })(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItemEvent>(response);
    await detail.mutate();
    await workspace.mutate();
    return parsed.data;
  }, [itemId, client, detail, workspace]);

  return {
    item: detail.data?.item || null,
    events: detail.data?.events || [],
    assignments: detail.data?.assignments || [],
    taskWorkspace: workspace.data || { exists: false, files: [] },
    taskWorkspaceLoading: !workspace.data && !workspace.error,
    taskWorkspaceError: workspace.error || null,
    loading: !detail.data && !detail.error,
    error: detail.error || null,
    updateItem,
    archiveItem,
    unarchiveItem,
    getTaskWorkspaceFile,
    listTaskWorkspaceDirectory,
    appendJournal,
    refetch: async () => {
      await detail.mutate();
      await workspace.mutate();
    },
    refetchTaskWorkspace: async () => {
      await workspace.mutate();
    },
  };
}

export function useAgentThreadTaskGraphs(threadId?: string, enabled = true) {
  const { client } = useClient();
  const {
    data: pages,
    error,
    mutate,
    isLoading,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite<ThreadTaskGraphsResponse>(
    (index, previousPageData) => {
      if (!enabled || !threadId) return null;
      if (index > 0 && (!previousPageData || !previousPageData.has_more)) return null;
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return ["wacht-ai-thread-graphs", threadId, cursor];
    },
    async ([, currentThreadId, cursor]) => {
      const params = new URLSearchParams();
      params.set("limit", "10");
      if (cursor) params.set("cursor", String(cursor));

      const response = await client(`/ai/threads/${currentThreadId}/task-graphs?${params.toString()}`);
      const parsed = await responseMapper<ThreadTaskGraphsResponse>(response);
      const payload = parsed.data || { data: [], limit: 10, has_more: false };

      return {
        ...payload,
        data: (payload.data || []).map((bundle) => ({
          ...bundle,
          nodes: Array.isArray(bundle.nodes) ? bundle.nodes : [],
          edges: Array.isArray(bundle.edges) ? bundle.edges : [],
          summary: bundle.summary || null,
        })),
      };
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      revalidateFirstPage: true,
      revalidateAll: false,
      persistSize: true,
    }
  );

  const graphs = useMemo(() => {
    return pages ? pages.flatMap((page) => page.data || []) : [];
  }, [pages]);

  const hasMore = pages ? pages[pages.length - 1]?.has_more || false : false;
  const loadingMore = isValidating && !!pages && size > (pages?.length || 0);

  return {
    graphs,
    latestGraph: graphs[0] || null,
    has_more: hasMore,
    loadingMore,
    loading: isLoading,
    error,
    loadMore: async () => {
      if (!hasMore || loadingMore) return;
      await setSize(size + 1);
    },
    refetch: async () => { await mutate(); },
  };
}
