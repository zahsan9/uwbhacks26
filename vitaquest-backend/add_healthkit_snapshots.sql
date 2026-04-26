create table if not exists public.healthkit_snapshots (
  email                    text primary key,
  steps_today              integer not null default 0,
  sleep_hours_last_night   numeric(5,2) not null default 0,
  synced_at                timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.healthkit_snapshots enable row level security;

drop policy if exists "healthkit_snapshots: public demo access" on public.healthkit_snapshots;
create policy "healthkit_snapshots: public demo access" on public.healthkit_snapshots
  for all using (true) with check (true);
