# Scope — AllTek SaaS Design Audit (2026-07-29)

**Audited:** alltech-saas repo at /Users/joshuasantos/.juno/workspace/projects/alltech-saas — client portal + admin console (React 19 + Vite + Supabase). No live/deployed instance found (dormant since March, no Netlify state locally) — audited via static code read plus two existing screenshots (login-test.png = client Login, admin-test.png = Admin Portal login). All other screens are code-inferred, not screenshotted (marked INFERRED in evidence).

**Primary users:**
1. Clients of AllTek (small businesses) — request IT jobs, track progress, view/pay invoices.
2. The business owner (admin) — tracks jobs/tasks, bills clients, manages client & employee accounts.

**Primary task:** client requests a job → admin tracks it to completion → client views and pays the invoice. (Per standing project memory, this is 1 of 4 stated goals; job request/tracking are solid, billing is view-only with no working payment.)

**Constraints:** Existing React/Vite/Supabase stack stays as-is (no framework swap in scope). Small team (effectively solo dev + Josh). Security remediation (hardcoded creds, RLS, route guards) was already done 2026-07-28/29 — this audit is design/UX only, not a re-check of security.

**Reference competitors used for feature research:** Jobber, Housecall Pro, ServiceTitan, Kickserv, mHelpDesk — small-crew field-service management tools, not enterprise-scale.
