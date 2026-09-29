import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, approvalsQuery, useApprovalAction } from "@/lib/api/queries";
import { EmptyState, PageHeader, Panel, PermissionBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "@/components/markdown-message";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals - OpenClaw" },
      { name: "description", content: "Review and approve sensitive agent actions." },
      { property: "og:title", content: "Approvals - OpenClaw" },
      { property: "og:description", content: "Review and approve sensitive agent actions." },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { data, isLoading, error, refetch } = useQuery(approvalsQuery());
  const { data: agents } = useQuery(agentsQuery());
  const act = useApprovalAction();
  return (
    <>
      <PageHeader title="Approvals" description="Sensitive actions wait here. Your decision is sent to the backend, which enforces it." />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? <LoadingRows /> : !data?.length ? (
        <Panel><EmptyState title="Nothing to approve" description="Agents will ask here before any external action." /></Panel>
      ) : (
        <div className="space-y-4">
          {data.map((a) => (
            <Panel key={a.id} title={`${agents?.find((x) => x.id === a.agentId)?.name ?? a.agentId} · ${a.action}`} action={<PermissionBadge level={a.level ?? "APPROVAL REQUIRED"} />}>
              <div className="space-y-3 p-4">
                <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[120px_1fr]">
                  {(a.fields ?? []).map((f) => (
                    <div key={f.label} className="contents"><dt className="text-muted-foreground">{f.label}</dt><dd>{f.value}</dd></div>
                  ))}
                  {a.risk && <><dt className="text-muted-foreground">Risk</dt><dd>{a.risk}</dd></>}
                </dl>
                {a.body && (
                  <div className="rounded-md border bg-background p-3 text-sm">
                    <MarkdownMessage content={a.body} />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/tasks/$taskId" params={{ taskId: a.taskId }} className="mr-auto text-xs text-muted-foreground hover:text-foreground">Task {a.taskId} · {a.requestedAgo}</Link>
                  <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ id: a.id, approve: false })}>Reject</Button>
                  <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: a.id, approve: true })}>Approve</Button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
