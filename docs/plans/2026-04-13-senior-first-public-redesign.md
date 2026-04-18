# inMyPoket Senior-First Public Redesign Implementation Plan

> For Hermes: use this as the execution source of truth for the public consumer redesign.

Goal: turn the current public experience into a calm, senior-friendly grocery decision flow where a 60+ household can understand the promise quickly and identify the cheapest store before seeing item-level detail.

Architecture: keep the existing Next.js route structure and pricing logic intact. Rework hierarchy and copy in `src/app/page.tsx` and `src/app/printable/page.tsx`, reuse the current component set where possible, and add only lightweight structural wrappers or classes where they materially improve clarity.

Tech Stack: Next.js App Router, React server/client components, TypeScript, CSS in `src/app/globals.css`

---

## Current codebase findings

- `src/app/page.tsx` still mixes landing, result, trust, methodology, and signup concerns in one sequence.
- `src/components/section-card.tsx` already supports `variant`, so hierarchy work is partly unlocked.
- `src/components/retailer-card.tsx` already moved somewhat toward shopper language, but it still needs tighter public hierarchy and explicit trust/support ordering.
- `src/components/product-comparison-table.tsx` still renders as always-open detail with spreadsheet-like density.
- `src/components/waitlist-form.tsx` already uses some improved copy, but behavior and surrounding treatment still reflect checkout flow.
- `src/app/printable/page.tsx` already includes useful top-summary text, but still needs stronger print-first hierarchy.
- `src/lib/catalog.ts` does not currently appear to contain Korean consumer strings, so broad normalization there is probably unnecessary unless implementation reveals stray rendered strings.

## Locked decisions for this implementation

1. `/` will show the default pilot ZIP result first, then let users change ZIP/scenario below the decision card.
2. New names like `DecisionHeroCard` and `TrustSummaryBar` are structural targets, not mandatory extracted files. Keep changes local unless extraction clearly improves readability.
3. `src/lib/catalog.ts` should only be edited if consumer-facing rendered copy actually needs cleanup during implementation.

---

## Phase 1: Restructure the main public page (P0)

### Task 1: Refactor `src/app/page.tsx` into summary-first order
Objective: make the first viewport communicate promise, action, and answer before any methodology or detail.

Files:
- Modify: `src/app/page.tsx`

Steps:
1. Remove the `/admin` CTA from the hero action block.
2. Rename the hero eyebrow, heading, and lede to the senior-first public copy from the implementation spec.
3. Replace the current `hero__stats` block with one dominant result block directly under hero copy.
4. Keep ZIP and scenario controls, but move them below the primary result block.
5. Reorder the rest of the page into:
   - hero
   - decision block
   - store comparison strip
   - trust summary
   - collapsed item detail
   - weekly signup section
6. Remove public sections for:
   - `Publish gate`
   - `Allowed and prohibited inputs`
   - `Daily runbook and gate checks`
   - `Revenue path`
7. Keep consumer trust content, but rewrite it into short public-facing explanation instead of operator language.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`
- Expected: no compile or lint errors introduced by page refactor.

Acceptance:
- The first viewport shows one strongest answer block and only two CTAs.
- Internal operations language is gone from public headings.

### Task 2: Add a calm decision card and trust summary markup in `src/app/page.tsx`
Objective: make the recommendation and trust explanation legible before detail.

Files:
- Modify: `src/app/page.tsx`

Steps:
1. Create local structural wrappers/classes for:
   - decision card
   - store comparison strip
   - trust summary bar
   - detail disclosure
2. In the decision card, show:
   - best place to shop today
   - cheapest store name
   - total basket cost
   - savings vs next-best store
   - checked time
   - same-basket support line
3. Add a trust summary bar with four short reassurance points.
4. Make the item-level comparison section collapsed by default.
5. Use consumer phrasing for partial/estimated states where data coverage is not ideal.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`

Acceptance:
- A first-time user can identify cheapest store, total, savings, and last checked time before opening any detail.

### Task 3: Simplify the store comparison strip using `RetailerCard`
Objective: turn retailer summaries into recommendation cards instead of QA cards.

Files:
- Modify: `src/app/page.tsx`
- Modify: `src/components/retailer-card.tsx`

Steps:
1. Pass rank explicitly from `page.tsx` when rendering retailer cards.
2. Ensure only the top 3 stores show in the summary strip.
3. Keep ordering within the card as:
   - store name + recommendation badge
   - total price
   - price difference / savings context
   - trust line
   - membership context
4. Remove any remaining blocker or publish-ready style language from the default card body.
5. Make the best card visually more dominant than the next two.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`

Acceptance:
- The best store is obvious from copy and styling alone.
- Cards read like shopping guidance, not internal reports.

---

## Phase 2: Make detail secondary instead of primary (P0)

### Task 4: Collapse `ProductComparisonTable` behind disclosure
Objective: keep item-level detail accessible without making it the default cognitive load.

Files:
- Modify: `src/app/page.tsx`
- Modify: `src/components/product-comparison-table.tsx`

Steps:
1. Wrap the item comparison in a disclosure element or equivalent collapsible pattern.
2. Add a compact summary banner above the expanded detail content.
3. Keep the table hidden by default on initial render.
4. Rename any remaining unit labels and missing-state labels into plain English.
5. Preserve existing pricing logic; only change presentation hierarchy.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`

Acceptance:
- Detailed comparison is collapsed by default.
- Mobile does not present the comparison as a mini spreadsheet on first view.

### Task 5: Reduce detail density for mobile scanning
Objective: make expanded item detail readable on smaller screens.

Files:
- Modify: `src/components/product-comparison-table.tsx`
- Modify: `src/app/globals.css`

Steps:
1. Convert retailer cells into a more vertical, card-like presentation on mobile.
2. Increase spacing between item blocks.
3. Reduce repeated metadata in the first visible state.
4. Keep retailer detail readable without horizontal scanning pressure.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`
- Optional manual check: `pnpm dev` and inspect a narrow viewport.

Acceptance:
- Mobile detail feels stacked and readable.
- Unit text reads plainly for non-technical shoppers.

---

## Phase 3: Improve signup and printable utility (P1)

### Task 6: Reposition the waitlist/signup as a weekly savings helper
Objective: make the bottom CTA feel supportive, not startup-transactional.

Files:
- Modify: `src/app/page.tsx`
- Modify: `src/components/waitlist-form.tsx`

Steps:
1. Keep the form at the bottom of the page only.
2. Wrap the form in calmer weekly-update framing.
3. Preserve email and ZIP fields, but ensure the surrounding copy reads like household support.
4. Keep disabled/error messages non-technical.
5. Avoid introducing new checkout-oriented hero language.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`

Acceptance:
- No public-facing founder language remains.
- The form reads like a weekly savings update signup.

### Task 7: Rework the printable page into a large-print shopping helper
Objective: make `/printable` useful as a standalone shopping aid.

Files:
- Modify: `src/app/printable/page.tsx`

Steps:
1. Strengthen the top summary block so the decision is visible in the first three lines.
2. Keep the print button and back link, but de-emphasize navigation relative to the summary.
3. Ensure the item list starts only after the summary block.
4. Keep per-item phrasing large-print and direct.
5. Preserve printable behavior and first-page readability.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`

Acceptance:
- A user can print and shop without checking the main page first.
- The first print page clearly states where to shop and expected total.

---

## Phase 4: Visual hierarchy and token cleanup (P1)

### Task 8: Introduce senior-first typography and spacing hierarchy in `globals.css`
Objective: make the page calmer, larger, and less dashboard-dense.

Files:
- Modify: `src/app/globals.css`

Steps:
1. Introduce semantic size/spacing tokens for public content.
2. Raise body, metadata, stat, and hero sizes to the ranges defined in the implementation spec.
3. Reduce all-caps emphasis for important consumer information.
4. Create explicit class support for:
   - decision card
   - store strip
   - trust bar
   - detail disclosure
   - section-card variants
5. Reduce chip dominance and increase whitespace between top sections.
6. Ensure the best answer block visually dominates methodology/support sections.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`
- Optional manual check: `pnpm dev`

Acceptance:
- No primary public-facing text is effectively below 20px.
- First viewport feels less crowded than the current implementation.

### Task 9: Apply hierarchy variants through `SectionCard`
Objective: stop all sections from competing equally.

Files:
- Modify: `src/app/page.tsx`
- Modify: `src/components/section-card.tsx` if needed
- Modify: `src/app/globals.css`

Steps:
1. Use `primary`, `secondary`, and `support` variants intentionally across the public page.
2. Ensure decision and trust content have stronger visual priority than methodology/supportive content.
3. Keep the component API minimal; do not over-engineer.

Verification:
- Run: `pnpm lint`
- Run: `pnpm typecheck`

Acceptance:
- Users can visually tell what to read first without scanning every section equally.

---

## Phase 5: Manual QA and finish (P1)

### Task 10: Run local verification for the public flow
Objective: confirm the redesign works as intended in code, not just on paper.

Files:
- No code changes required unless bugs are found

Steps:
1. Run: `pnpm lint`
2. Run: `pnpm typecheck`
3. Run: `pnpm build`
4. If the app builds, run: `pnpm dev`
5. Manually verify:
   - first viewport hierarchy
   - top result readability
   - trust visibility
   - details collapsed by default
   - printable page top summary
   - mobile-ish narrow width sanity

Acceptance:
- Build passes.
- Public flow matches the implementation intent.

---

## Recommended execution order

1. `src/app/page.tsx`
2. `src/components/retailer-card.tsx`
3. `src/components/product-comparison-table.tsx`
4. `src/components/waitlist-form.tsx`
5. `src/app/printable/page.tsx`
6. `src/app/globals.css`
7. final verification

## Notes

- Do not widen scope into accounts, maps, coupon systems, or admin redesign.
- Do not touch pricing logic unless a presentation change exposes a real bug.
- Prefer local structural wrappers first; extract new components only if a file becomes hard to read.
- The project’s biggest win is hierarchy, clarity, and trust tone — not more features.
