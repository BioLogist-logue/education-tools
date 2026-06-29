"use client";

import type { ReactNode } from "react";
import { Play, SlidersHorizontal } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import { treatmentLabels } from "@/lib/simulation";
import type { AdpState, OxygenState, SimulationState, Treatment } from "@/lib/types";

interface SimulatorPanelProps {
  state: SimulationState;
  prediction: string;
  isSaving: boolean;
  onStateChange: (state: SimulationState) => void;
  onPredictionChange: (prediction: string) => void;
  onRun: () => void;
}

const oxygenOptions: Array<{ value: OxygenState; label: string }> = [
  { value: "sufficient", label: "충분함" },
  { value: "low", label: "부족함" },
  { value: "none", label: "없음" }
];

const adpOptions: Array<{ value: AdpState; label: string }> = [
  { value: "sufficient", label: "충분함" },
  { value: "low", label: "부족함" }
];

const treatmentOptions = Object.entries(treatmentLabels) as Array<[Treatment, string]>;

export function SimulatorPanel({ state, prediction, isSaving, onStateChange, onPredictionChange, onRun }: SimulatorPanelProps) {
  const setNumber = (key: "nadh" | "fadh2", value: number) => onStateChange({ ...state, [key]: value });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-md bg-mint/12 p-2 text-mint"><SlidersHorizontal size={20} /></span>
        <div>
          <h2 className="text-lg font-bold text-ink">조건 조작</h2>
          <p className="text-sm text-slate-500">바탕질의 기질과 처리 조건을 바꾼 뒤 예측해보세요.</p>
        </div>
      </div>

      <div className="space-y-5">
        <Slider label="NADH 개수" value={state.nadh} onChange={(value) => setNumber("nadh", value)} />
        <Slider label="FADH2 개수" value={state.fadh2} onChange={(value) => setNumber("fadh2", value)} />

        <Field label="O2 상태">
          <div className="grid grid-cols-3 gap-2">
            {oxygenOptions.map((option) => (
              <Choice key={option.value} active={state.oxygen === option.value} onClick={() => onStateChange({ ...state, oxygen: option.value })}>{option.label}</Choice>
            ))}
          </div>
        </Field>

        <Field label="ADP 상태">
          <div className="grid grid-cols-2 gap-2">
            {adpOptions.map((option) => (
              <Choice key={option.value} active={state.adp === option.value} onClick={() => onStateChange({ ...state, adp: option.value })}>{option.label}</Choice>
            ))}
          </div>
        </Field>

        <Field label="처리 조건">
          <select value={state.treatment} onChange={(event) => onStateChange({ ...state, treatment: event.target.value as Treatment })} className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm outline-none ring-mint/30 focus:ring-4">
            {treatmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">예측하기</span>
          <textarea value={prediction} onChange={(event) => onPredictionChange(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 outline-none ring-mint/30 focus:ring-4" placeholder="예: O2가 없으면 전자 전달이 멈추고 ATP 생성도 줄어들 것 같다." />
        </label>

        <button onClick={onRun} disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-marine px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-marine/90 disabled:opacity-60">
          <Play size={18} /> {isSaving ? "저장 중..." : "시뮬레이션 실행"}
        </button>
      </div>
    </section>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span><ChemicalText text={label} /></span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-ink">{value}</span>
      </div>
      <input type="range" min={0} max={10} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-mint" />
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700"><ChemicalText text={label} /></p>
      {children}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  const className = active
    ? "rounded-md border border-marine bg-marine px-3 py-2 text-sm font-semibold text-white transition"
    : "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50";
  return <button type="button" className={className} onClick={onClick}>{children}</button>;
}
