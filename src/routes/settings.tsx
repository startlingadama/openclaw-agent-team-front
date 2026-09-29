import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getBaseUrl, setBaseUrl } from "@/lib/api/client";
import { PageHeader, Panel } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings - OpenClaw" },
      { name: "description", content: "Configure the backend connection." },
      { property: "og:title", content: "Settings - OpenClaw" },
      { property: "og:description", content: "Configure the backend connection." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(getBaseUrl()), []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (v && !/^https?:\/\/[^\s]+$/.test(v)) { toast.error("Enter a valid http(s) URL"); return; }
    setBaseUrl(v || null);
    await qc.invalidateQueries();
    try {
      const h = await api.health();
      toast.success("Backend reachable", { description: h.status });
    } catch (err) {
      toast.error("Backend not reachable", { description: (err as Error).message });
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Connection to the Python agent runtime." />
      <Panel title="Backend">
        <form onSubmit={save} className="space-y-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="api">API base URL</Label>
            <Input id="api" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://127.0.0.1:8000" />
            <p className="text-xs text-muted-foreground">Requests go to &lt;URL&gt;/api/…. Leaving this empty restores the local backend default. The initial value comes from VITE_API_BASE_URL.</p>
          </div>
          <Button type="submit" size="sm">Save & test</Button>
        </form>
      </Panel>
    </>
  );
}
