-- Leads table for anonymous hero-form submissions
-- Insert-only access for anon role, scoped by rate limit.
-- Read/update/delete restricted to admin staff via the existing is_admin() helper.

create table leads (
  id uuid default gen_random_uuid() primary key,
  name text,
  phone text not null,
  message text,
  source text default 'hero' not null,
  status text default 'new' not null,
  created_at timestamptz default now() not null
);

comment on table leads is 'Inbound lead submissions from the public website.';

-- Index to support the rate-limit check quickly.
create index idx_leads_phone_created_at on leads(phone, created_at desc);

alter table leads enable row level security;

-- Rate-limit helper: at most one lead per phone number per 5 minutes.
-- Security definer so the anon insert policy can read the count without
-- needing broader SELECT permissions on the table.
create or replace function public.can_insert_lead(p_phone text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1
    from public.leads
    where phone = p_phone
      and created_at > now() - interval '5 minutes'
  );
$$;

-- Anonymous visitors can insert one lead per phone every 5 minutes.
create policy "Anonymous users can insert leads"
  on leads
  for insert
  to anon
  with check (public.can_insert_lead(phone));

-- Only admins can view leads.
create policy "Admins can read leads"
  on leads
  for select
  to authenticated
  using (public.is_admin());

-- Only admins can update leads.
create policy "Admins can update leads"
  on leads
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete leads.
create policy "Admins can delete leads"
  on leads
  for delete
  to authenticated
  using (public.is_admin());

-- NOTE: Instant email/SMS notification on insert should be wired via a Supabase
-- Database Webhook or Edge Function once an email provider (SendGrid, Postmark,
-- AWS SES, etc.) is chosen. The table is ready to receive leads immediately.
