import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usePersistentState } from "@/lib/persistent-state";
import { toast } from "sonner";
import { agentsQuery, memoryQuery, qk } from "@/lib/api/queries";
import { api } from "@/lib/api";
import { PageHeader, Panel } from "@/components/status";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryLayerKey, MemoryScope } from "@/lib/api";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Memory - OpenClaw" },
      { name: "description", content: "Inspect the Markdown memory files each agent reads and writes." },
      { property: "og:title", content: "Memory - OpenClaw" },
      { property: "og:description", content: "Inspect the Markdown memory files each agent reads and writes." },
    ],
  }),
  component: MemoryPage,
});

const scopeCls: Record<MemoryScope, string> = {
  "Agent Memory": "text-info border-info/40",
  "User Memory": "text-success border-success/40",
  "Shared Memory": "text-warning border-warning/40",
  "Session Memory": "text-muted-foreground border-border",
};

const NO_DRAFTS: Record<string, string> = {};

function MemoryPage() {
  const { data: agents } = useQuery(agentsQuery());
  const [agentId, setAgentId] = usePersistentState("memory:agent", "");
  const active = agentId || agents?.[0]?.id || "";
  const { data: files, isLoading, error, refetch } = useQuery({ ...memoryQuery(active), enabled: !!active });
  const [open, setOpen] = usePersistentState("memory:file", "MEMORY.md");
  const file = files?.find((f) => f.name === open) ?? files?.[0];
  const [drafts, setDrafts] = usePersistentState<Record<string, string>>("memory:drafts", NO_DRAFTS);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Unsaved edits are kept per agent/file, so leaving the page does not lose them.
  const draftKey = file ? `${active}/${file.name}` : "";
  const draft = (draftKey ? drafts[draftKey] : undefined) ?? file?.content ?? "";
  const setDraft = (value: string) => {
    if (!draftKey) return;
    setDrafts((previous) => {
      const { [draftKey]: _removed, ...rest } = previous;
      return value === file?.content ? rest : { ...rest, [draftKey]: value };
    });
  };

  async function saveMemory() {
    if (!active || !file || !["MEMORY.md", "USER.md"].includes(file.name)) return;
    const layer: MemoryLayerKey = file.name === "USER.md" ? "user" : "agent";
    setSaving(true);
    try {
      const updated = await api.memory.update(active, layer, draft);
      queryClient.setQueryData(qk.memory(active), updated);
      setDrafts((previous) => {
        const { [draftKey]: _saved, ...rest } = previous;
        return rest;
      });
      toast.success(`${file.name} saved`);
    } catch (saveError) {
      toast.error("Could not save memory", { description: (saveError as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Memory"
        description="Markdown memory is the agents' long-term state. Nothing here is hidden from you."
        actions={
          <div className="flex flex-wrap gap-1">
            {agents?.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgentId(a.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  a.id === active ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {a.short}
              </button>
            ))}
          </div>
        }
      />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Panel title="Files">
            <ul className="divide-y">
              {files?.map((f) => (
                <li key={f.name}>
                  <button
                    onClick={() => setOpen(f.name)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left transition-colors hover:bg-accent/40",
                      f.name === file?.name && "bg-accent/60",
                    )}
                  >
                    <span className="font-mono text-xs">{f.name}</span>
                    <span className={`ml-2 rounded border px-1 py-0.5 text-[10px] ${scopeCls[f.scope]}`}>{f.scope}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">updated {f.updated}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title={file?.name ?? "-"}
            action={
              file && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{file.scope}</span>
                  {(["MEMORY.md", "USER.md"].includes(file.name)) && (
                    <Button size="sm" onClick={saveMemory} disabled={saving || draft === file.content}>
                      {saving ? "Saving…" : "Save"}
                    </Button>
                  )}
                </div>
              )
            }
          >
            {file && ["MEMORY.md", "USER.md"].includes(file.name) ? (
              <Textarea
                aria-label={`Edit ${file.name}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={22}
                className="min-h-112 resize-y rounded-none border-0 font-mono text-xs leading-relaxed shadow-none focus-visible:ring-0"
              />
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 font-mono text-xs leading-relaxed">
                {file?.content ?? "No memory file selected."}
              </pre>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
