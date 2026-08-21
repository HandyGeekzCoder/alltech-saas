/make-plan Redesign the billing/payment flow and unify UI consistency across AllTek's client portal + admin console (alltech-saas repo). Current design failed audit at 9/30 with a critical gap in principle #2 (Useful) — invoice payment is a stated primary goal and is completely non-functional.

Verdict paragraph:
> Total score 9/30, driven mainly by a payment feature that was never built (not built badly) plus consistency/hygiene debt (three different modal patterns, two different badge patterns, dead files) rather than a fundamentally broken core experience. The client job-request flow and admin job-tracking flow are the most solid parts of the product and should not be touched in this pass.

Why redesign and not refine: principle #2 (Useful) scored 0/3 because the "Pay Invoice" button (src/components/Dashboard/Overview.jsx:36) has no onClick handler and no payment processor exists anywhere in the codebase — the primary financial action a client needs is not directly supported at all.

Preserve from current design (do not touch in this pass):
- Client job request + admin job tracking flow (src/pages/JobRequest.jsx, src/components/Admin/JobManager.jsx core task list/progress logic) — confirmed solid end-to-end.
- The real overlay-modal pattern in src/components/Client/PasswordResetModal.jsx:26-39 (position:fixed, backdrop-filter) — this is the pattern to standardize on, not replace.
- Brand visual language: dark background, gradient CTA buttons, tech-grid motif — keep the identity, just gate the always-on animation with prefers-reduced-motion and stop it running app-wide via App.css:35 (currently pulses everywhere, not just login/marketing).
- Already-fixed auth: real Supabase role-based login (src/AdminContext.jsx:290-322, src/pages/Admin.jsx:16) — do not regress this.

Discard (patterns causing the failures):
- Dead "Pay Invoice" button with no handler. Evidence: Overview.jsx:36. Caused failure on principle #2.
- Hardcoded fake "Estimated completion for next project: 4 Days" string presented as computed data. Evidence: Overview.jsx:47. Caused failure on principle #4 and #6.
- Three parallel confirmation/modal implementations (real modal, inline panel, native alert/confirm). Evidence: JobManager.jsx:844-866, 231, 262 vs. PasswordResetModal.jsx:26-39. Caused failure on principle #3 and #10.
- Two parallel status-badge implementations. Evidence: Overview.jsx:66/Billing.jsx:79 (CSS-class based) vs. JobManager.jsx:704-714 (inline-styled). Caused failure on principle #3.
- Dead repo cruft: src/AdminContext.backup.jsx (hardcoded plaintext passwords, unused), 7 root-level debug-*.js/.cjs scripts, 2 screenshot artifacts, unused imports in Overview.jsx:2. Caused failure on principle #10.

Top 5 moves from the audit (verbatim):
1. Useful (#2): Build real invoice payment (Stripe Checkout or similar) behind Overview.jsx:36's "Pay Invoice" button. Evidence: Overview.jsx:36; also the #1 gap in competitor research (Jobber/Housecall Pro treat this as table-stakes).
2. Honest (#6): Fix or remove fake/dead controls — the hardcoded completion estimate (Overview.jsx:47) and dead "Forgot Password?" link (Login.jsx:85).
3. Aesthetic/simplicity (#3, #10): Unify on one confirmation-modal component (standardize on PasswordResetModal.jsx's pattern) and one shared status-badge component; delete the backup file and debug scripts.
4. Thorough (#8): Add `htmlFor` to every form label (currently zero project-wide) and add visible focus styles for buttons/icon-buttons, not just `.form-control` inputs.
5. Environmentally friendly (#9): Fix the N+1 Supabase query pattern in AdminContext.jsx:77-206 (fetchRemoteData) — 2 extra queries per client + 2 per job, refiring on every login; consolidate into fewer joined queries/RPC calls.

Redesign principles in priority order:
1. Useful (#2) — a client can click "Pay Invoice" and actually complete a payment; no dead financial controls anywhere.
2. Honest (#6) — every visible number/claim maps to real data; no fake-looking static text next to real data.
3. As little design as possible (#10) — one modal pattern, one badge pattern, zero dead files in the repo.

Deliverables for the plan:
- Payment flow: choice of processor (Stripe Checkout recommended — lowest integration lift for a small crew), a Supabase Edge Function or server-side webhook for payment confirmation, updated Overview.jsx/Billing.jsx wiring.
- One shared confirmation-modal component replacing the three current patterns, with usage sites listed.
- One shared status-badge component replacing the two current patterns.
- Cleanup list: delete AdminContext.backup.jsx, debug-*.js/.cjs scripts, unused screenshots/imports.
- Accessibility pass: htmlFor on every label, focus-visible styles on every interactive control, prefers-reduced-motion guard on the CSS animations.
- States checklist confirmed present: empty (already good), loading, error, focus, disabled — for the new payment flow specifically.

Anti-patterns to guard against:
- Porting the dead "Pay Invoice" button's markup/styling under new logic without checking it actually calls the new payment flow.
- Redesigning the job-tracking flow, which is out of scope and already solid — do not touch JobRequest.jsx's core submission logic or JobManager's task-progress calculation.
- Adding a 4th competing modal/badge pattern instead of consolidating to the one named above.
- Treating the Preserve list as optional.

Not in scope for this pass (explicitly out): GPS/fleet tracking, recurring maintenance plans, job-costing reports, e-signatures — lower priority per the competitor research, revisit after payments + notifications ship.
