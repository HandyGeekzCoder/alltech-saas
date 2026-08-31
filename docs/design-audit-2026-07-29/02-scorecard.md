# Scorecard

1. Innovative — Score: 1/3
   Evidence: standard client-portal + admin-dashboard SaaS shape, no novel pattern (01-evidence.md, Structural/Visual).
   Justification: refreshes nothing distinctive, but doesn't wholesale-copy one specific competitor's flow either.

2. Useful — Score: 0/3
   Evidence: "Pay Invoice" button has no onClick, no payment processor exists anywhere (Overview.jsx:36; Copy & Honesty evidence).
   Justification: paying invoices online is a stated primary goal of the product, and it is not directly supported at all on the screen built for it.

3. Aesthetic — Score: 1/3
   Evidence: status badges done two different ways, confirmation/modal pattern done three different ways (Structural evidence).
   Justification: the login screens look polished in isolation, but the pattern is not applied consistently once you look past the two screenshotted screens.

4. Understandable — Score: 1/3
   Evidence: hardcoded "Estimated completion for next project: 4 Days" presented as if computed (Overview.jsx:47); unexplained "Default" badge and "Sites Allowed" count.
   Justification: more than one control tells the user something that isn't real or isn't clear, not just a single tooltip-away thing.

5. Unobtrusive — Score: 1/3
   Evidence: infinite pulse-glow animation on the logo (App.css:35, app-wide, not just marketing surfaces) plus animated grid backgrounds.
   Justification: decorative motion runs continuously outside the login/marketing context where it would be more excusable.

6. Honest — Score: 1/3
   Evidence: dead "Pay Invoice" button + dead "Forgot Password?" link + fake computed-looking completion estimate = 2+ label→behavior mismatches (Copy & Honesty evidence).
   Justification: multiple controls promise something the app doesn't do, though none of it is a manipulative dark pattern.

7. Long-lasting — Score: 1/3
   Evidence: neon gradient glow CTAs + animated "tech grid" background (index.css keyframes) is a very of-the-moment "AI SaaS" visual trend.
   Justification: 2-3 dated trend markers (gradient glow, grid motion, neon accent palette) that read as a specific style-moment rather than timeless.

8. Thorough — Score: 1/3
   Evidence: only one focus-style rule exists app-wide (Login.css:60); no confirmed error/disabled states; empty states are handled well in several places.
   Justification: 2-3 states (focus on most controls, error, disabled) are missing or unconfirmed, offsetting the good empty-state coverage.

9. Environmentally friendly — Score: 1/3
   Evidence: confirmed N+1 Supabase query pattern that refires on every login (AdminContext.jsx:77-206); always-on CSS animation with no prefers-reduced-motion guard.
   Justification: dependency weight itself is lean, but the query pattern is a real, scaling resource cost, and motion is never gated.

10. As little design as possible — Score: 1/3
    Evidence: dead backup file with hardcoded passwords, 7 debug scripts, 2 screenshot artifacts at repo root, unused imports (Overview.jsx:2), three parallel confirmation-dialog implementations.
    Justification: more than 2 removable/duplicated elements sit in the surface actually shipped.

**Total: 9/30**
