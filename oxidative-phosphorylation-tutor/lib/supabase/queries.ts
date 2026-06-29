import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatMessage, LearningSession, SimulationResult, SimulationState, StudentProfile, TutorResponse } from "@/lib/types";

const localStudentKey = "op-tutor-student";
const localSessionKey = "op-tutor-session";
const localChatKey = "op-tutor-chat";
const localLogKey = "op-tutor-logs";

function createLocalId(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10);
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function upsertStudentAndStartSession(studentNumber: string, studentName: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const student: StudentProfile = {
      id: createLocalId("student"),
      student_number: studentNumber,
      student_name: studentName
    };
    const session: LearningSession = {
      id: createLocalId("session"),
      student_id: student.id,
      title: "산화적 인산화 학습 세션",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(localStudentKey, JSON.stringify(student));
    localStorage.setItem(localSessionKey, JSON.stringify(session));
    return { student, session, recentSession: null, offline: true };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .upsert(
      { student_number: studentNumber, student_name: studentName, updated_at: new Date().toISOString() },
      { onConflict: "student_number,student_name" }
    )
    .select("id, student_number, student_name")
    .single();

  if (studentError) throw studentError;

  const { data: recentSession } = await supabase
    .from("learning_sessions")
    .select("*")
    .eq("student_id", student.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: session, error: sessionError } = await supabase
    .from("learning_sessions")
    .insert({ student_id: student.id })
    .select("*")
    .single();

  if (sessionError) throw sessionError;

  await logSimulationEvent(session.id, student.id, "session_started", null, null, null);
  return { student, session, recentSession, offline: false };
}

export async function resumeSession(student: StudentProfile, session: LearningSession) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    localStorage.setItem(localStudentKey, JSON.stringify(student));
    localStorage.setItem(localSessionKey, JSON.stringify(session));
    return { state: null, result: null, prediction: "", chats: readLocalChats() };
  }

  const { data: lastSimulation } = await supabase
    .from("simulation_logs")
    .select("simulation_state, simulation_result, student_prediction")
    .eq("session_id", session.id)
    .eq("event_type", "simulation_run")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: chatRows } = await supabase
    .from("chat_logs")
    .select("id, role, message, misconception_tags, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true })
    .limit(24);

  const chats: ChatMessage[] = (chatRows ?? []).map((row) => ({
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "student",
    message: row.message,
    misconception_tags: row.misconception_tags ?? [],
    created_at: row.created_at
  }));

  return {
    state: (lastSimulation?.simulation_state as SimulationState | null) ?? null,
    result: (lastSimulation?.simulation_result as SimulationResult | null) ?? null,
    prediction: lastSimulation?.student_prediction ?? "",
    chats
  };
}

export async function logSimulationEvent(
  sessionId: string,
  studentId: string,
  eventType: string,
  simulationState: SimulationState | null,
  simulationResult: SimulationResult | null,
  studentPrediction: string | null
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const logs = readLocalLogs();
    logs.unshift({ id: createLocalId("log"), event_type: eventType, simulation_state: simulationState, simulation_result: simulationResult, student_prediction: studentPrediction, created_at: new Date().toISOString() });
    localStorage.setItem(localLogKey, JSON.stringify(logs.slice(0, 50)));
    return;
  }
  await supabase.from("simulation_logs").insert({
    session_id: sessionId,
    student_id: studentId,
    event_type: eventType,
    simulation_state: simulationState,
    simulation_result: simulationResult,
    student_prediction: studentPrediction
  });
}

export async function saveChatMessage(
  sessionId: string,
  studentId: string,
  role: "student" | "assistant",
  message: string,
  tutorResponse?: TutorResponse
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    const chats = readLocalChats();
    chats.push({ id: createLocalId("chat"), role, message, misconception_tags: tutorResponse?.misconception_tags ?? [], created_at: new Date().toISOString() });
    localStorage.setItem(localChatKey, JSON.stringify(chats.slice(-60)));
    return;
  }
  await supabase.from("chat_logs").insert({
    session_id: sessionId,
    student_id: studentId,
    role,
    message,
    misconception_tags: tutorResponse?.misconception_tags ?? null,
    raw_model_response: tutorResponse ?? null
  });
}

export async function saveReflection(sessionId: string, studentId: string, reflectionText: string, aiSummary: string | null) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.from("reflection_logs").insert({
    session_id: sessionId,
    student_id: studentId,
    reflection_text: reflectionText,
    ai_summary: aiSummary
  });
}

export async function fetchTeacherDashboard() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      offline: true,
      students: [],
      sessions: [],
      simulationLogs: readLocalLogs(),
      chatLogs: readLocalChats()
    };
  }

  const [students, sessions, simulationLogs, chatLogs] = await Promise.all([
    supabase.from("students").select("*").order("updated_at", { ascending: false }).limit(50),
    supabase.from("learning_sessions").select("*").order("updated_at", { ascending: false }).limit(80),
    supabase.from("simulation_logs").select("*").order("created_at", { ascending: false }).limit(120),
    supabase.from("chat_logs").select("*").order("created_at", { ascending: false }).limit(120)
  ]);

  return {
    offline: false,
    students: students.data ?? [],
    sessions: sessions.data ?? [],
    simulationLogs: simulationLogs.data ?? [],
    chatLogs: chatLogs.data ?? []
  };
}

function readLocalChats(): ChatMessage[] {
  if (typeof localStorage === "undefined") return [];
  return JSON.parse(localStorage.getItem(localChatKey) ?? "[]") as ChatMessage[];
}

function readLocalLogs() {
  if (typeof localStorage === "undefined") return [];
  return JSON.parse(localStorage.getItem(localLogKey) ?? "[]");
}
