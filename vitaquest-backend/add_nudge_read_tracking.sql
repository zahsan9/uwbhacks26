alter table public.nudges
add column if not exists read_at timestamptz;
