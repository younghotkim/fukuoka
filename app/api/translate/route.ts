import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserMessage,
  isDirection,
  isTone,
  type TranslateRequest,
  type TranslateResponse
} from "@/lib/translate";

export const runtime = "nodejs";

// gpt-5.4-mini: $0.75 / $4.50 per 1M tokens, 400k context, strong KO↔JA.
const MODEL = process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-5.4-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

const TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; body: TranslateResponse }>();

function cacheKey(req: TranslateRequest) {
  return `${req.direction}|${req.tone}|${req.text}|${req.context ?? ""}`;
}

function pruneCache() {
  if (cache.size <= CACHE_MAX) return;
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of cache) {
    if (v.at < cutoff) cache.delete(k);
    if (cache.size <= CACHE_MAX) break;
  }
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

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

function normalize(parsed: unknown): TranslateResponse | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const translation = typeof obj.translation === "string" ? obj.translation.trim() : "";
  if (!translation) return null;
  const altRaw = Array.isArray(obj.alt) ? obj.alt : [];
  // Accept either the new object form {text, meaning} or fall back to strings
  // for resilience against older model outputs.
  const alt = altRaw
    .map((entry) => {
      if (typeof entry === "string") {
        const text = entry.trim();
        return text ? { text } : null;
      }
      if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        const text = typeof e.text === "string" ? e.text.trim() : "";
        if (!text) return null;
        const meaning = typeof e.meaning === "string" && e.meaning.trim() ? e.meaning.trim() : undefined;
        return { text, meaning };
      }
      return null;
    })
    .filter((v): v is { text: string; meaning?: string } => v !== null)
    .slice(0, 3);
  return {
    translation,
    romaji: typeof obj.romaji === "string" && obj.romaji.trim() ? obj.romaji.trim() : undefined,
    hangulReading:
      typeof obj.hangulReading === "string" && obj.hangulReading.trim()
        ? obj.hangulReading.trim()
        : undefined,
    alt: alt.length > 0 ? alt : undefined,
    note: typeof obj.note === "string" ? obj.note.trim() : undefined
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, message: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "잘못된 요청 본문입니다." }, { status: 400 });
  }
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ message: "잘못된 요청 본문입니다." }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const direction = body.direction;
  const tone = body.tone;
  const context = typeof body.context === "string" ? body.context : undefined;

  if (!text) return NextResponse.json({ message: "번역할 문장이 비어 있습니다." }, { status: 400 });
  if (text.length > 800) {
    return NextResponse.json({ message: "한 번에 800자까지만 보낼 수 있어요." }, { status: 400 });
  }
  if (!isDirection(direction)) {
    return NextResponse.json({ message: "방향(direction)이 잘못됐습니다." }, { status: 400 });
  }
  if (!isTone(tone)) {
    return NextResponse.json({ message: "톤(tone)이 잘못됐습니다." }, { status: 400 });
  }

  const req: TranslateRequest = { text, direction, tone, context };

  const key = cacheKey(req);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ ...hit.body, cached: true });
  }

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
          { role: "system", content: buildSystemPrompt(req) },
          { role: "user", content: buildUserMessage(req) }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 600
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
        { message: "번역 결과를 파싱하지 못했어요.", raw: content },
        { status: 502 }
      );
    }

    cache.set(key, { at: Date.now(), body: normalized });
    pruneCache();
    return NextResponse.json({ ...normalized, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI API 호출 실패";
    return NextResponse.json({ message }, { status: 502 });
  }
}
