# inMyPoket — 프로젝트 컨텍스트

## 비즈니스 목표
시니어 친화적인 장바구니 비교 서비스. North Atlanta 지역의 시니어들이 최저가 장바구니를 쉽게 찾을 수 있도록 지원.

## 사용자 페르소나
- **주요 타겟**: 65세 이상 시니어
- **지역**: North Atlanta (ZIP: 30328, 30022, 30076)
- **니즈**: 큰 글씨, 간단한 UI, 인쇄 가능한 쇼핑 목록

## 핵심 기능
1. **장바구니 비교**: 3개 소매업체(Kroger, Aldi, Walmart) 가격 비교
2. **ZIP 기반 검색**: 위치 기반 가장 저렴한 매장 추천
3. **대기자 명단**: 서비스 출시 전 사용자 확보
4. **결제 시스템**: Stripe 기반 파운딩 멤버십
5. **관리자 페이지**: observations 데이터 관리
6. **인쇄 가능한 목록**: 오프라인 사용 지원

## 기술적 제약사항
- Supabase hosted 사용 (로컬 CLI 없음)
- WSL 환경에서 개발 (Windows node_modules 재사용 불가)
- Turbopack 사용 시 네이티브 바인딩 문제 가능

## 현재 진행 상황
- MVP 완성 (62개 테스트 통과)
- 호스팅 준비 상태 분석 완료
- 운영 증거 수집 파이프라인 구축됨

## 관련 저장소
- GitHub: https://github.com/SunwooPark-dev/inMyPocket.git
- 프로젝트 참조: `ndifsahnedlokhfvohcl` (dev-launchpad)
