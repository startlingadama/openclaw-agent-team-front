import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePersistentState } from "@/lib/persistent-state";
import { agentsQuery, toolsQuery } from "@/lib/api/queries";
import { EmptyState, PageHeader, Panel, PermissionBadge } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { Input } from "@/components/ui/input";
import type { ToolDetail } from "@/lib/api";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Tools - OpenClaw" },
      { name: "description", content: "Tools the agents can call, with permission and risk level." },
      { property: "og:title", content: "Tools - OpenClaw" },
      { property: "og:description", content: "Tools the agents can call, with permission and risk level." },
    ],
  }),
  component: ToolsPage,
});

const riskCls = {
  LOW: "text-muted-foreground border-border",
  MEDIUM: "text-warning border-warning/40",
  HIGH: "text-destructive border-destructive/40",
} as const;

function ToolsPage() {
  const { data, isLoading, error, refetch } = useQuery(toolsQuery());
  const { data: agents } = useQuery(agentsQuery());
  const [q, setQ] = usePersistentState("tools:q", "");

  const list = (data ?? []).filter((t) => `${t.name} ${t.description}`.toLowerCase().includes(q.toLowerCase()));
  const groups = list.reduce<Record<string, ToolDetail[]>>((acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  }, {});
  const agentName = (id: string) => agents?.find((a) => a.id === id)?.short ?? id;

  return (
    <>
      <PageHeader
        title="Tools"
        description="Every capability the runtime can call. High-risk tools always require your approval."
        actions={
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter tools…" aria-label="Filter tools" className="h-8 w-56" />
        }
      />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : list.length === 0 ? (
        <Panel><EmptyState title="No tools" description="No tool matches this filter." /></Panel>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([group, items]) => (
            <Panel key={group} title={group}>
              <ul className="divide-y">
                {items.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm">{t.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Access: {t.agents.map(agentName).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${riskCls[t.risk]}`}>
                        RISK {t.risk}
                      </span>
                      <PermissionBadge level={t.permission} />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
