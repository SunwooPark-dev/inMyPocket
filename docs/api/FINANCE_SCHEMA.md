# 📊 InMyPocket Finance Schema Documentation

본 문서는 `InMyPocket`의 데이터 구조와 `VA_Project` 에이전트가 이를 어떻게 활용하는지 정의합니다.

## 1. 데이터 모델 요약 (Model Overview)

| 테이블 | 역할 | VA 활용 방식 |
|---|---|---|
| **profiles** | 사용자 설정 및 성향 | 사용자의 `risk_tolerance`에 맞춘 조언 톤 조절 |
| **accounts** | 자산 소스 (은행, 거래소) | 자산 분포 분석 및 유동성(Liquidity) 확인 |
| **assets** | 세부 보유 자산 (주식, 코인) | `current_price` 변동에 따른 아우라(Aura) 색상 물리 매핑 |
| **transactions**| 모든 현금 흐름 | 소비 패턴 분석 및 이상 지출 경고 생성 |
| **va_logs** | 에이전트 활동 기록 | 과거 조언의 유효성 검증 및 장기적 재무 제언 학습 |

## 2. VA 에이전트 데이터 접근 시나리오
- **시나리오 A: 공감형 반응**: `assets.current_price`가 `assets.entry_price` 대비 10% 이상 하락 시, `va_logs`에 경고 기록 후 대시보드 상태를 `Alert`으로 전환.
- **시나리오 B: 수익화 포인트**: `transactions`의 소비 성향을 분석하여 '프리미엄 리서치 서비스'가 필요한 시점에 Stripe 결제 유도.

## 3. 마이그레이션 정보
- **Path**: `supabase/migrations/202604160001_core_finance_schema.sql`
- **Security**: PostgreSQL RLS(Row Level Security)를 통해 사용자 간 데이터 격리 보장.

---
**Antigravity Design Note**: 
"데이터 스키마는 곧 에이전트의 '지각 능력'입니다. 정교하게 설계된 테이블 구조를 통해 VA는 단순한 챗봇을 넘어 진정한 **Financial Oracle**로 작동하게 됩니다."
