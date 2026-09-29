import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePersistentState } from "@/lib/persistent-state";
import { skillsQuery } from "@/lib/api/queries";
import { EmptyState, PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/skills/")({
  head: () => ({
    meta: [
      { title: "Skills - OpenClaw" },
      { name: "description", content: "Agent Skills available to the OpenClaw agent runtime." },
      { property: "og:title", content: "Skills - OpenClaw" },
      { property: "og:description", content: "Agent Skills available to the OpenClaw agent runtime." },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const { data, isLoading, error, refetch } = useQuery(skillsQuery());
  const [q, setQ] = usePersistentState("skills:q", "");
  const list = (data ?? []).filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Skills"
        description="Skill packages the runtime loads on demand. Instructions are only read when a skill is opened."
        actions={
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter skills…"
            aria-label="Filter skills"
            className="h-8 w-56"
          />
        }
      />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : list.length === 0 ? (
        <Panel><EmptyState title="No skills" description="No skill matches this filter." /></Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((s) => (
            <Link
              key={s.id}
              to="/skills/$skillId"
              params={{ skillId: s.id }}
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{s.name}</p>
                <span
                  className={
                    s.status === "active"
                      ? "rounded border border-success/40 px-1.5 py-0.5 font-mono text-[10px] text-success"
                      : "rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  }
                >
                  {s.status.toUpperCase()}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                v{s.version} · {s.files.filter((f) => f.kind === "script").length} scripts ·{" "}
                {s.files.filter((f) => f.kind === "reference").length} references · {s.agents.length} agents
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
