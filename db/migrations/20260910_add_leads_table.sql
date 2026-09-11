-- Leads table for anonymous hero-form submissions
-- Insert-only access for anon role; no SELECT/UPDATE/DELETE to keep prior data private.

create table leads (
  id uuid default gen_random_uuid() primary key,
  name text,
  phone text not null,
  message text,
  source text default 'hero' not null,
  status text default 'new' not null,
  created_at timestamptz default now() not null
);

-- Rate-limit helper: prevent rapid re-submission from the same phone
comment on table leads is 'Inbound lead submissions from the public website.';
create index idx_leads_phone_created_at on leads(phone, created_at desc);

alter table leads enable row level security;

-- Anonymous visitors can only insert. No read/update/delete.
create policy "Anonymous users can insert leads"
  on leads
  for insert
  to anon
  with check (true);

-- Authenticated users (AllTek staff) can read and manage leads
create policy "Authenticated users can read leads"
  on leads
  for select
  to authenticated
  using (true);

create policy "Authenticated users can update leads"
  on leads
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete leads"
  on leads
  for delete
  to authenticated
  using (true);

-- NOTE: Instant email/SMS notification on insert should be wired via a Supabase
-- Database Webhook or Edge Function once an email provider (SendGrid, Postmark,
-- AWS SES, etc.) is chosen. The table is ready to receive leads immediately.
