create extension if not exists pgcrypto;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_email text not null,
  service_type text not null default 'onsu',
  client_password_hash text,
  title text,
  author text,
  genre text,
  style_direction text,
  package text,
  mood_keywords text,
  color_keywords text,
  reference_url text,
  deadline date,
  status text not null default '접수',
  admin_note text,
  comments jsonb not null default '[]'::jsonb
);

create table if not exists public.preview_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  url text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists requests_created_at_idx
on public.requests (created_at desc);

create index if not exists requests_status_created_at_idx
on public.requests (status, created_at desc);

create index if not exists requests_service_type_created_at_idx
on public.requests (service_type, created_at desc);

create index if not exists preview_images_request_uploaded_at_idx
on public.preview_images (request_id, uploaded_at desc);

alter table public.requests add column if not exists client_password_hash text;
alter table public.requests add column if not exists service_type text not null default 'onsu';

alter table public.requests enable row level security;
alter table public.preview_images enable row level security;

drop policy if exists "public requests read" on public.requests;
drop policy if exists "public requests write" on public.requests;
drop policy if exists "public requests update" on public.requests;
drop policy if exists "public requests delete" on public.requests;

drop policy if exists "public preview_images read" on public.preview_images;
drop policy if exists "public preview_images write" on public.preview_images;
drop policy if exists "public preview_images delete" on public.preview_images;

insert into storage.buckets (id, name, public)
values ('order-references', 'order-references', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('previews', 'previews', true)
on conflict (id) do nothing;

drop policy if exists "public order-references access" on storage.objects;
create policy "public order-references access"
on storage.objects
for all
to anon
using (bucket_id = 'order-references')
with check (bucket_id = 'order-references');

drop policy if exists "public previews access" on storage.objects;
create policy "public previews access"
on storage.objects
for select
to anon
using (bucket_id = 'previews');


