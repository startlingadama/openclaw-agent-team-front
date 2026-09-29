import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { usePersistentState } from "@/lib/persistent-state";
import { logsQuery } from "@/lib/api/queries";
import { EmptyState, PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Logs - OpenClaw" },
      { name: "description", content: "Structured execution events recorded by the backend." },
      { property: "og:title", content: "Logs - OpenClaw" },
      { property: "og:description", content: "Structured execution events recorded by the backend." },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const { data, isLoading, error, refetch } = useQuery(logsQuery());
  const [filter, setFilter] = usePersistentState("logs:filter", "");
  const events = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return [...(data ?? [])]
      .reverse()
      .filter((event) =>
        !query ||
        [event.time, event.type, event.label, event.agentId, event.taskId, event.taskTitle]
          .some((value) => value.toLowerCase().includes(query)),
      );
  }, [data, filter]);

  return (
    <>
      <PageHeader
        title="Logs"
        description="Structured execution events from backend traces. Sensitive tool inputs and outputs are not shown here."
        actions={
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter logs…"
            aria-label="Filter execution logs"
            className="h-8 w-56"
          />
        }
      />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : events.length === 0 ? (
        <Panel>
          <EmptyState
            title={data?.length ? "No matching logs" : "No logs yet"}
            description={
              data?.length
                ? "Try a different filter."
                : "Structured events appear after an agent execution has been recorded."
            }
          />
        </Panel>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Level</th>
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 font-medium">Agent / Task</th>
                  <th className="px-4 py-2 font-medium">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event, index) => (
                  <tr key={`${event.executionId}-${event.time}-${index}`}>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-muted-foreground">
                      {event.time}
                    </td>
                    <td className="px-4 py-2 uppercase text-muted-foreground">{event.status}</td>
                    <td className="min-w-64 px-4 py-2">
                      <span className="font-mono">{event.type}</span>
                      <span className="ml-2 text-muted-foreground">{event.label}</span>
                      {event.error && (
                        <p className="mt-1 max-w-xl whitespace-pre-wrap text-destructive">
                          {event.error}
                        </p>
                      )}
                    </td>
                    <td className="min-w-48 px-4 py-2">
                      <span className="block">{event.agentId}</span>
                      <span className="text-muted-foreground">{event.taskTitle}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <Link
                        to="/executions/$executionId"
                        params={{ executionId: event.executionId }}
                        className="font-mono text-primary hover:underline"
                      >
                        {event.executionId}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
