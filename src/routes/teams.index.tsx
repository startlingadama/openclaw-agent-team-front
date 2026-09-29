import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, teamsQuery } from "@/lib/api/queries";
import { PageHeader } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";

export const Route = createFileRoute("/teams/")({
  head: () => ({
    meta: [
      { title: "Teams - OpenClaw" },
      { name: "description", content: "Agent teams and how work is delegated between them." },
      { property: "og:title", content: "Teams - OpenClaw" },
      { property: "og:description", content: "Agent teams and how work is delegated between them." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { data, isLoading, error, refetch } = useQuery(teamsQuery());
  const { data: agents } = useQuery(agentsQuery());
  const name = (id: string) => agents?.find((a) => a.id === id)?.short ?? id;

  return (
    <>
      <PageHeader title="Teams" description="Groups of agents with a lead that delegates work." />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((t) => (
            <Link key={t.id} to="/teams/$teamId" params={{ teamId: t.id }} className="rounded-lg border bg-card p-4 hover:bg-accent/40">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.purpose}</p>
              <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-muted-foreground">
{t.lead.name}
{t.members.map((m, i) => `${i === t.members.length - 1 ? "└──" : "├──"} ${name(m.agentId)}`).join("\n")}
              </pre>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
