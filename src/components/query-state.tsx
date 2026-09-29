import { AlertTriangle, Loader2, ShieldAlert, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";

export function LoadingRows({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function LoadingCards({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function InlineSpinner({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}

/** Maps an error to a user-facing title/description (spec §27 error states). */
function describe(error: Error): { title: string; detail: string; icon: typeof AlertTriangle } {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 0)
    return {
      title: "Unable to connect to OpenClaw backend.",
      detail: "The backend did not respond. Check the backend URL in Settings, then retry.",
      icon: WifiOff,
    };
  if (status === 401)
    return { title: "Your session expired.", detail: "Sign in again to continue.", icon: ShieldAlert };
  if (status === 403)
    return {
      title: "Permission denied.",
      detail: "Your account is not allowed to perform this action. The backend enforces this policy.",
      icon: ShieldAlert,
    };
  if (status === 404) return { title: "Not found.", detail: error.message, icon: AlertTriangle };
  return { title: "Something went wrong.", detail: error.message, icon: AlertTriangle };
}

export function ErrorBox({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const { title, detail, icon: Icon } = describe(error);
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-destructive">{title}</p>
        <p className="mt-0.5 break-words text-muted-foreground">{detail}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
