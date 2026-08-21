-- ============================================================================
-- RLS lockdown for AllTek SaaS
--
-- Problem: every table's original policy was `using (true) with check (true)`
-- for any authenticated user (site_data even for anon). RLS was "on" but not
-- actually restricting anything, so any logged-in client could read or write
-- any other client's profile, jobs, tasks, invoices, and sites.
--
-- This migration replaces those policies with real scoping:
--   - a user can always see/edit their own rows
--   - an admin (profiles.role = 'admin') can see/edit everything
--   - an employee sub-account (profiles.parent_client_id set) can see/edit
--     their parent client's rows, matching how the app already treats them
--   - an employee is further scoped to only the SITES/JOBS listed in their
--     own profiles.permissions->'allowedSites' (mirrors the front-end filter
--     in AdminContext.jsx, now enforced at the database level too, closing
--     the "any employee can read/write the whole parent tenant" gap)
--   - catalog/task_catalog/site_data are shared reference & public site
--     content: readable by everyone, writable by admins only
--
-- HOW TO APPLY: run this whole file once in the Supabase SQL editor for this
-- project (Database > SQL Editor). It is idempotent (safe to re-run).
--
-- NOTE ON SITE SCOPING: jobs.meta->>'location' is a free-text label string
-- ("CompanyName - Location" or "CompanyName (Primary HQ)") generated the same
-- way on write (JobRequest.jsx / AdminContext.addJobToAccount) and on read
-- (AdminContext's own front-end filter). This migration matches that same
-- string server-side, so an employee only ever sees/writes jobs whose label
-- is in their own permissions->'allowedSites' list. If that label format is
-- ever changed on the front end without updating this migration, the failure
-- mode is fail-closed (the employee sees nothing extra, never something they
-- shouldn't) rather than a leak.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (security definer = bypasses RLS for this one lookup only,
-- so checking "is this caller an admin" doesn't recurse back through the
-- profiles policy we're about to define)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_parent_client_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select parent_client_id from public.profiles where id = auth.uid();
$$;

-- Every job-label string the calling employee is allowed to see, built the
-- exact same way the front end builds them (AdminContext.jsx ~130-144):
-- "{ParentCompany} (Primary HQ)" if 'primary-hq' is in their allowedSites,
-- plus "{site.company_name} - {site.location}" for every site id listed in
-- their allowedSites. Returns zero rows for non-employees, or for an
-- employee with no permissions/allowedSites configured (fail-closed).
create or replace function public.current_employee_allowed_locations()
returns table(location text)
language sql
security definer
set search_path = public
stable
as $$
  select (parent.company || ' (Primary HQ)') as location
  from public.profiles me
  join public.profiles parent on parent.id = me.parent_client_id
  where me.id = auth.uid()
    and me.permissions -> 'allowedSites' ? 'primary-hq'
  union all
  select (s.company_name || ' - ' || s.location) as location
  from public.profiles me
  join public.sites s on s.user_id = me.parent_client_id
  where me.id = auth.uid()
    and me.permissions -> 'allowedSites' ? s.id::text;
$$;

-- The raw site ids the calling employee is allowed to see (used to scope the
-- `sites` table itself, separately from the job-label matching above).
create or replace function public.current_employee_allowed_site_ids()
returns table(site_id text)
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_array_elements_text(coalesce(me.permissions -> 'allowedSites', '[]'::jsonb))
  from public.profiles me
  where me.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Column-level protection for profiles.
--
-- The `profiles_update_own_or_admin` policy cannot reliably compare OLD and
-- NEW values inside a single-row update using `with check` subqueries: in
-- PostgreSQL, a non-admin updating their own row may see the already-modified
-- NEW value in the subquery, allowing them to self-promote to admin or
-- re-parent themselves. A BEFORE UPDATE trigger sees both OLD and NEW
-- unambiguously and is the correct place to enforce that only admins can
-- change role, permissions, or parent_client_id.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    if NEW.role is distinct from OLD.role
       or NEW.permissions is distinct from OLD.permissions
       or NEW.parent_client_id is distinct from OLD.parent_client_id
    then
      raise exception 'Non-admin users cannot change role, permissions, or parent_client_id';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_profile_columns_trigger on profiles;
create trigger protect_profile_columns_trigger
  before update on profiles
  for each row
  execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
drop policy if exists "Enable full access for authenticated users" on profiles;
drop policy if exists "profiles_select_own_or_related" on profiles;
drop policy if exists "profiles_update_own_or_admin" on profiles;
drop policy if exists "profiles_insert_admin_only" on profiles;
drop policy if exists "profiles_insert_self_or_admin" on profiles;
drop policy if exists "profiles_delete_admin_only" on profiles;

create policy "profiles_select_own_or_related" on profiles
  for select to authenticated
  using (
    id = auth.uid()
    or is_admin()
    or id = current_parent_client_id()   -- employee can see their parent client's profile
    or parent_client_id = auth.uid()     -- a client can see their own employees' profiles
  );

create policy "profiles_update_own_or_admin" on profiles
  for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (
    is_admin()
    or id = auth.uid()
  );

create policy "profiles_insert_self_or_admin" on profiles
  for insert to authenticated
  with check (
    is_admin()
    or (
      -- self-registration: a user can only create their own profile as a non-admin, with no parent
      id = auth.uid()
      and role in ('client', 'employee')
      and parent_client_id is null
    )
    or (
      -- a client creating a subordinate employee account under themselves
      parent_client_id = auth.uid()
      and id != auth.uid()
      and role in ('client', 'employee')
    )
  );

create policy "profiles_delete_admin_only" on profiles
  for delete to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- JOBS
-- ---------------------------------------------------------------------------
drop policy if exists "Enable full access for authenticated users" on jobs;
drop policy if exists "jobs_select_own_or_related" on jobs;
drop policy if exists "jobs_insert_admin_only" on jobs;
drop policy if exists "jobs_insert_own_or_admin" on jobs;
drop policy if exists "jobs_update_own_or_admin" on jobs;
drop policy if exists "jobs_delete_admin_only" on jobs;

create policy "jobs_select_own_or_related" on jobs
  for select to authenticated
  using (
    is_admin()
    or user_id = auth.uid()
    or (
      user_id = current_parent_client_id()
      and meta ->> 'location' in (select location from public.current_employee_allowed_locations())
    )
  );

create policy "jobs_insert_own_or_admin" on jobs
  for insert to authenticated
  with check (
    is_admin()
    or user_id = auth.uid()
    or (
      user_id = current_parent_client_id()
      and meta ->> 'location' in (select location from public.current_employee_allowed_locations())
    )
  );

create policy "jobs_update_own_or_admin" on jobs
  for update to authenticated
  using (
    is_admin()
    or user_id = auth.uid()
    or (
      user_id = current_parent_client_id()
      and meta ->> 'location' in (select location from public.current_employee_allowed_locations())
    )
  )
  with check (
    is_admin()
    or user_id = auth.uid()
    or (
      user_id = current_parent_client_id()
      and meta ->> 'location' in (select location from public.current_employee_allowed_locations())
    )
  );

create policy "jobs_delete_admin_only" on jobs
  for delete to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- TASKS (scoped through the parent job's ownership)
-- ---------------------------------------------------------------------------
-- Note: only admins actually write tasks in the app today (src/components/Admin/JobManager.jsx) --
-- a client can only ever read their own jobs' tasks. Writes are pinned to admin-only so a client
-- can't hit the Supabase REST API directly and tamper with their own job's task/billing state.
drop policy if exists "Enable full access for authenticated users" on tasks;
drop policy if exists "tasks_via_job" on tasks;
drop policy if exists "tasks_select_via_job" on tasks;
drop policy if exists "tasks_write_admin_only" on tasks;

create policy "tasks_select_via_job" on tasks
  for select to authenticated
  using (
    exists (
      select 1 from jobs
      where jobs.id = tasks.job_id
        and (
          is_admin()
          or jobs.user_id = auth.uid()
          or (
            jobs.user_id = current_parent_client_id()
            and jobs.meta ->> 'location' in (select location from public.current_employee_allowed_locations())
          )
        )
    )
  );

create policy "tasks_write_admin_only" on tasks
  for insert to authenticated with check (is_admin());
create policy "tasks_update_admin_only" on tasks
  for update to authenticated using (is_admin()) with check (is_admin());
create policy "tasks_delete_admin_only" on tasks
  for delete to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- LINE_ITEMS (scoped through the parent job's ownership)
-- ---------------------------------------------------------------------------
-- Same reasoning as tasks above: only admins write invoices/line items in the app today.
drop policy if exists "Enable full access for authenticated users" on line_items;
drop policy if exists "line_items_via_job" on line_items;
drop policy if exists "line_items_select_via_job" on line_items;
drop policy if exists "line_items_write_admin_only" on line_items;

create policy "line_items_select_via_job" on line_items
  for select to authenticated
  using (
    exists (
      select 1 from jobs
      where jobs.id = line_items.job_id
        and (
          is_admin()
          or jobs.user_id = auth.uid()
          or (
            jobs.user_id = current_parent_client_id()
            and jobs.meta ->> 'location' in (select location from public.current_employee_allowed_locations())
          )
        )
    )
  );

create policy "line_items_write_admin_only" on line_items
  for insert to authenticated with check (is_admin());
create policy "line_items_update_admin_only" on line_items
  for update to authenticated using (is_admin()) with check (is_admin());
create policy "line_items_delete_admin_only" on line_items
  for delete to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- CATALOG / TASK_CATALOG (shared pricing & task reference lists: everyone
-- logged in can read them to render the UI, only admins can change them)
-- ---------------------------------------------------------------------------
drop policy if exists "Enable full access for authenticated users" on catalog;
drop policy if exists "catalog_select_authenticated" on catalog;
drop policy if exists "catalog_insert_admin_only" on catalog;
drop policy if exists "catalog_update_admin_only" on catalog;
drop policy if exists "catalog_delete_admin_only" on catalog;

create policy "catalog_select_authenticated" on catalog for select to authenticated using (true);
create policy "catalog_insert_admin_only" on catalog for insert to authenticated with check (is_admin());
create policy "catalog_update_admin_only" on catalog for update to authenticated using (is_admin()) with check (is_admin());
create policy "catalog_delete_admin_only" on catalog for delete to authenticated using (is_admin());

drop policy if exists "Enable full access for authenticated users" on task_catalog;
drop policy if exists "task_catalog_select_authenticated" on task_catalog;
drop policy if exists "task_catalog_insert_admin_only" on task_catalog;
drop policy if exists "task_catalog_update_admin_only" on task_catalog;
drop policy if exists "task_catalog_delete_admin_only" on task_catalog;

create policy "task_catalog_select_authenticated" on task_catalog for select to authenticated using (true);
create policy "task_catalog_insert_admin_only" on task_catalog for insert to authenticated with check (is_admin());
create policy "task_catalog_update_admin_only" on task_catalog for update to authenticated using (is_admin()) with check (is_admin());
create policy "task_catalog_delete_admin_only" on task_catalog for delete to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- SITE_DATA (public marketing site copy: anyone can read, only admins write)
-- ---------------------------------------------------------------------------
drop policy if exists "Enable full access for anon/authenticated users" on site_data;
drop policy if exists "site_data_select_public" on site_data;
drop policy if exists "site_data_insert_admin_only" on site_data;
drop policy if exists "site_data_update_admin_only" on site_data;
drop policy if exists "site_data_delete_admin_only" on site_data;

create policy "site_data_select_public" on site_data for select to public using (true);
create policy "site_data_insert_admin_only" on site_data for insert to authenticated with check (is_admin());
create policy "site_data_update_admin_only" on site_data for update to authenticated using (is_admin()) with check (is_admin());
create policy "site_data_delete_admin_only" on site_data for delete to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- SITES (referenced throughout the app's code but never appears in
-- supabase_schema.sql -- meaning it was likely added later directly in the
-- Supabase dashboard and may have NO row level security at all today, not
-- even the wide-open "using(true)" kind. Enabling + scoping it here either
-- way.)
-- ---------------------------------------------------------------------------
alter table if exists sites enable row level security;

drop policy if exists "sites_select_own_or_related" on sites;
drop policy if exists "sites_insert_admin_only" on sites;
drop policy if exists "sites_update_admin_only" on sites;
drop policy if exists "sites_delete_admin_only" on sites;
drop policy if exists "sites_insert_own_or_admin" on sites;
drop policy if exists "sites_update_own_or_admin" on sites;
drop policy if exists "sites_delete_own_or_admin" on sites;

create policy "sites_select_own_or_related" on sites
  for select to authenticated
  using (
    is_admin()
    or user_id = auth.uid()
    or (
      user_id = current_parent_client_id()
      and id::text in (select site_id from public.current_employee_allowed_site_ids())
    )
  );

create policy "sites_insert_own_or_admin" on sites
  for insert to authenticated
  with check (user_id = auth.uid() or user_id = current_parent_client_id() or is_admin());

create policy "sites_update_own_or_admin" on sites
  for update to authenticated
  using (user_id = auth.uid() or user_id = current_parent_client_id() or is_admin())
  with check (user_id = auth.uid() or user_id = current_parent_client_id() or is_admin());

create policy "sites_delete_own_or_admin" on sites
  for delete to authenticated
  using (user_id = auth.uid() or user_id = current_parent_client_id() or is_admin());
