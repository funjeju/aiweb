import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const EMOTIONS = ["happy", "calm", "sad", "excited", "tired", "grateful", "anxious", "neutral"] as const;
type Emotion = (typeof EMOTIONS)[number];

interface ChatMsg { role: "ai" | "user"; text: string }

function getModel(temperature: number) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: { temperature } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as "chat" | "finalize";
    const model = getModel(action === "chat" ? 0.9 : 0.7);
    if (!model) return NextResponse.json({ error: "AI 미설정" }, { status: 500 });

    /* ── 대화형: AI가 다음 질문/공감 한 마디 ── */
    if (action === "chat") {
      const messages = (body.messages ?? []) as ChatMsg[];
      const transcript = messages.map((m) => `${m.role === "ai" ? "AI" : "사용자"}: ${m.text}`).join("\n");
      const result = await model.generateContent(
        `너는 사용자의 하루를 따뜻하게 들어주는 다이어리 친구야.
아래 대화를 이어서, AI로서 다음 한 마디만 한국어로 해줘.
조건:
- 공감하며 자연스럽게 하루를 더 끌어내는 질문이나 반응 한 문장
- 2~3문장 이내, 따뜻하고 다정한 말투
- 이모지 1개 정도는 허용
- 질문만 반복하지 말고 가끔은 공감·위로도

대화:
${transcript}

AI:`
      );
      const reply = result.response.text().trim();
      return NextResponse.json({ reply });
    }

    /* ── 마무리: 일기 요약 + 감정 분류 ── */
    if (action === "finalize") {
      const mode = body.mode as "text" | "chat";
      const source: string = mode === "chat"
        ? ((body.messages ?? []) as ChatMsg[]).map((m) => `${m.role === "ai" ? "AI" : "나"}: ${m.text}`).join("\n")
        : (body.text ?? "");

      if (!source.trim()) return NextResponse.json({ error: "내용 없음" }, { status: 400 });

      const prompt = mode === "chat"
        ? `아래는 사용자와 AI가 나눈 하루 대화야. 이걸 사용자(나) 1인칭 시점의 자연스러운 하루 일기로 정리해줘.`
        : `아래는 사용자가 쓴 하루 메모야. 이걸 자연스럽고 감성적인 1인칭 일기로 다듬어줘. 내용은 보존하되 문장만 매끄럽게.`;

      const result = await model.generateContent(
        `${prompt}

조건:
- 1인칭("나는...") 한국어 일기
- 3~6문장, 너무 길지 않게
- 감성적이되 과장 없이 담백하게
- 마지막 줄에 반드시 감정 태그를 다음 중 하나로 표기: [emotion:happy|calm|sad|excited|tired|grateful|anxious|neutral]

내용:
${source}`
      );

      const raw = result.response.text().trim();
      // 감정 태그 추출
      const m = raw.match(/\[emotion:(\w+)\]/);
      let emotion: Emotion = "neutral";
      if (m && EMOTIONS.includes(m[1] as Emotion)) emotion = m[1] as Emotion;
      const content = raw.replace(/\[emotion:\w+\]/g, "").trim();

      return NextResponse.json({ content, emotion });
    }

    return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
  } catch (e) {
    console.error("[diary]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
