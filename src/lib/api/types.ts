export type TaskStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type Permission = "READ" | "PREPARE" | "WRITE" | "EXTERNAL ACTION" | "APPROVAL REQUIRED";

export interface Skill {
  name: string;
  description: string;
  status: "active" | "disabled";
  scripts: number;
  references: number;
}

export interface Tool {
  name: string;
  description: string;
  permission: Permission;
}

export interface Agent {
  id: string;
  name: string;
  short: string;
  role: string;
  description: string;
  status: "online" | "busy" | "offline";
  currentTask?: string;
  capabilities: string[];
  skills: Skill[];
  tools: Tool[];
  tasksCount: number;
}

export interface TaskEvent {
  time: string;
  type: string;
  label: string;
  duration?: string;
  input?: unknown;
  output?: unknown;
  status: "ok" | "running" | "error" | "pending";
  error?: string;
}

export type DocumentKind = "md" | "tex" | "pdf";

/** A file of the documents directory (Markdown, LaTeX source or PDF), produced by the writer. */
export interface DocumentFile {
  path: string;
  name: string;
  kind: DocumentKind;
  size: number;
  modified: string;
  folder: string;
  /** The task that produced it, when the backend still knows it. */
  taskId?: string | null;
  agentId?: string | null;
  taskTitle?: string | null;
}

export interface Task {
  id: string;
  title: string;
  agentId: string;
  status: TaskStatus;
  started: string;
  duration: string;
  createdAgo: string;
  events: TaskEvent[];
  /** Files the task produced that can still be downloaded (only on a single-task response). */
  documents?: DocumentFile[];
}

export interface Approval {
  id: string;
  agentId: string;
  taskId: string;
  action: string;
  status: "pending" | "approved" | "rejected";
  level?: Permission;
  risk?: string;
  fields?: { label: string; value: string }[];
  body?: string;
  requestedAgo: string;
}

export interface SkillFile {
  path: string;
  kind: "instruction" | "script" | "reference" | "asset";
  size: string;
}

export interface SkillDetail {
  id: string;
  name: string;
  description: string;
  status: "active" | "disabled";
  agents: string[];
  version?: string;
  files: SkillFile[];
  instructions?: string;
}

export type MemoryLayerKey = "agent" | "user";

export interface ToolDetail {
  id: string;
  group: string;
  name: string;
  description: string;
  agents: string[];
  permission: Permission;
  risk: "LOW" | "MEDIUM" | "HIGH";
}

export type MemoryScope = "Agent Memory" | "User Memory" | "Shared Memory" | "Session Memory";

export interface MemoryFile {
  name: string;
  scope: MemoryScope;
  updated: string;
  content: string;
}

export interface TeamMember {
  agentId: string;
  role: "lead" | "member";
  responsibility: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  purpose: string;
  lead: { id: string; name: string };
  members: TeamMember[];
  delegationRules: string[];
  sharedMemory: string[];
  recentTaskIds: string[];
}

export interface ExecutionSummary {
  id: string;
  taskId: string;
  taskTitle: string;
  agentId: string;
  status: "completed" | "failed" | "running" | "cancelled";
  startedAt: string;
  duration: string;
  steps: number;
  toolCalls: number;
  approvals: number;
}

export interface ExecutionLogEntry extends TaskEvent {
  executionId: string;
  taskId: string;
  taskTitle: string;
  agentId: string;
}
