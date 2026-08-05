ALTER TABLE public.apis ADD COLUMN IF NOT EXISTS github_repo text;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS github_pr_url text;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS github_pr_number integer;