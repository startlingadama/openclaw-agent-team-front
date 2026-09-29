import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { agentsQuery, useCreateTask } from "@/lib/api/queries";

export function NewTaskDialog({ defaultAgent }: { defaultAgent?: string }) {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState(defaultAgent ?? "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const { data: agents } = useQuery(agentsQuery());
  const create = useCreateTask();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent || !title.trim()) return;
    const t = await create.mutateAsync({ agent_id: agent, title: title.trim(), instructions: instructions.trim() || undefined });
    toast.success("Task submitted", { description: t.title });
    setOpen(false);
    setTitle("");
    setInstructions("");
    navigate({ to: "/tasks/$taskId", params: { taskId: t.id } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4" /> New task</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
          <div className="my-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Agent</Label>
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger>
                <SelectContent>
                  {agents?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Analyze repository architecture" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-ins">Instructions</Label>
              <Textarea id="t-ins" rows={4} maxLength={4000} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!agent || !title.trim() || create.isPending}>{create.isPending ? "Submitting…" : "Submit task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
