import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: Request) {
  try {
    // 1. 프론트엔드에서 보낸 데이터(학생의 말, 상태)를 받습니다.
    const body = await request.json();
    const { studentMessage, currentTab, glucoseCount, studentInfo } = body;

    // 2. Gemini 모델 설정 및 프롬프트 작성
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", // 또는 gemini-2.5-pro
      generationConfig: {
        responseMimeType: "application/json", // 👈 무조건 JSON으로만 대답하게 강제!
      }
    });

    const systemPrompt = `
      너는 고등학교 생명과학 '세포 대사(호흡/광합성)' 전문가 인지 튜터야.
      현재 학생은 '${currentTab}' 시뮬레이션을 보고 있고, 포도당 분자 수는 ${glucoseCount}개로 설정되어 있어.
      학생의 입력을 분석해서 반드시 아래 JSON 형식으로만 응답해:
      {
        "tutor_reply": "학생의 오개념을 교정하거나 다음 사고를 유도하는 소크라테스식 질문 (친절하게)",
        "misconception_type": "탐지된 생명과학 오개념 (없으면 '없음')",
        "cognitive_load": "낮음/중간/높음 중 하나",
        "next_prediction": "학생이 다음에 보일 반응이나 겪을 인지적 갈등 예측"
      }
    `;

    const prompt = `${systemPrompt}\n\n학생의 말: "${studentMessage}"`;

    // 3. Gemini에게 답변 받아오기
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const aiData = JSON.parse(responseText);

    // 4. Supabase DB에 로그 저장하기 (이전에 짠 SQL 테이블 구조에 맞춤)
    const { error: dbError } = await supabase
      .from('metabolic_chat_logs')
      .insert([
        {
          student_email: studentInfo.email,
          student_name: studentInfo.name,
          current_tab: currentTab,
          glucose_count: glucoseCount,
          student_message: studentMessage,
          tutor_reply: aiData.tutor_reply,
          misconception_type: aiData.misconception_type,
          cognitive_load: aiData.cognitive_load,
          next_prediction: aiData.next_prediction,
        }
      ]);

    if (dbError) {
      console.error('Supabase 저장 에러:', dbError);
      // DB 저장이 실패해도 학생에겐 답변이 가야 하므로 에러만 찍습니다.
    }

    // 5. 생성된 AI 답변을 프론트엔드로 전달
    return NextResponse.json(aiData);

  } catch (error) {
    console.error('API 라우트 에러:', error);
    return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}
