create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('monitor-apis-every-5m') where exists (select 1 from cron.job where jobname = 'monitor-apis-every-5m');

select cron.schedule(
  'monitor-apis-every-5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url:='https://project--9ae59306-b9cb-4dc7-93cd-6909ef876ca8-dev.lovable.app/api/public/hooks/monitor-apis',
    headers:=jsonb_build_object('Content-Type','application/json','x-monitor-secret','b061a8f58552ae12cb4a2f8d126c993caaeaef6bb17acb0b'),
    body:='{}'::jsonb
  ) as request_id;
  $$
);