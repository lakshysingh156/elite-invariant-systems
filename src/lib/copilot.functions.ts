// AI Copilot server functions.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function currentOrgId(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error("No workspace");
  return data.org_id as string;
}

export const listCopilotThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ threadId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("copilot_messages")
      .select("id, role, content, citations, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        question: z.string().min(1).max(4000),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { chatCompletion } = await import("./ai-gateway.server");
    const orgId = await currentOrgId(context.supabase, context.userId);

    // Persist the user turn
    await context.supabase.from("copilot_messages").insert({
      org_id: orgId,
      user_id: context.userId,
      thread_id: data.threadId,
      role: "user",
      content: data.question,
    });

    // Load workspace context: recent APIs, breaking changes, open incidents.
    const [apisRes, changesRes, incidentsRes, prevTurnsRes] = await Promise.all([
      context.supabase
        .from("apis")
        .select("name, base_url, status, genome, current_version_id")
        .eq("org_id", orgId)
        .order("updated_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("contract_changes")
        .select("severity, kind, target, summary, created_at, api_id")
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase
        .from("incidents")
        .select("code, title, severity, status, summary, opened_at")
        .eq("org_id", orgId)
        .neq("status", "resolved")
        .order("opened_at", { ascending: false })
        .limit(10),
      context.supabase
        .from("copilot_messages")
        .select("role, content")
        .eq("thread_id", data.threadId)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

    const workspaceSnapshot = {
      apis: apisRes.data ?? [],
      recent_changes: changesRes.data ?? [],
      open_incidents: incidentsRes.data ?? [],
    };

    const systemPrompt = [
      "You are Invariant Copilot — the reliability engineer for this workspace's API surface.",
      "You have ground-truth data below. Reason ONLY from it; never invent APIs, endpoints, or incidents.",
      "Answer in short, direct paragraphs. When you cite something, name the API and the change or incident.",
      "If the workspace has no relevant data, say so and suggest what to upload (OpenAPI specs, connect a repo, etc).",
      "",
      "WORKSPACE SNAPSHOT (JSON):",
      JSON.stringify(workspaceSnapshot, null, 2),
    ].join("\n");

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...((prevTurnsRes.data ?? []).map((t) => ({
        role: t.role as "user" | "assistant",
        content: t.content,
      }))),
    ];

    let answer: string;
    try {
      answer = await chatCompletion({ messages });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      answer = `I couldn't reach the reasoning engine: ${msg}`;
    }

    const citations = [
      ...(changesRes.data ?? []).slice(0, 3).map((c) => ({
        kind: "change" as const,
        label: c.target,
        ref: c.severity,
      })),
      ...(incidentsRes.data ?? []).slice(0, 2).map((i) => ({
        kind: "incident" as const,
        label: `${i.code} · ${i.title}`,
        ref: i.severity,
      })),
    ];

    await context.supabase.from("copilot_messages").insert({
      org_id: orgId,
      user_id: context.userId,
      thread_id: data.threadId,
      role: "assistant",
      content: answer,
      citations,
    });

    return { answer, citations };
  });
