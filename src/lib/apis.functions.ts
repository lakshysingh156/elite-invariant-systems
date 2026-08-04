// Server functions for the API reliability engine.
// Client-safe module — imports of *.server.ts happen inside handler bodies only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function currentOrgId(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("org_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No workspace found for user. Sign out and sign back in to bootstrap one.");
  return data.org_id as string;
}

export const getCurrentWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await currentOrgId(context.supabase, context.userId);
    const { data: org, error } = await context.supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .eq("id", orgId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return org;
  });

export const listApis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await currentOrgId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("apis")
      .select("id, name, base_url, spec_url, kind, tags, owning_team, monitor_interval, status, genome, current_version_id, last_checked, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        baseUrl: z.string().url(),
        specUrl: z.string().url().max(500).optional().nullable(),
        kind: z.enum(["internal", "third-party"]).default("internal"),
        owningTeam: z.string().max(80).optional(),
        monitorInterval: z.enum(["5m", "15m", "1h", "6h", "24h"]).default("15m"),
        tags: z.array(z.string().max(40)).max(20).default([]),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const orgId = await currentOrgId(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("apis")
      .insert({
        org_id: orgId,
        name: data.name,
        base_url: data.baseUrl,
        spec_url: data.specUrl || null,
        kind: data.kind,
        owning_team: data.owningTeam ?? null,
        monitor_interval: data.monitorInterval,
        tags: data.tags,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const getApiDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ apiId: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { data: api, error } = await context.supabase
      .from("apis")
      .select("*")
      .eq("id", data.apiId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!api) return null;

    const [versionsRes, changesRes, endpointsRes] = await Promise.all([
      context.supabase
        .from("api_versions")
        .select("id, version, source, endpoint_count, change_count, breaking_count, is_current, created_at")
        .eq("api_id", data.apiId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("contract_changes")
        .select("id, severity, kind, endpoint_path, method, target, summary, before_snippet, after_snippet, created_at")
        .eq("api_id", data.apiId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("endpoints")
        .select("id, method, path, operation_id")
        .eq("api_id", data.apiId)
        .eq("version_id", api.current_version_id ?? "00000000-0000-0000-0000-000000000000")
        .order("path"),
    ]);

    return {
      api,
      versions: versionsRes.data ?? [],
      changes: changesRes.data ?? [],
      endpoints: endpointsRes.data ?? [],
    };
  });

/**
 * Real spec-versioning flow backed by the semantic diff engine in ./openapi-diff.
 * Diffs the incoming spec against the current version, persists the new version,
 * its endpoints, and the classified contract changes, then rescores the API.
 */
export const submitSpecVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        apiId: z.string().uuid(),
        specText: z.string().min(2).max(5_000_000),
        versionLabel: z.string().max(80).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { applySpecDiff } = await import("./apply-spec-diff.server");
    return applySpecDiff(context.supabase, data.apiId, data.specText, data.versionLabel, "upload");
  });

/** Update the mutable settings of an API (currently the live spec URL). */
export const updateApiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        apiId: z.string().uuid(),
        specUrl: z.string().url().max(500).nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("apis")
      .update({ spec_url: data.specUrl })
      .eq("id", data.apiId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

