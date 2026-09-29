import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentQuery, taskQuery } from "@/lib/api/queries";
import { useExecutionStream } from "@/lib/api/use-execution-stream";
import { formatEventValue } from "@/lib/format-event-value";
import { Dot, PageHeader, Panel, TaskStatusBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { MarkdownMessage } from "@/components/markdown-message";
import { DocumentLinks } from "@/components/document-links";

export const Route = createFileRoute("/tasks/$taskId")({
  head: ({ params }) => ({
    meta: [
      { title: `Task ${params.taskId} - OpenClaw` },
      { name: "description", content: "Execution timeline for an agent task." },
      { property: "og:title", content: `Task ${params.taskId} - OpenClaw` },
      { property: "og:description", content: "Execution timeline for an agent task." },
    ],
  }),
  component: TaskPage,
});

const dot = { ok: "bg-success", running: "bg-info", error: "bg-destructive", pending: "bg-muted-foreground" } as const;

function TaskPage() {
  const { taskId } = Route.useParams();
  const { data: t, isLoading, error, refetch } = useQuery(taskQuery(taskId));
  const { data: agent } = useQuery({ ...agentQuery(t?.agentId ?? ""), enabled: !!t });
  const live = t && (t.status === "running" || t.status === "queued" || t.status === "waiting_approval");
  const streamState = useExecutionStream(live ? taskId : undefined);
  if (isLoading) return <LoadingRows />;
  if (error || !t) return <ErrorBox error={error ?? new Error("Task not found")} onRetry={() => refetch()} />;
  return (
    <>
      <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground">← Tasks</Link>
      <PageHeader
        title={t.title}
        description={`${t.id} · ${agent?.name ?? t.agentId} · started ${t.started}`}
        actions={
          <span className="flex items-center gap-3">
            {live && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Dot className={streamState === "open" ? "bg-success" : streamState === "error" ? "bg-destructive" : "bg-muted-foreground"} pulse={streamState === "open"} />
                {streamState === "open" ? "Live" : streamState === "error" ? "Reconnecting…" : "Connecting…"}
              </span>
            )}
            <TaskStatusBadge status={t.status} />
          </span>
        }
      />
      {t.documents?.length ? (
        <Panel title="Documents" className="mb-4">
          <div className="px-4 pb-4">
            <DocumentLinks documents={t.documents} />
          </div>
        </Panel>
      ) : null}
      <Panel title="Execution timeline">
        <ol className="divide-y">
          {t.events.map((e, i) => (
            <li key={i} className="grid grid-cols-[48px_16px_1fr] gap-3 px-4 py-3">
              <span className="font-mono text-xs text-muted-foreground">{e.time}</span>
              <span className="pt-1.5"><Dot className={dot[e.status]} pulse={e.status === "running"} /></span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.label} <span className="ml-2 font-mono text-[11px] text-muted-foreground">{e.type}{e.duration ? ` · ${e.duration}` : ""}</span></p>
                {e.input !== undefined && e.input !== null && (
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                    → {formatEventValue(e.input)}
                  </pre>
                )}
                {e.output !== undefined && e.output !== null && (
                  <div className="mt-1 border-l-2 pl-3 text-xs text-muted-foreground">
                    <MarkdownMessage content={formatEventValue(e.output)} />
                  </div>
                )}
                {e.error && <p className="mt-1 text-xs text-destructive">{e.error}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
