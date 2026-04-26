-- VitaQuest Database Schema
-- Paste this into the Supabase SQL Editor and click Run.

-- Users
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  google_id    text unique,
  email        text unique,
  username     text not null,
  avatar_id    integer not null default 1,
  total_xp     integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Habits
create table public.habits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  name            text not null,
  description     text,
  tier            integer not null default 1,
  category        text,
  is_healthkit    boolean not null default false,
  healthkit_type  text,
  habit_id_key    text not null,
  created_at      timestamptz not null default now()
);

-- Habit logs
create table public.habit_logs (
  id           uuid primary key default gen_random_uuid(),
  habit_id     uuid not null references public.habits(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  verified_by  text not null check (verified_by in ('photo', 'manual', 'healthkit')),
  confidence   integer not null default 0,
  xp_awarded   integer not null default 0
);

-- Friendships
create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.users(id) on delete cascade,
  addressee_id  uuid not null references public.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- Nudges
create table public.nudges (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.users(id) on delete cascade,
  receiver_id  uuid not null references public.users(id) on delete cascade,
  sent_at      timestamptz not null default now(),
  read_at      timestamptz
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.users        enable row level security;
alter table public.habits       enable row level security;
alter table public.habit_logs   enable row level security;
alter table public.friendships  enable row level security;
alter table public.nudges       enable row level security;

-- users: own row only
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

-- users: searchable by authenticated users for discovery
create policy "users: searchable rows" on public.users
  for select using (auth.role() = 'authenticated');

-- habits: own rows only
create policy "habits: own rows" on public.habits
  for all using (auth.uid() = user_id);

-- habits: readable for accepted friends
create policy "habits: accepted friends read" on public.habits
  for select using (
    auth.uid() = user_id or exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = user_id) or
          (f.addressee_id = auth.uid() and f.requester_id = user_id)
        )
    )
  );

-- habit_logs: own rows only
create policy "habit_logs: own rows" on public.habit_logs
  for all using (auth.uid() = user_id);

-- habit_logs: readable for accepted friends
create policy "habit_logs: accepted friends read" on public.habit_logs
  for select using (
    auth.uid() = user_id or exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = user_id) or
          (f.addressee_id = auth.uid() and f.requester_id = user_id)
        )
    )
  );

-- friendships: readable by both parties
create policy "friendships: own rows" on public.friendships
  for all using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- nudges: own sent/received
create policy "nudges: own rows" on public.nudges
  for all using (auth.uid() = sender_id or auth.uid() = receiver_id);
