# inMyPoket Validated Next-Step Controller — 2026-04-16

Purpose: reconcile three independent feedback passes (business, UX/conversion, implementation/governance) against the live repository state and freeze the next safe execution order.

## 0. Final integrated verdict

Verdict: 조건부 On-track. 다만 “다음 한 걸음”은 한 문장으로 끝내면 오판한다.

검증 결과는 두 문장을 동시에 요구한다.

1. 다음 사용자 학습 lane은 여전히 Demand Harness 1 이다.
2. 하지만 다음 engineering implementation slice는 Governance Kernel 1 이 먼저다.

왜 이렇게 나뉘는가:
- business와 UX 감사는 둘 다 non-payment demand capture refinement를 가장 빠른 학습 회수 지점으로 봤다.
- 그러나 implementation 감사와 실제 코드/SQL 교차검증 결과, 현재 public publication path는 approval-safe contract를 전혀 강제하지 않는다.
- 따라서 “무엇을 public에 내보내도 되는가”를 시스템이 잠그기 전에는 demand lane을 더 세게 밀수록 unsafe surface 위에 UX/measurement를 더 얹게 된다.

즉, 통합 순서는 아래가 맞다.
- 바로 구현할 것: Governance Kernel 1
- 병렬 spec/review lane: Demand Harness 1 refinement
- Governance Kernel 1 검증 후 즉시 구현할 것: homepage decision-card-adjacent weekly updates bridge

## 1. Three-pass feedback summary

### Pass A — Business / learning / monetization

Independent verdict:
- demand capture refinement first

Why:
- repeatable demand proof가 핵심 공백으로 이미 문서화돼 있다.
- Stripe payment proof는 현재 환경에서 비밀값 부재로 막혀 있다.
- `/api/waitlist`와 weekly-updates 저장 계약이 이미 살아 있어 학습 대비 구현비가 가장 낮다.

Verified evidence:
- `docs/harness-integrated-upgrade-2026-04-15.md`
- `docs/implementation-controller-next-slice-2026-04-15.md`
- `docs/release-readiness-checklist.md`
- `docs/accepted-risks.md`
- `src/app/api/waitlist/route.ts`
- `src/lib/waitlist.ts`

Business conclusion:
- payment-first는 지금 하면 안 된다.
- demand proof는 계속 우선순위가 높다.

### Pass B — UX / conversion / IA

Independent verdict:
- current waitlist exists, but conversion path is misplaced

Why:
- homepage top answer는 괜찮지만, weekly-updates CTA는 value confirmation 직후가 아니라 페이지 하단에 묻혀 있다.
- hero CTA는 `See today's cheapest store`, `Print...`만 있고 signup bridge가 없다.
- 실제 waitlist form은 비교 카드/신뢰 설명/아이템 상세/controls 뒤에 나온다.

Verified evidence:
- `src/app/page.tsx:185-191`
- `src/app/page.tsx:219-310`
- `src/components/waitlist-form.tsx:104-147`
- `docs/product-harness-status.md:32-37`
- `docs/accepted-risks.md:15-21`

UX conclusion:
- demand refinement 자체는 맞다.
- 하지만 구현 내용은 “새 폼 만들기”가 아니라 “decision 바로 다음에 signup bridge를 배치하는 것”이어야 한다.

### Pass C — Implementation / governance / publication safety

Independent verdict:
- biggest blocker is still publication governance implementation, not payment and not extra CTA polish

Why:
- `published_price_observations` view가 실제로는 `price_observations` pass-through다.
- public read path도 그 뷰를 그대로 신뢰한다.
- merge logic은 newer row wins 방식이라 spec의 “newer unapproved row must not suppress older published row”와 충돌한다.
- current schema에는 `review_status`, `approved_by`, `published_snapshot_id`, invalidation/retirement metadata가 없다.

Verified evidence:
- `supabase/migrations/202604130001_inmypoket_foundations.sql:93-115`
- `src/lib/observation-repository.ts:120-139`
- `src/lib/observation-feed.ts:11-42`
- `docs/publication-governance-spec-1.md`
- `docs/mvp-operations.md:11-20,31-39`

Implementation conclusion:
- readiness 기준의 next implementation slice는 governance kernel이어야 한다.

## 2. Reconciliation: what changed after three feedback loops

Initial thesis from prior docs:
- demand capture refinement looked like the next slice.

Feedback loop 1 update:
- yes, from learning/business standpoint, demand is still the next value lane.

Feedback loop 2 update:
- the UX problem is not lack of a waitlist backend; it is bad placement and weak bridge copy.

Feedback loop 3 update:
- however, repository reality forces one sequencing correction:
- before expanding any public learning surface around the live product, the publication layer must stop pretending that “published” means pass-through public rows.

Final corrected thesis:
- Demand Harness 1 remains the next product-learning slice.
- Governance Kernel 1 is the next engineering-safe slice.
- Therefore implementation order must be:
  1. Governance Kernel 1 implementation
  2. Demand Harness 1 implementation
  3. Payment reopening only after both are verified

## 3. Frozen execution order

### Step 1 — Governance Kernel 1 (implement now)

Goal:
- make public publication approval-safe instead of privacy-only

Required scope:
1. schema fields for lifecycle and approval metadata
2. minimal ZIP snapshot model
3. governed `published_price_observations` semantics
4. stale/store_call/invalidated/retired exclusion in public eligibility
5. public merge/read logic that no longer lets newer unapproved rows win

Minimum acceptance criteria:
- `draft`, `review_required`, `approved` rows are not public
- public rows require active snapshot membership
- stale rows are excluded from public output
- `store_call` rows are excluded from public output for this slice
- `invalidated` and `retired` rows are excluded
- newer unapproved rows do not suppress older published rows

Primary evidence files to update or verify:
- `supabase/migrations/202604130001_inmypoket_foundations.sql`
- `src/lib/observation-repository.ts`
- `src/lib/observation-feed.ts`
- tests for governed publication semantics

### Step 2 — Demand Harness 1 (spec now, implement immediately after Step 1)

Goal:
- convert the existing non-payment signup capability into a real learning lane

Required scope:
1. decision-card-adjacent weekly-updates bridge section
2. non-payment-safe CTA/copy aligned with current runtime
3. caregiver-oriented copy variant 1개
4. funnel event contract
5. docs/smoke/status alignment

Minimum acceptance criteria:
- weekly-updates CTA is visible within one scroll of the decision answer
- CTA copy does not imply payment when checkout is disabled
- user can jump from the answer section to the signup form immediately
- one caregiver-oriented message variant exists
- invalid/valid signup behavior stays aligned with `/api/waitlist`
- docs no longer drift from live non-payment behavior

Primary evidence files to update or verify:
- `src/app/page.tsx`
- `src/components/waitlist-form.tsx`
- `src/lib/waitlist.ts`
- `src/app/api/waitlist/route.ts`
- `docs/product-harness-status.md`
- `docs/release-readiness-checklist.md`
- `docs/accepted-risks.md`

### Step 3 — Payment lane (defer)

Do not reopen yet.

Reason:
- current environment still lacks the required Stripe secrets
- payment proof is blocked by prerequisites, while governance and demand refinement are not

Verified evidence:
- `docs/accepted-risks.md:51-60`
- `docs/release-readiness-checklist.md:42-50`
- `docs/product-harness-status.md:79-95`

## 4. Do-not-do list

Do not do now:
- Stripe-first reactivation
- broader geography/store expansion
- more public UX polish before governance kernel exists
- extra operator/process wording on the main acquisition path
- any change that makes “published” sound safer than the current code actually guarantees

## 5. Implementation prompt for the next agent wave

Use this prompt for the next implementation run:

“Work in harness engineering mode. Treat Governance Kernel 1 as the next engineering slice and Demand Harness 1 as the parallel spec/review lane. Use independent subagents for schema/view, public-read logic, and test coverage. Do not merge until all three prove that public rows are approval-safe. After Governance Kernel 1 passes, implement the homepage weekly-updates bridge directly below the shopping decision card, keeping copy aligned with the non-payment runtime.”

## 6. Verification commands to run after implementation

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- targeted publication-governance tests
- targeted waitlist CTA/copy tests
- `pnpm build`
- if env permits: `pnpm smoke:local -SkipPayment`

## 7. Controller note

This document intentionally overrides the simplistic interpretation that “demand comes first” means “implement demand UI first.”

After cross-checking code, schema, and docs, the safer and smarter interpretation is:
- business priority = demand learning
- implementation priority = governance kernel
- product immediate-after = demand bridge UX
