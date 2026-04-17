import { useCallback, useMemo } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import type {
  ActorProject,
  ActorProjectsResponse,
  AgentThread,
  AppendProjectTaskBoardItemJournalRequest,
  CreateProjectTaskBoardItemRequest,
  CreateActorProjectRequest,
  UpdateActorProjectRequest,
  CreateAgentThreadRequest,
  ProjectTaskBoardItem,
  ProjectTaskBoardItemAssignment,
  ProjectTaskBoardItemEvent,
  ProjectTaskWorkspaceFileContent,
  ProjectTaskWorkspaceListing,
  ThreadEvent,
  ThreadTaskGraphsResponse,
  UpdateAgentThreadRequest,
  UpdateProjectTaskBoardItemRequest,
  ProjectThreadsResponse,
} from "@wacht/types";

const EMPTY_WORKSPACE_LISTING: ProjectTaskWorkspaceListing = {
  exists: false,
  files: [],
};

type AgentThreadHookOptions = {
  enabled?: boolean;
  limit?: number;
};

type AgentSearchOptions = {
  enabled?: boolean;
  query?: string;
  limit?: number;
};

type ThreadEventsPage = {
  data: ThreadEvent[];
  limit: number;
  has_more: boolean;
  next_cursor?: string;
};

type ThreadAssignmentsPage = {
  data: ProjectTaskBoardItemAssignment[];
  limit: number;
  has_more: boolean;
  next_cursor?: string;
};

type BoardItemEventsPage = {
  data: ProjectTaskBoardItemEvent[];
  limit: number;
  has_more: boolean;
  next_cursor?: string;
};

type BoardItemAssignmentsPage = {
  data: ProjectTaskBoardItemAssignment[];
  limit: number;
  has_more: boolean;
  next_cursor?: string;
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

function fileExtension(path: string): string {
  const name = path.split("/").pop() || path;
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

function isTextResponseMimeType(mimeType: string, path: string): boolean {
  const ext = fileExtension(path);
  const nonTextExtensions = new Set([
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "pdf",
    "zip",
    "gz",
    "tar",
    "7z",
    "rar",
    "jar",
    "war",
    "bin",
  ]);
  const textExtensions = new Set([
    "txt",
    "md",
    "mdx",
    "markdown",
    "json",
    "jsonc",
    "js",
    "jsx",
    "ts",
    "tsx",
    "mts",
    "cts",
    "mjs",
    "cjs",
    "py",
    "rb",
    "php",
    "java",
    "kt",
    "kts",
    "go",
    "rs",
    "c",
    "cc",
    "cpp",
    "cxx",
    "h",
    "hpp",
    "swift",
    "sh",
    "bash",
    "zsh",
    "fish",
    "ps1",
    "sql",
    "html",
    "htm",
    "css",
    "scss",
    "less",
    "xml",
    "svg",
    "yaml",
    "yml",
    "toml",
    "ini",
    "cfg",
    "conf",
    "env",
    "log",
  ]);

  if (nonTextExtensions.has(ext)) return false;
  if (textExtensions.has(ext)) return true;

  return mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("python") ||
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
  appendFormValue(formData, "schedule_kind", request.schedule_kind);
  appendFormValue(formData, "next_run_at", request.next_run_at);
  appendFormValue(formData, "interval_seconds", request.interval_seconds);
  if ("clear_schedule" in request) {
    appendFormValue(formData, "clear_schedule", request.clear_schedule);
  }
  for (const file of files) {
    formData.append("files", file);
  }
  return formData;
}

export function useActorProjects(options: { includeArchived?: boolean; enabled?: boolean } = {}) {
  const { client } = useClient();
  const { includeArchived = false, enabled = true } = options;
  const key = enabled ? `wacht-ai-actor-projects:${includeArchived}` : null;

  const fetcher = useCallback(async () => {
    const response = await client(`/ai/projects${buildBoolQuery("include_archived", includeArchived)}`);
    const parsed = await responseMapper<ActorProject[]>(response);
    return parsed.data;
  }, [client, includeArchived]);

  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  const createProject = useCallback(async (request: CreateActorProjectRequest) => {
    const response = await client(`/ai/projects`, {
      method: "POST",
      body: buildActorProjectFormData(request),
    });
    const parsed = await responseMapper<ActorProject>(response);
    await mutate();
    return parsed;
  }, [client, mutate]);

  const updateProject = useCallback(async (projectId: string, request: UpdateActorProjectRequest) => {
    const response = await client(`/ai/projects/${projectId}/update`, {
      method: "POST",
      body: buildActorProjectFormData(request),
    });
    const parsed = await responseMapper<ActorProject>(response);
    await mutate();
    return parsed;
  }, [client, mutate]);

  const archiveProject = useCallback(async (projectId: string) => {
    const response = await client(`/ai/projects/${projectId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ActorProject>(response);
    await mutate();
    return parsed;
  }, [client, mutate]);

  const unarchiveProject = useCallback(async (projectId: string) => {
    const response = await client(`/ai/projects/${projectId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ActorProject>(response);
    await mutate();
    return parsed;
  }, [client, mutate]);

  return {
    projects: data || [],
    loading: !data && !error,
    error,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
    refetch: async () => {
      await mutate();
    },
  };
}

export function useActorProjectSearch(
  options: AgentSearchOptions = {},
) {
  const { client } = useClient();
  const {
    enabled = true,
    query = "",
    limit = 12,
  } = options;
  const normalizedQuery = query.trim();
  const key = enabled
    ? `wacht-ai-actor-project-search:${normalizedQuery}:${limit}`
    : null;

  const fetcher = useCallback(async () => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }
    const response = await client(`/ai/projects/search?${params.toString()}`);
    const parsed = await responseMapper<ActorProjectsResponse>(response);
    return parsed.data;
  }, [client, limit, normalizedQuery]);

  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  return {
    projects: data?.data || [],
    loading: !data && !error,
    error,
    hasMore: data?.has_more || false,
    nextCursor: data?.next_cursor,
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
    if (!projectId) return { data: [] as AgentThread[], has_more: false, next_cursor: "" };
    const params = new URLSearchParams({ limit: "100" });
    if (includeArchived) {
      params.set("include_archived", "true");
    }
    const response = await client(`/ai/projects/${projectId}/threads?${params.toString()}`);
    const parsed = await responseMapper<ProjectThreadsResponse>(response);
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
    return parsed;
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
    return parsed;
  }, [client, mutate]);

  const archiveThread = useCallback(async (threadId: string) => {
    const response = await client(`/ai/threads/${threadId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await mutate();
    return parsed;
  }, [client, mutate]);

  const unarchiveThread = useCallback(async (threadId: string) => {
    const response = await client(`/ai/threads/${threadId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await mutate();
    return parsed;
  }, [client, mutate]);

  return {
    threads: data?.data || [],
    loading: !data && !error,
    error,
    hasMore: data?.has_more || false,
    nextCursor: data?.next_cursor || "",
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

export function useProjectThreadFeed(
  projectId?: string,
  options: { includeArchived?: boolean; archivedOnly?: boolean; enabled?: boolean; query?: string; limit?: number } = {},
) {
  const { client } = useClient();
  const {
    includeArchived = false,
    archivedOnly = false,
    enabled = true,
    query = "",
    limit = 10,
  } = options;
  const normalizedQuery = query.trim();

  const pages = useSWRInfinite(
    (index, previousPageData: ProjectThreadsResponse | null) => {
      if (!enabled || !projectId) return null;
      if (index > 0 && previousPageData && !previousPageData.has_more) {
        return null;
      }
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return [
        "wacht-ai-project-thread-feed",
        projectId,
        archivedOnly
          ? "archived-only"
          : includeArchived
            ? "with-archived"
            : "active-only",
        normalizedQuery,
        limit,
        cursor || "",
      ];
    },
    async ([, currentProjectId, includeArchivedKey, currentQuery, currentLimit, cursor]) => {
      const params = new URLSearchParams({ limit: String(currentLimit) });
      if (includeArchivedKey === "with-archived") {
        params.set("include_archived", "true");
      } else if (includeArchivedKey === "archived-only") {
        params.set("include_archived", "true");
        params.set("archived_only", "true");
      }
      if (currentQuery) {
        params.set("q", String(currentQuery));
      }
      if (cursor) {
        params.set("cursor", String(cursor));
      }
      const response = await client(`/ai/projects/${currentProjectId}/threads?${params.toString()}`);
      const parsed = await responseMapper<ProjectThreadsResponse>(response);
      return parsed.data;
    },
    { revalidateOnFocus: false, revalidateFirstPage: true, persistSize: true },
  );

  const threads = useMemo(
    () => pages.data?.flatMap((page) => page.data || []) || [],
    [pages.data],
  );
  const hasMore = pages.data ? pages.data[pages.data.length - 1]?.has_more || false : false;
  const loadingMore = pages.isValidating && !!pages.data && pages.size > (pages.data?.length || 0);

  return {
    threads,
    loading: !pages.data && !pages.error,
    error: pages.error || null,
    hasMore,
    loadingMore,
    loadMore: async () => {
      if (!hasMore || loadingMore) return;
      await pages.setSize((size) => size + 1);
    },
    refetch: async () => {
      await pages.mutate();
    },
  };
}

export function useActorThreadSearch(options: AgentSearchOptions = {}) {
  const { client } = useClient();
  const {
    enabled = true,
    query = "",
    limit = 16,
  } = options;
  const normalizedQuery = query.trim();
  const key = enabled
    ? `wacht-ai-actor-thread-search:${normalizedQuery}:${limit}`
    : null;

  const fetcher = useCallback(async () => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }
    const response = await client(`/ai/threads/search?${params.toString()}`);
    const parsed = await responseMapper<ProjectThreadsResponse>(response);
    return parsed.data;
  }, [client, limit, normalizedQuery]);

  const { data, error, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });

  return {
    threads: data?.data || [],
    loading: !data && !error,
    error,
    hasMore: data?.has_more || false,
    nextCursor: data?.next_cursor,
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
    return parsed;
  }, [threadId, client, thread]);

  const archiveThread = useCallback(async () => {
    if (!threadId) throw new Error("threadId is required");
    const response = await client(`/ai/threads/${threadId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await thread.mutate();
    return parsed;
  }, [threadId, client, thread]);

  const unarchiveThread = useCallback(async () => {
    if (!threadId) throw new Error("threadId is required");
    const response = await client(`/ai/threads/${threadId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<AgentThread>(response);
    await thread.mutate();
    return parsed;
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
    const isText = isTextResponseMimeType(mimeType, path);

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
  const { enabled = true, limit = 40 } = options;

  const events = useSWRInfinite(
    (index, previousPageData: ThreadEventsPage | null) => {
      if (!enabled || !threadId) return null;
      if (index > 0 && previousPageData && !previousPageData.has_more) {
        return null;
      }
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return ["wacht-ai-thread-events", threadId, limit, cursor || ""];
    },
    async ([, currentThreadId, currentLimit, cursor]) => {
      const params = new URLSearchParams({ limit: String(currentLimit) });
      if (cursor) params.set("cursor", String(cursor));
      const response = await client(`/ai/threads/${currentThreadId}/events?${params.toString()}`);
      const parsed = await responseMapper<ThreadEventsPage>(response);
      return parsed.data;
    },
    { revalidateOnFocus: false, revalidateFirstPage: true, persistSize: true, refreshInterval: 5000 },
  );

  const data = useMemo(
    () => events.data?.flatMap((page) => page.data || []) || [],
    [events.data],
  );
  const hasMore = events.data ? events.data[events.data.length - 1]?.has_more || false : false;
  const loadingMore = events.isValidating && !!events.data && events.size > (events.data?.length || 0);

  return {
    events: data,
    loading: !events.data && !events.error,
    error: events.error || null,
    hasMore,
    loadingMore,
    loadMore: async () => {
      if (!hasMore || loadingMore) return;
      await events.setSize((size) => size + 1);
    },
    refetch: async () => {
      await events.mutate();
    },
  };
}

export function useAgentThreadAssignments(threadId?: string, options: AgentThreadHookOptions = {}) {
  const { client } = useClient();
  const { enabled = true, limit = 40 } = options;

  const assignments = useSWRInfinite(
    (index, previousPageData: ThreadAssignmentsPage | null) => {
      if (!enabled || !threadId) return null;
      if (index > 0 && previousPageData && !previousPageData.has_more) {
        return null;
      }
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return ["wacht-ai-thread-assignments", threadId, limit, cursor || ""];
    },
    async ([, currentThreadId, currentLimit, cursor]) => {
      const params = new URLSearchParams({ limit: String(currentLimit) });
      if (cursor) params.set("cursor", String(cursor));
      const response = await client(`/ai/threads/${currentThreadId}/assignments?${params.toString()}`);
      const parsed = await responseMapper<ThreadAssignmentsPage>(response);
      return parsed.data;
    },
    { revalidateOnFocus: false, revalidateFirstPage: true, persistSize: true, refreshInterval: 5000 },
  );

  const data = useMemo(
    () => assignments.data?.flatMap((page) => page.data || []) || [],
    [assignments.data],
  );
  const hasMore = assignments.data ? assignments.data[assignments.data.length - 1]?.has_more || false : false;
  const loadingMore = assignments.isValidating && !!assignments.data && assignments.size > (assignments.data?.length || 0);

  return {
    assignments: data,
    loading: !assignments.data && !assignments.error,
    error: assignments.error || null,
    hasMore,
    loadingMore,
    loadMore: async () => {
      if (!hasMore || loadingMore) return;
      await assignments.setSize((size) => size + 1);
    },
    refetch: async () => {
      await assignments.mutate();
    },
  };
}

type ProjectTaskListOptions = {
  statuses?: string[];
  includeArchived?: boolean;
  archivedOnly?: boolean;
  limit?: number;
};

type ProjectTaskListPage = {
  data: ProjectTaskBoardItem[];
  limit: number;
  has_more: boolean;
  next_cursor?: string;
};

function buildTaskListQuery(options: ProjectTaskListOptions = {}, cursor?: string) {
  const params = new URLSearchParams();
  if (options.statuses && options.statuses.length > 0) {
    params.set("status", options.statuses.join(","));
  }
  if (options.includeArchived) {
    params.set("include_archived", "true");
  }
  if (options.archivedOnly) {
    params.set("archived_only", "true");
  }
  if (options.limit) {
    params.set("limit", String(options.limit));
  }
  if (cursor) {
    params.set("cursor", cursor);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
export function useProjectTasks(projectId?: string, enabled = true, options: ProjectTaskListOptions = {}) {
  const { client } = useClient();
  const statusKey = options.statuses?.join(",") || "all";
  const archiveKey = options.archivedOnly
    ? "archived-only"
    : options.includeArchived
      ? "with-archived"
      : "active-only";
  const limitKey = options.limit || 60;

  const items = useSWRInfinite(
    (index, previousPageData: ProjectTaskListPage | null) => {
      if (!enabled || !projectId) return null;
      if (index > 0 && previousPageData && !previousPageData.has_more) {
        return null;
      }
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return [
        "wacht-ai-project-tasks",
        projectId,
        statusKey,
        archiveKey,
        limitKey,
        cursor || "",
      ];
    },
    async ([, currentProjectId, , , , cursor]) => {
      const response = await client(
        `/ai/projects/${currentProjectId}/board/items${buildTaskListQuery(options, cursor || undefined)}`,
      );
      const parsed = await responseMapper<ProjectTaskListPage>(response);
      return parsed.data;
    },
    {
      revalidateOnFocus: false,
      revalidateFirstPage: true,
      persistSize: true,
    },
  );

  const tasks = useMemo(
    () => items.data?.flatMap((page) => page.data || []) || [],
    [items.data],
  );
  const hasMore = items.data ? items.data[items.data.length - 1]?.has_more || false : false;
  const loadingMore = items.isValidating && !!items.data && items.size > (items.data?.length || 0);

  const createTask = useCallback(async (request: CreateProjectTaskBoardItemRequest, files: File[] = []) => {
    if (!projectId) throw new Error("projectId is required");
    const response = await client(`/ai/projects/${projectId}/board/items`, {
      method: "POST",
      body: buildTaskBoardItemFormData(request, files),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await items.mutate();
    return parsed;
  }, [projectId, client, items]);

  const archiveTask = useCallback(async (itemId: string) => {
    if (!projectId) throw new Error("projectId is required");
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await items.mutate();
    return parsed;
  }, [projectId, client, items]);

  const unarchiveTask = useCallback(async (itemId: string) => {
    if (!projectId) throw new Error("projectId is required");
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await items.mutate();
    return parsed;
  }, [projectId, client, items]);

  return {
    tasks,
    loading: !items.data && !items.error,
    error: items.error || null,
    hasMore,
    loadingMore,
    loadMore: async () => {
      if (!hasMore || loadingMore) return;
      await items.setSize((size) => size + 1);
    },
    createTask,
    archiveTask,
    unarchiveTask,
    refetch: async () => { await items.mutate(); },
  };
}

type ProjectTaskDetailOptions = {
  includeArchived?: boolean;
};

export function useProjectTaskBoardItem(projectId?: string, itemId?: string, enabled = true, options: ProjectTaskDetailOptions = {}) {
  const { client } = useClient();
  const archiveKey = options.includeArchived ? "with-archived" : "active-only";
  const detailQuery = options.includeArchived ? "?include_archived=true" : "";
  const itemKey = enabled && projectId && itemId ? `wacht-ai-board-item:${projectId}:${itemId}:${archiveKey}` : null;
  const workspaceKey = enabled && projectId && itemId ? `wacht-ai-board-item-workspace:${projectId}:${itemId}:${archiveKey}` : null;

  const itemFetcher = useCallback(async () => {
    if (!projectId || !itemId) return null;
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}${detailQuery}`);
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    return parsed.data;
  }, [projectId, itemId, client, detailQuery]);

  const item = useSWR(itemKey, itemFetcher, { revalidateOnFocus: false, refreshInterval: 5000 });

  const events = useSWRInfinite(
    (index, previousPageData: BoardItemEventsPage | null) => {
      if (!enabled || !projectId || !itemId) return null;
      if (index > 0 && previousPageData && !previousPageData.has_more) {
        return null;
      }
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return ["wacht-ai-board-item-events", projectId, itemId, archiveKey, cursor || ""];
    },
    async ([, currentProjectId, currentItemId, , cursor]) => {
      const params = new URLSearchParams({ limit: "40" });
      if (options.includeArchived) {
        params.set("include_archived", "true");
      }
      if (cursor) {
        params.set("cursor", String(cursor));
      }
      const response = await client(`/ai/projects/${currentProjectId}/board/items/${currentItemId}/events?${params.toString()}`);
      const parsed = await responseMapper<BoardItemEventsPage>(response);
      return parsed.data;
    },
    { revalidateOnFocus: false, revalidateFirstPage: true, persistSize: true, refreshInterval: 5000 },
  );

  const assignments = useSWRInfinite(
    (index, previousPageData: BoardItemAssignmentsPage | null) => {
      if (!enabled || !projectId || !itemId) return null;
      if (index > 0 && previousPageData && !previousPageData.has_more) {
        return null;
      }
      const cursor = index === 0 ? undefined : previousPageData?.next_cursor;
      return ["wacht-ai-board-item-assignments", projectId, itemId, archiveKey, cursor || ""];
    },
    async ([, currentProjectId, currentItemId, , cursor]) => {
      const params = new URLSearchParams({ limit: "40" });
      if (options.includeArchived) {
        params.set("include_archived", "true");
      }
      if (cursor) {
        params.set("cursor", String(cursor));
      }
      const response = await client(`/ai/projects/${currentProjectId}/board/items/${currentItemId}/assignments?${params.toString()}`);
      const parsed = await responseMapper<BoardItemAssignmentsPage>(response);
      return parsed.data;
    },
    { revalidateOnFocus: false, revalidateFirstPage: true, persistSize: true, refreshInterval: 5000 },
  );

  const workspaceFetcher = useCallback(async () => {
    if (!projectId || !itemId) return { exists: false, files: [] } as ProjectTaskWorkspaceListing;
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/filesystem${detailQuery}`);
    const parsed = await responseMapper<ProjectTaskWorkspaceListing>(response);
    return parsed.data;
  }, [projectId, itemId, client, detailQuery]);

  const workspace = useSWR(workspaceKey, workspaceFetcher, { revalidateOnFocus: false, refreshInterval: 5000 });

  const updateItem = useCallback(async (request: UpdateProjectTaskBoardItemRequest, files: File[] = []) => {
    if (!projectId || !itemId) throw new Error("projectId and itemId are required");
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/update`, {
      method: "POST",
      body: buildTaskBoardItemFormData(request, files),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await item.mutate();
    await workspace.mutate();
    return parsed;
  }, [projectId, itemId, client, item, workspace]);

  const archiveItem = useCallback(async () => {
    if (!projectId || !itemId) throw new Error("projectId and itemId are required");
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/archive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await item.mutate();
    return parsed;
  }, [projectId, itemId, client, item]);

  const unarchiveItem = useCallback(async () => {
    if (!projectId || !itemId) throw new Error("projectId and itemId are required");
    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/unarchive`, {
      method: "POST",
      body: new URLSearchParams(),
    });
    const parsed = await responseMapper<ProjectTaskBoardItem>(response);
    await item.mutate();
    return parsed;
  }, [projectId, itemId, client, item]);

  const getTaskWorkspaceFile = useCallback(async (path: string) => {
    if (!projectId || !itemId) throw new Error("projectId and itemId are required");
    const response = await client(
      `/ai/projects/${projectId}/board/items/${itemId}/filesystem/file${buildTaskWorkspaceFileQuery(path, options.includeArchived)}`,
    );
    const parsed = await responseMapper<ProjectTaskWorkspaceFileContent>(response);
    return parsed;
  }, [projectId, itemId, client, options.includeArchived]);

  const listTaskWorkspaceDirectory = useCallback(async (path?: string) => {
    if (!projectId || !itemId) throw new Error("projectId and itemId are required");
    const response = await client(
      `/ai/projects/${projectId}/board/items/${itemId}/filesystem${buildDirectoryQuery(path, options.includeArchived)}`,
    );
    const parsed = await responseMapper<ProjectTaskWorkspaceListing>(response);
    return parsed;
  }, [projectId, itemId, client, options.includeArchived]);

  const appendJournal = useCallback(async (
    request: AppendProjectTaskBoardItemJournalRequest,
    files: File[] = [],
  ) => {
    if (!projectId || !itemId) throw new Error("projectId and itemId are required");

    const response = await client(`/ai/projects/${projectId}/board/items/${itemId}/journal`, {
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
    await events.mutate();
    await workspace.mutate();
    return parsed;
  }, [projectId, itemId, client, events, workspace]);

  const flattenedEvents = useMemo(
    () => events.data?.flatMap((page) => page.data || []) || [],
    [events.data],
  );

  const flattenedAssignments = useMemo(
    () => assignments.data?.flatMap((page) => page.data || []) || [],
    [assignments.data],
  );

  const eventsHasMore = events.data ? events.data[events.data.length - 1]?.has_more || false : false;
  const eventsLoadingMore = events.isValidating && !!events.data && events.size > (events.data?.length || 0);
  const assignmentsHasMore = assignments.data ? assignments.data[assignments.data.length - 1]?.has_more || false : false;
  const assignmentsLoadingMore =
    assignments.isValidating && !!assignments.data && assignments.size > (assignments.data?.length || 0);

  return {
    item: item.data || null,
    events: flattenedEvents,
    assignments: flattenedAssignments,
    eventsHasMore,
    eventsLoadingMore,
    loadMoreEvents: async () => {
      if (!eventsHasMore || eventsLoadingMore) return;
      await events.setSize((size) => size + 1);
    },
    assignmentsHasMore,
    assignmentsLoadingMore,
    loadMoreAssignments: async () => {
      if (!assignmentsHasMore || assignmentsLoadingMore) return;
      await assignments.setSize((size) => size + 1);
    },
    taskWorkspace: workspace.data || { exists: false, files: [] },
    taskWorkspaceLoading: !workspace.data && !workspace.error,
    taskWorkspaceError: workspace.error || null,
    loading: (!item.data && !item.error) || (!events.data && !events.error) || (!assignments.data && !assignments.error),
    error: item.error || events.error || assignments.error || null,
    updateItem,
    archiveItem,
    unarchiveItem,
    getTaskWorkspaceFile,
    listTaskWorkspaceDirectory,
    appendJournal,
    refetch: async () => {
      await item.mutate();
      await events.mutate();
      await assignments.mutate();
      await workspace.mutate();
    },
    refetchEvents: async () => {
      await events.mutate();
    },
    refetchAssignments: async () => {
      await assignments.mutate();
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
