# North Atlanta catalog boundary hardening plan

## Context

The canonical operator-first contract says the active MVP is North Atlanta only:

- ZIPs: `30328`, `30022`, `30076`
- Retailers: `kroger`, `aldi`, `walmart`
- Out of scope: Eugene restoration, mixed-pilot UX, and retailer expansion beyond the three North Atlanta operators.

The active app contract must stay free of retired Eugene catalog drift and wider retailer typing:

- `PILOT_CLUSTERS` must include only the three North Atlanta ZIPs.
- `RETAILERS` must include only `kroger`, `aldi`, and `walmart`.
- `STORES` must include only North Atlanta store rows.
- `RetailerId` must stay narrowed to `"kroger" | "aldi" | "walmart"`.
- `tests/normalization.test.ts` must reject Fred Meyer and Albertsons source domains.

## Small slice

Tighten only the in-app catalog boundary so the active runtime/test contract matches the canonical North Atlanta lane.

## Files to change

1. `tests/location-context-lane-a.test.ts`
   - Add a regression test that asserts the supported ZIP list excludes `97401` and still includes the three North Atlanta ZIPs.
   - This should fail before production changes because `isSupportedPilotZip("97401")` currently returns `true`.

2. `tests/normalization.test.ts`
   - Adjust source-policy expectations so Fred Meyer and Albertsons are not accepted retailer IDs for the active lane.
   - Keep positive checks for Kroger/ALDI/Walmart official HTTPS domains and negative checks for unknown/HTTP hosts.

3. `src/lib/catalog.ts`
   - Verify the catalog contains only North Atlanta pilot clusters, active retailers, and active store rows.
   - Leave North Atlanta `30328`, `30022`, `30076` data unchanged.
   - If `git status` reports this file modified but `git diff` is empty, treat it as a WSL/index metadata anomaly rather than a content change.

4. `src/lib/domain.ts`
   - Keep `RetailerId` narrowed to `"kroger" | "aldi" | "walmart"`.

## Verification plan

1. RED: run `npm test -- --test-name-pattern="pilot-only|source"` after adding the regression test and before production edits. Expected: fail on Eugene ZIP still being supported and/or retired retailers still accepted.
2. GREEN: run the same focused test after production edits. Expected: exit 0.
3. Broader safety: run `npm test -- --test-name-pattern="location|source|default basket summary"`. Expected: exit 0.
4. If time permits and tooling supports it without installing dependencies: run `npm test`. Expected: exit 0.

## Non-goals

- No git reset/pull/rebase/stash/commit.
- No Supabase migration changes.
- No checkout/payment restoration.
- No broad UI redesign.
- No generated evidence or secret-related files touched.
