import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in - OpenClaw" },
      { name: "description", content: "Sign in to your OpenClaw agent workspace." },
      { property: "og:title", content: "Sign in - OpenClaw" },
      { property: "og:description", content: "Sign in to your OpenClaw agent workspace." },
    ],
  }),
  component: () => <AuthForm mode="login" redirect={Route.useSearch().redirect} />,
});
