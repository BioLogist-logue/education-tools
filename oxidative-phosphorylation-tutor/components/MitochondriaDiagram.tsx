"use client";

import type { SimulationResult, SimulationState } from "@/lib/types";
import { treatmentLabels } from "@/lib/simulation";

const NADH_TO_OXYGEN_PATH = "M 110 332 C 114 276, 118 224, 122 180 C 178 166, 236 178, 294 192 C 352 205, 374 192, 414 180 C 462 166, 486 178, 505 192 C 548 224, 580 206, 616 180 C 604 226, 586 278, 558 322";
const FADH2_TO_OXYGEN_PATH = "M 222 332 C 224 292, 224 270, 222 250 C 246 228, 268 207, 294 192 C 352 205, 374 192, 414 180 C 462 166, 486 178, 505 192 C 548 224, 580 206, 616 180 C 604 226, 586 278, 558 322";
const NADH_TO_COMPLEX_III_PATH = "M 110 332 C 114 276, 118 224, 122 180 C 178 166, 236 178, 294 192 C 344 202, 372 192, 398 182";
const FADH2_TO_COMPLEX_III_PATH = "M 222 332 C 224 292, 224 270, 222 250 C 246 228, 268 207, 294 192 C 344 202, 372 192, 398 182";
const NADH_TO_COMPLEX_IV_PATH = "M 110 332 C 114 276, 118 224, 122 180 C 178 166, 236 178, 294 192 C 352 205, 374 192, 414 180 C 462 166, 486 178, 505 192 C 548 224, 580 206, 616 180";
const FADH2_TO_COMPLEX_IV_PATH = "M 222 332 C 224 292, 224 270, 222 250 C 246 228, 268 207, 294 192 C 352 205, 374 192, 414 180 C 462 166, 486 178, 505 192 C 548 224, 580 206, 616 180";

interface MitochondriaDiagramProps {
  state: SimulationState;
  result: SimulationResult;
  runId: number;
}

export function MitochondriaDiagram({ state, result, runId }: MitochondriaDiagramProps) {
  const blockedAtIII = state.treatment === "complexIII";
  const blockedAtIV = state.treatment === "complexIV" || state.oxygen === "none";
  const nadhPath = blockedAtIII ? NADH_TO_COMPLEX_III_PATH : blockedAtIV ? NADH_TO_COMPLEX_IV_PATH : NADH_TO_OXYGEN_PATH;
  const fadh2Path = blockedAtIII ? FADH2_TO_COMPLEX_III_PATH : blockedAtIV ? FADH2_TO_COMPLEX_IV_PATH : FADH2_TO_OXYGEN_PATH;
  const electronFactor = blockedAtIII || blockedAtIV ? 0.5 : 1;

  const nadhElectrons = state.nadh > 0 && state.treatment !== "complexI" ? Math.min(10, Math.max(1, Math.ceil(state.nadh * 2 * electronFactor))) : 0;
  const fadh2Electrons = state.fadh2 > 0 ? Math.min(10, Math.max(1, Math.ceil(state.fadh2 * 2 * electronFactor))) : 0;
  const protonPumpCount = result.protonPumpingScore < 0.04 ? 0 : Math.min(12, Math.max(1, Math.round(result.protonPumpingScore * 14)));
  const gradientCount = protonPumpCount;
  const protonReturnCount = state.treatment === "atpSynthase" || result.atpEstimate <= 0 ? 0 : Math.min(7, Math.max(1, Math.round(result.atpEstimate / 2.4)));
  const atpCount = Math.max(0, Math.min(6, Math.round(result.atpEstimate / 2.6)));
  const waterCount = result.oxygenConsumptionScore < 0.06 || state.oxygen === "none" || state.treatment === "complexIII" || state.treatment === "complexIV" ? 0 : Math.min(4, Math.max(1, Math.round(result.oxygenConsumptionScore * 5)));
  const leakCount = state.treatment === "uncoupler" ? Math.max(3, Math.min(8, protonPumpCount)) : 0;

  const complexIActive = state.treatment !== "complexI";
  const complexIIIActive = state.treatment !== "complexIII";
  const complexIVActive = state.treatment !== "complexIV" && state.oxygen !== "none";
  const synthaseActive = state.treatment !== "atpSynthase";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">마이토콘드리아 내막 시뮬레이션</h2>
          <p className="text-sm text-slate-500">H<sup>+</sup> 기울기 형성, ATP 합성효소를 통한 H<sup>+</sup> 재유입, ADP의 ATP 전환을 순서대로 보여줍니다.</p>
        </div>
        <span className="rounded-md bg-mint/12 px-3 py-2 text-sm font-bold text-mint">처리 조건: {treatmentLabels[state.treatment]}</span>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-gradient-to-b from-sky-50 to-emerald-50">
        <svg key={runId} viewBox="0 0 900 430" className="h-auto w-full" role="img" aria-label="산화적 인산화 시뮬레이션 다이어그램">
          <defs>
            <marker id="arrow-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#37a987" /></marker>
            <radialGradient id="electronGlow"><stop offset="0%" stopColor="#fff7cc" /><stop offset="55%" stopColor="#f2a93b" /><stop offset="100%" stopColor="#d97706" /></radialGradient>
            <radialGradient id="waterGlow"><stop offset="0%" stopColor="#dff6ff" /><stop offset="100%" stopColor="#38bdf8" /></radialGradient>
          </defs>

          <rect x="0" y="0" width="900" height="122" fill="#dff5ff" />
          <rect x="0" y="278" width="900" height="152" fill="#eefbf5" />
          <text x="24" y="38" fill="#176b87" fontSize="18" fontWeight="900">막사이공간</text>
          <text x="24" y="398" fill="#367064" fontSize="18" fontWeight="900">바탕질</text>

          <path d="M 20 162 C 88 130, 154 194, 226 162 S 368 130, 442 162 S 588 194, 878 162" fill="none" stroke="#37a987" strokeWidth="25" strokeLinecap="round" opacity="0.52" />
          <path d="M 20 220 C 88 188, 154 252, 226 220 S 368 188, 442 220 S 588 252, 878 220" fill="none" stroke="#176b87" strokeWidth="25" strokeLinecap="round" opacity="0.52" />

          <Complex x={92} y={138} label="I" active={complexIActive} />
          <Complex x={194} y={224} label="II" active />
          <Carrier x={294} y={192} label="Q" />
          <Complex x={386} y={138} label="III" active={complexIIIActive} />
          <Carrier x={504} y={192} label="c" />
          <Complex x={586} y={138} label="IV" active={complexIVActive} />
          <Synthase x={704} y={154} active={synthaseActive} />

          <path d={nadhPath} fill="none" stroke="#f2a93b" strokeWidth="2" strokeDasharray="5 10" opacity="0.14" />
          <path d={fadh2Path} fill="none" stroke="#f2a93b" strokeWidth="2" strokeDasharray="5 10" opacity="0.12" />

          <MoleculeLabel x={56} y={318} label="NADH" />
          <text x="58" y="344" fill="#64748b" fontSize="13" fontWeight="800">→ NAD<tspan baselineShift="super" fontSize="9">+</tspan> + e<tspan baselineShift="super" fontSize="9">−</tspan></text>
          <MoleculeLabel x={168} y={318} label="FADH" subscript="2" />
          <text x="170" y="344" fill="#64748b" fontSize="13" fontWeight="800">→ FAD + e<tspan baselineShift="super" fontSize="9">−</tspan></text>

          <text x="112" y="66" fill="#176b87" fontSize="13" fontWeight="900">H<tspan baselineShift="super" fontSize="9">+</tspan> 기울기 형성</text>
          {Array.from({ length: gradientCount }).map((_, index) => <GradientProton key={"gradient-h-" + index} x={122 + (index % 12) * 40} y={78 + (index % 3) * 11} delay={3.2 + index * 0.08} />)}

          <OxygenToWater x={528} y={306} waterCount={waterCount} />
          <AdpToAtp x={662} y={300} atpCount={atpCount} active={synthaseActive && protonReturnCount > 0} />

          {Array.from({ length: nadhElectrons }).map((_, index) => <Electron key={"nadh-e-" + index} path={nadhPath} delay={index * 0.42} />)}
          {Array.from({ length: fadh2Electrons }).map((_, index) => <Electron key={"fadh2-e-" + index} path={fadh2Path} delay={0.35 + index * 0.44} />)}

          {Array.from({ length: protonPumpCount }).map((_, index) => {
            const pumpX = [118, 414, 614][index % 3];
            return <ProtonMove key={"pump-h-" + index} x={pumpX + (index % 2) * 10} fromY={270} toY={78 + (index % 3) * 11} delay={0.6 + index * 0.24} dur="5.2s" />;
          })}

          {Array.from({ length: protonReturnCount }).map((_, index) => {
            const startX = 444 + (index % 6) * 36;
            const startY = 82 + (index % 3) * 9;
            const path = "M " + startX + " " + startY + " C 610 " + startY + ", 744 92, 752 138 L 726 300";
            return <ProtonPath key={"return-h-" + index} path={path} delay={4.2 + index * 0.28} dur="5.4s" />;
          })}

          {Array.from({ length: leakCount }).map((_, index) => {
            const startX = 642 + (index % 4) * 18;
            const startY = 82 + (index % 3) * 9;
            const endX = 650 + (index % 4) * 18;
            const path = "M " + startX + " " + startY + " C 650 145, 675 225, " + endX + " 286";
            return <ProtonPath key={"leak-h-" + index} path={path} delay={3.2 + index * 0.2} dur="4.8s" />;
          })}

          <LegendItem x={32} y={66} color="#f2a93b" label="전자" />
          <LegendItem x={32} y={88} color="#e46a5d" label="H" superscript="+" suffix=" 펌핑" />
          <LegendItem x={32} y={110} color="#37a987" label="ADP → ATP" />
        </svg>
      </div>
    </section>
  );
}

function Electron({ path, delay }: { path: string; delay: number }) {
  return (
    <circle r="8" fill="url(#electronGlow)" stroke="#b45309" strokeWidth="1.5">
      <animateMotion path={path} dur="6.8s" begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
      <animate attributeName="opacity" values="0;1;1;0" dur="6.8s" begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
    </circle>
  );
}

function ProtonMove({ x, fromY, toY, delay, dur }: { x: number; fromY: number; toY: number; delay: number; dur: string }) {
  return (
    <g>
      <circle cx={x} cy={fromY} r="10" fill="#e46a5d" stroke="#b91c1c" strokeWidth="1">
        <animate attributeName="cy" from={String(fromY)} to={String(toY)} dur={dur} begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
        <animate attributeName="opacity" values="0;1;1;0.2" dur={dur} begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
      </circle>
      <text x={x - 5.8} y={fromY + 4.5} fill="white" fontSize="10" fontWeight="900">H<tspan baselineShift="super" fontSize="7">+</tspan>
        <animate attributeName="y" from={String(fromY + 4.5)} to={String(toY + 4.5)} dur={dur} begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
        <animate attributeName="opacity" values="0;1;1;0.2" dur={dur} begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
      </text>
    </g>
  );
}

function ProtonPath({ path, delay, dur }: { path: string; delay: number; dur: string }) {
  return (
    <g opacity="0">
      <circle r="10" fill="#e46a5d" stroke="#b91c1c" strokeWidth="1" />
      <text x="-5.8" y="4.5" fill="white" fontSize="10" fontWeight="900">H<tspan baselineShift="super" fontSize="7">+</tspan></text>
      <animateMotion path={path} dur={dur} begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
      <animate attributeName="opacity" values="0;1;1;0.25" dur={dur} begin={String(delay) + "s"} repeatCount="2" fill="freeze" />
    </g>
  );
}

function GradientProton({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g opacity="0">
      <circle cx={x} cy={y} r="8" fill="#e46a5d" opacity="0.82" />
      <text x={x - 4.8} y={y + 3.8} fill="white" fontSize="8" fontWeight="900">H<tspan baselineShift="super" fontSize="6">+</tspan></text>
      <animate attributeName="opacity" values="0;0;1;1" dur="5.8s" begin={String(delay) + "s"} fill="freeze" />
    </g>
  );
}

function OxygenToWater({ x, y, waterCount }: { x: number; y: number; waterCount: number }) {
  return (
    <g>
      <g>
        <circle cx={x} cy={y} r="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" />
        <circle cx={x + 25} cy={y} r="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" />
        <text x={x + 4} y={y + 5} fill="#0f172a" fontSize="13" fontWeight="900">O<tspan baselineShift="sub" fontSize="9">2</tspan></text>
      </g>
      <g opacity={waterCount > 0 ? 1 : 0.35}>
        <circle cx={x - 22} cy={y + 36} r="9" fill="#e46a5d" />
        <text x={x - 28} y={y + 40} fill="white" fontSize="9" fontWeight="900">H<tspan baselineShift="super" fontSize="6">+</tspan></text>
        <circle cx={x + 58} cy={y + 36} r="9" fill="#e46a5d" />
        <text x={x + 52} y={y + 40} fill="white" fontSize="9" fontWeight="900">H<tspan baselineShift="super" fontSize="6">+</tspan></text>
      </g>
      <path d={"M " + (x + 38) + " " + (y + 16) + " C " + (x + 55) + " " + (y + 28) + ", " + (x + 62) + " " + (y + 50) + ", " + (x + 48) + " " + (y + 66)} fill="none" stroke="#38bdf8" strokeWidth="3" markerEnd="url(#arrow-mint)" opacity={waterCount > 0 ? 0.8 : 0.25} />
      {waterCount > 0 ? Array.from({ length: waterCount }).map((_, index) => <WaterDrop key={"water-" + index} x={x + 46 + index * 20} y={y + 74 - (index % 2) * 10} delay={6.2 + index * 0.35} />) : <text x={x - 4} y={y + 76} fill="#64748b" fontSize="12" fontWeight="800">물 생성 낮음</text>}
    </g>
  );
}

function WaterDrop({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g opacity="0">
      <path d={"M " + x + " " + (y - 16) + " C " + (x - 13) + " " + y + ", " + (x - 9) + " " + (y + 15) + ", " + x + " " + (y + 18) + " C " + (x + 12) + " " + (y + 15) + ", " + (x + 14) + " " + y + ", " + x + " " + (y - 16) + " Z"} fill="url(#waterGlow)" stroke="#0284c7" strokeWidth="1.5" />
      <text x={x - 10} y={y + 6} fill="#0f172a" fontSize="10" fontWeight="900">H<tspan baselineShift="sub" fontSize="7">2</tspan>O</text>
      <animate attributeName="opacity" values="0;0;1;1" dur="6.8s" begin={String(delay) + "s"} fill="freeze" />
    </g>
  );
}

function AdpToAtp({ x, y, atpCount, active }: { x: number; y: number; atpCount: number; active: boolean }) {
  return (
    <g>
      <g opacity={active ? 1 : 0.4}>
        <rect x={x} y={y} width="46" height="24" rx="7" fill="#e2e8f0" stroke="#64748b" />
        <text x={x + 9} y={y + 16} fill="#122022" fontSize="12" fontWeight="900">ADP</text>
        <circle cx={x + 60} cy={y + 12} r="8" fill="#cbd5e1" stroke="#64748b" />
        <text x={x + 56} y={y + 16} fill="#122022" fontSize="10" fontWeight="900">P<tspan baselineShift="sub" fontSize="7">i</tspan></text>
        <path d={"M " + (x + 75) + " " + (y + 12) + " L " + (x + 98) + " " + (y + 12)} stroke="#37a987" strokeWidth="3" markerEnd="url(#arrow-mint)" />
      </g>
      {active ? Array.from({ length: Math.max(1, atpCount) }).map((_, index) => <AtpBadge key={"atp-" + index} x={x + 108 + (index % 3) * 42} y={y + 2 + Math.floor(index / 3) * 24} delay={6.8 + index * 0.32} />) : <text x={x + 108} y={y + 18} fill="#64748b" fontSize="12" fontWeight="800">ATP 낮음</text>}
    </g>
  );
}

function AtpBadge({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g opacity="0">
      <rect x={x} y={y} width="38" height="22" rx="7" fill="#f2a93b" stroke="#b45309" strokeWidth="1.4" />
      <text x={x + 7} y={y + 15} fill="#122022" fontSize="11" fontWeight="900">ATP</text>
      <animate attributeName="opacity" values="0;0;1;1" dur="5.8s" begin={String(delay) + "s"} fill="freeze" />
    </g>
  );
}

function MoleculeLabel({ x, y, label, subscript }: { x: number; y: number; label: string; subscript?: string }) {
  return <text x={x} y={y} fill="#122022" fontSize="17" fontWeight="900">{label}{subscript ? <tspan baselineShift="sub" fontSize="11">{subscript}</tspan> : null}</text>;
}

function Complex({ x, y, label, active }: { x: number; y: number; label: string; active: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width="58" height="92" rx="8" fill={active ? "#176b87" : "#94a3b8"} />
      <text x={x + 20} y={y + 54} fill="white" fontSize="24" fontWeight="900">{label}</text>
      {!active ? <line x1={x + 8} y1={y + 12} x2={x + 50} y2={y + 80} stroke="#ef4444" strokeWidth="5" strokeLinecap="round" /> : null}
    </g>
  );
}

function Carrier({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="23" fill="#37a987" />
      <text x={x - 8} y={y + 6} fill="white" fontSize="17" fontWeight="900">{label}</text>
    </g>
  );
}

function Synthase({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width="44" height="84" rx="10" fill={active ? "#37a987" : "#94a3b8"} />
      <circle cx={x + 22} cy={y + 104} r="28" fill={active ? "#37a987" : "#94a3b8"} />
      <text x={x + 8} y={y + 109} fill="white" fontSize="13" fontWeight="900">ATP</text>
      {!active ? <line x1={x + 4} y1={y + 12} x2={x + 40} y2={y + 124} stroke="#ef4444" strokeWidth="5" strokeLinecap="round" /> : null}
    </g>
  );
}

function LegendItem({ x, y, color, label, superscript, suffix = "" }: { x: number; y: number; color: string; label: string; superscript?: string; suffix?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="6" fill={color} />
      <text x={x + 11} y={y + 5} fill="#475569" fontSize="12" fontWeight="800">{label}{superscript ? <tspan baselineShift="super" fontSize="8">{superscript}</tspan> : null}{suffix}</text>
    </g>
  );
}
