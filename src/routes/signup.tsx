import { createFileRoute } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Get started — Invariant." },
      {
        name: "description",
        content: "Create your Invariant. workspace and start watching your APIs.",
      },
    ],
  }),
  component: () => <AuthShell mode="signup" />,
});
