import { useEffect, type ComponentType, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const PUBLIC = ["/login", "/signup"];

export function AuthGate({ shell: Shell, children }: { shell: ComponentType<{ children: ReactNode }>; children: ReactNode }) {
  const { user, ready } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isPublic = PUBLIC.includes(path);

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) navigate({ to: "/login", search: { redirect: path } });
    if (user && isPublic) navigate({ to: "/" });
  }, [ready, user, isPublic, path, navigate]);

  if (isPublic) return <>{children}</>;
  if (!ready || !user)
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex min-h-screen flex-col items-center justify-center gap-3 px-4"
      >
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  return <Shell>{children}</Shell>;
}
