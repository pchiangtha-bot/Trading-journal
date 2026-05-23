create table if not exists public.journal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_name text not null default 'Cloud profile',
  trades jsonb not null default '[]'::jsonb,
  strategies jsonb not null default '[]'::jsonb,
  custom_pairs jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  client_id text
);

alter table public.journal_profiles enable row level security;

drop policy if exists "Users can read own journal profile" on public.journal_profiles;
create policy "Users can read own journal profile"
on public.journal_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own journal profile" on public.journal_profiles;
create policy "Users can insert own journal profile"
on public.journal_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own journal profile" on public.journal_profiles;
create policy "Users can update own journal profile"
on public.journal_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own journal profile" on public.journal_profiles;
create policy "Users can delete own journal profile"
on public.journal_profiles
for delete
to authenticated
using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'journal_profiles'
  ) then
    alter publication supabase_realtime add table public.journal_profiles;
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'daily-review-evidence',
  'daily-review-evidence',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own daily review evidence" on storage.objects;
create policy "Users can read own daily review evidence"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'daily-review-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload own daily review evidence" on storage.objects;
create policy "Users can upload own daily review evidence"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-review-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own daily review evidence" on storage.objects;
create policy "Users can update own daily review evidence"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'daily-review-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'daily-review-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own daily review evidence" on storage.objects;
create policy "Users can delete own daily review evidence"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'daily-review-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create table if not exists public.mt5_bridge_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'MT5 desktop',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table public.mt5_bridge_tokens enable row level security;

drop policy if exists "Users can manage own MT5 bridge tokens" on public.mt5_bridge_tokens;
create policy "Users can manage own MT5 bridge tokens"
on public.mt5_bridge_tokens
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.mt5_bridge_leases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_key text not null,
  broker_account text,
  broker_server text,
  leader_device_id text not null,
  leader_label text,
  last_heartbeat_at timestamptz not null default now(),
  lease_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, account_key)
);

alter table public.mt5_bridge_leases enable row level security;

drop policy if exists "Users can manage own MT5 bridge leases" on public.mt5_bridge_leases;
create policy "Users can manage own MT5 bridge leases"
on public.mt5_bridge_leases
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.mt5_detected_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  broker_account text,
  broker_server text,
  symbol text not null,
  direction text not null,
  opened_at timestamptz,
  closed_at timestamptz,
  lot_size numeric,
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  profit numeric,
  commission numeric,
  swap numeric,
  status text not null default 'new' check (status in ('new', 'recorded', 'ignored')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_id)
);

alter table public.mt5_detected_orders enable row level security;

drop policy if exists "Users can read own MT5 detected orders" on public.mt5_detected_orders;
create policy "Users can read own MT5 detected orders"
on public.mt5_detected_orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own MT5 detected orders" on public.mt5_detected_orders;
create policy "Users can update own MT5 detected orders"
on public.mt5_detected_orders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mt5_detected_orders'
  ) then
    alter publication supabase_realtime add table public.mt5_detected_orders;
  end if;
end
$$;


create table if not exists public.mt5_history_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_by text,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  picked_up_at timestamptz,
  completed_at timestamptz,
  order_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mt5_history_requests enable row level security;

drop policy if exists "Users can manage own MT5 history requests" on public.mt5_history_requests;
create policy "Users can manage own MT5 history requests"
on public.mt5_history_requests
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mt5_history_requests'
  ) then
    alter publication supabase_realtime add table public.mt5_history_requests;
  end if;
end
$$;
