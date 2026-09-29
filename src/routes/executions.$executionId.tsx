import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, executionEventsQuery, executionQuery } from "@/lib/api/queries";
import { formatEventValue } from "@/lib/format-event-value";
import { MarkdownMessage } from "@/components/markdown-message";
import { Dot, EmptyState, PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";

export const Route = createFileRoute("/executions/$executionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Execution ${params.executionId} - OpenClaw` },
      { name: "description", content: "Execution timeline: steps, tool calls, approvals and results." },
      { property: "og:title", content: `Execution ${params.executionId} - OpenClaw` },
      { property: "og:description", content: "Execution timeline: steps, tool calls, approvals and results." },
    ],
  }),
  component: ExecutionDetail,
});

const runDot = { running: "bg-info", completed: "bg-success", failed: "bg-destructive", cancelled: "bg-muted-foreground" } as const;
const evDot = { ok: "bg-success", running: "bg-info", error: "bg-destructive", pending: "bg-warning" } as const;

function ExecutionDetail() {
  const { executionId } = Route.useParams();
  const exec = useQuery(executionQuery(executionId));
  const events = useQuery({ ...executionEventsQuery(executionId), refetchInterval: exec.data?.status === "running" ? 5_000 : false });
  const { data: agents } = useQuery(agentsQuery());
  const agent = agents?.find((a) => a.id === exec.data?.agentId);

  if (exec.error) return <ErrorBox error={exec.error} onRetry={() => exec.refetch()} />;
  if (!exec.data) return <LoadingRows />;
  const e = exec.data;

  return (
    <>
      <PageHeader
        title={e.taskTitle}
        description={`${e.id} · ${agent?.name ?? e.agentId}`}
        actions={
          <Link to="/tasks/$taskId" params={{ taskId: e.taskId }} className="text-sm underline underline-offset-4">
            Open task
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Status", <span key="s" className="inline-flex items-center gap-2 capitalize"><Dot className={runDot[e.status]} pulse={e.status === "running"} />{e.status}</span>],
          ["Started", e.startedAt],
          ["Duration", e.duration],
          ["Steps", e.steps],
          ["Tools / approvals", `${e.toolCalls} / ${e.approvals}`],
        ].map(([k, v]) => (
          <Panel key={String(k)}>
            <div className="p-3">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className="mt-1 font-mono text-sm">{v}</div>
            </div>
          </Panel>
        ))}
      </div>
      <Panel title="Timeline">
        {events.error ? (
          <ErrorBox error={events.error} onRetry={() => events.refetch()} />
        ) : events.isLoading ? (
          <LoadingRows />
        ) : !events.data?.length ? (
          <EmptyState title="No events" description="This execution has no recorded events yet." />
        ) : (
          <ol className="divide-y">
            {events.data.map((ev, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Dot className={evDot[ev.status]} pulse={ev.status === "running"} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-sm">{ev.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{ev.type}</span>
                    {ev.duration && <span className="font-mono text-xs text-muted-foreground">{ev.duration}</span>}
                  </div>
                  {ev.input !== undefined && ev.input !== null && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap wrap-break-word font-mono text-xs text-muted-foreground">
                      → {formatEventValue(ev.input)}
                    </pre>
                  )}
                  {ev.output !== undefined && ev.output !== null && (
                    <div className="mt-1 border-l-2 pl-3 text-xs text-muted-foreground">
                      <MarkdownMessage content={formatEventValue(ev.output)} />
                    </div>
                  )}
                  {ev.error && <p className="mt-1 text-xs text-destructive">{ev.error}</p>}
                </div>
                <span className="font-mono text-xs text-muted-foreground">{ev.time}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
