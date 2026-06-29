import type { Level, SimulationResult, SimulationState, Treatment } from "@/lib/types";

export const defaultSimulationState: SimulationState = {
  nadh: 4,
  fadh2: 2,
  oxygen: "sufficient",
  adp: "sufficient",
  treatment: "none"
};

export const treatmentLabels: Record<Treatment, string> = {
  none: "처리 없음",
  complexI: "복합체 I 저해",
  complexIII: "복합체 III 저해",
  complexIV: "복합체 IV 저해",
  atpSynthase: "ATP 합성효소 저해",
  uncoupler: "탈공역제 처리"
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const levelFromScore = (score: number, allowVeryHigh = false): Level => {
  if (allowVeryHigh && score >= 0.86) return "매우 높음";
  if (score >= 0.66) return "높음";
  if (score >= 0.38) return "보통";
  if (score >= 0.12) return "낮음";
  return "매우 낮음";
};

const oxygenLevelFromScore = (score: number): Level | "없음" => {
  if (score <= 0.03) return "없음";
  return levelFromScore(score);
};

export function calculateSimulation(state: SimulationState): SimulationResult {
  const nadhInput = clamp(state.nadh / 10);
  const fadh2Input = clamp(state.fadh2 / 10);

  let nadhPath = nadhInput;
  let fadh2Path = fadh2Input;
  let terminalFlow = 1;
  let pumpEfficiency = 1;
  let atpSynthaseEfficiency = state.adp === "sufficient" ? 1 : 0.38;
  let gradientRetention = 1;
  let oxygenUseMultiplier = 1;
  let treatmentNote = "정상 조건에서는 NADH가 복합체 I로, FADH2가 복합체 II로 전자를 넣고, 복합체 I·III·IV가 H+ 기울기를 만드는 데 기여합니다.";

  if (state.oxygen === "low") terminalFlow *= 0.45;
  if (state.oxygen === "none") terminalFlow *= 0.02;
  if (state.adp === "low") terminalFlow *= 0.7;

  switch (state.treatment) {
    case "complexI":
      nadhPath *= 0.08;
      pumpEfficiency *= 0.58;
      treatmentNote = "복합체 I 저해에서는 NADH에서 시작하는 전자 전달이 크게 막힙니다. FADH2는 복합체 II로 들어가므로 일부 전자 흐름은 유지될 수 있습니다.";
      break;
    case "complexIII":
      terminalFlow *= 0.04;
      pumpEfficiency *= 0.18;
      oxygenUseMultiplier *= 0.12;
      treatmentNote = "복합체 III 저해에서는 Q 이후로 전자가 거의 넘어가지 못해 시토크롬 c, 복합체 IV, 산소 환원으로 이어지는 흐름이 크게 줄어듭니다.";
      break;
    case "complexIV":
      terminalFlow *= 0.05;
      pumpEfficiency *= 0.24;
      oxygenUseMultiplier *= 0.03;
      treatmentNote = "복합체 IV 저해에서는 산소가 전자를 받아 H2O로 환원되는 단계가 막혀 O2 소비와 전자 전달이 거의 멈춥니다.";
      break;
    case "atpSynthase":
      atpSynthaseEfficiency *= 0.04;
      gradientRetention *= 1.42;
      terminalFlow *= 0.56;
      treatmentNote = "ATP 합성효소 저해에서는 H+가 바탕질로 돌아오기 어려워 H+ 기울기는 쌓이지만 ATP 생성은 거의 일어나지 않습니다.";
      break;
    case "uncoupler":
      gradientRetention *= 0.12;
      atpSynthaseEfficiency *= 0.08;
      oxygenUseMultiplier *= 1.25;
      terminalFlow *= 1.08;
      treatmentNote = "탈공역제는 H+가 ATP 합성효소가 아닌 다른 통로로 새게 하므로 H+ 기울기가 무너지고, O2 소비는 유지되거나 늘어도 ATP 생성은 낮아집니다.";
      break;
    default:
      break;
  }

  const entryScore = clamp((nadhPath + fadh2Path) / 2);
  const electronFlowScore = clamp(entryScore * terminalFlow * (state.oxygen === "none" ? 0.45 : 1.1));
  const protonPumpingScore = clamp((nadhPath * 0.42 + fadh2Path * 0.16 + electronFlowScore * 0.42) * pumpEfficiency);
  const gradientScore = clamp(protonPumpingScore * gradientRetention * (state.treatment === "atpSynthase" ? 1.2 : 1));
  const oxygenConsumptionScore = clamp(electronFlowScore * oxygenUseMultiplier * (state.oxygen === "sufficient" ? 1 : state.oxygen === "low" ? 0.45 : 0.01));

  const idealAtp = state.nadh * 2.5 + state.fadh2 * 1.5;
  const oxygenFactor = state.oxygen === "sufficient" ? 1 : state.oxygen === "low" ? 0.45 : 0.01;
  const atpTreatmentFactor =
    state.treatment === "complexI"
      ? 0.48
      : state.treatment === "complexIII"
        ? 0.06
        : state.treatment === "complexIV"
          ? 0.03
          : state.treatment === "atpSynthase"
            ? 0.03
            : state.treatment === "uncoupler"
              ? 0.08
              : 1;
  const atpEstimate = Math.round(idealAtp * oxygenFactor * atpTreatmentFactor * atpSynthaseEfficiency * 10) / 10;

  const nadhUse = state.treatment === "complexI" ? 0.08 : electronFlowScore;
  const fadh2Use = state.treatment === "complexIII" || state.treatment === "complexIV" ? electronFlowScore * 0.65 : electronFlowScore;
  const nadhRemaining = Math.round(state.nadh * (1 - clamp(nadhUse)) * 10) / 10;
  const fadh2Remaining = Math.round(state.fadh2 * (1 - clamp(fadh2Use)) * 10) / 10;

  const explanation = buildExplanation(state, atpEstimate, treatmentNote, gradientScore, oxygenConsumptionScore);
  const misconceptionHints = buildMisconceptionHints(state);

  return {
    electronFlowLevel: levelFromScore(electronFlowScore),
    protonGradientLevel: levelFromScore(gradientScore, true),
    oxygenConsumptionLevel: oxygenLevelFromScore(oxygenConsumptionScore),
    atpEstimate,
    atpLabel: atpEstimate.toFixed(1) + " ATP",
    nadhRemaining,
    fadh2Remaining,
    protonPumpingScore,
    electronFlowScore,
    oxygenConsumptionScore,
    treatmentNote,
    explanation,
    misconceptionHints
  };
}

function buildExplanation(
  state: SimulationState,
  atpEstimate: number,
  treatmentNote: string,
  gradientScore: number,
  oxygenConsumptionScore: number
): string[] {
  const lines = [treatmentNote];
  if (state.oxygen === "none") {
    lines.push("O2가 없으면 최종 전자 수용체가 사라져 복합체 IV 이후 전자 전달이 거의 멈추고 ATP 생성도 매우 낮아집니다.");
  } else if (state.oxygen === "low") {
    lines.push("O2가 부족하면 전자가 마지막 단계에서 빠르게 빠져나가지 못해 전체 흐름이 제한됩니다.");
  }
  if (state.adp === "low") {
    lines.push("ADP가 부족하면 H+ 기울기가 있어도 ATP로 바꿀 재료가 부족해 ATP 생성량이 줄어듭니다.");
  }
  if (state.treatment === "uncoupler") {
    lines.push("탈공역 상태에서는 O2 소비량과 ATP 생성량이 같은 방향으로 움직이지 않을 수 있습니다.");
  } else if (gradientScore > 0.65 && atpEstimate < 1) {
    lines.push("H+ 기울기가 높아도 ATP 합성효소가 막혀 있으면 ATP 생성은 낮게 남습니다.");
  } else if (oxygenConsumptionScore > 0.55 && atpEstimate > 0) {
    lines.push("전자 이동, H+ 펌핑, ATP 합성효소 작동, ADP 공급이 이어질 때 ATP 생성이 증가합니다.");
  }
  return lines.slice(0, 3);
}

function buildMisconceptionHints(state: SimulationState): string[] {
  const hints: string[] = [];
  if (state.oxygen !== "sufficient") hints.push("산소의 역할 미이해");
  if (state.treatment === "uncoupler") hints.push("저해제와 탈공역제 차이 혼동");
  if (state.treatment === "atpSynthase") hints.push("ATP 합성효소 역할 미이해");
  if (state.nadh > 0 && state.treatment === "complexI") hints.push("NADH와 FADH2 진입 위치 혼동");
  if (state.adp === "low") hints.push("ADP의 역할 미이해");
  return hints;
}
