import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon } from "lucide-react";
import { agentsQuery, logsQuery } from "@/lib/api/queries";
import { Dot, EmptyState, PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity - OpenClaw" },
      { name: "description", content: "Recent agent and task activity from backend execution events." },
      { property: "og:title", content: "Activity - OpenClaw" },
      { property: "og:description", content: "Recent agent and task activity from backend execution events." },
    ],
  }),
  component: ActivityPage,
});

const statusDot = {
  ok: "bg-success",
  running: "bg-info",
  error: "bg-destructive",
  pending: "bg-warning",
} as const;

function ActivityPage() {
  const activity = useQuery(logsQuery());
  const { data: agents } = useQuery(agentsQuery());
  const agentName = (id: string) => agents?.find((agent) => agent.id === id)?.name ?? id;
  const events = [...(activity.data ?? [])].sort((left, right) =>
    right.time.localeCompare(left.time),
  );

  return (
    <>
      <PageHeader
        title="Activity"
        description="Recent agent steps and task status reported by the backend."
      />
      {activity.error && <ErrorBox error={activity.error} onRetry={() => activity.refetch()} />}
      {activity.isLoading ? (
        <LoadingRows />
      ) : events.length === 0 ? (
        <Panel>
          <EmptyState
            title="No recent activity"
            description="Agent activity appears here when executions produce backend events."
          />
        </Panel>
      ) : (
        <Panel>
          <ol className="divide-y">
            {events.map((event, index) => (
              <li key={`${event.executionId}-${event.time}-${index}`}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="pt-1.5">
                    <Dot
                      className={statusDot[event.status]}
                      pulse={event.status === "running"}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{event.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {agentName(event.agentId)} · {event.taskTitle}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                      <span className="font-mono">{event.type}</span>
                      <span>{event.status}</span>
                      {event.duration && <span>{event.duration}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                    <time className="font-mono text-muted-foreground">{event.time}</time>
                    <Link
                      to="/executions/$executionId"
                      params={{ executionId: event.executionId }}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ActivityIcon className="size-3" /> Execution
                    </Link>
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: event.taskId }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Task {event.taskId}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  );
}
