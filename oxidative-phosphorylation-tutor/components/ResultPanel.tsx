"use client";

import { BatteryCharging, Calculator, Droplet, Wind } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import type { SimulationResult, SimulationState } from "@/lib/types";

export function ResultPanel({ result, state }: { result: SimulationResult; state: SimulationState }) {
  const idealNadhAtp = state.nadh * 2.5;
  const idealFadh2Atp = state.fadh2 * 1.5;
  const idealTotal = idealNadhAtp + idealFadh2Atp;
  const efficiency = idealTotal > 0 ? Math.round((result.atpEstimate / idealTotal) * 100) : 0;
  const metrics = [
    { label: "H+ 농도 기울기", value: result.protonGradientLevel, icon: Droplet },
    { label: "O2 소비량", value: result.oxygenConsumptionLevel, icon: Wind },
    { label: "ATP 생성량", value: result.atpLabel, icon: BatteryCharging }
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">결과</h2>
          <p className="text-sm text-slate-500">교과서 기준 ATP 환산값을 바탕으로 조건별 감소를 반영했습니다.</p>
        </div>
        <div className="rounded-md bg-amber/15 px-3 py-2 text-sm font-bold text-amber"><ChemicalText text={result.atpLabel} /></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-md border border-slate-200 bg-panel p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><Icon size={17} /> <ChemicalText text={metric.label} /></div>
              <p className="text-xl font-bold text-ink"><ChemicalText text={String(metric.value)} /></p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-md border border-amber/30 bg-amber/10 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber"><Calculator size={17} /> ATP 계산</div>
        <div className="space-y-2 text-sm leading-6 text-slate-700">
          <p><ChemicalText text={"NADH " + state.nadh + "개 × 2.5 ATP = " + idealNadhAtp.toFixed(1) + " ATP"} /></p>
          <p><ChemicalText text={"FADH2 " + state.fadh2 + "개 × 1.5 ATP = " + idealFadh2Atp.toFixed(1) + " ATP"} /></p>
          <p className="font-semibold text-ink"><ChemicalText text={"정상 조건 예상 합계 = " + idealTotal.toFixed(1) + " ATP"} /></p>
          <p><ChemicalText text={"현재 조건 반영 결과 = " + result.atpEstimate.toFixed(1) + " ATP (" + efficiency + "% 수준)"} /></p>
        </div>
      </div>

      <div className="mt-5 rounded-md bg-marine/8 p-4">
        <p className="mb-2 text-sm font-bold text-marine">해석</p>
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {result.explanation.map((line) => <li key={line}>• <ChemicalText text={line} /></li>)}
        </ul>
      </div>
    </section>
  );
}
