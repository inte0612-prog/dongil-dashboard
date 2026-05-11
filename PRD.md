# PRD.md — 동일유리 생산실적 대시보드

## 1. 프로젝트 개요
- **서비스명**: 동일유리 생산실적 대시보드
- **목적**: 오창공장 MES 원본 데이터(465,399건, 2024-01 ~ 2026-03)를 Supabase에 적재하고, Next.js 웹 대시보드에서 생산 현황·추이·다차원·이상 감지를 실시간으로 시각화한다.
- **대상 사용자**: 공장 관리자 / 생산 계획 담당자 / 품질·생산성 담당자
- **배포 환경**: Vercel (프로덕션) + 로컬 개발 서버 (Next.js 16, Webpack)

---

## 2. 기능 요구사항

### 2-1. 글로벌 필터 (모든 페이지 공통)
- 조회 기간 선택: 빠른 선택 버튼 (7일 / 30일 / 3개월 / 6개월 / 1년 / 전체)
- 달력 직접 선택 (DateRangePicker)
- 전체 프리셋: DB 실제 첫 데이터 날짜 ~ 마지막 날짜 (동적 조회)
- 라인 필터: 전체 / 1-LINE / 2-LINE
- 필터 상태를 URL 파라미터로 관리 → 페이지 이동 시에도 유지

---

### 2-2. 대시보드 홈
| 구성 요소 | 설명 |
|---|---|
| KPI 카드 (4개) | 총 생산 건수 / 총 생산 평수 / 일평균 생산 평수 / 1-LINE 비율 |
| 생산량 추이 차트 | 일별 생산 건수 + 7일·30일 이동평균 라인 + 이상치 표시 (±2σ) |
| 상위 거래처·품목 | 기간 내 Top 거래처 / Top 품목 순위 차트 |
| 전년 대비 | 월별 올해 vs 전년 생산 건수 비교 바 차트 |
| 집중도 분석 | 거래처 HHI 지수 + Top1/Top5/Top10 점유율 요약 |

- 이동평균 차트: 실제 데이터가 있는 구간만 표시 (앞뒤 빈 날짜 자동 제거)
- 라인 분리 버튼: 1-LINE / 2-LINE 별도 표시 토글
- 요약 카드: 일평균·최대·최소·변동성(CV%) 수치 표시

---

### 2-3. 다차원 분석
- 로컬 필터: 집계 단위(월별/일별) / 분석 기준(거래처·품목코드·라인·등록자) / 측정 지표(수량/평수) / 상위 N개(5/10/20)
- 5개 탭으로 구성:

| 탭 | 내용 |
|---|---|
| 피벗 테이블 | 기간 × 분석 기준 교차 집계 테이블 (합계 열 포함) |
| 차트 분석 | 기간별 누적 바 차트 |
| 집중도 분석 | ABC 분석 (A: 누적 70%, B: 70~90%, C: 90% 초과) |
| 추세 분석 | 기간별 라인 차트 |
| 전년 대비 | 선택 기간의 월별 올해 vs 전년 바 차트 |

- KPI 카드: 총 생산 수량 / 총 생산 면적 / 분석 기준 항목 수 / 분석 기간 수
- Supabase RPC 함수(`rpc_pivot_bucketed`, `rpc_dashboard_kpi`, `rpc_dashboard_yoy`)로 DB 집계

---

### 2-4. 데이터 탐색
- 원본 데이터 페이지네이션 테이블 (50건/페이지)
- 복합 필터: 기간 / 라인 / 품명 검색 / 거래처 검색
- 컬럼 정렬: 등록일시·평수·가로·세로
- CSV 전체 다운로드 (BOM 포함, 한글 Excel 호환)
- 표시 컬럼: 등록일시 / 라인 / 거래처 / 품명 / 품목코드 / 가로×세로 / 평수 / 의뢰번호 / 등록자

---

### 2-5. 데이터 임포트
- CSV (쉼표 구분) / TXT (탭 구분) 파일 업로드, 최대 100MB
- 드래그앤드롭 + 클릭 선택 지원
- 인코딩 자동 감지: UTF-8 → EUC-KR(CP949) 순서 시도 (한글 Excel CSV 호환)
- 헤더 자동 매핑 (한글 컬럼명 → DB 컬럼명)
- 등록일시 + PID 기준 중복 자동 스킵 (upsert)
- 미리보기 (상위 3행) → 건수 확인 → 가져오기 진행
- 500건 청크 단위 배치 INSERT + 진행률 표시

---

### 2-6. 목표 설정
- 연월별 생산 목표 수량(건) / 목표 평수 설정
- 목표 추가 / 수정 / 삭제 (모달 UI)
- 연도별 목표 현황 테이블
- Supabase `production_goals` 테이블 CRUD

---

## 3. 비기능 요구사항

| 항목 | 기준 |
|---|---|
| 성능 | 집계 쿼리 응답 3초 이내 (Supabase RPC + 인덱스 활용) |
| 대용량 처리 | 46만 건 데이터 → DB 집계 후 JSON 반환, 클라이언트 전체 로드 금지 |
| 반응형 | 데스크톱(1280px↑) 기준 최적화, 태블릿 부분 지원 |
| 타임존 | 모든 날짜 처리 KST(Asia/Seoul) 기준 통일 (RPC 내 `AT TIME ZONE` 사용) |
| 번들러 | Turbopack 한글 경로 충돌 이슈로 Webpack 사용 (`--webpack` 플래그) |
| 보안 | Supabase RLS 적용, 클라이언트에서 직접 DB 접근 금지 |
| 타입 안전성 | TypeScript strict 모드, any 타입 금지 |
| 디자인 | 라이트 테마, Shadcn UI 컴포넌트, 부드러운 호버 애니메이션 |

---

## 4. 데이터베이스 스키마

### 테이블: `production_records`
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `bigserial PRIMARY KEY` | 자동 증가 PK |
| `s_flag` | `boolean` | S 컬럼 (현재 전부 false) |
| `registered_at` | `timestamptz NOT NULL` | 등록일시 |
| `pid` | `varchar(20)` | 프로세스 ID |
| `process` | `varchar(50)` | 공정명 |
| `item_code` | `varchar(20)` | 품목코드 |
| `item_name` | `text` | 품명 |
| `width` | `integer` | 가로(mm) |
| `height` | `integer` | 세로(mm) |
| `quantity` | `integer` | 수량 |
| `pyung` | `numeric(10,4)` | 평수 |
| `order_no` | `varchar(20)` | 의뢰번호 |
| `seq_no` | `integer` | 순번 |
| `client` | `text` | 거래처 |
| `site` | `text` | 현장 |
| `line` | `varchar(10)` | 라인 (1-LINE / 2-LINE) |
| `registrar` | `varchar(20)` | 등록자 |
| `remark` | `text` | 비고 |

### 테이블: `production_goals`
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | 자동 생성 PK |
| `year` | `integer NOT NULL` | 연도 |
| `month` | `integer NOT NULL` | 월 (1~12) |
| `target_quantity` | `integer` | 목표 수량 (건) |
| `target_area` | `numeric` | 목표 평수 |
| `memo` | `text` | 메모 |

### 인덱스
```sql
CREATE INDEX idx_registered_at ON production_records (registered_at);
CREATE INDEX idx_line ON production_records (line);
CREATE INDEX idx_item_code ON production_records (item_code);
CREATE INDEX idx_client ON production_records (client);
CREATE INDEX idx_order_no ON production_records (order_no);
CREATE INDEX idx_pr_registered_at_line ON production_records (registered_at, line);
CREATE INDEX idx_pr_registered_at_kst_date ON production_records (((registered_at AT TIME ZONE 'Asia/Seoul')::date));
```

### Supabase RPC 함수
| 함수명 | 설명 |
|---|---|
| `rpc_dashboard_daily_trend` | 일별 트렌드 집계 (KST 기준, 빈 날짜 0 채움) |
| `rpc_dashboard_kpi` | KPI 요약 (총 건수·평수·일평균·라인 비율) |
| `rpc_dashboard_yoy` | 월별 전년 대비 집계 + 성장률 |
| `rpc_pivot_bucketed` | 다차원 피벗 집계 (일/월 단위, 기준 차원 선택) |

---

## 5. API 명세

모든 API는 Next.js App Router `app/api/` Route Handler로 구현. Supabase는 서버 컴포넌트·Route Handler에서만 접근.

| 엔드포인트 | 메서드 | 설명 |
|---|---|---|
| `/api/kpi` | GET | KPI 요약 (건수·평수·일평균·라인 비율·전월 대비) |
| `/api/dashboard/trend` | GET | 일별 생산 추이 + 이동평균 + 이상치 (RPC 기반) |
| `/api/dashboard/top` | GET | 상위 거래처·품목 순위 |
| `/api/dashboard/yoy` | GET | 월별 전년 대비 비교 (RPC 기반) |
| `/api/dashboard/concentration` | GET | 거래처 집중도 (HHI + ABC 분석) |
| `/api/dashboard/data-range` | GET | DB 실제 데이터 첫날·마지막날 조회 |
| `/api/dashboard-extra` | GET | 추가 대시보드 집계 |
| `/api/pivot` | GET | 다차원 분석 피벗 집계 (RPC 기반) |
| `/api/records` | GET | 원본 데이터 페이지네이션·검색·정렬 |
| `/api/export` | GET | 필터 조건 CSV 다운로드 (BOM 포함) |
| `/api/import` | POST | CSV/TXT 데이터 배치 INSERT (500건 청크) |
| `/api/goals` | GET/POST/PUT/DELETE | 생산 목표 CRUD |
| `/api/anomaly` | GET | 이상치 감지 (이동평균 ±2σ) |

---

## 6. UI/UX 요구사항

- **레이아웃**: 좌측 사이드바(네비게이션) + 우측 메인 콘텐츠 영역
- **네비게이션 메뉴**:
  - 대시보드 홈 (KPI + 생산 추이 + 전년 대비 + 집중도)
  - 다차원 분석 (피벗·차트·ABC·추세·전년 대비 5탭)
  - 데이터 탐색 (원본 테이블 + CSV 다운로드)
  - 데이터 임포트 (파일 업로드)
  - 목표 설정 (연월별 생산 목표 관리)
- **글로벌 필터**: 상단 헤더 고정 영역에 배치, 모든 페이지에 적용
- **차트 공통**: 툴팁, 범례, 로딩 스켈레톤 UI 적용
- **색상 표준**: 1-LINE 파란 계열(`#3b82f6`), 2-LINE 초록 계열(`#22c55e`)
- **빈 데이터**: "조회된 데이터가 없습니다" 상태 UI 표시
