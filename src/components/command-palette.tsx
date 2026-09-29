// Phase 5: global keyboard navigation (Cmd/Ctrl-K) across pages, agents and tasks.
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot, Brain, CheckCircle2, FolderOpen, Home, ListTodo, MessageSquare, Play, Settings, Sparkles, Users, Wrench } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { agentsQuery, tasksQuery } from "@/lib/api/queries";

const pages = [
  { label: "Overview", icon: Home, to: "/" },
  { label: "Chat", icon: MessageSquare, to: "/chat" },
  { label: "Tasks", icon: ListTodo, to: "/tasks" },
  { label: "Approvals", icon: CheckCircle2, to: "/approvals" },
  { label: "Documents", icon: FolderOpen, to: "/documents" },
  { label: "Agents", icon: Bot, to: "/agents" },
  { label: "Teams", icon: Users, to: "/teams" },
  { label: "Skills", icon: Sparkles, to: "/skills" },
  { label: "Tools", icon: Wrench, to: "/tools" },
  { label: "Memory", icon: Brain, to: "/memory" },
  { label: "Executions", icon: Play, to: "/executions" },
  { label: "Settings", icon: Settings, to: "/settings" },
] as const;

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { data: agents } = useQuery({ ...agentsQuery(), enabled: open });
  const { data: tasks } = useQuery({ ...tasksQuery(), enabled: open });

  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Search pages, agents and tasks">
      <CommandInput placeholder="Search pages, agents, tasks…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.to} value={`page ${p.label}`} onSelect={() => go(() => navigate({ to: p.to }))}>
              <p.icon className="size-4" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {agents?.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Agents">
              {agents.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`agent ${a.name} ${a.id}`}
                  onSelect={() => go(() => navigate({ to: "/agents/$agentId", params: { agentId: a.id } }))}
                >
                  <Bot className="size-4" />
                  <span>{a.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        {tasks?.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.slice(0, 20).map((t) => (
                <CommandItem
                  key={t.id}
                  value={`task ${t.title} ${t.id}`}
                  onSelect={() => go(() => navigate({ to: "/tasks/$taskId", params: { taskId: t.id } }))}
                >
                  <ListTodo className="size-4" />
                  <span className="truncate">{t.title}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{t.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
