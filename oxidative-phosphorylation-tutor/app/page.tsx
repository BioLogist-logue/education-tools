"use client";

import { useMemo, useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { SimulatorPanel } from "@/components/SimulatorPanel";
import { MitochondriaDiagram } from "@/components/MitochondriaDiagram";
import { ResultPanel } from "@/components/ResultPanel";
import { TutorChat } from "@/components/TutorChat";
import { LearningLogPanel } from "@/components/LearningLogPanel";
import { ExternalLinks } from "@/components/ExternalLinks";
import { SiteFooter } from "@/components/SiteFooter";
import { calculateSimulation, defaultSimulationState } from "@/lib/simulation";
import { logSimulationEvent } from "@/lib/supabase/queries";
import type { ChatMessage, LearningSession, SimulationResult, SimulationState, StudentProfile } from "@/lib/types";

interface AppReadyState {
  student: StudentProfile;
  session: LearningSession;
  chats?: ChatMessage[];
  offline?: boolean;
}

export default function Home() {
  const [app, setApp] = useState<AppReadyState | null>(null);
  const [state, setState] = useState<SimulationState>(defaultSimulationState);
  const [result, setResult] = useState<SimulationResult>(() => calculateSimulation(defaultSimulationState));
  const [prediction, setPrediction] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [simulationRunId, setSimulationRunId] = useState(0);

  const statusText = useMemo(() => {
    if (!app) return "";
    return app.offline ? "이 브라우저에 임시 저장" : "학습 기록 저장됨";
  }, [app]);

  if (!app) {
    return (
      <>
        <div className="fixed right-4 top-4 z-10 max-w-[calc(100vw-2rem)]"><ExternalLinks /></div>
        <LoginScreen
          onReady={(payload) => {
            setApp({ student: payload.student, session: payload.session, chats: payload.chats, offline: payload.offline });
            if (payload.state) setState(payload.state);
            if (payload.result) setResult(payload.result);
            if (payload.prediction) setPrediction(payload.prediction);
          }}
        />
        <SiteFooter />
      </>
    );
  }

  async function runSimulation() {
    if (!app) return;
    const nextResult = calculateSimulation(state);
    setResult(nextResult);
    setSimulationRunId((current) => current + 1);
    setIsSaving(true);
    try {
      await logSimulationEvent(app.session.id, app.student.id, "simulation_run", state, nextResult, prediction);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/80 bg-white/80 px-5 py-4 shadow-soft backdrop-blur">
          <div>
            <p className="text-sm font-semibold text-marine">{app.student.student_number} {app.student.student_name}</p>
            <h1 className="text-2xl font-bold text-ink">산화적 인산화 탐구실</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExternalLinks />
            <div className="rounded-md bg-mint/12 px-3 py-2 text-sm font-bold text-mint">{statusText}</div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <SimulatorPanel state={state} prediction={prediction} isSaving={isSaving} onStateChange={setState} onPredictionChange={setPrediction} onRun={runSimulation} />
          <div className="space-y-5">
            <MitochondriaDiagram state={state} result={result} runId={simulationRunId} />
            <ResultPanel result={result} state={state} />
            <LearningLogPanel state={state} result={result} prediction={prediction} />
          </div>
          <TutorChat student={app.student} session={app.session} state={state} result={result} prediction={prediction} initialMessages={app.chats} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
