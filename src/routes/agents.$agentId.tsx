import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentQuery } from "@/lib/api/queries";
import { AgentStatus, PageHeader, Panel, PermissionBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { NewTaskDialog } from "@/components/new-task-dialog";

export const Route = createFileRoute("/agents/$agentId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.agentId} agent - OpenClaw` },
      { name: "description", content: "Agent capabilities, skills and tools." },
      { property: "og:title", content: `${params.agentId} agent - OpenClaw` },
      { property: "og:description", content: "Agent capabilities, skills and tools." },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  const { agentId } = Route.useParams();
  const { data: a, isLoading, error, refetch } = useQuery(agentQuery(agentId));
  if (isLoading) return <LoadingRows />;
  if (error || !a) return <ErrorBox error={error ?? new Error("Agent not found")} onRetry={() => refetch()} />;
  return (
    <>
      <Link to="/agents" className="text-xs text-muted-foreground hover:text-foreground">← Agents</Link>
      <PageHeader title={a.name} description={a.role} actions={<div className="flex items-center gap-3"><AgentStatus status={a.status} /><NewTaskDialog defaultAgent={a.id} /></div>} />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">{a.description}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Skills">
          <div className="divide-y">
            {a.skills.map((s) => (
              <div key={s.name} className="px-4 py-3">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Tools">
          <div className="divide-y">
            {a.tools.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <PermissionBadge level={t.permission} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
