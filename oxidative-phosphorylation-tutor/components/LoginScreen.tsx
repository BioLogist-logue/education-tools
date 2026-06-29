"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import { resumeSession, upsertStudentAndStartSession } from "@/lib/supabase/queries";
import type { ChatMessage, LearningSession, SimulationResult, SimulationState, StudentProfile } from "@/lib/types";

interface ReadyPayload {
  student: StudentProfile;
  session: LearningSession;
  state?: SimulationState | null;
  result?: SimulationResult | null;
  prediction?: string;
  chats?: ChatMessage[];
  offline?: boolean;
}

export function LoginScreen({ onReady }: { onReady: (payload: ReadyPayload) => void }) {
  const [studentNumber, setStudentNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<null | Awaited<ReturnType<typeof upsertStudentAndStartSession>>>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!studentNumber.trim() || !studentName.trim()) {
      setError("학번과 이름을 모두 입력하세요.");
      return;
    }
    if (!consent) {
      setError("자료 수집 안내에 동의해야 학습을 시작할 수 있습니다.");
      return;
    }
    setLoading(true);
    try {
      const result = await upsertStudentAndStartSession(studentNumber.trim(), studentName.trim());
      if (result.recentSession) {
        setPending(result);
      } else {
        onReady({ student: result.student, session: result.session, offline: result.offline });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResume() {
    if (!pending?.recentSession) return;
    setLoading(true);
    const resumed = await resumeSession(pending.student, pending.recentSession);
    onReady({
      student: pending.student,
      session: pending.recentSession,
      state: resumed.state,
      result: resumed.result,
      prediction: resumed.prediction,
      chats: resumed.chats,
      offline: pending.offline
    });
  }

  function handleNewSession() {
    if (!pending) return;
    onReady({ student: pending.student, session: pending.session, offline: pending.offline });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-white/80 bg-white/88 p-8 shadow-soft backdrop-blur">
        <div className="mb-8">
          <p className="text-sm font-semibold text-marine">고등학교 생명과학 탐구</p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">AI 튜터와 함께하는 산화적 인산화</h1>
          <p className="mt-3 text-base leading-7 text-slate-600"><ChemicalText text="전자 전달, H+ 기울기, ATP 생성의 관계를 직접 조작하고 설명해보세요." /></p>
        </div>

        {pending?.recentSession ? (
          <div className="space-y-4">
            <div className="rounded-md border border-mint/30 bg-mint/10 p-4 text-sm text-slate-700">
              최근 학습 기록이 있습니다. 이어서 학습하거나 새 세션으로 시작할 수 있습니다.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleResume} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md bg-marine px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-marine/90 disabled:opacity-60">
                <RotateCcw size={18} /> 이어서 학습하기
              </button>
              <button type="button" onClick={handleNewSession} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 font-semibold text-ink transition hover:bg-slate-50 disabled:opacity-60">
                <ArrowRight size={18} /> 새 학습 시작
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">학번</span>
              <input value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none ring-mint/30 transition focus:ring-4" placeholder="예: 20513" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">이름</span>
              <input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none ring-mint/30 transition focus:ring-4" placeholder="예: 김생명" />
            </label>

            <label className="flex gap-3 rounded-md border border-slate-200 bg-panel p-4 text-sm leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-marine accent-marine"
              />
              <span>
                에듀테크 교육 앱 개발을 위한 자료 수집에 동의합니다. 학번, 이름, 시뮬레이션 조건과 결과, AI 튜터 대화 기록은 수업 운영과 학습 분석을 위해 저장될 수 있습니다.
              </span>
            </label>

            {error ? <p className="rounded-md bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p> : null}
            <button disabled={loading || !consent} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-marine px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-marine/90 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "준비 중..." : "학습 시작"} <ArrowRight size={18} />
            </button>
          </form>
        )}

        <p className="mt-7 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">
          이 도구는 수업 중 학습 기록 저장을 위해 학번과 이름을 사용합니다. 수업 목적에 필요한 범위에서만 확인하며, 교사용 화면에서 학생별 학습 상황을 살펴볼 수 있습니다.
        </p>
      </section>
    </main>
  );
}
