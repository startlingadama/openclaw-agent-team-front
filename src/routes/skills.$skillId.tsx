import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { agentsQuery, skillInstructionsQuery, skillQuery } from "@/lib/api/queries";
import { PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/skills/$skillId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.skillId} - Skill - OpenClaw` },
      { name: "description", content: "Skill definition, files and agent compatibility." },
      { property: "og:title", content: `${params.skillId} - Skill - OpenClaw` },
      { property: "og:description", content: "Skill definition, files and agent compatibility." },
    ],
  }),
  component: SkillPage,
});

const kindCls: Record<string, string> = {
  instruction: "text-info border-info/40",
  script: "text-warning border-warning/40",
  reference: "text-muted-foreground border-border",
  asset: "text-muted-foreground border-border",
};

function SkillPage() {
  const { skillId } = Route.useParams();
  const { data: s, isLoading, error, refetch } = useQuery(skillQuery(skillId));
  const { data: agents } = useQuery(agentsQuery());
  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsQuery = useQuery({
    ...skillInstructionsQuery(skillId),
    enabled: showInstructions,
  });

  if (isLoading) return <LoadingRows />;
  if (error || !s) return <ErrorBox error={error ?? new Error("Skill not found")} onRetry={() => refetch()} />;

  const name = (id: string) => agents?.find((a) => a.id === id)?.name ?? id;

  return (
    <>
      <Link to="/skills" className="text-xs text-muted-foreground hover:text-foreground">← Skills</Link>
      <PageHeader
        title={s.name}
        description={`${s.description}${s.version ? ` · v${s.version}` : ""}`}
        actions={
          <span
            className={
              s.status === "active"
                ? "rounded border border-success/40 px-1.5 py-0.5 font-mono text-[10px] text-success"
                : "rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            }
          >
            {s.status.toUpperCase()}
          </span>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Panel title="Files">
            <ul className="divide-y">
              {s.files.map((f) => (
                <li key={f.path} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] ${kindCls[f.kind]}`}>
                    {f.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.path}</span>
                  <span className="font-mono text-xs text-muted-foreground">{f.size}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="SKILL.md"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInstructions((visible) => !visible)}
              >
                {showInstructions ? "Hide" : "Load instructions"}
              </Button>
            }
          >
            {showInstructions ? (
              instructionsQuery.isLoading ? (
                <LoadingRows rows={2} label="Loading skill instructions" />
              ) : instructionsQuery.error ? (
                <ErrorBox
                  error={instructionsQuery.error}
                  onRetry={() => instructionsQuery.refetch()}
                />
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed">
                  {instructionsQuery.data?.instructions}
                </pre>
              )
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Instructions are loaded on demand so the runtime context stays small.
              </p>
            )}
          </Panel>
        </div>

        <Panel title="Agent compatibility">
          <ul className="divide-y">
            {s.agents.map((id) => (
              <li key={id} className="px-4 py-2.5">
                <Link to="/agents/$agentId" params={{ agentId: id }} className="text-sm hover:underline">
                  {name(id)}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
