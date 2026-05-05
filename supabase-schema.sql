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
