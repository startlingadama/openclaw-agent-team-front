import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, teamQuery, tasksQuery } from "@/lib/api/queries";
import { PageHeader, Panel, TaskStatusBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";

export const Route = createFileRoute("/teams/$teamId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.teamId} team - OpenClaw` },
      { name: "description", content: "Team members, delegation rules, shared memory and recent tasks." },
      { property: "og:title", content: `${params.teamId} team - OpenClaw` },
      { property: "og:description", content: "Team members, delegation rules, shared memory and recent tasks." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { teamId } = Route.useParams();
  const { data: t, isLoading, error, refetch } = useQuery(teamQuery(teamId));
  const { data: agents } = useQuery(agentsQuery());
  const { data: tasks } = useQuery(tasksQuery());

  if (isLoading) return <LoadingRows />;
  if (error || !t) return <ErrorBox error={error ?? new Error("Team not found")} onRetry={() => refetch()} />;

  const short = (id: string) => agents?.find((a) => a.id === id)?.short ?? id;
  const recent = (tasks ?? []).filter((x) => t.recentTaskIds.includes(x.id));

  return (
    <>
      <Link to="/teams" className="text-xs text-muted-foreground hover:text-foreground">← Teams</Link>
      <PageHeader title={t.name} description={t.purpose} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Delegation">
          <div className="overflow-x-auto px-4 py-4">
            <div className="inline-flex min-w-full flex-col items-center gap-0">
              <span className="rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-sm font-medium">{t.lead.name}</span>
              <span className="h-5 w-px bg-border" />
              <div className="flex flex-wrap items-start justify-center gap-3 border-t pt-5">
                {t.members.map((m) => (
                  <Link
                    key={m.agentId}
                    to="/agents/$agentId"
                    params={{ agentId: m.agentId }}
                    className="max-w-[160px] rounded-md border bg-card px-3 py-2 text-center hover:bg-accent/40"
                  >
                    <span className="block text-sm font-medium">{short(m.agentId)}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{m.responsibility}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Members & responsibilities">
          <ul className="divide-y">
            {t.members.map((m) => (
              <li key={m.agentId} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{short(m.agentId)}</p>
                  <p className="text-xs text-muted-foreground">{m.responsibility}</p>
                </div>
                <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">{m.role}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Delegation rules">
          <ul className="space-y-2 px-4 py-3 text-sm text-muted-foreground">
            {t.delegationRules.map((r) => (
              <li key={r} className="flex gap-2"><span className="text-muted-foreground">→</span>{r}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="Shared memory">
          <ul className="divide-y">
            {t.sharedMemory.map((f) => (
              <li key={f} className="px-4 py-2.5 font-mono text-xs">{f}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent tasks" className="lg:col-span-2">
          <ul className="divide-y">
            {recent.map((x) => (
              <li key={x.id}>
                <Link to="/tasks/$taskId" params={{ taskId: x.id }} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-accent/40">
                  <span className="min-w-0 truncate text-sm">{x.title}</span>
                  <TaskStatusBadge status={x.status} />
                </Link>
              </li>
            ))}
            {recent.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">No recent task for this team.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
