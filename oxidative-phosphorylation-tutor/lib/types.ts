export type OxygenState = "sufficient" | "low" | "none";
export type AdpState = "sufficient" | "low";
export type Treatment = "none" | "complexI" | "complexIII" | "complexIV" | "atpSynthase" | "uncoupler";

export type Level = "매우 낮음" | "낮음" | "보통" | "높음" | "매우 높음";

export interface SimulationState {
  nadh: number;
  fadh2: number;
  oxygen: OxygenState;
  adp: AdpState;
  treatment: Treatment;
}

export interface SimulationResult {
  electronFlowLevel: Level;
  protonGradientLevel: Level;
  oxygenConsumptionLevel: Level | "없음";
  atpEstimate: number;
  atpLabel: string;
  nadhRemaining: number;
  fadh2Remaining: number;
  protonPumpingScore: number;
  electronFlowScore: number;
  oxygenConsumptionScore: number;
  treatmentNote: string;
  explanation: string[];
  misconceptionHints: string[];
}

export interface StudentProfile {
  id: string;
  student_number: string;
  student_name: string;
}

export interface LearningSession {
  id: string;
  student_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "student" | "assistant";
  message: string;
  misconception_tags?: string[];
  created_at?: string;
}

export interface TutorResponse {
  reply: string;
  misconception_tags: string[];
  next_question: string;
  confidence: "low" | "medium" | "high";
}
