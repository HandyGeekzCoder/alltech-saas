# Database SQL

This folder holds the Supabase schema and RLS fix SQL for AllTech SaaS.

## Run order

1. **`supabase_schema.sql`** — Run first to create tables, enums, triggers, and initial policies.
2. **`supabase_rls_fix.sql`** — Run second to tighten/broaden Row Level Security policies after the schema is in place.

Apply both in the Supabase SQL Editor (or via `psql` against your Supabase project) in the order above.
