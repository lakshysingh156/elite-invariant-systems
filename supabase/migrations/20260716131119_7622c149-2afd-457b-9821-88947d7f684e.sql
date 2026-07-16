
-- ============ Enums ============
CREATE TYPE public.org_role AS ENUM ('owner','admin','member');
CREATE TYPE public.api_kind AS ENUM ('internal','third-party');
CREATE TYPE public.api_status AS ENUM ('stable','drifting','breaking','analyzing');
CREATE TYPE public.change_severity AS ENUM ('breaking','risky','safe');
CREATE TYPE public.change_kind AS ENUM ('added','removed','modified');
CREATE TYPE public.incident_severity AS ENUM ('critical','high','medium','low');
CREATE TYPE public.incident_status AS ENUM ('detected','analyzing','identified','mitigating','resolved');

-- ============ Organizations & Membership ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helper: is caller a member of org?
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = _org_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = _org_id AND user_id = _user_id AND role IN ('owner','admin')
  );
$$;

CREATE POLICY "org members can view org" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()));
CREATE POLICY "any authed can create org" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners update org" ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners delete org" ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "members view membership" ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(org_id, auth.uid()));
CREATE POLICY "admins manage membership" ON public.organization_members FOR ALL TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()))
  WITH CHECK (public.is_org_admin(org_id, auth.uid()));

-- Auto-create org + membership on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_org_id uuid;
  base_slug text;
  final_slug text;
  n int := 0;
BEGIN
  base_slug := regexp_replace(lower(coalesce(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1), 'workspace')), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'workspace'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    n := n + 1;
    final_slug := base_slug || '-' || n::text;
  END LOOP;

  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (coalesce(NEW.raw_user_meta_data->>'org_name', initcap(base_slug)), final_slug, NEW.id)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ APIs ============
CREATE TABLE public.apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_url text NOT NULL,
  kind public.api_kind NOT NULL DEFAULT 'internal',
  tags text[] NOT NULL DEFAULT '{}',
  owning_team text,
  monitor_interval text NOT NULL DEFAULT '15m',
  status public.api_status NOT NULL DEFAULT 'stable',
  genome int NOT NULL DEFAULT 100,
  current_version_id uuid,
  last_checked timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apis_org_idx ON public.apis(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apis TO authenticated;
GRANT ALL ON public.apis TO service_role;
ALTER TABLE public.apis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read apis" ON public.apis FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members write apis" ON public.apis FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

-- ============ API Versions ============
CREATE TABLE public.api_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  version text NOT NULL,
  spec jsonb NOT NULL,
  source text NOT NULL DEFAULT 'upload',
  endpoint_count int NOT NULL DEFAULT 0,
  change_count int NOT NULL DEFAULT 0,
  breaking_count int NOT NULL DEFAULT 0,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_versions_api_idx ON public.api_versions(api_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_versions TO authenticated;
GRANT ALL ON public.api_versions TO service_role;
ALTER TABLE public.api_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read versions" ON public.api_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())));
CREATE POLICY "members write versions" ON public.api_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())));

ALTER TABLE public.apis
  ADD CONSTRAINT apis_current_version_fk FOREIGN KEY (current_version_id) REFERENCES public.api_versions(id) ON DELETE SET NULL;

-- ============ Endpoints ============
CREATE TABLE public.endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.api_versions(id) ON DELETE CASCADE,
  api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  method text NOT NULL,
  path text NOT NULL,
  operation_id text,
  spec jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX endpoints_version_idx ON public.endpoints(version_id);
CREATE INDEX endpoints_api_idx ON public.endpoints(api_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.endpoints TO authenticated;
GRANT ALL ON public.endpoints TO service_role;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read endpoints" ON public.endpoints FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())));
CREATE POLICY "members write endpoints" ON public.endpoints FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())));

-- ============ Contract Changes ============
CREATE TABLE public.contract_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  from_version_id uuid REFERENCES public.api_versions(id) ON DELETE SET NULL,
  to_version_id uuid NOT NULL REFERENCES public.api_versions(id) ON DELETE CASCADE,
  severity public.change_severity NOT NULL,
  kind public.change_kind NOT NULL,
  endpoint_path text,
  method text,
  target text NOT NULL,
  summary text NOT NULL,
  before_snippet text,
  after_snippet text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX changes_api_idx ON public.contract_changes(api_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_changes TO authenticated;
GRANT ALL ON public.contract_changes TO service_role;
ALTER TABLE public.contract_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read changes" ON public.contract_changes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())));
CREATE POLICY "members write changes" ON public.contract_changes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.apis a WHERE a.id = api_id AND public.is_org_member(a.org_id, auth.uid())));

-- ============ Dependencies (service -> api endpoint) ============
CREATE TABLE public.dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_service text NOT NULL,
  target_api_id uuid NOT NULL REFERENCES public.apis(id) ON DELETE CASCADE,
  endpoint_path text,
  method text,
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX deps_org_idx ON public.dependencies(org_id);
CREATE INDEX deps_target_idx ON public.dependencies(target_api_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dependencies TO authenticated;
GRANT ALL ON public.dependencies TO service_role;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read deps" ON public.dependencies FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members write deps" ON public.dependencies FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

-- ============ Incidents ============
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_id uuid REFERENCES public.apis(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  status public.incident_status NOT NULL DEFAULT 'detected',
  summary text,
  root_cause text,
  assignee text,
  affected_services int NOT NULL DEFAULT 0,
  affected_endpoints int NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX incidents_org_idx ON public.incidents(org_id, opened_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read incidents" ON public.incidents FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members write incidents" ON public.incidents FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE TABLE public.incident_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  label text NOT NULL,
  detail text
);
CREATE INDEX incident_events_incident_idx ON public.incident_events(incident_id, at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_events TO authenticated;
GRANT ALL ON public.incident_events TO service_role;
ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read incident events" ON public.incident_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND public.is_org_member(i.org_id, auth.uid())));
CREATE POLICY "members write incident events" ON public.incident_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND public.is_org_member(i.org_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND public.is_org_member(i.org_id, auth.uid())));

-- ============ Copilot Chat ============
CREATE TABLE public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  citations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX copilot_thread_idx ON public.copilot_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copilot_messages TO authenticated;
GRANT ALL ON public.copilot_messages TO service_role;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read copilot" ON public.copilot_messages FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members write copilot" ON public.copilot_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()) AND user_id = auth.uid());

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER apis_updated BEFORE UPDATE ON public.apis
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER incidents_updated BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
