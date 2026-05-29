import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";
import { VIBES } from "@/lib/types/site";

export const runtime = "nodejs";

const VIBE_EDIT_PROMPT = `
너는 소상공인 웹빌더의 편집 어시스턴트다.

사용자의 자연어 명령을 분석하여 웹사이트에 적용할 변경사항을 JSON으로 반환한다.

규칙:
1. 오직 JSON만 반환
2. 명령에 맞는 변경만 제안
3. 디자인 토큰(테마)은 사전 정의된 값만 사용
4. UI 코드는 절대 생성하지 않음

사용 가능한 테마(themeId):
- warm-ocean (따뜻한 오션, 인디고)
- jeju-warm (제주 감성, 오렌지)
- luxury-modern (럭셔리 모던, 블랙)
- minimal-clean (미니멀 클린, 블루)
- vintage-cozy (빈티지 코지, 브라운)
- fresh-green (프레시 그린, 그린)

반환 형식 (JSON):
{
  "actions": [
    { "type": "setTheme", "themeId": "jeju-warm" },
    { "type": "updateHeroTitle", "value": "..." },
    { "type": "updateHeroSubtitle", "value": "..." },
    { "type": "updateDescription", "value": "..." }
  ],
  "message": "사용자에게 보여줄 변경 요약 (한국어, 1문장)"
}
`.trim();

interface VibeEditResult {
  actions: Array<{ type: string; themeId?: string; value?: string }>;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const { command, currentSite } = await req.json();
    if (!command) return NextResponse.json({ error: "command required" }, { status: 400 });

    const context = `
현재 상태:
- 상호명: ${currentSite?.name || ""}
- 업종: ${currentSite?.category || ""}
- 소개: ${currentSite?.description || ""}
- 현재 테마: ${currentSite?.themeId || ""}

사용자 명령: "${command}"
`.trim();

    const result = await generateJSON<VibeEditResult>(VIBE_EDIT_PROMPT, context);

    // themeId 검증
    const validThemes = VIBES.map((v) => v.id);
    result.actions = result.actions.filter((a) => {
      if (a.type === "setTheme") return validThemes.includes(a.themeId as never);
      return true;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Vibe edit error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
