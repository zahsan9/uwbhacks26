-- Add photo_url column to habit_logs
alter table public.habit_logs add column if not exists photo_url text;

-- Create the storage bucket for habit photos
insert into storage.buckets (id, name, public)
values ('habit-photos', 'habit-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "users can upload habit photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'habit-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (so photo URLs work without auth headers)
create policy "habit photos are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'habit-photos');
