# inMyPoket Next Slice Controller — 2026-04-15

> Purpose: integrate independent business, UX, and implementation-readiness audits into one evidence-backed execution baseline for the next step.

## 0. Controller verdict

Verdict: **조건부 On-track**.

- 제품 방향은 맞다: senior-first, trust-first, North Atlanta pilot scope, public/private data boundary, printable helper flow.
- 운영 증빙도 MVP 기준으로는 강하다: admin save flow, private evidence storage, public published view, smoke/evidence/release-health lane.
- 하지만 지금 가장 큰 공백은 두 갈래다:
  1. **public demand capture는 코드상 존재하지만, 계측·메시지·문서 정합성이 아직 약하다**
  2. **publication governance가 privacy-safe이긴 하지만 approval-safe는 아니다**

따라서 다음 단계는 하나의 큰 추상 목표가 아니라 아래처럼 나눠야 한다.

- **즉시 구현 slice:** non-payment demand capture 정교화(계측 + 메시지 + 문서 정합화)
- **즉시 병행 spec lane:** publication governance state machine 고정

즉, “다음 한 걸음”은 demand lane의 **정교화와 검증**이다.  
하지만 그 다음 확장권은 governance spec이 잠그지 않으면 열어선 안 된다.

---

## 1. 병렬 감사 결과 요약

### Audit A — Business / monetization / learning
Independent conclusion:
- **Demand capture first**

Why:
- `docs/harness-integrated-upgrade-2026-04-15.md`는 이미 최우선 공백을 repeatable demand proof와 visible non-payment signup path로 규정한다.
- Stripe proof는 현재 env secret 부재로 막혀 있다.
- 저장/제출 로직은 이미 상당 부분 구현되어 있어, 학습 대비 구현비가 낮다.
- 다만 현재 과제는 “존재 여부”보다 **측정 가능성·카피·문서 정합성**을 맞추는 쪽으로 이동했다.

Verified evidence:
- `docs/harness-integrated-upgrade-2026-04-15.md`
- `docs/product-harness-status.md`
- `docs/release-readiness-checklist.md`
- `src/app/api/waitlist/route.ts`
- `src/lib/waitlist.ts`

### Audit B — UX / IA / conversion
Independent conclusion:
- **Homepage에서 비결제 public CTA를 검증하고 정교화해야 한다**

Why:
- public answer flow는 꽤 안정화됐고, 현재 코드에는 signup path도 존재한다.
- 그러나 문서와 일부 기존 판단이 이 현실을 제대로 반영하지 못하고 있어 acquisition 학습 기준이 흐려져 있다.
- 신뢰형 제품에서 증거 없는 social proof는 오히려 리스크다.

Verified evidence:
- `src/app/page.tsx`
- `docs/product-harness-status.md`
- `docs/accepted-risks.md`

### Audit C — Governance / implementation-readiness
Independent conclusion:
- **구현 readiness 관점의 가장 큰 구조적 결함은 publication lifecycle/state machine 부재**

Why:
- 현재 public view는 privacy sanitization은 하지만 approval workflow를 내장하지 않는다.
- draft/review/approved/published/retired 같은 상태 전이가 schema와 view에 정식 반영되지 않았다.

Verified evidence:
- `docs/implementation-ready-gap-assessment.md`
- `docs/mvp-operations.md`
- `supabase/migrations/202604130001_inmypoket_foundations.sql`
- `src/lib/observation-repository.ts`
- `src/lib/observation-feed.ts`

---

## 2. 교차 검증으로 확인된 핵심 사실

### Fact 1. Non-payment capture backend는 이미 존재한다
Verified in code:
- `src/app/api/waitlist/route.ts`
- `src/lib/waitlist.ts`

What it does:
- Stripe가 꺼져 있어도 `/api/waitlist`로 email + ZIP을 받아
- `weekly-updates` plan code와 `weekly_updates_subscribed` status로 저장 가능하다.

Implication:
- 다음 slice는 greenfield 기능 개발이 아니라 **이미 있는 capability를 계측·메시지·증빙 기준까지 포함해 운영 가능한 acquisition lane으로 정교화하는 작업**이다.

### Fact 2. 현재 docs 일부는 실제 코드와 충돌한다
Examples:
- `README.md`는 `/api/waitlist`가 deprecated라고 말한다.
- 과거 smoke/status docs도 `410` 기대를 전제로 한다.
- 그러나 실제 route는 현재 정상 구현되어 있다.

Implication:
- 단순 구현만 하고 문서를 안 맞추면 다음 엔지니어/에이전트가 잘못된 lane으로 간다.
- 그래서 이번 next slice에는 **doc alignment**가 포함되어야 한다.

### Fact 3. Homepage에는 아직 evidence-light social proof가 있다
Verified in code:
- `src/app/page.tsx:154-155`

Current behavior:
- “100 active households”를 가정한 계산으로 community savings를 보여준다.

Implication:
- trust-first product와 충돌 가능성이 있다.
- demand proof가 아직 없는 상태에서는 제거 또는 명시적 실험 격리가 맞다.

### Fact 4. Governance gap은 여전히 실제 blocker다
Verified in docs + schema:
- `docs/implementation-ready-gap-assessment.md`
- `supabase/migrations/202604130001_inmypoket_foundations.sql`

Current weakness:
- public/private boundary는 존재하지만,
- **무엇이 어떤 승인 상태를 거쳐 public에 나가도 되는지**에 대한 정형 스펙/스키마가 없다.

Implication:
- demand slice는 진행 가능하지만,
- store/ZIP/data scale-up이나 broader ops 확장은 governance spec 전까지 멈춰야 한다.

---

## 3. 통합 판정: 무엇을 “다음 단계”로 볼 것인가

### 최종 판정
**다음 구현 slice는 Demand Harness 1이어야 한다.**

정의:
- Stripe가 없어도 public에서 보이는 signup path를 복구한다.
- 그 path를 계측한다.
- caregiver 메시지를 최소 1개 넣는다.
- 코드/문서/스모크 기대치를 실제 동작과 맞춘다.

### 단, 이 해석이 Governance reviewer와 충돌하지 않는 이유
Governance reviewer가 맞게 지적한 사실:
- publication governance가 implementation-ready의 가장 큰 구조적 결함이다.

그럼에도 demand lane을 먼저 두는 이유:
1. demand lane은 **현재 env에서 막히지 않는다**
2. backend가 이미 부분 구현되어 있어 **가장 빠르게 사용자 학습을 회수할 수 있다**
3. governance lane은 **동시에 spec 작업을 시작할 수 있다**
4. 반대로 Stripe-first는 env prerequisite 때문에 막혀 있다

즉,
- **implementation slice priority = demand capture**
- **structural hardening priority = governance spec**

이 둘을 분리하지 않으면 문서 충돌이 계속된다.

---

## 4. 즉시 실행 순서

## Step 0 — Source-of-truth 정렬
Before code change, controller가 먼저 고정해야 할 것:
- 최신 source-of-truth는 `docs/harness-integrated-upgrade-2026-04-15.md`와 본 문서다.
- `docs/roadmap-slices.md`, `README.md`, smoke/status docs 중 일부는 현재 코드/전략과 drift가 있다.

Output:
- 이 문서를 기준으로 다음 구현을 진행한다.

## Step 1 — Demand Harness 1 구현
Scope:
1. existing weekly updates capture path를 실제 UX/카피/계측 기준으로 정교화
2. CTA/copy를 answer-first 흐름을 깨지 않게 배치
3. caregiver-oriented copy variant 1개 추가
4. basic funnel instrumentation 정의 및 연결
5. docs/smoke/status 기대치 정합화
6. evidence-light social proof 제거 또는 격리

Why first:
- business/UX 두 독립 감사가 모두 같은 결론을 냈다.
- current environment에서 unblock되어 있다.

## Step 2 — Publication Governance Spec 1 작성
Scope:
1. observation lifecycle state machine 고정
2. required schema fields 초안
3. published view eligibility rule 초안
4. freshness TTL / stale handling 초안
5. rollback / takedown / audit minimum contract 작성

Why immediately after or in parallel as spec-only lane:
- implementation-ready gap의 본체이기 때문이다.
- demand slice 이후 store/data 확장 판단 기준이 된다.

## Step 3 — Demand slice proof + governance spec cross-review
Required before more expansion:
- non-payment capture가 실제로 보이고 제출되고 측정되는지
- docs가 더 이상 `/api/waitlist`에 대해 거짓말하지 않는지
- governance spec이 state machine 수준으로 고정됐는지

## Step 4 — Only then reconsider Stripe proof
Condition:
- Stripe test-mode secrets가 준비되어야 한다.
- demand capture learning과 governance baseline이 먼저 확보되어야 한다.

---

## 5. Demand Harness 1 — implementation-ready acceptance criteria

### Product behavior
- Stripe 비활성 상태에서도 `/`의 signup surface가 유지되고, 그 상태별 카피가 실제 동작과 일치한다.
- primary answer flow는 여전히 “today’s cheapest store”가 먼저다.
- CTA는 dead-end payment wording 없이 weekly updates value를 직접 설명한다.
- caregiver/audlt-child oriented 메시지 variant가 최소 1개 존재한다.

### Functional behavior
- 비결제 모드 제출은 `/api/waitlist`를 사용한다.
- 성공 시 inline success message가 보인다.
- duplicate submit은 idempotent하게 처리된다.
- `weekly-updates` / `weekly_updates_subscribed` 저장 계약이 유지된다.

### Trust behavior
- 근거 없는 social proof 수치가 기본 trust path에 남지 않는다.
- methodology copy는 answer를 보조하지, 경쟁하지 않는다.

### Measurement
Minimum events:
- homepage viewed
- signup CTA viewed
- signup CTA clicked
- signup submit attempted
- signup submit succeeded
- signup submit failed
- caregiver variant seen/selected

### Documentation / verification
- `/api/waitlist` 동작이 README/status/smoke docs와 일치한다.
- 테스트 또는 smoke가 Stripe-off public signup visibility를 증명한다.
- checkout-enabled path와 checkout-disabled path가 모두 테스트된다.

---

## 6. Publication Governance Spec 1 — acceptance criteria

### Lifecycle
Observation state machine must be frozen as at least:
- `draft`
- `review_required`
- `approved`
- `published`
- `retired`
- `invalidated` (if `retired`와 별도 개념이면 분리)

### Schema contract
Need design for fields such as:
- `review_status`
- `approved_by`
- `approved_at`
- `published_snapshot_id` or equivalent
- `invalidated_reason`
- `supersedes_observation_id` / `replaced_by`
- collector vs approver identity fields

### Publication rule
- public view는 approved + publishable rows만 노출해야 한다.
- newer unapproved observation이 older approved public row를 덮어쓰면 안 된다.
- stale row는 TTL 바깥이면 public에서 제외된다.

### Ops / legal minimums
- same-day unpublish/takedown rule
- evidence retention window
- rollback trigger + owner
- audit log minimum schema

### Verification
Need explicit test plan for:
- draft row not public
- approved row public
- stale row excluded
- invalidated row excluded
- rollback path preserves auditability

---

## 7. Do-not-do list

Do not make these the immediate next slice:
- Stripe proof first
- broader geography expansion
- more stores before governance spec freeze
- visual polish detached from acquisition or trust gain
- more aggressive social-proof messaging without evidence

---

## 8. Remaining ambiguities that still need a decision

These are not blockers for Demand Harness 1, but they must be answered soon:

1. **Acquisition destination**
- Is weekly-updates email capture the final interim CTA, or should there also be “request your ZIP/store”?

2. **Measurement stack**
- Where will funnel events live first: app logs, Supabase table, PostHog, GA, or lightweight local evidence artifact?

3. **Caregiver segmentation surface**
- Separate CTA, alternate copy block, or A/B-able text variant?

4. **Governance enforcement phase**
- spec-only first, or spec + schema migration in the same implementation wave?

5. **Social proof policy**
- remove entirely until measured, or keep only if explicitly labeled as pilot estimate?

---

## 9. 냉정한 최종 판정

### 지금 상태가 온트랙인가?
**예, 단 조건부다.**

Why:
- pilot trust product로서는 충분히 탄탄하다.
- 하지만 아직 business learning loop와 publication governance가 동시에 덜 잠겨 있다.

### 지금 바로 구현 가능한 다음 단계는 무엇인가?
**Demand Harness 1**
- existing weekly-updates path 정교화
- instrumentation
- caregiver copy variant
- doc/smoke alignment
- evidence-light social proof cleanup

### 바로 다음에 붙어야 하는 스펙 작업은 무엇인가?
**Publication Governance Spec 1**
- state machine
- published eligibility
- freshness TTL
- rollback/takedown/audit contract

---

## 10. Implementation controller prompt

Use this as the next executor brief:

> Work in harness-engineering mode. Run independent lanes for (A) non-payment demand capture implementation, (B) publication governance spec drafting, and (C) independent verification/documentation review. Do not treat Stripe proof as the next slice. For lane A, expose the existing waitlist flow on the homepage even when payment is disabled, instrument the funnel, add one caregiver-oriented copy variant, and remove unsubstantiated social-proof messaging. For lane B, freeze the observation lifecycle, publication eligibility, freshness TTL, and rollback/takedown/audit contract. Do not merge until docs, tests, and runtime behavior agree.
