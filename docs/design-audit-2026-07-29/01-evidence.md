# Evidence

## Visual (screenshots — Login.jsx, AdminLogin.jsx; all else INFERRED from CSS)
- Dark background, animated grid + glow effects (`index.css:210-286`, five `@keyframes`), gradient CTA buttons (blue→cyan on client login, magenta→purple on admin login — two different gradient identities for what is structurally the same control).
- Type: large bold display heading ("Client Portal" / "Admin Portal"), muted subhead, form labels, all legible, good contrast on dark bg.
- Logo icon has an infinite pulse-glow animation (`App.css:35`) — not scoped to login, applies app-wide per CSS class use.

## Structural
- Client Overview (`Overview.jsx`): 1 interactive element total — the "Pay Invoice" button (line 36), which has **no onClick handler**.
- JobManager.jsx (admin): ~32+ static interactive elements (9 selects, 10 inputs, 1 textarea, ~12 buttons) before any data rows render; nesting depth ~9 levels at its deepest (line 524-541).
- Status badges implemented two different ways: CSS-class based (`Overview.jsx:66`, `Billing.jsx:79`) vs. fully inline-styled with different colors/markup (`JobManager.jsx:704-714`).
- Confirmation/modal pattern implemented three different ways: a real fixed-overlay modal (`PasswordResetModal.jsx:26-39`), an inline non-overlay panel (`JobManager.jsx:844-866`), and native browser `alert()`/`confirm()` (`JobManager.jsx:231,262`).
- Dead code: `AdminContext.backup.jsx` (hardcoded plaintext passwords, superseded duplicate, still committed), 7 root-level debug scripts, 2 screenshot artifacts at repo root, unused imports (`Overview.jsx:2` imports `Clock`/`CheckCircle`, neither used).

## Weight & Friction
- Dependencies are lean; `lucide-react` imported per-icon (tree-shakeable), no CSS framework, no animation library — animation is hand-rolled CSS.
- Multiple always-running CSS animations (`gridMove`, `pulseGlow`, `float`) — idle motion present outside login too, no `prefers-reduced-motion` guard found.
- **N+1 query pattern confirmed** in `AdminContext.jsx:77-206` `fetchRemoteData`: 4 base queries + 2 queries per client profile + 2 queries per job, all fired on initial load **and again after every login()** call. Scales badly as the client/job count grows — a real latency and Supabase-cost problem down the line, not just a code-smell.

## Accessibility
- Zero `htmlFor` on any `<label>` project-wide (verified by grep) — every form (Login, AdminLogin, PasswordResetModal, JobManager) relies on visual proximity only, not programmatic label association.
- No `<div onClick>` anti-pattern found — all click handlers are on real `<button>`/`<a>` elements, so keyboard reachability is intact.
- Landmarks present but thin: 3× `<main>`, 3× `<nav>`, 1× `<header>`, `<aside>` used for sidebars. Zero `role=` attributes anywhere.
- Only one focus-style rule in the whole app (`Login.css:60`, `.form-control:focus`) — none for buttons, nav links, or JobManager's many inline-styled icon buttons.
- Status indicators are color + text (not color-only) in the cases checked — no pure color-only violations found.

## Copy & Honesty
- "Restricted access. Authorized IT personnel only." (`AdminLogin.jsx:41`) is now genuinely backed by real role-based auth (`AdminContext.jsx:290-322`, `Admin.jsx:16`) — the old hardcoded Admin/Admin logic only survives in the unused `.backup.jsx` file, confirming the 2026-07-28/29 security fix is real and not just cosmetic.
- **"Pay Invoice" button is still completely dead** (`Overview.jsx:36`) — no onClick, no payment processor anywhere in the codebase. This is the single biggest label→behavior mismatch: it promises the one financial action clients need, and does nothing.
- `Overview.jsx:47` — "Estimated completion for next project: 4 Days" is a **hardcoded static string**, not computed from any job data, but presented next to real job data as if it were.
- "Forgot Password?" (`Login.jsx:85`) is a dead `href="#"` link.
- Generic marketing language on the public landing page ("Next-Gen IT Infrastructure," "Enterprise-grade implementation") — low-severity, expected for a marketing page, not deceptive.
- No dark patterns found (no pre-checked boxes, no forced continuity, no confirmshaming).
- Minor jargon ("Provision Master Client Account," "Sites Allowed" count) is admin-only, seen only by the business owner, not clients — low severity.

## Feature-gap research (vs. Jobber / Housecall Pro / ServiceTitan / Kickserv / mHelpDesk)
AllTek has: client login, job requests, job tracking with progress, manual/view-only invoicing, multi-site/employee sub-accounts.
AllTek is missing, in priority order: **(1) online payment processing** (the dead button is the tell), **(2) automated SMS/email notifications** (job status, invoice reminders), **(3) a visual scheduling/dispatch calendar**. Also missing: GPS/fleet tracking, recurring maintenance plans, job-costing reports, e-signatures — lower priority for a 1-5 person crew right now.
