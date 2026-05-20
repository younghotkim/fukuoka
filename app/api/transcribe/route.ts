import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// gpt-4o-mini-transcribe: cheaper, noise-robust successor to whisper-1.
// Better for izakaya/bar environments with background chatter.
const MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";
const API_URL = "https://api.openai.com/v1/audio/transcriptions";

const MAX_BYTES = 24 * 1024 * 1024; // OpenAI caps at 25MB; leave a safety margin.

type OpenAITranscription = { text?: string; error?: { message?: string } };

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

  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ message: "audio 파일이 비어 있습니다." }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ message: "녹음된 오디오가 비어 있습니다." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ message: "오디오가 너무 큽니다 (최대 24MB)." }, { status: 413 });
  }

  const langRaw = form.get("language");
  const language = langRaw === "ko" || langRaw === "ja" ? langRaw : undefined;
  const promptRaw = form.get("prompt");
  const prompt = typeof promptRaw === "string" && promptRaw.length <= 240 ? promptRaw : undefined;

  // Build a fresh FormData for OpenAI (passing the audio Blob through as-is).
  const upstream = new FormData();
  // Use a sensible filename based on MIME so OpenAI's parser is happy.
  const mime = audio.type || "audio/webm";
  const ext =
    mime.includes("mp4") || mime.includes("m4a") ? "m4a"
    : mime.includes("mpeg") || mime.includes("mp3") ? "mp3"
    : mime.includes("wav") ? "wav"
    : mime.includes("ogg") ? "ogg"
    : "webm";
  upstream.append("file", audio, `recording.${ext}`);
  upstream.append("model", MODEL);
  if (language) upstream.append("language", language);
  if (prompt) upstream.append("prompt", prompt);
  upstream.append("response_format", "json");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: upstream
    });
    const json = (await res.json()) as OpenAITranscription;
    if (!res.ok) {
      return NextResponse.json(
        { message: json.error?.message || `OpenAI STT 오류 (${res.status})` },
        { status: 502 }
      );
    }
    const text = (json.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ message: "음성을 인식하지 못했어요. 다시 시도해주세요." }, { status: 422 });
    }
    return NextResponse.json({ text, language: language ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI STT 호출 실패";
    return NextResponse.json({ message }, { status: 502 });
  }
}
