import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Table,
  Upload,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: LayoutDashboard,
    title: "대시보드",
    description: "총 생산건수·평수·일평균·라인비율 KPI와 이상 탐지 경고를 한눈에 확인합니다.",
    href: "/dashboard",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: TrendingUp,
    title: "다차원 분석",
    description: "기간별 생산 추이, 품목·거래처·사양·치수 등 다양한 축으로 데이터를 분석합니다.",
    href: "/dashboard/pivot",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Table,
    title: "데이터 그리드",
    description: "465,399건 전체 생산 레코드를 검색·필터링하고 CSV로 내보냅니다.",
    href: "/dashboard/records",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Upload,
    title: "데이터 임포트",
    description: "CSV/TXT 파일을 업로드하여 생산 레코드를 직접 추가합니다. 중복은 자동으로 스킵됩니다.",
    href: "/dashboard/import",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

const STEPS = [
  {
    step: 1,
    title: "데이터 확인",
    description: "데이터 탐색 메뉴에서 465,399건 생산 레코드를 검색하고 확인합니다.",
  },
  {
    step: 2,
    title: "대시보드 확인",
    description: "KPI 카드와 이상 탐지 배너로 전체 생산 현황을 파악합니다.",
  },
  {
    step: 3,
    title: "다차원 분석",
    description: "생산 추이, 품목, 거래처, 사양 등 원하는 축으로 깊이 분석합니다.",
  },
  {
    step: 4,
    title: "데이터 내보내기",
    description: "필터된 결과를 CSV로 다운로드해 외부 도구와 연동합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">오창공장 MES · 465,399건</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            동일유리 생산실적 분석시스템
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            생산 데이터를 실시간으로 집계·분석하여 의사결정을 지원합니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            대시보드 바로가기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16 space-y-16">
        {/* Feature Cards */}
        <section>
          <h2 className="mb-8 text-xl font-semibold text-foreground">주요 기능</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-lg border bg-background p-6 flex flex-col gap-4"
                >
                  <div className={`w-10 h-10 rounded-md ${card.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>
                  <Link
                    href={card.href}
                    className="self-start inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    바로가기
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step Guide */}
        <section>
          <h2 className="mb-8 text-xl font-semibold text-foreground">시작하기 — 4단계 가이드</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-lg border bg-background p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">STEP {s.step}</span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <footer className="border-t pt-8 text-center text-xs text-muted-foreground">
          동일유리 생산실적 분석시스템 · 오창공장 MES 데이터 기반
        </footer>
      </div>
    </div>
  );
}
