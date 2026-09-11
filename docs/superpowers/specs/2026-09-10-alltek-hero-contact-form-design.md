# AllTek SaaS — Hero Contact Form Design

## Goal
Capture more leads from the public landing page by adding a phone-first contact form to the hero section, responding to review data: 54 reviews mention phone calls, zero mention the existing form.

## Where
`src/pages/Home.jsx` hero section.

## UX
- Keep the existing headline, badge, and service CTA.
- Add a compact lead-capture card beside or below the hero copy (follow current glass-panel styling).
- Form fields (max 3 visible):
  1. Name
  2. Phone (required)
  3. Message / what they need help with (optional)
- Email is omitted from the hero form to reduce friction; phone is the required field because that matches the review signal.
- Primary action button copy: "Request a Callback".
- Click-to-call phone number button is visually primary and at least as prominent as the form, especially on mobile.
- Success state: short confirmation message and a prompt to call if urgent.

## Data Model
New Supabase table: `leads`
- `id` uuid primary key default gen_random_uuid()
- `name` text
- `phone` text not null
- `message` text
- `source` text default 'hero'
- `created_at` timestamptz default now()
- `status` text default 'new'
- Hidden honeypot field `website` (or similar) on the form to catch spam.

## Security
- Anonymous role gets INSERT only on `leads`, no SELECT/UPDATE/DELETE.
- RLS policy: `anon` can insert when `auth.role() = 'anon'`.
- Rate limit: one insert per phone number per 5 minutes using a simple check (or edge-function guard).
- Honeypot field must be empty; submissions with it filled are rejected.

## Notification
- Supabase insert trigger / edge function sends an instant email to AllTek on each new lead.
- v1 uses email; SMS can be added later.
- Notification includes name, phone, message, timestamp, and source.

## Out of Scope
- Dashboard UI for viewing leads (can query Supabase directly for now).
- SMS notifications.
- Email confirmation to the lead.

## Success Criteria
- Hero renders the form and click-to-call button on desktop and mobile.
- Anonymous visitor can submit a lead with phone + name.
- AllTek receives an email within seconds of submission.
- Spam/bot submissions are reduced by honeypot + rate limit.
