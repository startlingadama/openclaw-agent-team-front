// Typed API surface. All application data and actions come from the Python backend.
import { ApiError, request, requestBlob } from "./client";
import type {
  Agent,
  Approval,
  DocumentFile,
  ExecutionSummary,
  ExecutionLogEntry,
  MemoryFile,
  MemoryLayerKey,
  SkillDetail,
  Task,
  TaskEvent,
  TeamDetail,
  ToolDetail,
} from "./types";

export type {
  Agent,
  Approval,
  DocumentFile,
  DocumentKind,
  ExecutionSummary,
  ExecutionLogEntry,
  MemoryFile,
  MemoryLayerKey,
  MemoryScope,
  Permission,
  SkillDetail,
  SkillFile,
  Task,
  TaskEvent,
  TaskStatus,
  TeamDetail,
  TeamMember,
  ToolDetail,
} from "./types";
export { ApiError } from "./client";

export interface User {
  id: string;
  email: string;
  name?: string | undefined;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateTaskInput {
  agent_id: string;
  title: string;
  instructions?: string | undefined;
}

export interface Health {
  status: string;
  version?: string;
  llm?: string;
}

/** Encodes each segment of a relative path and keeps the `/` between them. */
const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export interface ChatReply {
  task_id?: string;
  message: string;
}

export const api = {
  health: () => request<Health>("/api/health"),

  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password } }),
    signup: (email: string, password: string, name?: string) =>
      request<AuthResponse>("/api/auth/signup", {
        method: "POST",
        body: { email, password, name },
      }),
    me: () => request<User>("/api/auth/me"),
    logout: () => request<null>("/api/auth/logout", { method: "POST" }),
  },

  agents: {
    list: () => request<Agent[]>("/api/agents"),
    get: (id: string) => request<Agent>(`/api/agents/${encodeURIComponent(id)}`),
  },

  tasks: {
    list: () => request<Task[]>("/api/tasks"),
    get: (id: string) => request<Task>(`/api/tasks/${encodeURIComponent(id)}`),
    create: (input: CreateTaskInput) =>
      request<Task>("/api/tasks", { method: "POST", body: input }),
  },

  approvals: {
    list: () => request<Approval[]>("/api/approvals"),
    approve: (id: string) =>
      request<unknown>(`/api/approvals/${encodeURIComponent(id)}/approve`, { method: "POST" }),
    reject: (id: string, reason?: string) =>
      request<unknown>(`/api/approvals/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        body: { reason },
      }),
  },

  chat: {
    send: (agent_id: string, message: string) =>
      request<ChatReply>("/api/chat", { method: "POST", body: { agent_id, message } }),
  },

  skills: {
    // The index omits instructions; full skill content is fetched only when opened.
    list: () =>
      request<Omit<SkillDetail, "instructions">[]>("/api/skills"),
    get: (id: string) => request<Omit<SkillDetail, "instructions">>(`/api/skills/${encodeURIComponent(id)}`),
    instructions: (id: string) =>
      request<{ instructions: string }>(`/api/skills/${encodeURIComponent(id)}/instructions`),
  },

  tools: {
    list: () => request<ToolDetail[]>("/api/tools"),
  },

  memory: {
    get: (agentId: string) =>
      request<MemoryFile[]>(`/api/memory/${encodeURIComponent(agentId)}`),
    update: (agentId: string, layer: MemoryLayerKey, content: string) =>
      request<MemoryFile[]>(
        `/api/memory/${encodeURIComponent(agentId)}/${layer}`,
        { method: "PUT", body: { content } },
      ),
  },

  teams: {
    list: () => request<TeamDetail[]>("/api/teams"),
    get: (id: string) => request<TeamDetail>(`/api/teams/${encodeURIComponent(id)}`),
  },

  executions: {
    list: () => request<ExecutionSummary[]>("/api/executions"),
    get: (id: string) =>
      request<ExecutionSummary>(`/api/executions/${encodeURIComponent(id)}`),
    events: (id: string) =>
      request<TaskEvent[]>(`/api/executions/${encodeURIComponent(id)}/events`),
  },

  documents: {
    list: () => request<DocumentFile[]>("/api/documents"),
    blob: (path: string) => requestBlob(`/api/documents/${encodePath(path)}`),
    text: async (path: string) => (await requestBlob(`/api/documents/${encodePath(path)}`)).text(),
  },

  logs: {
    list: async (): Promise<ExecutionLogEntry[]> => {
      const executions = await request<ExecutionSummary[]>("/api/executions");
      const batches = await Promise.all(
        executions.map(async (execution) => {
          const events = await request<TaskEvent[]>(
            `/api/executions/${encodeURIComponent(execution.id)}/events`,
          );
          return events.map((event) => ({
            ...event,
            executionId: execution.id,
            taskId: execution.taskId,
            taskTitle: execution.taskTitle,
            agentId: execution.agentId,
          }));
        }),
      );
      return batches.flat();
    },
  },
};
