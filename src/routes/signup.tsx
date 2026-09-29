import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account - OpenClaw" },
      { name: "description", content: "Create an account for the OpenClaw agent workspace." },
      { property: "og:title", content: "Create account - OpenClaw" },
      { property: "og:description", content: "Create an account for the OpenClaw agent workspace." },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});
