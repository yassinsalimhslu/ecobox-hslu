
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reference data
create table public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null
);
alter table public.stations enable row level security;
create policy "stations public read" on public.stations for select using (true);

create table public.lockers (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  code text not null
);
alter table public.lockers enable row level security;
create policy "lockers public read" on public.lockers for select using (true);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text
);
alter table public.farms enable row level security;
create policy "farms public read" on public.farms for select using (true);

create type public.box_type as enum ('vegan','veggie','meat');
create type public.box_size as enum ('small','medium','large');

create table public.boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.box_type not null,
  size public.box_size not null,
  price_chf numeric(6,2) not null,
  description text,
  farm_id uuid references public.farms(id)
);
alter table public.boxes enable row level security;
create policy "boxes public read" on public.boxes for select using (true);

create table public.box_contents (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  item_name text not null,
  quantity text
);
alter table public.box_contents enable row level security;
create policy "box_contents public read" on public.box_contents for select using (true);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  box_id uuid not null references public.boxes(id),
  station_id uuid not null references public.stations(id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "own subs select" on public.subscriptions for select using (auth.uid() = user_id);
create policy "own subs insert" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "own subs update" on public.subscriptions for update using (auth.uid() = user_id);

-- Pickups
create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  locker_id uuid references public.lockers(id),
  pickup_date date not null,
  status text not null default 'scheduled',
  qr_code text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);
alter table public.pickups enable row level security;
create policy "own pickups select" on public.pickups for select using (auth.uid() = user_id);
create policy "own pickups insert" on public.pickups for insert with check (auth.uid() = user_id);
create policy "own pickups update" on public.pickups for update using (auth.uid() = user_id);

-- Donations
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references public.pickups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.donations enable row level security;
create policy "own donations select" on public.donations for select using (auth.uid() = user_id);
create policy "own donations insert" on public.donations for insert with check (auth.uid() = user_id);

-- Seed data
insert into public.farms (name, region) values
  ('Hofgut Bärnegg','Bern'),('Mattenhof','Zürich'),('Domaine du Lac','Vaud');

insert into public.stations (name, city) values
  ('Zürich HB','Zürich'),('Bern','Bern'),('Lausanne','Lausanne'),('Basel SBB','Basel');

insert into public.lockers (station_id, code)
select id, 'L-' || upper(substr(md5(random()::text),1,4)) from public.stations;

insert into public.boxes (name, type, size, price_chf, description, farm_id) values
  ('Garden Vegan Small','vegan','small',24.00,'A light vegan harvest of seasonal greens.', (select id from public.farms limit 1)),
  ('Garden Vegan Medium','vegan','medium',34.00,'Plant-based weekly essentials.', (select id from public.farms limit 1)),
  ('Garden Vegan Large','vegan','large',44.00,'Family vegan box.', (select id from public.farms limit 1)),
  ('Veggie Classic Small','veggie','small',26.00,'Vegetables, eggs and cheese.', (select id from public.farms offset 1 limit 1)),
  ('Veggie Classic Medium','veggie','medium',36.00,'Vegetarian variety for two.', (select id from public.farms offset 1 limit 1)),
  ('Veggie Classic Large','veggie','large',48.00,'Vegetarian family box.', (select id from public.farms offset 1 limit 1)),
  ('Alpine Meat Small','meat','small',38.00,'Veg + Swiss farm meat.', (select id from public.farms offset 2 limit 1)),
  ('Alpine Meat Medium','meat','medium',54.00,'Veg + cuts from local farms.', (select id from public.farms offset 2 limit 1)),
  ('Alpine Meat Large','meat','large',72.00,'Family meat & veg box.', (select id from public.farms offset 2 limit 1));
