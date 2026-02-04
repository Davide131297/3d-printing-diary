-- Create a table for user profiles (settings)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  currency text default 'EUR' check (currency in ('EUR', 'USD')),
  price_ct_kwh numeric default null,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a table for Printers
create table public.printers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  model text not null, -- 'Bambu Lab X1C', 'P1P', 'A1', etc.
  image_url text, -- We can store a preset image URL here
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.printers enable row level security;

create policy "Users can view own printers." on public.printers
  for select using (auth.uid() = user_id);

create policy "Users can insert own printers." on public.printers
  for insert with check (auth.uid() = user_id);

create policy "Users can update own printers." on public.printers
  for update using (auth.uid() = user_id);
  
create policy "Users can delete own printers." on public.printers
  for delete using (auth.uid() = user_id);


-- Create a table for Filaments
create table public.filaments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  manufacturer text,
  material text, -- PLA, PETG, ABS, etc.
  color text, -- store as hex code or name
  price numeric(10, 2),
  currency text default 'EUR',
  weight_g integer, -- e.g. 1000g
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.filaments enable row level security;

create policy "Users can view own filaments." on public.filaments
  for select using (auth.uid() = user_id);

create policy "Users can insert own filaments." on public.filaments
  for insert with check (auth.uid() = user_id);

create policy "Users can update own filaments." on public.filaments
  for update using (auth.uid() = user_id);
  
create policy "Users can delete own filaments." on public.filaments
  for delete using (auth.uid() = user_id);


-- Create a table for Prints (Diary Entries)
create table public.prints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  printer_id uuid references public.printers,
  
  title text not null,
  model_name text,
  makerworld_link text,
  
  print_time_minutes integer,
  power_consumption_w integer, -- Power consumption in Watts
  status text default 'completed', -- 'completed', 'failed', 'printing'
  
  notes text,
  image_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prints enable row level security;

create policy "Users can view own prints." on public.prints
  for select using (auth.uid() = user_id);

create policy "Users can insert own prints." on public.prints
  for insert with check (auth.uid() = user_id);

create policy "Users can update own prints." on public.prints
  for update using (auth.uid() = user_id);
  
create policy "Users can delete own prints." on public.prints
  for delete using (auth.uid() = user_id);

-- Junction table for Filaments used in a Print
create table public.print_filaments (
    id uuid default gen_random_uuid() primary key,
    print_id uuid references public.prints on delete cascade not null,
    filament_id uuid references public.filaments on delete cascade not null,
    amount_used_g integer -- grams used
);

alter table public.print_filaments enable row level security;

create policy "Users can view own print filaments." on public.print_filaments
  for select using (
    exists ( select 1 from public.prints where id = print_filaments.print_id and user_id = auth.uid() )
  );

create policy "Users can insert own print filaments." on public.print_filaments
  for insert with check (
    exists ( select 1 from public.prints where id = print_id and user_id = auth.uid() )
  );
  
-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- [NEW] Function to allow users to delete their own account
create or replace function public.delete_user()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
