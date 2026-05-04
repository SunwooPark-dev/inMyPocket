# inMyPoket Implementation-Ready Gap Assessment

Last refreshed: 2026-04-15

## 1) On-track 여부 판정

판정: 조건부 On-track

근거:
- 운영 기본 뼈대는 이미 있다: daily runbook, publish gate, Supabase trust boundary, admin save flow, evidence bundle, CI proof lane.
- 그러나 현재 문서는 "운영 가능한 MVP 상태"에 더 가깝고, "다른 구현자가 재해석 없이 만들 수 있는 implementation-ready spec" 수준에는 아직 못 미친다.
- 특히 데이터 모델의 공개/비공개 상태 전이, canonical item 매칭 규칙의 정형화, freshness/SLA, legal review 기록, 예외 처리 기준이 빠져 있어 구현이 사람 판단에 과도하게 의존한다.

## 2) 이미 잘 정의된 것 3개

1. 공개/비공개 데이터 경계
- public은 `published_price_observations`만 읽고 base table은 deny 정책으로 막는 구조가 분명하다.
- 근거: `docs/mvp-operations.md`, `docs/operator-evidence-bundle.md`, `supabase/migrations/202604130001_inmypoket_foundations.sql`.

2. 운영 루틴과 최소 publish gate
- daily runbook, source URL, timestamp, store/ZIP context, coverage 80%, weekly ad 분리 규칙이 명시돼 있다.
- 근거: `docs/mvp-operations.md`.

3. 파일럿 범위
- 3개 ZIP, 3개 retailer, 20개 anchor basket이라는 pilot scope가 코드와 문서에 일치한다.
- 근거: `README.md`, `src/lib/catalog.ts`.

## 3) 빠져서 구현을 막는 핵심 스펙 7개

1. Canonical item matching spec
- 현재 anchor basket 항목과 일부 fallback rule은 존재하지만, 어떤 실제 SKU/pack을 exact / near-match / partial / non-comparable로 분류하는지 표준 규칙표가 없다.
- 구현 blocker 이유: 수집자/엔지니어마다 같은 상품을 다르게 판정할 수 있다.
- implementation-ready로 가려면 item별 허용 pack-size 범위, 허용 브랜드 편차, 금지 substitutions, normalization formula를 표로 고정해야 한다.

2. Observation lifecycle / publish state machine
- 현재는 저장되면 사실상 public view에 노출될 수 있는 구조이고 `published_at`, `review_status`, `approved_by`, `replaced_by`, `invalidated_reason` 같은 필드가 없다.
- 근거: `price_observations` 스키마와 `published_price_observations` view는 별도 승인 상태 없이 base table을 그대로 노출한다.
- 구현 blocker 이유: 초안, 검토중, 승인, 철회 상태가 없으면 운영과 법적 방어가 약하다.

3. Freshness and staleness SLA
- 문서에는 "timestamp is not stale"만 있고 stale 기준 시간이 없다.
- 근거: `docs/mvp-operations.md`에 정량 기준 부재.
- implementation-ready spec에는 scenario별 freshness SLA(예: base regular 24h, weekly ad 12h), ZIP snapshot cutoff, stale 시 자동 비공개 규칙이 필요하다.

4. Store roster and geographic eligibility spec
- ZIP cluster와 store list는 코드에 하드코딩되어 있으나, 실제 운영 store 선정 기준, store 변경 승인 절차, ZIP-to-store 매핑 정책이 없다.
- 구현 blocker 이유: 운영 확장이나 store 교체 시 데이터 일관성이 무너진다.
- 필요 항목: authoritative store roster source, store active/inactive status, effective dates, ZIP coverage fallback 규칙.

5. Data quality scoring and exception handling spec
- 현재 gate는 coverage와 몇 개 필수 필드만 본다.
- 빠진 것: outlier 탐지, 중복 observation 충돌 해결, manual correction 기준, missing item 처리 방식, channel 혼합 방지 규칙의 우선순위.
- implementation-ready spec에는 reject / warn / publish-allowed 기준을 rule table로 정의해야 한다.

6. Legal/compliance review checklist and evidence retention policy
- allowed domain 정책은 있으나, retailer별 허용 수집 행위/금지 행위의 기록 버전, evidence 보존 기간, takedown 대응, operator attest flow가 없다.
- 근거: docs 전반에서 retention/archive/takedown/rollback spec 부재.
- 구현 blocker 이유: 합법 수집 서비스의 핵심 방어선이 문서화되지 않으면 운영 이전 승인 불가.

7. Incident / rollback / audit spec
- 현재 evidence bundle은 있으나, 잘못된 가격 공개 시 누가 어떻게 롤백하고, 어떤 로그를 남기고, 언제 재게시하는지 절차가 없다.
- 구현 blocker 이유: public trust와 legal risk 관리가 불완전하다.
- 필요 항목: incident severity, rollback trigger, operator ownership, SLA, customer-visible messaging, audit trail schema.

## 4) 데이터/운영/법적 검증 게이트 제안

### 데이터 게이트
- G1. Required fields complete: source URL, collected_at, store_id, zip_code, channel, price_type, comparability_grade.
- G2. Allowed domain + https + public page check.
- G3. Item normalization pass: measurement unit conversion succeeds and target pack rule is valid.
- G4. Freshness pass: scenario-specific TTL 이내.
- G5. Basket publishability pass: ZIP-store snapshot coverage >= 80%, weekly ad/member/coupon totals 분리.
- G6. Conflict pass: 동일 item/store/scenario에서 최신 observation이 기존값과 큰 차이일 경우 review_required.

### 운영 게이트
- O1. Observation은 draft -> review_required/approved -> published -> retired 상태를 가져야 함.
- O2. 4-eyes rule: 수집자와 승인자는 분리.
- O3. Daily snapshot은 ZIP 기준으로 원자적으로 publish.
- O4. Release-health에 data freshness, missing coverage, rollback 상태를 포함.
- O5. Incident runbook: bad publish, stale snapshot, domain policy breach, storage leak 별 대응 절차.

### 법적 게이트
- L1. Retailer/domain allowlist 버전 관리.
- L2. prohibited input taxonomy 문서화: login-required page, coupon clip, loyalty-only hidden price, robots/terms blocked endpoint, personal account page.
- L3. Evidence retention and deletion policy 명시.
- L4. takedown / challenge intake 절차와 same-day unpublish 규칙.
- L5. operator action log: who collected, who reviewed, why published/unpublished.

## 5) 다음 실행 순서(1주 단위) 6개

1주차. Data contract 고정
- canonical basket 20개에 대해 exact / near-match / partial / reject rule table 작성
- measurement conversion과 fallback rule을 문서 + 테스트 케이스로 고정

2주차. Publication workflow 명세 및 DB 확장
- `price_observations`에 review/publish lifecycle 필드 추가 설계
- `published_price_observations`를 승인된 최신 스냅샷만 노출하는 view/materialized view로 재정의

3주차. Freshness / quality gate 구현
- scenario별 TTL, outlier threshold, duplicate/conflict rule 정의
- gate 결과를 `pass/warn/fail`로 저장하고 admin에 표시

4주차. Store roster / ZIP snapshot 운영화
- authoritative store roster 테이블과 effective-date 관리 추가
- ZIP publish 단위를 atomic snapshot으로 만들고 rollback 단위도 동일하게 맞춤

5주차. Legal / compliance pack 작성
- allowed/prohibited inputs를 retailer/domain별 체크리스트로 정식화
- evidence retention, takedown, operator attestation, audit log 요구사항 확정

6주차. Incident and readiness closure
- rollback runbook, incident severity, comms template, re-publish 조건 문서화
- release checklist를 implementation-ready gate로 재편하고 pilot go/no-go 판정

## 압축 결론

이 프로젝트는 "MVP 운영 증빙"은 꽤 잘 잡혀 있지만, implementation-ready spec 관점에서는 다음 한 문장으로 요약된다:

- 비교 로직은 존재한다.
- 운영 루틴도 존재한다.
- 하지만 어떤 관측치가 언제 어떤 승인 절차를 거쳐 공개 가능한지에 대한 정형 스펙이 아직 부족하다.

따라서 다음 문서화 목표는 "수집 규칙 추가"가 아니라 아래 3개를 고정하는 것이다:
- item matching rule table
- publish state machine
- freshness/legal/rollback gate
