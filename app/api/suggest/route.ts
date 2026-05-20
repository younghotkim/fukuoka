import { NextRequest, NextResponse } from "next/server";
import {
  buildSuggestSystemPrompt,
  buildSuggestUserMessage,
  isSuggestion,
  type SuggestRequest,
  type SuggestResponse
} from "@/lib/suggest";
import { isTone } from "@/lib/translate";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-5.4-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

const TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 80;
const cache = new Map<string, { at: number; body: SuggestResponse }>();

function cacheKey(req: SuggestRequest) {
  return `${req.tone}|${req.situation}`;
}

function pruneCache() {
  if (cache.size <= CACHE_MAX) return;
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

function normalize(parsed: unknown): SuggestResponse | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const arr = Array.isArray(obj.suggestions) ? obj.suggestions : [];
  const cleaned = arr
    .filter(isSuggestion)
    .map((s) => ({
      ja: s.ja.trim(),
      meaning: (s.meaning ?? "").trim(),
      hangulReading: s.hangulReading.trim(),
      romaji: s.romaji.trim(),
      reason: s.reason.trim()
    }))
    .slice(0, 4);
  if (cleaned.length === 0) return null;
  return { suggestions: cleaned };
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
  const situation = typeof body.situation === "string" ? body.situation.trim() : "";
  const tone = body.tone;

  if (!situation) {
    return NextResponse.json({ message: "상황 설명이 비어 있습니다." }, { status: 400 });
  }
  if (situation.length > 800) {
    return NextResponse.json({ message: "상황 설명은 800자까지만 가능합니다." }, { status: 400 });
  }
  if (!isTone(tone)) {
    return NextResponse.json({ message: "톤(tone)이 잘못됐습니다." }, { status: 400 });
  }

  const req: SuggestRequest = { situation, tone };
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
          { role: "system", content: buildSuggestSystemPrompt(req) },
          { role: "user", content: buildSuggestUserMessage(req) }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 900
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
        { message: "추천 결과를 파싱하지 못했어요.", raw: content },
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
