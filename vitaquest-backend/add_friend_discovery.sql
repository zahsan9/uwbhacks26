alter table public.users
add column if not exists email text;

create unique index if not exists users_email_unique_idx
on public.users (email)
where email is not null;

drop policy if exists "users: searchable rows" on public.users;
create policy "users: searchable rows" on public.users
  for select using (auth.role() = 'authenticated');

drop policy if exists "habits: accepted friends read" on public.habits;
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

drop policy if exists "habit_logs: accepted friends read" on public.habit_logs;
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
