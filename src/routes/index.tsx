import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, approvalsQuery, healthQuery, tasksQuery, useApprovalAction } from "@/lib/api/queries";
import { AgentStatus, Dot, EmptyState, PageHeader, Panel, TaskStatusBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview - OpenClaw" },
      { name: "description", content: "Operational command center for your AI agent team." },
      { property: "og:title", content: "Overview - OpenClaw" },
      { property: "og:description", content: "Operational command center for your AI agent team." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const agentsQ = useQuery(agentsQuery());
  const tasksQ = useQuery(tasksQuery());
  const agents = agentsQ.data ?? [];
  const tasks = tasksQ.data ?? [];
  const approvals = useQuery(approvalsQuery()).data ?? [];
  const health = useQuery(healthQuery());
  const loadError = agentsQ.error ?? tasksQ.error;
  const act = useApprovalAction();
  const getAgent = (id: string) => agents.find((a) => a.id === id);
  const running = tasks.filter((t) => t.status === "running");
  const stats = [
    { k: "System", v: health.data?.status ?? (health.isError ? "Down" : "…"), dot: health.isError ? "bg-destructive" : "bg-success" },
    { k: "API", v: health.isError ? "Unreachable" : health.data?.status === "demo" ? "Demo" : "Connected", dot: health.isError ? "bg-destructive" : "bg-success" },
    { k: "LLM", v: health.data?.llm ?? "-", dot: "bg-info" },
    { k: "Agents", v: `${agents.length} active` },
    { k: "Tasks", v: `${running.length} running` },
    { k: "Approvals", v: `${approvals.length} pending`, dot: "bg-warning" },
  ];
  return (
    <>
      <PageHeader title="Overview" description="What your agents are doing right now." />
      {loadError && (
        <ErrorBox
          error={loadError}
          onRetry={() => {
            agentsQ.refetch();
            tasksQ.refetch();
          }}
        />
      )}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.k} className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.k}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium">
              {s.dot && <Dot className={s.dot} />}
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {approvals.length > 0 && (
        <Panel
          className="mt-6 border-warning/40"
          title={`Pending approvals · ${approvals.length}`}
          action={<Link to="/approvals" className="text-xs text-muted-foreground hover:text-foreground">Open center →</Link>}
        >
          <div className="divide-y">
            {approvals.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{getAgent(a.agentId)?.name} · wants to {a.action.toLowerCase()}</p>
                  <p className="mt-0.5 truncate text-sm font-medium">"{a.fields?.[1]?.value ?? a.action}"</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="ghost"><Link to="/approvals">Review</Link></Button>
                  <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ id: a.id, approve: false })}>Reject</Button>
                  <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: a.id, approve: true })}>Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Agent activity" className="lg:col-span-1">
          {agentsQ.isLoading && <LoadingRows rows={3} label="Loading agents" />}
          {!agentsQ.isLoading && !agents.length && (
            <EmptyState title="No agents yet" description="Connect the backend to see your agent roster." />
          )}
          <div className="divide-y">
            {agents.map((a) => (
              <Link key={a.id} to="/agents/$agentId" params={{ agentId: a.id }} className="block px-4 py-3 hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.name}</p>
                  <AgentStatus status={a.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.currentTask ?? "Idle"}</p>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Recent tasks" className="lg:col-span-2" action={<Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground">All tasks →</Link>}>
          {tasksQ.isLoading && <LoadingRows rows={4} label="Loading tasks" />}
          {!tasksQ.isLoading && !tasks.length && (
            <EmptyState title="No active tasks" description="Start a conversation to create your first task." />
          )}
          <div className="divide-y">
            {tasks.slice(0, 6).map((t) => (
              <Link key={t.id} to="/tasks/$taskId" params={{ taskId: t.id }} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 hover:bg-accent/50 sm:grid-cols-[1fr_140px_80px_80px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{getAgent(t.agentId)?.name}</p>
                </div>
                <TaskStatusBadge status={t.status} />
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">{t.duration}</span>
                <span className="hidden text-right text-xs text-muted-foreground sm:block">{t.createdAgo}</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
