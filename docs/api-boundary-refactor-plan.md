# API Boundary Refactor Plan

## Objective

Keep public basket data available while preventing public runtime drift toward direct backend/API exposure.

## Completed in the current slice

- Moved public governed basket reads onto a server-owned module.
- Removed the public Supabase client helper from active basket-read code.
- Moved manual observation save/read under `/api/admin/observations`.
- Removed public published-read re-exports from the mixed `server-storage` barrel.

## Remaining Follow-up

### 1. Barrel cleanup

- Continue shrinking mixed convenience barrels so public, admin, and operator imports are harder to confuse.
- Active weekly-updates routes should prefer `waitlist-storage` over the mixed `server-storage` barrel.
- Active admin observation routes should prefer `admin-observation-storage` over the mixed `server-storage` barrel.

### 2. Policy review

- Direct publishable-key REST checks, when retained, must prove denied access or zero governed rows.
- Governed basket reads belong to server/operator lanes, not browser-side Supabase clients.

### 3. Static guardrails

- Add lightweight grep or lint checks that fail when:
  - a client component imports server-owned basket read helpers
  - `/api/admin/` routes are called from unauthenticated product paths
  - mixed storage barrels re-export newly added admin-only helpers

### 4. Operator truth

- Keep smoke/docs/operator proof aligned whenever a boundary changes.
- Prefer explicit server-only module names for public basket reads so review diff noise stays low.

## Success Criteria

- Public app keeps working without direct Supabase browser reads.
- Admin write routes stay namespaced and gated.
- Smoke/docs/tests all describe the same boundary truth.
