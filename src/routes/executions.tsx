import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, executionsQuery } from "@/lib/api/queries";
import { Dot, EmptyState, PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";

export const Route = createFileRoute("/executions")({
  head: () => ({
    meta: [
      { title: "Executions - OpenClaw" },
      { name: "description", content: "History of agent executions with steps, tool calls and approvals." },
      { property: "og:title", content: "Executions - OpenClaw" },
      { property: "og:description", content: "History of agent executions with steps, tool calls and approvals." },
    ],
  }),
  component: ExecutionsPage,
});

const dot = { running: "bg-info", completed: "bg-success", failed: "bg-destructive", cancelled: "bg-muted-foreground" } as const;

function ExecutionsPage() {
  const { data, isLoading, error, refetch } = useQuery(executionsQuery());
  const { data: agents } = useQuery(agentsQuery());
  const short = (id: string) => agents?.find((a) => a.id === id)?.short ?? id;

  return (
    <>
      <PageHeader title="Executions" description="Every run of the agent runtime, newest first." />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : !data?.length ? (
        <Panel><EmptyState title="No executions yet" description="Runs appear here as soon as a task starts." /></Panel>
      ) : (
        <Panel>
          <ul className="divide-y">
            {data.map((e) => (
              <li key={e.id}>
                <Link to="/executions/$executionId" params={{ executionId: e.id }} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-accent/40">
                  <Dot className={dot[e.status]} pulse={e.status === "running"} />
                  <span className="min-w-0 flex-1 truncate text-sm">{e.taskTitle}</span>
                  <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
                  <span className="text-xs text-muted-foreground">{short(e.agentId)}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {e.steps} steps · {e.toolCalls} tools · {e.approvals} approvals
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{e.startedAt} · {e.duration}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
