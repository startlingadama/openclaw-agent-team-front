import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, tasksQuery } from "@/lib/api/queries";
import { EmptyState, PageHeader, Panel, TaskStatusBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { NewTaskDialog } from "@/components/new-task-dialog";

export const Route = createFileRoute("/tasks/")({
  head: () => ({
    meta: [
      { title: "Tasks - OpenClaw" },
      { name: "description", content: "All tasks submitted to your AI agents." },
      { property: "og:title", content: "Tasks - OpenClaw" },
      { property: "og:description", content: "All tasks submitted to your AI agents." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { data, isLoading, error, refetch } = useQuery(tasksQuery());
  const { data: agents } = useQuery(agentsQuery());
  const name = (id: string) => agents?.find((a) => a.id === id)?.name ?? id;
  return (
    <>
      <PageHeader title="Tasks" description="Every task your agents have received." actions={<NewTaskDialog />} />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      <Panel>
        {isLoading ? <LoadingRows /> : !data?.length ? (
          <EmptyState title="No tasks yet" description="Create a task to put an agent to work." />
        ) : (
          <div className="divide-y">
            {data.map((t) => (
              <Link key={t.id} to="/tasks/$taskId" params={{ taskId: t.id }} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 hover:bg-accent/50 sm:grid-cols-[1fr_150px_80px_90px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">{t.id} · {name(t.agentId)}</p>
                </div>
                <TaskStatusBadge status={t.status} />
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">{t.duration}</span>
                <span className="hidden text-right text-xs text-muted-foreground sm:block">{t.createdAgo}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
