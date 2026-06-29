"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, MessageCircle, Send } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import { saveChatMessage } from "@/lib/supabase/queries";
import type { ChatMessage, LearningSession, SimulationResult, SimulationState, StudentProfile, TutorResponse } from "@/lib/types";

interface TutorChatProps {
  student: StudentProfile;
  session: LearningSession;
  state: SimulationState;
  result: SimulationResult;
  prediction: string;
  initialMessages?: ChatMessage[];
}

const quickButtons = [
  { mode: "hint", label: "힌트 요청" },
  { mode: "feedback", label: "내 예측 피드백" }
] as const;

export function TutorChat({ student, session, state, result, prediction, initialMessages = [] }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatHistory = useMemo(() => messages.slice(-8), [messages]);

  async function sendMessage(mode: "hint" | "feedback" | "free_chat", explicitText?: string) {
    const text = explicitText ?? input.trim();
    if (!text && mode === "free_chat") return;
    const studentMessage = text || modeLabel(mode);
    const userRow: ChatMessage = { id: crypto.randomUUID(), role: "student", message: studentMessage, created_at: new Date().toISOString() };
    setMessages((current) => [...current, userRow]);
    setInput("");
    setLoading(true);
    await saveChatMessage(session.id, student.id, "student", studentMessage);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          session_id: session.id,
          current_simulation_state: state,
          simulation_result: result,
          student_prediction: prediction,
          student_message: studentMessage,
          recent_chat_history: chatHistory,
          mode
        })
      });
      const data = (await response.json()) as TutorResponse;
      const reply = data.reply || "좋아요. 지금 조건에서 H+ 기울기, O2 소비량, ATP 생성량 중 무엇이 가장 크게 변했는지 먼저 비교해볼까요?";
      const assistantRow: ChatMessage = { id: crypto.randomUUID(), role: "assistant", message: reply, misconception_tags: data.misconception_tags, created_at: new Date().toISOString() };
      setMessages((current) => [...current, assistantRow]);
      await saveChatMessage(session.id, student.id, "assistant", reply, data);
    } catch {
      const fallback = "지금은 AI 응답을 받을 수 없어요. 대신 현재 결과에서 O2 소비량과 ATP 생성량이 같은 방향으로 변했는지 먼저 비교해볼까요?";
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", message: fallback, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage("free_chat");
  }

  return (
    <section className="flex min-h-[620px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-md bg-marine/10 p-2 text-marine"><Bot size={20} /></span>
        <div>
          <h2 className="text-lg font-bold text-ink">AI 튜터</h2>
          <p className="text-sm text-slate-500">정답을 바로 말하기보다 생각을 이끄는 질문을 합니다.</p>
        </div>
      </div>

      <div className="mb-4 grid gap-2">
        {quickButtons.map((button) => (
          <button key={button.mode} type="button" onClick={() => void sendMessage(button.mode)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
            <MessageCircle size={16} /> {button.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-md bg-panel p-3">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
            시뮬레이션을 실행한 뒤 예측을 설명하거나 힌트를 요청해보세요.
          </div>
        ) : null}
        {messages.map((message) => {
          const isStudent = message.role === "student";
          const className = isStudent ? "ml-auto bg-marine text-white" : "mr-auto bg-white text-slate-700 border border-slate-200";
          return (
            <div key={message.id} className={"max-w-[88%] rounded-md px-4 py-3 text-sm leading-6 " + className}>
              <ChemicalText text={message.message} />
              {message.misconception_tags?.length ? <p className="mt-2 text-xs text-slate-400">태그: {message.misconception_tags.join(", ")}</p> : null}
            </div>
          );
        })}
        {loading ? <p className="text-sm text-slate-500">AI 튜터가 질문을 고르는 중...</p> : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-3 text-sm outline-none ring-mint/30 focus:ring-4" placeholder="질문을 입력하세요" />
        <button disabled={loading} className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-marine text-white transition hover:bg-marine/90 disabled:opacity-60" aria-label="메시지 보내기"><Send size={18} /></button>
      </form>
    </section>
  );
}

function modeLabel(mode: "hint" | "feedback" | "free_chat") {
  if (mode === "hint") return "힌트를 요청합니다.";
  if (mode === "feedback") return "내 예측에 대한 피드백을 요청합니다.";
  return "질문합니다.";
}
