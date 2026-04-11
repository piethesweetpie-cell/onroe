alter table public.requests
add column if not exists service_type text not null default 'onsu';

create index if not exists requests_service_type_created_at_idx
on public.requests (service_type, created_at desc);
