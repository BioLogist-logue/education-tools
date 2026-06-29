import { ExternalLinks } from "@/components/ExternalLinks";
import { SiteFooter } from "@/components/SiteFooter";
import { TeacherDemoDashboard } from "@/components/TeacherDemoDashboard";

export default function TeacherDemoPage() {
  return (
    <>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/80 bg-white/80 px-5 py-4 shadow-soft backdrop-blur">
          <div>
            <p className="text-sm font-semibold text-marine">교사용 확인 화면</p>
            <h1 className="text-2xl font-bold text-ink">학습 로그 대시보드</h1>
          </div>
          <ExternalLinks />
        </header>
        <TeacherDemoDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
