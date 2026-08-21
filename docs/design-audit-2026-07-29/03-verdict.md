# Verdict

**REDESIGN** (of the billing/payment flow and cross-app consistency) — total score 9/30, with principle #2 (Useful) scoring 0 because the invoice-payment flow, a stated primary goal of the product, does not function at all.

Important nuance the raw score hides: the two most-used parts of the app — client job requests and admin job tracking — are the most solid parts of the product per the standing project audit, and this audit's own evidence backs that (only 1 dead interactive element on the whole Overview screen, no dark patterns, security already fixed). The low score is driven by (a) a payment feature that was never built, not a payment feature that was built badly, and (b) consistency/hygiene debt (three different modal patterns, two different badge patterns, dead files) rather than a fundamentally broken experience. This is not "start over" territory for the whole app — it's REDESIGN for one missing flow plus a consistency pass everywhere else.

**Top 5 highest-leverage moves:**

1. **#2 Useful — Build real invoice payment.** The "Pay Invoice" button (Overview.jsx:36) needs an actual Stripe Checkout or similar flow behind it. This single fix removes the #2 score of 0 and is also the top feature gap from the market research.
2. **#6 Honest — Fix or remove fake/dead controls.** Wire up or delete: the hardcoded "Estimated completion: 4 Days" text (Overview.jsx:47), the dead "Forgot Password?" link (Login.jsx:85).
3. **#3/#10 Aesthetic & simplicity — Unify the confirmation pattern.** Pick one modal/confirm approach (the real overlay modal already built in PasswordResetModal.jsx is the best candidate) and replace the inline panel (JobManager.jsx:844-866) and native alert()/confirm() calls (JobManager.jsx:231,262) with it. Do the same for status badges — one shared `.status-badge` component, not two implementations.
4. **#8 Thorough — Add focus states and htmlFor labels.** Zero `htmlFor` attributes exist anywhere; add them across Login, AdminLogin, PasswordResetModal, and JobManager forms. Add a visible focus-style rule for buttons and icon-buttons, not just `.form-control` inputs.
5. **#9 Environmentally friendly — Fix the N+1 query pattern.** AdminContext.jsx's fetchRemoteData fires 2 extra queries per client and 2 per job, refiring on every login — batch these (e.g. a single joined query or Supabase RPC) before client count grows.

**After those:** the next feature to add, per the competitor research, is automated SMS/email notifications (job status + invoice reminders), then a visual scheduling/dispatch calendar.
