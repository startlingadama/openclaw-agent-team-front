import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type CreateTaskInput } from "./index";

export const qk = {
  health: ["health"] as const,
  agents: ["agents"] as const,
  agent: (id: string) => ["agents", id] as const,
  tasks: ["tasks"] as const,
  task: (id: string) => ["tasks", id] as const,
  approvals: ["approvals"] as const,
  skills: ["skills"] as const,
  skill: (id: string) => ["skills", id] as const,
  skillInstructions: (id: string) => ["skills", id, "instructions"] as const,
  tools: ["tools"] as const,
  memory: (agentId: string) => ["memory", agentId] as const,
  teams: ["teams"] as const,
  team: (id: string) => ["teams", id] as const,
  executions: ["executions"] as const,
  logs: ["logs"] as const,
  documents: ["documents"] as const,
  documentContent: (path: string) => ["documents", "content", path] as const,
};

export const healthQuery = () => queryOptions({ queryKey: qk.health, queryFn: api.health, retry: false, refetchInterval: 30_000 });
export const agentsQuery = () => queryOptions({ queryKey: qk.agents, queryFn: api.agents.list });
export const agentQuery = (id: string) => queryOptions({ queryKey: qk.agent(id), queryFn: () => api.agents.get(id) });
export const tasksQuery = () => queryOptions({ queryKey: qk.tasks, queryFn: api.tasks.list, refetchInterval: 10_000 });
export const taskQuery = (id: string) => queryOptions({ queryKey: qk.task(id), queryFn: () => api.tasks.get(id), refetchInterval: 5_000 });
export const approvalsQuery = () => queryOptions({ queryKey: qk.approvals, queryFn: api.approvals.list, refetchInterval: 10_000 });
export const skillsQuery = () => queryOptions({ queryKey: qk.skills, queryFn: api.skills.list });
export const skillQuery = (id: string) => queryOptions({ queryKey: qk.skill(id), queryFn: () => api.skills.get(id) });
export const skillInstructionsQuery = (id: string) =>
  queryOptions({ queryKey: qk.skillInstructions(id), queryFn: () => api.skills.instructions(id) });
export const toolsQuery = () => queryOptions({ queryKey: qk.tools, queryFn: api.tools.list });
export const memoryQuery = (agentId: string) => queryOptions({ queryKey: qk.memory(agentId), queryFn: () => api.memory.get(agentId) });
export const teamsQuery = () => queryOptions({ queryKey: qk.teams, queryFn: api.teams.list });
export const teamQuery = (id: string) => queryOptions({ queryKey: qk.team(id), queryFn: () => api.teams.get(id) });
export const executionsQuery = () => queryOptions({ queryKey: qk.executions, queryFn: api.executions.list, refetchInterval: 15_000 });
export const executionQuery = (id: string) =>
  queryOptions({ queryKey: [...qk.executions, id], queryFn: () => api.executions.get(id) });
export const executionEventsQuery = (id: string) =>
  queryOptions({ queryKey: [...qk.executions, id, "events"], queryFn: () => api.executions.events(id), refetchInterval: 5_000 });
export const logsQuery = () =>
  queryOptions({ queryKey: qk.logs, queryFn: api.logs.list, refetchInterval: 10_000 });

export const documentsQuery = () =>
  queryOptions({ queryKey: qk.documents, queryFn: api.documents.list, refetchInterval: 15_000 });
// Markdown and LaTeX are read as text, a PDF as a Blob. Same key prefix as the list, so one
// invalidation of `qk.documents` (a `docs.*` tool just ran) refreshes an open document too.
export const documentTextQuery = (path: string) =>
  queryOptions({ queryKey: [...qk.documentContent(path), "text"], queryFn: () => api.documents.text(path) });
export const documentBlobQuery = (path: string) =>
  queryOptions({ queryKey: [...qk.documentContent(path), "blob"], queryFn: () => api.documents.blob(path) });

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: CreateTaskInput) => api.tasks.create(i),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tasks }),
    onError: (e: Error) => toast.error("Could not create task", { description: e.message }),
  });
}

export function useApprovalAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? api.approvals.approve(id) : api.approvals.reject(id),
    onSuccess: (_d, v) => {
      toast.success(v.approve ? "Approval sent to backend" : "Rejection sent to backend");
      qc.invalidateQueries({ queryKey: qk.approvals });
      qc.invalidateQueries({ queryKey: qk.tasks });
    },
    onError: (e: Error) => toast.error("Action failed", { description: e.message }),
  });
}
