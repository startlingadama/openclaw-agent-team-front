import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, Bot, Brain, CheckCircle2, Cpu, FileText, FolderOpen, Home, ListTodo, MessageSquare,
  Play, Search, Settings, Users, Wrench, Sparkles,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { agentsQuery, approvalsQuery, healthQuery, teamsQuery } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Dot } from "@/components/status";
import { useEffect, useState } from "react";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";

type Item = { label: string; icon: React.ElementType; to?: string; params?: Record<string, string>; badge?: number };

const groups: { label?: string; items: Item[] }[] = [
  { items: [{ label: "Overview", icon: Home, to: "/" }] },
  {
    label: "Workspace",
    items: [
      { label: "Chat", icon: MessageSquare, to: "/chat" },
      { label: "Tasks", icon: ListTodo, to: "/tasks" },
      { label: "Approvals", icon: CheckCircle2, to: "/approvals", },
      { label: "Documents", icon: FolderOpen, to: "/documents" },
    ],
  },
  {
    label: "Agents",
    items: [{ label: "All Agents", icon: Bot, to: "/agents" }],
  },
  {
    label: "Teams",
    items: [{ label: "All Teams", icon: Users, to: "/teams" }],
  },
  {
    label: "Resources",
    items: [
      { label: "Skills", icon: Sparkles, to: "/skills" },
      { label: "Tools", icon: Wrench, to: "/tools" },
      { label: "Memory", icon: Brain, to: "/memory" },
    ],
  },
  {
    label: "Observability",
    items: [
      { label: "Activity", icon: Activity, to: "/activity" },
      { label: "Executions", icon: Play, to: "/executions" },
      { label: "Logs", icon: FileText, to: "/logs" },
    ],
  },
];

function AppSidebar() {
  const { data: pending } = useQuery(approvalsQuery());
  const { data: agents } = useQuery(agentsQuery());
  const { data: teams } = useQuery(teamsQuery());
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (i: Item) => {
    if (!i.to) return false;
    const href = i.params?.["agentId"]
      ? `/agents/${i.params["agentId"]}`
      : i.params?.["teamId"]
        ? `/teams/${i.params["teamId"]}`
        : i.to;
    return href === "/" ? path === "/" : path === href || (href !== "/agents" && path.startsWith(href + "/"));
  };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">
            OC
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold leading-none">OpenClaw</p>
            <p className="mt-1 text-xs text-muted-foreground">Agent Team</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g, gi) => (
          <SidebarGroup key={gi} className="py-1">
            {g.label && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {g.items.map((i) => (
                <SidebarMenuItem key={i.label}>
                  {i.to ? (
                    <SidebarMenuButton asChild isActive={isActive(i)} tooltip={i.label}>
                      <Link to={i.to} params={i.params as never}>
                        <i.icon />
                        <span>{i.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled tooltip={`${i.label} · soon`} className="opacity-50">
                      <i.icon />
                      <span>{i.label}</span>
                    </SidebarMenuButton>
                  )}
                  {i.to === "/approvals" && pending?.length ? (
                    <SidebarMenuBadge className="bg-warning/15 text-warning">{pending.length}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
              {g.label === "Agents" &&
                agents?.map((agent) => {
                  const item: Item = {
                    label: agent.short,
                    icon: Cpu,
                    to: "/agents/$agentId",
                    params: { agentId: agent.id },
                  };
                  return (
                    <SidebarMenuItem key={agent.id}>
                      <SidebarMenuButton asChild isActive={isActive(item)} tooltip={agent.short}>
                        <Link to="/agents/$agentId" params={{ agentId: agent.id }}>
                          <Cpu />
                          <span>{agent.short}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              {g.label === "Teams" &&
                teams?.map((team) => {
                  const item: Item = {
                    label: team.name,
                    icon: Users,
                    to: "/teams/$teamId",
                    params: { teamId: team.id },
                  };
                  return (
                    <SidebarMenuItem key={team.id}>
                      <SidebarMenuButton asChild isActive={isActive(item)} tooltip={team.name}>
                        <Link to="/teams/$teamId" params={{ teamId: team.id }}>
                          <Users />
                          <span>{team.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={path === "/settings"} tooltip="Settings">
              <Link to="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function BackendStatus() {
  const { data, isError } = useQuery(healthQuery());
  const [cls, label] = isError
    ? ["bg-destructive", "Backend unreachable"]
    : data
      ? ["bg-success", "Connected"]
      : ["bg-muted-foreground", "Connecting…"];
  return (
    <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
      <Dot className={cls} /> {label}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const initials = (user?.name || user?.email || "?").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div title={user?.email} className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">{initials}</div>
      <button onClick={() => logout()} aria-label="Log out" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" aria-live="assertive" className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-xs text-warning">
      You are offline. Live agent updates are paused until the connection returns.
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <BackendStatus />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Search pages, agents and tasks"
              aria-keyshortcuts="Meta+K Control+K"
              className="flex h-8 items-center gap-2 rounded-md border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:w-64"
            >
              <Search className="size-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Search tasks, agents…</span>
              <kbd className="ml-auto hidden font-mono text-[10px] md:inline">⌘K</kbd>
            </button>
            <UserMenu />
          </div>
        </header>
        <OfflineBanner />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </SidebarInset>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}
