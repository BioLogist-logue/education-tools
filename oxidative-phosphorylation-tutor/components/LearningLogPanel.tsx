"use client";

import { ClipboardList, Download } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import type { SimulationResult, SimulationState } from "@/lib/types";
import { treatmentLabels } from "@/lib/simulation";

export function LearningLogPanel({ state, result, prediction }: { state: SimulationState; result: SimulationResult; prediction: string }) {
  function downloadSummary() {
    const now = new Date();
    const html = buildSummaryHtml(state, result, prediction, now);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "oxidative-phosphorylation-summary.html";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-amber/15 p-2 text-amber"><ClipboardList size={20} /></span>
          <div>
            <h2 className="text-lg font-bold text-ink">학습 로그</h2>
            <p className="text-sm text-slate-500">이번 실행 조건과 예측을 정리합니다.</p>
          </div>
        </div>
        <button type="button" onClick={downloadSummary} className="inline-flex items-center gap-2 rounded-md bg-marine px-3 py-2 text-sm font-semibold text-white transition hover:bg-marine/90">
          <Download size={16} /> 정리 파일 다운로드
        </button>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <LogItem label="NADH / FADH2" value={String(state.nadh) + " / " + String(state.fadh2)} />
        <LogItem label="처리 조건" value={treatmentLabels[state.treatment]} />
        <LogItem label="산소 상태" value={state.oxygen === "sufficient" ? "충분함" : state.oxygen === "low" ? "부족함" : "없음"} />
        <LogItem label="ADP 상태" value={state.adp === "sufficient" ? "충분함" : "부족함"} />
        <LogItem label="ATP 생성" value={result.atpLabel} />
        <LogItem label="전자 이동" value={result.electronFlowLevel} />
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="mb-1 font-bold text-slate-800">학생 예측</p>
        <p><ChemicalText text={prediction || "아직 예측이 입력되지 않았습니다."} /></p>
      </div>
      <div className="mt-4 rounded-md bg-mint/10 p-4 text-sm leading-6 text-slate-700">
        <p className="mb-1 font-bold text-mint">핵심 정리</p>
        <p><ChemicalText text="전자 전달은 H+ 기울기를 만들고, ATP 합성효소는 그 기울기를 이용해 ADP와 무기 인산으로 ATP를 만듭니다. O2는 마지막 전자 수용체입니다." /></p>
      </div>
    </section>
  );
}

function LogItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500"><ChemicalText text={label} /></p>
      <p className="mt-1 font-bold text-ink"><ChemicalText text={value} /></p>
    </div>
  );
}

function buildSummaryHtml(state: SimulationState, result: SimulationResult, prediction: string, now: Date) {
  const rows = [
    ["NADH", String(state.nadh)],
    ["FADH2", String(state.fadh2)],
    ["산소 상태", state.oxygen === "sufficient" ? "충분함" : state.oxygen === "low" ? "부족함" : "없음"],
    ["ADP 상태", state.adp === "sufficient" ? "충분함" : "부족함"],
    ["처리 조건", treatmentLabels[state.treatment]],
    ["전자 이동 속도", result.electronFlowLevel],
    ["H+ 농도 기울기", result.protonGradientLevel],
    ["산소 소비량", result.oxygenConsumptionLevel],
    ["ATP 생성량", result.atpLabel],
    ["NADH 잔량", String(result.nadhRemaining)],
    ["FADH2 잔량", String(result.fadh2Remaining)]
  ];
  const tableRows = rows.map(([key, value]) => "<tr><th>" + escapeHtml(key) + "</th><td>" + escapeHtml(value) + "</td></tr>").join("");
  const explanations = result.explanation.map((line) => "<p>• " + escapeHtml(line) + "</p>").join("");
  return "<!doctype html><html lang='ko'><head><meta charset='utf-8'><title>산화적 인산화 학습 정리</title><style>body{font-family:Arial,'Malgun Gothic',sans-serif;background:#eef7f3;color:#122022;margin:0;padding:32px}.sheet{max-width:860px;margin:0 auto;background:white;border:1px solid #dbe5e2;border-radius:12px;padding:32px;box-shadow:0 14px 35px rgba(18,32,34,.12)}h1{margin:0 0 8px;font-size:28px}h2{margin-top:28px;color:#176b87}p{line-height:1.7}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #d8e4e2;padding:10px;text-align:left}th{background:#f1faf7}.note{background:#f7fbfb;border-left:5px solid #37a987;padding:14px;margin-top:12px}.footer{margin-top:28px;color:#64748b;font-size:13px}</style></head><body><article class='sheet'><h1>산화적 인산화 학습 정리</h1><p>" + escapeHtml(now.toLocaleString("ko-KR")) + "</p><h2>실행 조건과 결과</h2><table><tbody>" + tableRows + "</tbody></table><h2>학생 예측</h2><div class='note'>" + escapeHtml(prediction || "예측을 입력하지 않았습니다.") + "</div><h2>결과 해석</h2>" + explanations + "<h2>핵심 개념</h2><p>산소는 전자전달계의 최종 전자 수용체입니다. NADH는 복합체 I로, FADH2는 복합체 II로 전자를 전달하며, 복합체 I·III·IV는 H+ 기울기를 만드는 데 기여합니다. ATP 합성효소는 H+가 바탕질 쪽으로 돌아오는 흐름을 이용해 ATP를 합성합니다.</p><p class='footer'>© Copyright 2026 All rights reserved by BioLogist</p></article></body></html>";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}
