import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import type { TutorResponse } from "@/lib/types";

const systemInstruction = "너는 고등학교 생명과학을 가르치는 친절한 AI 튜터다. 학생은 산화적 인산화 시뮬레이터를 조작하며 전자전달, H+ 농도 기울기, ATP 합성효소, 산소의 역할, 저해제와 탈공역제의 영향을 학습하고 있다. 학생에게 정답을 바로 길게 설명하지 말고, 현재 시뮬레이션 상태와 학생 답변을 바탕으로 사고를 유도하는 질문을 먼저 하라. 학생의 오개념이 보이면 부드럽게 짚어주고, 고등학교 수준의 표현으로 설명하라. 한 번에 너무 많은 내용을 말하지 말고 2~5문장으로 응답하라.";

const fallback: TutorResponse = {
  reply: "좋아요. 지금 조건에서 전자 이동, H+ 기울기, ATP 생성 중 무엇이 먼저 변했는지 비교해볼까요? 특히 산소 소비량과 ATP 생성량이 항상 같이 움직이는지도 살펴보세요.",
  misconception_tags: [],
  next_question: "현재 조건에서 ATP 생성이 줄어든 가장 직접적인 이유는 무엇일까요?",
  confidence: "medium"
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return NextResponse.json({
      ...fallback,
      reply: "Gemini API 키가 아직 설정되지 않았어요. 지금 결과를 보면 전자 이동, H+ 기울기, ATP 생성량 중 어느 값이 가장 크게 바뀌었나요? 그 변화가 산소나 처리 조건과 어떻게 연결되는지 먼저 말해볼까요?"
    });
  }

  const prompt = {
    task: "Return only valid JSON with keys reply, misconception_tags, next_question, confidence.",
    allowed_misconception_tags: [
      "산소의 역할 미이해",
      "전자 이동과 H+ 펌핑 연결 미이해",
      "ATP 합성효소 역할 미이해",
      "NADH와 FADH2 진입 위치 혼동",
      "저해제와 탈공역제 차이 혼동",
      "H+ 농도 기울기와 ATP 생성 관계 미이해",
      "산소 소비량과 ATP 생성량 관계 혼동",
      "ADP의 역할 미이해"
    ],
    context: body
  };

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: JSON.stringify(prompt) }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const textValue = (response as { text?: string | (() => string | Promise<string>) }).text;
    const rawText = typeof textValue === "function" ? await textValue() : textValue;
    const parsed = parseTutorResponse(rawText ?? "");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      ...fallback,
      reply: "AI 응답을 받는 중 문제가 생겼어요. 그래도 현재 결과에서 산소가 최종 전자 수용체로 작동하는지, H+ 기울기가 ATP 합성효소를 통해 쓰였는지 차례로 확인해봅시다.",
      confidence: "low"
    });
  }
}

function parseTutorResponse(text: string): TutorResponse {
  const cleaned = text.replace(/\x60\x60\x60json/g, "").replace(/\x60\x60\x60/g, "").trim();
  try {
    const data = JSON.parse(cleaned) as Partial<TutorResponse>;
    return {
      reply: String(data.reply || fallback.reply),
      misconception_tags: Array.isArray(data.misconception_tags) ? data.misconception_tags.map(String) : [],
      next_question: String(data.next_question || fallback.next_question),
      confidence: data.confidence === "low" || data.confidence === "high" ? data.confidence : "medium"
    };
  } catch {
    return { ...fallback, reply: cleaned || fallback.reply };
  }
}
