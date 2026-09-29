import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export function AuthForm({ mode, redirect }: { mode: "login" | "signup"; redirect?: string | undefined }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password, name || undefined);
      navigate({ to: redirect && redirect.startsWith("/") ? redirect : "/" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-card p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">OC</div>
          <div>
            <p className="text-sm font-semibold leading-none">OpenClaw</p>
            <p className="mt-1 text-xs text-muted-foreground">{mode === "login" ? "Sign in to your workspace" : "Create your account"}</p>
          </div>
        </div>
        {mode === "signup" && (
          <div className="mb-3 space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
        )}
        <div className="mb-3 space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} autoComplete="email" />
        </div>
        <div className="mb-4 space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={mode === "signup" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
        {error && <p role="alert" className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>No account? <Link to="/signup" className="text-foreground underline">Sign up</Link></>
          ) : (
            <>Already registered? <Link to="/login" className="text-foreground underline">Sign in</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
