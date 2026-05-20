"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Loader2,
  Mic,
  Sparkles,
  Square,
  Volume2,
  X
} from "lucide-react";
import {
  detectLang,
  toneMeta,
  toneOrder,
  type Direction,
  type LangCode,
  type TonePreset,
  type TranslateResponse
} from "@/lib/translate";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speak";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Result = TranslateResponse & { cached?: boolean };

type Pair = { src: LangCode; tgt: LangCode };

const langLabel: Record<LangCode, string> = { ko: "한국어", ja: "日本語" };

const storageKey = "yj-fukuoka-translate-v1";

type Persisted = {
  pair: Pair;
  tone: TonePreset;
  context: string;
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { pair: { src: "ko", tgt: "ja" }, tone: "icebreaker", context: "" };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) throw new Error();
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      pair:
        parsed.pair && (parsed.pair.src === "ko" || parsed.pair.src === "ja") && (parsed.pair.tgt === "ko" || parsed.pair.tgt === "ja")
          ? parsed.pair
          : { src: "ko", tgt: "ja" },
      tone: parsed.tone && parsed.tone in toneMeta ? parsed.tone : "icebreaker",
      context: typeof parsed.context === "string" ? parsed.context : ""
    };
  } catch {
    return { pair: { src: "ko", tgt: "ja" }, tone: "icebreaker", context: "" };
  }
}

// Pick a MIME type the current browser will actually produce.
function preferredAudioMime(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // ignore
    }
  }
  return "audio/webm";
}

export function TranslatePanel({ open, onClose }: Props) {
  const [pair, setPair] = useState<Pair>({ src: "ko", tgt: "ja" });
  const [tone, setTone] = useState<TonePreset>("icebreaker");
  const [context, setContext] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingTtsKey, setSpeakingTtsKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const persisted = loadPersisted();
    setPair(persisted.pair);
    setTone(persisted.tone);
    setContext(persisted.context);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: Persisted = { pair, tone, context };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [pair, tone, context]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Clean up any active recording / TTS when the panel closes.
  useEffect(() => {
    if (open) return;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop(); } catch { /* ignore */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    stopSpeaking();
    setSpeakingTtsKey(null);
    setRecording(false);
  }, [open]);

  // Auto-detect source language as user types.
  const lastDetectRef = useRef<LangCode | null>(null);
  useEffect(() => {
    if (!text.trim()) return;
    const detected = detectLang(text);
    if (!detected) return;
    if (detected === lastDetectRef.current) return;
    lastDetectRef.current = detected;
    if (detected !== pair.src) {
      setPair({ src: detected, tgt: detected === "ko" ? "ja" : "ko" });
    }
  }, [text, pair.src]);

  const direction: Direction = `${pair.src}->${pair.tgt}`;

  const swap = useCallback(() => {
    setPair((cur) => ({ src: cur.tgt, tgt: cur.src }));
  }, []);

  const submit = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    setError(null);
    setResult(null);
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, direction, tone, context: context.trim() || undefined }),
        signal: controller.signal
      });
      const payload = (await response.json()) as Result & { message?: string; configured?: boolean };
      if (!response.ok) {
        setError(payload.message || "번역에 실패했어요.");
        return;
      }
      if (payload.configured === false) {
        setError(payload.message || "OpenAI 키가 설정돼있지 않아요.");
        return;
      }
      setResult(payload);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [text, direction, tone, context]);

  const onKeyDownInput = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied((cur) => (cur === label ? null : cur)), 1200);
    } catch {
      // ignore
    }
  };

  // ── Speech-to-Text (Whisper-class) ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (recording) return;
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("이 브라우저에서는 마이크를 지원하지 않아요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = preferredAudioMime();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size === 0) {
          setTranscribing(false);
          return;
        }
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob);
          form.append("language", pair.src);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const payload = (await res.json()) as { text?: string; message?: string; configured?: boolean };
          if (!res.ok || !payload.text) {
            setError(payload.message || "음성 인식에 실패했어요.");
            return;
          }
          // Append to existing text if present; otherwise replace.
          setText((cur) => (cur.trim() ? `${cur.trim()} ${payload.text}` : payload.text!));
          // Focus and put cursor at the end.
          window.setTimeout(() => {
            const ta = inputRef.current;
            if (ta) {
              ta.focus();
              ta.setSelectionRange(ta.value.length, ta.value.length);
            }
          }, 0);
        } catch (err) {
          setError((err as Error).message || "음성 인식 호출 실패");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError((err as Error).message || "마이크 권한이 거부됐어요.");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [recording, pair.src]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch { /* ignore */ }
    }
    setRecording(false);
  }, []);

  // ── Text-to-Speech (browser native) ──────────────────────────────────────
  const playTts = useCallback(
    (key: string, value: string, lang: LangCode) => {
      if (!ttsSupported()) {
        setError("이 브라우저에서는 음성 재생을 지원하지 않아요.");
        return;
      }
      if (speakingTtsKey === key) {
        stopSpeaking();
        setSpeakingTtsKey(null);
        return;
      }
      setSpeakingTtsKey(key);
      // Manually clear state after a reasonable estimate — onend not fully reliable on iOS.
      const estimateMs = Math.min(8000, Math.max(1500, value.length * 90));
      void speak(value, lang);
      window.setTimeout(() => setSpeakingTtsKey((cur) => (cur === key ? null : cur)), estimateMs);
    },
    [speakingTtsKey]
  );

  const tonePills = useMemo(() => toneOrder, []);

  if (!open) return null;

  const micDisabled = transcribing;
  const supportsTts = ttsSupported();

  return (
    <div className="translate-overlay" role="dialog" aria-modal="true" aria-label="번역">
      <button className="translate-overlay__scrim" aria-label="닫기" onClick={onClose} />
      <section className="translate-panel">
        <header className="translate-panel__head">
          <div className="translate-panel__title">
            <Sparkles size={16} />
            <strong>번역기</strong>
            <span className="translate-panel__model">GPT-5.4 mini</span>
          </div>
          <button className="translate-panel__close" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </header>

        <div className="translate-direction">
          <span className="translate-direction__lang">{langLabel[pair.src]}</span>
          <button className="translate-direction__swap" onClick={swap} aria-label="언어 바꾸기">
            <ArrowLeftRight size={14} />
          </button>
          <span className="translate-direction__lang translate-direction__lang--tgt">
            {langLabel[pair.tgt]}
          </span>
        </div>

        <div className="translate-tones" role="tablist" aria-label="톤 프리셋">
          {tonePills.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tone === id}
              className={tone === id ? "translate-tone translate-tone--on" : "translate-tone"}
              onClick={() => setTone(id)}
              title={toneMeta[id].hint}
            >
              <span aria-hidden="true">{toneMeta[id].emoji}</span>
              <span>{toneMeta[id].label}</span>
            </button>
          ))}
        </div>
        <p className="translate-tones__hint">{toneMeta[tone].hint}</p>

        <label className="translate-field">
          <span>원문 ({langLabel[pair.src]})</span>
          <div className="translate-field__wrap">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onKeyDownInput}
              placeholder={
                pair.src === "ko"
                  ? "여기에 한국어 문장을 적거나 🎙️을 눌러 말하세요"
                  : "여기에 일본어를 입력하거나 🎙️을 눌러 말하세요"
              }
              rows={3}
              maxLength={800}
            />
            <button
              type="button"
              className={
                recording
                  ? "translate-mic translate-mic--rec"
                  : transcribing
                  ? "translate-mic translate-mic--busy"
                  : "translate-mic"
              }
              onClick={recording ? stopRecording : startRecording}
              disabled={micDisabled}
              aria-label={recording ? "녹음 중지" : "음성으로 입력"}
              title={recording ? "녹음 중지" : "음성으로 입력"}
            >
              {transcribing ? (
                <Loader2 size={16} className="translate-mic__spin" />
              ) : recording ? (
                <Square size={14} fill="currentColor" />
              ) : (
                <Mic size={16} />
              )}
            </button>
          </div>
          <small className="translate-field__hint">
            {text.length}/800 · ⌘/Ctrl+Enter로 번역
            {recording && <em className="translate-field__rec"> · 녹음 중…</em>}
            {transcribing && <em className="translate-field__rec"> · 인식 중…</em>}
          </small>
        </label>

        <details className="translate-context">
          <summary>상황 메모 (선택) {context.trim() && <em>· 입력됨</em>}</summary>
          <input
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="예: 텐진 이자카야, 방금 합석함, 그녀가 사진작가라고 했음"
            maxLength={240}
          />
        </details>

        <button
          className="translate-submit"
          onClick={submit}
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="translate-submit__spin" />
              번역 중…
            </>
          ) : (
            <>
              <Sparkles size={15} />
              번역하기
            </>
          )}
        </button>

        {error && <div className="translate-error">{error}</div>}

        {result && (
          <div className="translate-result">
            <div className="translate-result__main">
              <span className="translate-result__lang">{langLabel[pair.tgt]}</span>
              <p className="translate-result__text">{result.translation}</p>
              <div className="translate-result__actions">
                {supportsTts && (
                  <button
                    className={
                      speakingTtsKey === "main"
                        ? "translate-result__action translate-result__action--on"
                        : "translate-result__action"
                    }
                    onClick={() => playTts("main", result.translation, pair.tgt)}
                    aria-label="발음 듣기"
                    title="발음 듣기"
                  >
                    <Volume2 size={14} />
                    <span>{speakingTtsKey === "main" ? "재생 중" : "듣기"}</span>
                  </button>
                )}
                <button
                  className="translate-result__action"
                  onClick={() => copy("main", result.translation)}
                  aria-label="복사"
                >
                  {copied === "main" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied === "main" ? "복사됨" : "복사"}</span>
                </button>
              </div>
            </div>
            {pair.tgt === "ja" && (result.hangulReading || result.romaji) && (
              <div className="translate-result__reading">
                {result.hangulReading && (
                  <div className="translate-reading">
                    <em>한글 발음</em>
                    <span>{result.hangulReading}</span>
                    <button onClick={() => copy("hangul", result.hangulReading!)} aria-label="복사">
                      {copied === "hangul" ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                {result.romaji && (
                  <div className="translate-reading translate-reading--romaji">
                    <em>romaji</em>
                    <span>{result.romaji}</span>
                  </div>
                )}
              </div>
            )}
            {result.alt && result.alt.length > 0 && (
              <div className="translate-alts">
                <em>다른 표현</em>
                <ul>
                  {result.alt.map((a, i) => (
                    <li key={i}>
                      <span>{a}</span>
                      <span className="translate-alts__btns">
                        {supportsTts && (
                          <button
                            onClick={() => playTts(`alt-${i}`, a, pair.tgt)}
                            aria-label="발음 듣기"
                            className={speakingTtsKey === `alt-${i}` ? "is-on" : undefined}
                          >
                            <Volume2 size={12} />
                          </button>
                        )}
                        <button onClick={() => copy(`alt-${i}`, a)} aria-label="복사">
                          {copied === `alt-${i}` ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.note && <p className="translate-note">💡 {result.note}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
