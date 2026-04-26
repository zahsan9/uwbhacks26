begin;

delete from public.nudges;
delete from public.friendships;
delete from public.habit_logs;
delete from public.habits;
delete from public.users;

commit;
