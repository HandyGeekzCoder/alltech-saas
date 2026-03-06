-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  company text not null,
  email text not null,
  is_temporary_password boolean default true,
  role text default 'client'
);

-- JOBS
create table jobs (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  status text not null default 'Pending Review',
  progress numeric default 0,
  date text not null,
  meta jsonb
);

-- TASKS
create table tasks (
  id text primary key,
  job_id text references jobs(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  weight numeric
);

-- LINE ITEMS
create table line_items (
  id text primary key,
  job_id text references jobs(id) on delete cascade not null,
  description text not null,
  amount numeric not null,
  date_added text not null
);

-- CATALOG
create table catalog (
  id text primary key,
  description text not null,
  default_price numeric not null
);

-- SITE DATA
create table site_data (
  id uuid default uuid_generate_v4() primary key,
  section text not null,
  key text not null,
  value text not null,
  unique(section, key)
);

-- Insert default site data
insert into site_data (section, key, value) values
('hero', 'badge', 'Next-Gen IT Infrastructure'),
('hero', 'titleMain', 'Empowering Your Business with'),
('hero', 'titleGradient', 'Intelligent Technology'),
('hero', 'description', 'AllTech delivers professional IT solutions. From advanced network architectures to high-end surveillance and full AV integration, we engineer environments built for the future.'),
('hero', 'primaryButton', 'Explore Services'),
('hero', 'secondaryButton', 'Client Dashboard');

-- Turn on Row Level Security
alter table profiles enable row level security;
alter table jobs enable row level security;
alter table tasks enable row level security;
alter table line_items enable row level security;
alter table catalog enable row level security;
alter table site_data enable row level security;

-- Policies (We will refine these for security later, but for migration we allow full access to authenticated users)
create policy "Enable full access for authenticated users" on profiles for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on jobs for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on tasks for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on line_items for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on catalog for all to authenticated using (true) with check (true);
create policy "Enable full access for anon/authenticated users" on site_data for all to public using (true) with check (true);

-- TASK CATALOG
create table task_catalog (
  id text primary key,
  description text not null,
  default_weight numeric
);

alter table task_catalog enable row level security;
create policy "Enable full access for authenticated users" on task_catalog for all to authenticated using (true) with check (true);
