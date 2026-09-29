import { cn } from "@/lib/utils";
import type { Permission, TaskStatus } from "@/lib/api/types";

const taskMap: Record<TaskStatus, { label: string; cls: string; pulse?: boolean | undefined }> = {
  queued: { label: "Queued", cls: "text-muted-foreground bg-muted" },
  running: { label: "Running", cls: "text-info bg-info/10", pulse: true },
  waiting_approval: { label: "Waiting approval", cls: "text-warning bg-warning/10" },
  completed: { label: "Completed", cls: "text-success bg-success/10" },
  failed: { label: "Failed", cls: "text-destructive bg-destructive/10" },
  cancelled: { label: "Cancelled", cls: "text-muted-foreground bg-muted" },
};

export function Dot({ className, pulse }: { className?: string; pulse?: boolean | undefined }) {
  return (
    <span className="relative inline-flex size-2">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", className)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", className)} />
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = taskMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", s.cls)}>
      <Dot className="bg-current" pulse={s.pulse} />
      {s.label}
    </span>
  );
}

export function AgentStatus({ status }: { status: "online" | "busy" | "offline" }) {
  const m = {
    online: { l: "Online", c: "bg-success", t: "text-success" },
    busy: { l: "Running", c: "bg-info", t: "text-info" },
    offline: { l: "Offline", c: "bg-muted-foreground", t: "text-muted-foreground" },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", m.t)}>
      <Dot className={m.c} pulse={status === "busy"} />
      {m.l}
    </span>
  );
}

const permCls: Record<Permission, string> = {
  READ: "text-muted-foreground border-border",
  PREPARE: "text-info border-info/40",
  WRITE: "text-warning border-warning/40",
  "EXTERNAL ACTION": "text-destructive border-destructive/40",
  "APPROVAL REQUIRED": "text-destructive border-destructive/40",
};

export function PermissionBadge({ level }: { level: Permission }) {
  return (
    <span className={cn("inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide", permCls[level])}>
      {level}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
