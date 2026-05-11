# TASK.md — 동일유리 생산실적 대시보드

---

## Phase 1. 프로젝트 세팅 — 완료

- [x] Next.js 16 프로젝트 생성 (TypeScript, Tailwind, App Router)
- [x] Shadcn UI 초기화
- [x] 패키지 설치 (`recharts`, `@supabase/supabase-js`, `@supabase/ssr`, `xlsx`, `date-fns`, `dotenv`, `lucide-react`, `tailwind-merge`)
- [x] `.env.local` 파일 생성 및 Supabase 환경변수 입력
- [x] `tsconfig.json` strict 모드 확인
- [x] Turbopack 한글 경로 충돌 이슈 → `--webpack` 플래그로 해결 (`package.json` scripts 수정)
- [x] `lib/constants.ts` 생성 (라인명, 색상, 페이지 메뉴 목록)
- [x] `lib/supabase/server.ts` 서버 클라이언트 설정
- [x] `lib/utils/dateUtils.ts` 날짜 포맷·범위 유틸 (UTC 명시적 처리로 KST 서버 버그 수정)
- [x] `types/index.ts` 공통 타입 정의
- [x] `hooks/useFilter.ts` URL 기반 필터 상태 관리
- [x] `app/page.tsx` → /dashboard 리다이렉트
- [x] TypeScript strict 타입 검사 통과

---

## Phase 2. DB 세팅 및 데이터 마이그레이션 — 완료

- [x] Supabase 프로젝트 생성 (ref: awtvapphrwfcnacryjnv)
- [x] `production_records` 테이블 생성 SQL 실행
- [x] 인덱스 7개 생성 (`registered_at`, `line`, `item_code`, `client`, `order_no`, 복합 인덱스 2개)
- [x] RLS 활성화 및 anon read 정책 설정
- [x] `scripts/migrate.mjs` 작성 (xlsx 파싱 → 1,000건 청크 배치 INSERT)
- [x] 마이그레이션 실행 및 465,399건 적재 완료
- [x] Supabase RPC 함수 4개 등록:
  - `rpc_dashboard_daily_trend` (일별 트렌드, KST 기준)
  - `rpc_dashboard_kpi` (KPI 요약)
  - `rpc_dashboard_yoy` (전년 대비)
  - `rpc_pivot_bucketed` (다차원 피벗)
- [x] `production_goals` 테이블 생성 (목표 설정 CRUD용)

---

## Phase 3. 공통 레이아웃 및 글로벌 필터 — 완료

- [x] `app/layout.tsx` 루트 레이아웃
- [x] `components/layout/Sidebar.tsx` 사이드바 (6개 메뉴, 활성 상태, URL 파라미터 유지)
- [x] `components/layout/Header.tsx` 상단 헤더
- [x] `components/layout/GlobalFilter.tsx` 날짜 범위 + 라인 필터 통합
  - 빠른 선택 버튼: 7일/30일/3개월/6개월/1년/전체
  - 전체 프리셋: `/api/dashboard/data-range` 조회로 DB 실제 범위 동적 반영
- [x] `components/layout/DateRangePicker.tsx` 달력 직접 선택
- [x] `app/dashboard/layout.tsx` 사이드바 + 헤더 공통 레이아웃

---

## Phase 4. 대시보드 홈 — 완료

- [x] `app/api/kpi/route.ts` KPI 집계 쿼리
- [x] `app/api/anomaly/route.ts` 이동평균·이상치 감지 쿼리
- [x] `app/api/dashboard/trend/route.ts` 일별 트렌드 (RPC 기반, 앞뒤 빈 구간 자동 제거)
- [x] `app/api/dashboard/top/route.ts` 상위 거래처·품목 순위
- [x] `app/api/dashboard/yoy/route.ts` 전년 대비 (RPC 기반)
- [x] `app/api/dashboard/concentration/route.ts` 거래처 집중도 (HHI + ABC)
- [x] `app/api/dashboard/data-range/route.ts` 실제 데이터 첫날·마지막날 조회
- [x] `components/dashboard/KpiCard.tsx` KPI 카드 단일 컴포넌트
- [x] `components/dashboard/KpiGrid.tsx` KPI 4종 그리드
- [x] `components/dashboard/AnomalyBanner.tsx` 이상치 경고 배너
- [x] `components/dashboard/DashboardTrend.tsx` 생산량 추이 차트 (이동평균, 이상치, 라인 분리)
- [x] `components/dashboard/DashboardTop.tsx` 상위 거래처·품목 차트
- [x] `components/dashboard/DashboardYoy.tsx` 전년 대비 바 차트
- [x] `components/dashboard/DashboardConcentration.tsx` 집중도 분석 (HHI + Top 점유율)
- [x] `app/dashboard/DashboardHome.tsx` 홈 클라이언트 컴포넌트
- [x] `app/dashboard/page.tsx` 홈 페이지

---

## Phase 5. 다차원 분석 — 완료

- [x] `app/api/pivot/route.ts` 다차원 집계 (RPC + 페이지네이션)
- [x] `app/dashboard/pivot/PivotContent.tsx` 5탭 다차원 분석 클라이언트 컴포넌트
  - 피벗 테이블 / 차트 분석 / 집중도(ABC) / 추세 분석 / 전년 대비
  - 로딩 상태 정상 처리, 에러 배너 표시
- [x] `app/dashboard/pivot/page.tsx` 다차원 분석 페이지

---

## Phase 6. 데이터 탐색 — 완료

- [x] `app/api/records/route.ts` 페이지네이션·정렬·검색 쿼리
- [x] `app/api/export/route.ts` CSV 다운로드 (BOM 포함, 한글 Excel 호환)
- [x] `components/tables/DataTable.tsx` 컬럼 클릭 정렬 테이블
- [x] `app/dashboard/records/RecordsContent.tsx` 검색·페이지네이션·CSV 다운로드
- [x] `app/dashboard/records/page.tsx` 데이터 탐색 페이지

---

## Phase 7. 데이터 임포트 — 완료

- [x] `app/api/import/route.ts` 배치 INSERT (500건 청크, 중복 스킵)
- [x] `app/dashboard/import/page.tsx` 파일 업로드 페이지
  - 드래그앤드롭 + 클릭 선택
  - UTF-8 → EUC-KR 인코딩 자동 감지
  - RFC 4180 CSV 파싱 (인용부호 내 쉼표 처리)
  - 미리보기 3행 + 진행률 바

---

## Phase 8. 목표 설정 — 완료

- [x] `app/api/goals/route.ts` 생산 목표 CRUD (GET/POST/PUT/DELETE)
- [x] `app/dashboard/goals/page.tsx` 연월별 목표 관리 페이지 (추가·수정·삭제 모달)

---

## Phase 9. 차트 공통 컴포넌트 — 완료

- [x] `components/charts/TrendLineChart.tsx` 라인 차트
- [x] `components/charts/HorizontalBarChart.tsx` 수평 바 차트
- [x] `components/charts/StackedBarChart.tsx` 수평 누적 바 차트
- [x] `components/charts/DonutChart.tsx` 도넛 차트
- [x] `components/charts/HeatmapChart.tsx` 히트맵 차트
- [x] `components/charts/ScatterChart.tsx` 산점도 차트
- [x] `components/charts/HistogramChart.tsx` 히스토그램 차트

---

## Phase 10. 배포 — 완료

- [x] Vercel 프로젝트 연결 (inte0612-8828s-projects/dongil-dashboard)
- [x] 환경변수 3개 등록 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [x] Vercel 프로덕션 배포 성공 → https://dongil-dashboard.vercel.app

---

## Phase 11. 버그 수정 및 개선 — 완료

- [x] 날짜 필터 타임존 버그 수정 (`toStartOfDay` / `toEndOfDay` → UTC 명시적 처리)
- [x] 트렌드 차트 X축 뒤쪽 빈 구간 제거 (trailing zeros trim)
- [x] 트렌드 차트 X축 앞쪽 빈 구간 제거 (leading zeros trim, API 레벨)
- [x] 전체 날짜 프리셋 DB 실제 범위로 동적 설정 (`/api/dashboard/data-range`)
- [x] 이상치 점 색상 연하게 수정 (fillOpacity 0.35)
- [x] 툴팁 NaN 표시 버그 수정 (비숫자 payload 필터링)
- [x] 다차원 분석 초기 로딩 상태 수정 (`useState(true)`)
- [x] 다차원 분석 API 오류 시 에러 배너 표시
- [x] Turbopack 한글 경로 panic 오류 → Webpack으로 전환
- [x] CSV EUC-KR 인코딩 업로드 오류 수정 (ArrayBuffer + TextDecoder fallback)
- [x] pivot API `totalCount` 정확도 수정 (Supabase `count: "exact"` 활용)

---

## 미완료 항목

- [ ] 모바일 반응형 레이아웃 검증 (태블릿 768px↓)
- [ ] 전체 기능 플로우 테스트 (KPI · 추이 · 다차원 · 이상감지 · CSV 다운로드)
- [ ] 다차원 분석 전년 대비 탭 — 다년도 선택 시 월별 연도 혼합 집계 버그 수정
