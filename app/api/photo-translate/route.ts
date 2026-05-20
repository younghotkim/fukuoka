import { NextRequest, NextResponse } from "next/server";
import type { PhotoBlock, PhotoTranslateResponse } from "@/lib/photo-translate";

export const runtime = "nodejs";

// Vision-capable variant. gpt-5.4-mini accepts image_url inputs via Chat Completions.
const MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-5.4-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

// Photos can be large — clamp before base64'ing so we don't blow request size.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

const SYSTEM_PROMPT = `
You are a translator helping two Korean travelers in Fukuoka read Japanese text
from photos — menus, signs, station boards, receipts, hand-written notes.

TASK:
1) Detect every meaningful Japanese text block in the image. Skip pure decoration,
   logos with no readable info, and generic copyright lines.
2) For each block, return:
   - "ja": the Japanese text as written (keep proper nouns, kanji, etc.)
   - "ko": natural Korean translation, spoken-length and useful.
   - "note": OPTIONAL 1 short line in Korean — only if it adds real value:
     * Menu items: 매운정도, 공유에 좋은지, 1인분 분량 감각, 가격대 등
     * Signs: 들어가도 되는지, 시간 제한, 주의 사항
     * Receipts: 항목 요약/총액 강조
     Skip "note" entirely when there's nothing to add. Don't pad.
3) Also return "scene": one of "menu" | "sign" | "message" | "receipt" | "other".

HARD RULES:
- Return STRICT JSON only. No markdown. No commentary.
- Spoken-length translations. No essays.
- Order blocks roughly by reading order (top to bottom, left to right).
- If the image has NO Japanese text, return { "scene": "other", "blocks": [] }.

OUTPUT FORMAT:
{
  "scene": "menu" | "sign" | "message" | "receipt" | "other",
  "blocks": [
    { "ja": "...", "ko": "...", "note": "..." },
    ...
  ]
}
`.trim();

function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalize(parsed: unknown): PhotoTranslateResponse | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const sceneRaw = typeof obj.scene === "string" ? obj.scene.trim() : "other";
  const scene = (["menu", "sign", "message", "receipt", "other"].includes(sceneRaw)
    ? sceneRaw
    : "other") as PhotoTranslateResponse["scene"];
  const blocksRaw = Array.isArray(obj.blocks) ? obj.blocks : [];
  const blocks: PhotoBlock[] = blocksRaw
    .map((b): PhotoBlock | null => {
      if (!b || typeof b !== "object") return null;
      const e = b as Record<string, unknown>;
      const ja = typeof e.ja === "string" ? e.ja.trim() : "";
      const ko = typeof e.ko === "string" ? e.ko.trim() : "";
      if (!ja || !ko) return null;
      const block: PhotoBlock = { ja, ko };
      if (typeof e.note === "string" && e.note.trim()) block.note = e.note.trim();
      return block;
    })
    .filter((b): b is PhotoBlock => b !== null)
    .slice(0, 30);
  return { scene, blocks };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, message: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "multipart/form-data 요청이 필요합니다." }, { status: 400 });
  }

  const image = form.get("image");
  if (!(image instanceof Blob)) {
    return NextResponse.json({ message: "image 파일이 비어 있습니다." }, { status: 400 });
  }
  if (image.size === 0) {
    return NextResponse.json({ message: "이미지가 비어 있어요." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ message: "이미지가 너무 큽니다 (최대 8MB)." }, { status: 413 });
  }

  const mime = image.type || "image/jpeg";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ message: "이미지 파일만 보낼 수 있어요." }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "이 사진의 모든 일본어 텍스트를 읽어서 위 형식대로 JSON으로 반환해주세요." },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1800
      })
    });

    const json = (await res.json()) as OpenAIResponse;
    if (!res.ok) {
      return NextResponse.json(
        { message: json.error?.message || `OpenAI API 오류 (${res.status})` },
        { status: 502 }
      );
    }
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ message: "응답이 비어 있습니다." }, { status: 502 });
    }

    const parsed = parseJsonLoose(content);
    const normalized = normalize(parsed);
    if (!normalized) {
      return NextResponse.json(
        { message: "사진 결과를 파싱하지 못했어요.", raw: content },
        { status: 502 }
      );
    }
    if (normalized.blocks.length === 0) {
      return NextResponse.json(
        { ...normalized, message: "이 사진에서 일본어를 찾지 못했어요. 더 선명하게 찍어주세요." },
        { status: 200 }
      );
    }

    return NextResponse.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI API 호출 실패";
    return NextResponse.json({ message }, { status: 502 });
  }
}
