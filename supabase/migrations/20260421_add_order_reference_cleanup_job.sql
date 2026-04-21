create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_order_reference_cleanup(
  dry_run boolean default true,
  days_old integer default 3
)
returns bigint
language sql
security definer
set search_path = public
as $$
  select net.http_post(
    url := 'https://vfzateaxdsqokcujqnjt.supabase.co/functions/v1/cleanup-order-references',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'bucket', 'order-references',
      'daysOld', days_old,
      'dryRun', dry_run,
      'prefixes', jsonb_build_array(
        'studio-roe/product-originals/',
        'studio-roe/reference-images/'
      )
    )
  );
$$;

do $$
declare
  cleanup_job_id bigint;
begin
  for cleanup_job_id in
    select jobid
    from cron.job
    where jobname = 'cleanup-order-references-after-7-days'
  loop
    perform cron.unschedule(cleanup_job_id);
  end loop;

  perform cron.schedule(
    'cleanup-order-references-after-7-days',
    '0 3 * * *',
    $cron$select public.invoke_order_reference_cleanup(false, 3);$cron$
  );
end
$$;

comment on function public.invoke_order_reference_cleanup(boolean, integer) is
'Manually invoke the cleanup Edge Function for order-references. Pass dry_run := true to preview without deleting.';
