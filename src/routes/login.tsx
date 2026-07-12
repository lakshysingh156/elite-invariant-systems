import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Invariant." },
      { name: "description", content: "Sign in to your Invariant. dashboard." },
    ],
  }),
  component: () => <AuthShell mode="login" />,
});
