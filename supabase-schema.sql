-- The Cellar: Wine Collection Database Schema

create extension if not exists "uuid-ossp";

create table if not exists wines (
  id uuid primary key default uuid_generate_v4(),
  vintage integer not null,
  producer text not null,
  name text,
  grape text,
  region text,
  country text,
  type text default 'Red',
  vineyard text,
  abv decimal,
  drink_from integer,
  drink_by integer,
  rating integer check (rating >= 1 and rating <= 5),
  score text,
  tasting_notes text,
  general_notes text,
  food_pairings text,
  storage_location text,
  purchase_location text,
  quantity integer default 1,
  volume text default '750mL',
  price decimal,
  currency text default 'AUD',
  label_image_url text,
  ai_enriched boolean default false,
  is_wishlist boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_wines_updated_at
  before update on wines
  for each row execute function update_updated_at_column();

-- Permissive RLS for Phase 1 (single user)
alter table wines enable row level security;
create policy "Allow all" on wines for all using (true) with check (true);

-- Storage bucket for label images
insert into storage.buckets (id, name, public)
values ('labels', 'labels', true)
on conflict (id) do nothing;

create policy "Allow public read" on storage.objects
  for select using (bucket_id = 'labels');
create policy "Allow authenticated upload" on storage.objects
  for insert with check (bucket_id = 'labels');
create policy "Allow authenticated delete" on storage.objects
  for delete using (bucket_id = 'labels');
