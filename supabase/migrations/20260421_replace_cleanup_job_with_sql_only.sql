create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_order_reference_cleanup(
  dry_run boolean default true,
  days_old integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff_ts timestamptz := now() - make_interval(days => days_old);
  base_public_url text := 'https://vfzateaxdsqokcujqnjt.supabase.co/storage/v1/object/public/order-references/';
  delete_base_url text := 'https://vfzateaxdsqokcujqnjt.supabase.co/storage/v1/object/order-references/';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmemF0ZWF4ZHNxb2tjdWpxbmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTUxOTAsImV4cCI6MjA5MDUzMTE5MH0.JSjiuR8H7li67vwFI1-mTx9gNvKOQSLsi7j1-rQOdyA';
  deleted_count integer := 0;
  request_id bigint;
  target_path text;
  delete_headers jsonb := jsonb_build_object(
    'Authorization', 'Bearer ' || anon_key,
    'apikey', anon_key
  );
begin
  create temporary table if not exists tmp_cleanup_paths (
    path text primary key
  ) on commit drop;

  truncate tmp_cleanup_paths;

  with referenced_paths as (
    select distinct
      replace(replace(regexp_replace(match_url, '\?.*$', ''), base_public_url, ''), '%2F', '/') as path
    from public.requests r
    cross join lateral regexp_matches(coalesce(r.reference_url, ''), 'https?://[^\s]+', 'g') as match(match_url)
    where r.service_type = 'studio_roe'
      and r.created_at < cutoff_ts
      and match_url like base_public_url || '%'
  )
  insert into tmp_cleanup_paths(path)
  select path
  from referenced_paths
  where path like 'studio-roe/product-originals/%'
     or path like 'studio-roe/reference-images/%'
  on conflict do nothing;

  with active_paths as (
    select distinct
      replace(replace(regexp_replace(match_url, '\?.*$', ''), base_public_url, ''), '%2F', '/') as path
    from public.requests r
    cross join lateral regexp_matches(coalesce(r.reference_url, ''), 'https?://[^\s]+', 'g') as match(match_url)
    where r.service_type = 'studio_roe'
      and r.created_at >= cutoff_ts
      and match_url like base_public_url || '%'
  ),
  orphan_paths as (
    select distinct o.name as path
    from storage.objects o
    where o.bucket_id = 'order-references'
      and o.created_at < cutoff_ts
      and (
        o.name like 'studio-roe/product-originals/%'
        or o.name like 'studio-roe/reference-images/%'
      )
      and not exists (
        select 1
        from active_paths a
        where a.path = o.name
      )
  )
  insert into tmp_cleanup_paths(path)
  select path
  from orphan_paths
  on conflict do nothing;

  if dry_run then
    return jsonb_build_object(
      'dry_run', true,
      'days_old', days_old,
      'cutoff', cutoff_ts,
      'delete_count', (select count(*) from tmp_cleanup_paths),
      'paths', (
        select coalesce(jsonb_agg(path order by path), '[]'::jsonb)
        from (select path from tmp_cleanup_paths order by path limit 100) q
      )
    );
  end if;

  for target_path in
    select path
    from tmp_cleanup_paths
    order by path
  loop
    select net.http_delete(
      url := delete_base_url || replace(target_path, '/', '%2F'),
      headers := delete_headers
    )
    into request_id;

    deleted_count := deleted_count + 1;
  end loop;

  return jsonb_build_object(
    'dry_run', false,
    'days_old', days_old,
    'cutoff', cutoff_ts,
    'delete_count', deleted_count
  );
end;
$$;

do $$
declare
  cleanup_job_id bigint;
begin
  for cleanup_job_id in
    select jobid
    from cron.job
    where jobname = 'cleanup-order-references-after-3-days'
  loop
    perform cron.unschedule(cleanup_job_id);
  end loop;

  perform cron.schedule(
    'cleanup-order-references-after-3-days',
    '0 3 * * *',
    $cron$select public.invoke_order_reference_cleanup(false, 3);$cron$
  );
end
$$;

comment on function public.invoke_order_reference_cleanup(boolean, integer) is
'SQL-only cleanup for order-references bucket. Deletes studio_roe uploads older than the retention window via Storage API.';
