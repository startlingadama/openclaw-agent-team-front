import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery } from "@/lib/api/queries";
import { AgentStatus, PageHeader } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "Agents - OpenClaw" },
      { name: "description", content: "Your team of specialized AI agents." },
      { property: "og:title", content: "Agents - OpenClaw" },
      { property: "og:description", content: "Your team of specialized AI agents." },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const { data, isLoading, error, refetch } = useQuery(agentsQuery());
  return (
    <>
      <PageHeader title="Agents" description="Specialists available to your workspace." />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? <LoadingRows /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.map((a) => (
            <Link key={a.id} to="/agents/$agentId" params={{ agentId: a.id }} className="rounded-lg border bg-card p-4 hover:bg-accent/40">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.name}</p>
                <AgentStatus status={a.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.role}</p>
              <p className="mt-3 text-sm text-muted-foreground">{a.description}</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">{a.skills.length} skills · {a.tools.length} tools · {a.tasksCount} tasks</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
