"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Camera,
  Check,
  Copy,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  MessageCircleReply,
  Mic,
  Sparkles,
  Square,
  Star,
  Trash2,
  Volume2,
  Wand2,
  X
} from "lucide-react";
import {
  detectLang,
  toneExamples,
  toneMeta,
  toneOrder,
  type Direction,
  type LangCode,
  type TonePreset,
  type TranslateResponse
} from "@/lib/translate";
import type { Suggestion, SuggestResponse } from "@/lib/suggest";
import type { ReplyResponse } from "@/lib/reply";
import type { PhotoTranslateResponse } from "@/lib/photo-translate";
import { useFavorites, type FavoriteItem, type FavoriteSource } from "@/lib/favorites";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speak";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "translate" | "suggest" | "reply" | "photo" | "favorites";

type TranslateResult = TranslateResponse & { cached?: boolean };
type SuggestResult = SuggestResponse & { cached?: boolean };
type ReplyResult = ReplyResponse & { cached?: boolean };
type PhotoResult = PhotoTranslateResponse & { message?: string };

type Pair = { src: LangCode; tgt: LangCode };

const langLabel: Record<LangCode, string> = { ko: "한국어", ja: "日本語" };
const storageKey = "yj-fukuoka-translate-v3";

const modeMeta: Record<Mode, { icon: React.ReactNode; label: string }> = {
  translate: { icon: <ArrowLeftRight size={13} />, label: "번역" },
  suggest: { icon: <Wand2 size={13} />, label: "상황 추천" },
  reply: { icon: <MessageCircleReply size={13} />, label: "답장 추천" },
  photo: { icon: <Camera size={13} />, label: "사진" },
  favorites: { icon: <Star size={13} />, label: "즐겨찾기" }
};

const modeOrder: Mode[] = ["translate", "suggest", "reply", "photo", "favorites"];

type Persisted = {
  pair: Pair;
  tone: TonePreset;
  context: string;
  mode: Mode;
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { pair: { src: "ko", tgt: "ja" }, tone: "icebreaker", context: "", mode: "translate" };
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) throw new Error();
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const validMode = parsed.mode && (modeOrder as string[]).includes(parsed.mode) ? (parsed.mode as Mode) : "translate";
    return {
      pair:
        parsed.pair && (parsed.pair.src === "ko" || parsed.pair.src === "ja") && (parsed.pair.tgt === "ko" || parsed.pair.tgt === "ja")
          ? parsed.pair
          : { src: "ko", tgt: "ja" },
      tone: parsed.tone && parsed.tone in toneMeta ? parsed.tone : "icebreaker",
      context: typeof parsed.context === "string" ? parsed.context : "",
      mode: validMode
    };
  } catch {
    return { pair: { src: "ko", tgt: "ja" }, tone: "icebreaker", context: "", mode: "translate" };
  }
}

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
  const favorites = useFavorites();
  const [mode, setMode] = useState<Mode>("translate");
  const [pair, setPair] = useState<Pair>({ src: "ko", tgt: "ja" });
  const [tone, setTone] = useState<TonePreset>("icebreaker");
  const [context, setContext] = useState("");
  const [text, setText] = useState("");
  const [translateResult, setTranslateResult] = useState<TranslateResult | null>(null);
  const [suggestResult, setSuggestResult] = useState<SuggestResult | null>(null);
  const [replyResult, setReplyResult] = useState<ReplyResult | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingTtsKey, setSpeakingTtsKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const persisted = loadPersisted();
    setPair(persisted.pair);
    setTone(persisted.tone);
    setContext(persisted.context);
    setMode(persisted.mode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: Persisted = { pair, tone, context, mode };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [pair, tone, context, mode]);

  useEffect(() => {
    if (open && (mode === "translate" || mode === "suggest" || mode === "reply")) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(id);
    }
  }, [open, mode]);

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

  // Cleanup on close.
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

  // Auto-detect KO/JA only in translate mode.
  const lastDetectRef = useRef<LangCode | null>(null);
  useEffect(() => {
    if (mode !== "translate" || !text.trim()) return;
    const detected = detectLang(text);
    if (!detected) return;
    if (detected === lastDetectRef.current) return;
    lastDetectRef.current = detected;
    if (detected !== pair.src) {
      setPair({ src: detected, tgt: detected === "ko" ? "ja" : "ko" });
    }
  }, [text, pair.src, mode]);

  const direction: Direction = `${pair.src}->${pair.tgt}`;

  const swap = useCallback(() => {
    setPair((cur) => ({ src: cur.tgt, tgt: cur.src }));
  }, []);

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    setError(null);
    setTranslateResult(null);
    setSuggestResult(null);
    setReplyResult(null);
    // Keep photoResult/preview across mode switches so users can come back to it.
  }, []);

  const submit = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    setError(null);
    setTranslateResult(null);
    setSuggestResult(null);
    setReplyResult(null);
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (mode === "translate") {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value, direction, tone, context: context.trim() || undefined }),
          signal: controller.signal
        });
        const payload = (await response.json()) as TranslateResult & { message?: string; configured?: boolean };
        if (!response.ok) { setError(payload.message || "번역에 실패했어요."); return; }
        if (payload.configured === false) { setError(payload.message || "OpenAI 키가 설정돼있지 않아요."); return; }
        setTranslateResult(payload);
      } else if (mode === "suggest") {
        const response = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situation: value, tone }),
          signal: controller.signal
        });
        const payload = (await response.json()) as SuggestResult & { message?: string; configured?: boolean };
        if (!response.ok) { setError(payload.message || "추천에 실패했어요."); return; }
        if (payload.configured === false) { setError(payload.message || "OpenAI 키가 설정돼있지 않아요."); return; }
        setSuggestResult(payload);
      } else if (mode === "reply") {
        const response = await fetch("/api/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heard: value, tone }),
          signal: controller.signal
        });
        const payload = (await response.json()) as ReplyResult & { message?: string; configured?: boolean };
        if (!response.ok) { setError(payload.message || "답장 추천에 실패했어요."); return; }
        if (payload.configured === false) { setError(payload.message || "OpenAI 키가 설정돼있지 않아요."); return; }
        setReplyResult(payload);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [text, mode, direction, tone, context]);

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

  const fillFromExample = (phrase: string) => {
    setText(phrase);
    setTranslateResult(null);
    setError(null);
    window.setTimeout(() => {
      const ta = inputRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }, 0);
  };

  // ── STT ──────────────────────────────────────────────────────────────────
  // For STT, source language hint depends on mode:
  //   translate → current pair.src
  //   reply     → ja (she just spoke Japanese)
  //   suggest   → ko (user describes situation in Korean)
  const sttLang: LangCode =
    mode === "translate" ? pair.src : mode === "reply" ? "ja" : "ko";

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
          form.append("language", sttLang);
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const payload = (await res.json()) as { text?: string; message?: string; configured?: boolean };
          if (!res.ok || !payload.text) {
            setError(payload.message || "음성 인식에 실패했어요.");
            return;
          }
          setText((cur) => (cur.trim() ? `${cur.trim()} ${payload.text}` : payload.text!));
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
  }, [recording, sttLang]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch { /* ignore */ }
    }
    setRecording(false);
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────
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
      const estimateMs = Math.min(8000, Math.max(1500, value.length * 90));
      void speak(value, lang);
      window.setTimeout(() => setSpeakingTtsKey((cur) => (cur === key ? null : cur)), estimateMs);
    },
    [speakingTtsKey]
  );

  // ── Photo upload ─────────────────────────────────────────────────────────
  const onPhotoFile = useCallback(async (file: File) => {
    setError(null);
    setPhotoResult(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일을 선택해주세요.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("이미지가 너무 큽니다 (최대 8MB).");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/photo-translate", { method: "POST", body: form });
      const payload = (await res.json()) as PhotoResult & { message?: string; configured?: boolean };
      if (!res.ok) {
        setError(payload.message || "사진 번역에 실패했어요.");
        return;
      }
      if (payload.configured === false) {
        setError(payload.message || "OpenAI 키가 설정돼있지 않아요.");
        return;
      }
      setPhotoResult(payload);
    } catch (err) {
      setError((err as Error).message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  const examples = toneExamples[tone];

  if (!open) return null;

  const supportsTts = ttsSupported();
  const micDisabled = transcribing;
  const showToneStrip = mode === "translate" || mode === "suggest" || mode === "reply";
  const showInputField = mode === "translate" || mode === "suggest" || mode === "reply";

  const inputLabel =
    mode === "translate" ? `원문 (${langLabel[pair.src]})` :
    mode === "suggest" ? "상황 설명" :
    mode === "reply" ? "그녀가 한 말 (일본어)" :
    "";

  const inputPlaceholder =
    mode === "translate"
      ? pair.src === "ko"
        ? "여기에 한국어를 적거나 🎙️을 눌러 말하세요"
        : "여기에 일본어를 입력하거나 🎙️을 눌러 말하세요"
      : mode === "suggest"
      ? "어떤 상황인지 자세히 적어주세요\n예: 텐진 이자카야에서 합석함. 그녀가 사진작가라고 했고 분위기 좋음. 자연스럽게 관심 표현하고 싶음"
      : mode === "reply"
      ? "그녀가 한 일본어를 적거나 🎙️을 눌러 그녀가 말할 때 녹음하세요\n예: もう一軒行きませんか?"
      : "";

  const submitLabel =
    mode === "translate" ? "번역하기" :
    mode === "suggest" ? "추천받기" :
    mode === "reply" ? "답장 추천받기" : "";

  const submitIcon =
    mode === "translate" ? <Sparkles size={15} /> :
    mode === "suggest" ? <Wand2 size={15} /> :
    mode === "reply" ? <MessageCircleReply size={15} /> :
    <Sparkles size={15} />;

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

        <div className="translate-mode" role="tablist" aria-label="모드">
          {modeOrder.map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={mode === m ? "translate-mode__btn translate-mode__btn--on" : "translate-mode__btn"}
              onClick={() => switchMode(m)}
            >
              {modeMeta[m].icon}
              {modeMeta[m].label}
              {m === "favorites" && favorites.items.length > 0 && (
                <em className="translate-mode__count">{favorites.items.length}</em>
              )}
            </button>
          ))}
        </div>

        {/* Direction strip — translate only */}
        {mode === "translate" && (
          <div className="translate-direction">
            <span className="translate-direction__lang">{langLabel[pair.src]}</span>
            <button className="translate-direction__swap" onClick={swap} aria-label="언어 바꾸기">
              <ArrowLeftRight size={14} />
            </button>
            <span className="translate-direction__lang translate-direction__lang--tgt">
              {langLabel[pair.tgt]}
            </span>
          </div>
        )}
        {mode === "suggest" && (
          <div className="translate-direction translate-direction--suggest">
            <span className="translate-direction__lang">상황 (한국어)</span>
            <span className="translate-direction__arrow">→</span>
            <span className="translate-direction__lang translate-direction__lang--tgt">日本語 추천 3-4개</span>
          </div>
        )}
        {mode === "reply" && (
          <div className="translate-direction translate-direction--suggest">
            <span className="translate-direction__lang">그녀의 말 (日本語)</span>
            <span className="translate-direction__arrow">→</span>
            <span className="translate-direction__lang translate-direction__lang--tgt">日本語 답장 3-4개</span>
          </div>
        )}

        {/* Tone strip */}
        {showToneStrip && (
          <>
            <div className="translate-tones" role="tablist" aria-label="톤 프리셋">
              {toneOrder.map((id) => (
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
          </>
        )}

        {/* Example chips — translate only */}
        {mode === "translate" && examples.length > 0 && (
          <div className="translate-examples" aria-label="이 톤의 예시 문장">
            <div className="translate-examples__head">
              <Lightbulb size={12} />
              <em>예시 — 눌러서 채우기</em>
            </div>
            <div className="translate-examples__list">
              {examples.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  className="translate-example"
                  onClick={() => fillFromExample(phrase)}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text input (translate / suggest / reply) */}
        {showInputField && (
          <>
            <label className="translate-field">
              <span>{inputLabel}</span>
              <div className="translate-field__wrap">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={onKeyDownInput}
                  placeholder={inputPlaceholder}
                  rows={mode === "translate" ? 3 : 4}
                  maxLength={800}
                />
                <button
                  type="button"
                  className={
                    recording ? "translate-mic translate-mic--rec"
                    : transcribing ? "translate-mic translate-mic--busy"
                    : "translate-mic"
                  }
                  onClick={recording ? stopRecording : startRecording}
                  disabled={micDisabled}
                  aria-label={recording ? "녹음 중지" : "음성으로 입력"}
                  title={recording ? "녹음 중지" : "음성으로 입력"}
                >
                  {transcribing ? <Loader2 size={16} className="translate-mic__spin" />
                    : recording ? <Square size={14} fill="currentColor" />
                    : <Mic size={16} />}
                </button>
              </div>
              <small className="translate-field__hint">
                {text.length}/800 · ⌘/Ctrl+Enter로 {submitLabel.replace("받기", "").replace("하기", "")}
                {recording && <em className="translate-field__rec"> · 녹음 중…</em>}
                {transcribing && <em className="translate-field__rec"> · 인식 중…</em>}
              </small>
            </label>

            {mode === "translate" && (
              <details className="translate-context">
                <summary>상황 메모 (선택) {context.trim() && <em>· 입력됨</em>}</summary>
                <input
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="예: 텐진 이자카야, 방금 합석함, 그녀가 사진작가라고 했음"
                  maxLength={240}
                />
              </details>
            )}

            <button className="translate-submit" onClick={submit} disabled={loading || !text.trim()}>
              {loading ? (
                <>
                  <Loader2 size={15} className="translate-submit__spin" />
                  처리 중…
                </>
              ) : (
                <>
                  {submitIcon}
                  {submitLabel}
                </>
              )}
            </button>
          </>
        )}

        {/* Photo mode controls */}
        {mode === "photo" && (
          <PhotoSection
            onFile={onPhotoFile}
            preview={photoPreview}
            loading={loading}
            fileInputRef={fileInputRef}
            result={photoResult}
            onClear={() => {
              setPhotoPreview(null);
              setPhotoResult(null);
              setError(null);
            }}
          />
        )}

        {error && <div className="translate-error">{error}</div>}

        {/* Results */}
        {mode === "translate" && translateResult && (
          <TranslateResultView
            result={translateResult}
            pair={pair}
            tone={tone}
            sourceText={text}
            copied={copied}
            speakingTtsKey={speakingTtsKey}
            supportsTts={supportsTts}
            onCopy={copy}
            onSpeak={playTts}
            favorites={favorites}
          />
        )}

        {mode === "suggest" && suggestResult && (
          <div className="translate-suggestions">
            {suggestResult.suggestions.map((sugg, i) => (
              <SuggestionCard
                key={`${sugg.ja}-${i}`}
                index={i}
                ja={sugg.ja}
                meaning={sugg.meaning}
                hangulReading={sugg.hangulReading}
                romaji={sugg.romaji}
                reason={sugg.reason}
                tone={tone}
                source="suggest"
                context={text}
                supportsTts={supportsTts}
                isSpeaking={speakingTtsKey === `sugg-${i}`}
                isCopied={copied === `sugg-${i}`}
                isFav={favorites.has(sugg.ja, sugg.meaning || "")}
                onSpeak={() => playTts(`sugg-${i}`, sugg.ja, "ja")}
                onCopy={() => copy(`sugg-${i}`, sugg.ja)}
                onFav={() => favorites.toggle({
                  ja: sugg.ja,
                  ko: sugg.meaning || "",
                  hangulReading: sugg.hangulReading,
                  romaji: sugg.romaji,
                  tone,
                  source: "suggest",
                  context: text
                })}
              />
            ))}
          </div>
        )}

        {mode === "reply" && replyResult && (
          <div className="translate-replies">
            {replyResult.heardMeaning && (
              <div className="translate-heard">
                <em>그녀의 말 의미</em>
                <p>“{replyResult.heardMeaning}”</p>
              </div>
            )}
            <div className="translate-suggestions">
              {replyResult.suggestions.map((sugg, i) => (
                <SuggestionCard
                  key={`${sugg.ja}-${i}`}
                  index={i}
                  ja={sugg.ja}
                  meaning={sugg.meaning}
                  hangulReading={sugg.hangulReading}
                  romaji={sugg.romaji}
                  reason={sugg.angle}
                  tone={tone}
                  source="reply"
                  context={text}
                  supportsTts={supportsTts}
                  isSpeaking={speakingTtsKey === `reply-${i}`}
                  isCopied={copied === `reply-${i}`}
                  isFav={favorites.has(sugg.ja, sugg.meaning || "")}
                  onSpeak={() => playTts(`reply-${i}`, sugg.ja, "ja")}
                  onCopy={() => copy(`reply-${i}`, sugg.ja)}
                  onFav={() => favorites.toggle({
                    ja: sugg.ja,
                    ko: sugg.meaning || "",
                    hangulReading: sugg.hangulReading,
                    romaji: sugg.romaji,
                    tone,
                    source: "reply",
                    context: text
                  })}
                />
              ))}
            </div>
          </div>
        )}

        {mode === "photo" && photoResult && photoResult.blocks.length > 0 && (
          <div className="translate-suggestions">
            {photoResult.blocks.map((b, i) => (
              <PhotoBlockCard
                key={i}
                index={i}
                ja={b.ja}
                ko={b.ko}
                note={b.note}
                supportsTts={supportsTts}
                isSpeaking={speakingTtsKey === `photo-${i}`}
                isCopied={copied === `photo-${i}`}
                isFav={favorites.has(b.ja, b.ko)}
                onSpeak={() => playTts(`photo-${i}`, b.ja, "ja")}
                onCopy={() => copy(`photo-${i}`, b.ja)}
                onFav={() => favorites.toggle({
                  ja: b.ja,
                  ko: b.ko,
                  source: "photo",
                  context: photoResult.scene
                })}
              />
            ))}
          </div>
        )}

        {mode === "favorites" && (
          <FavoritesList
            items={favorites.items}
            supportsTts={supportsTts}
            speakingTtsKey={speakingTtsKey}
            copied={copied}
            onSpeak={(key, ja) => playTts(key, ja, "ja")}
            onCopy={(key, value) => copy(key, value)}
            onRemove={favorites.remove}
            onClear={() => {
              if (window.confirm("저장된 즐겨찾기를 모두 지울까요?")) favorites.clear();
            }}
          />
        )}
      </section>
    </div>
  );
}

// ── Result subcomponents ───────────────────────────────────────────────────

function TranslateResultView({
  result,
  pair,
  tone,
  sourceText,
  copied,
  speakingTtsKey,
  supportsTts,
  onCopy,
  onSpeak,
  favorites
}: {
  result: TranslateResponse;
  pair: Pair;
  tone: TonePreset;
  sourceText: string;
  copied: string | null;
  speakingTtsKey: string | null;
  supportsTts: boolean;
  onCopy: (key: string, value: string) => void;
  onSpeak: (key: string, value: string, lang: LangCode) => void;
  favorites: ReturnType<typeof useFavorites>;
}) {
  // For the main translation:
  //   KO→JA: ja = result.translation, ko = sourceText
  //   JA→KO: ja = sourceText, ko = result.translation
  const ja = pair.tgt === "ja" ? result.translation : sourceText.trim();
  const ko = pair.tgt === "ja" ? sourceText.trim() : result.translation;
  const isFav = ja && ko ? favorites.has(ja, ko) : false;
  const favEntry: Omit<FavoriteItem, "id" | "createdAt"> = {
    ja,
    ko,
    hangulReading: pair.tgt === "ja" ? result.hangulReading : undefined,
    romaji: pair.tgt === "ja" ? result.romaji : undefined,
    tone,
    source: "translate"
  };

  return (
    <div className="translate-result">
      <div className="translate-result__main">
        <span className="translate-result__lang">{langLabel[pair.tgt]}</span>
        <p className="translate-result__text">{result.translation}</p>
        <div className="translate-result__actions">
          {supportsTts && (
            <button
              className={speakingTtsKey === "main" ? "translate-result__action translate-result__action--on" : "translate-result__action"}
              onClick={() => onSpeak("main", result.translation, pair.tgt)}
            >
              <Volume2 size={14} />
              <span>{speakingTtsKey === "main" ? "재생 중" : "듣기"}</span>
            </button>
          )}
          <button className="translate-result__action" onClick={() => onCopy("main", result.translation)}>
            {copied === "main" ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied === "main" ? "복사됨" : "복사"}</span>
          </button>
          {ja && ko && (
            <button
              className={isFav ? "translate-result__action translate-result__action--star" : "translate-result__action"}
              onClick={() => favorites.toggle(favEntry)}
              aria-pressed={isFav}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
              <span>{isFav ? "저장됨" : "저장"}</span>
            </button>
          )}
        </div>
      </div>
      {pair.tgt === "ja" && (result.hangulReading || result.romaji) && (
        <div className="translate-result__reading">
          {result.hangulReading && (
            <div className="translate-reading">
              <em>한글 발음</em>
              <span>{result.hangulReading}</span>
              <button onClick={() => onCopy("hangul", result.hangulReading!)}>
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
            {result.alt.map((a, i) => {
              const altJa = pair.tgt === "ja" ? a.text : "";
              const altKo = pair.tgt === "ja" ? (a.meaning ?? "") : a.text;
              const altFav = altJa && altKo ? favorites.has(altJa, altKo) : false;
              return (
                <li key={i}>
                  <span className="translate-alts__body">
                    <span className="translate-alts__text">{a.text}</span>
                    {a.meaning && pair.tgt === "ja" && (
                      <span className="translate-alts__meaning">{a.meaning}</span>
                    )}
                  </span>
                  <span className="translate-alts__btns">
                    {supportsTts && (
                      <button
                        onClick={() => onSpeak(`alt-${i}`, a.text, pair.tgt)}
                        className={speakingTtsKey === `alt-${i}` ? "is-on" : undefined}
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                    <button onClick={() => onCopy(`alt-${i}`, a.text)}>
                      {copied === `alt-${i}` ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    {altJa && altKo && (
                      <button
                        onClick={() => favorites.toggle({
                          ja: altJa,
                          ko: altKo,
                          tone,
                          source: "alt"
                        })}
                        className={altFav ? "is-on" : undefined}
                        aria-pressed={altFav}
                      >
                        <Star size={12} fill={altFav ? "currentColor" : "none"} />
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {result.note && <p className="translate-note">💡 {result.note}</p>}
    </div>
  );
}

function SuggestionCard({
  index,
  ja,
  meaning,
  hangulReading,
  romaji,
  reason,
  supportsTts,
  isSpeaking,
  isCopied,
  isFav,
  onSpeak,
  onCopy,
  onFav
}: {
  index: number;
  ja: string;
  meaning: string;
  hangulReading: string;
  romaji: string;
  reason: string;
  tone: TonePreset;
  source: FavoriteSource;
  context: string;
  supportsTts: boolean;
  isSpeaking: boolean;
  isCopied: boolean;
  isFav: boolean;
  onSpeak: () => void;
  onCopy: () => void;
  onFav: () => void;
}) {
  return (
    <article className="translate-sugg">
      <header className="translate-sugg__head">
        <span className="translate-sugg__num">{index + 1}</span>
        <span className="translate-sugg__reason">{reason}</span>
      </header>
      <p className="translate-sugg__ja">{ja}</p>
      {meaning && <p className="translate-sugg__meaning">“{meaning}”</p>}
      {hangulReading && <p className="translate-sugg__hangul">{hangulReading}</p>}
      {romaji && <p className="translate-sugg__romaji">{romaji}</p>}
      <div className="translate-sugg__actions">
        {supportsTts && (
          <button
            className={isSpeaking ? "translate-result__action translate-result__action--on" : "translate-result__action"}
            onClick={onSpeak}
          >
            <Volume2 size={13} />
            <span>{isSpeaking ? "재생 중" : "듣기"}</span>
          </button>
        )}
        <button className="translate-result__action" onClick={onCopy}>
          {isCopied ? <Check size={13} /> : <Copy size={13} />}
          <span>{isCopied ? "복사됨" : "복사"}</span>
        </button>
        <button
          className={isFav ? "translate-result__action translate-result__action--star" : "translate-result__action"}
          onClick={onFav}
          aria-pressed={isFav}
        >
          <Star size={13} fill={isFav ? "currentColor" : "none"} />
          <span>{isFav ? "저장됨" : "저장"}</span>
        </button>
      </div>
    </article>
  );
}

function PhotoBlockCard({
  index,
  ja,
  ko,
  note,
  supportsTts,
  isSpeaking,
  isCopied,
  isFav,
  onSpeak,
  onCopy,
  onFav
}: {
  index: number;
  ja: string;
  ko: string;
  note?: string;
  supportsTts: boolean;
  isSpeaking: boolean;
  isCopied: boolean;
  isFav: boolean;
  onSpeak: () => void;
  onCopy: () => void;
  onFav: () => void;
}) {
  return (
    <article className="translate-sugg translate-sugg--photo">
      <header className="translate-sugg__head">
        <span className="translate-sugg__num">{index + 1}</span>
      </header>
      <p className="translate-sugg__ja">{ja}</p>
      <p className="translate-sugg__meaning">“{ko}”</p>
      {note && <p className="translate-note translate-note--inline">💡 {note}</p>}
      <div className="translate-sugg__actions">
        {supportsTts && (
          <button
            className={isSpeaking ? "translate-result__action translate-result__action--on" : "translate-result__action"}
            onClick={onSpeak}
          >
            <Volume2 size={13} />
            <span>{isSpeaking ? "재생 중" : "듣기"}</span>
          </button>
        )}
        <button className="translate-result__action" onClick={onCopy}>
          {isCopied ? <Check size={13} /> : <Copy size={13} />}
          <span>{isCopied ? "복사됨" : "복사"}</span>
        </button>
        <button
          className={isFav ? "translate-result__action translate-result__action--star" : "translate-result__action"}
          onClick={onFav}
          aria-pressed={isFav}
        >
          <Star size={13} fill={isFav ? "currentColor" : "none"} />
          <span>{isFav ? "저장됨" : "저장"}</span>
        </button>
      </div>
    </article>
  );
}

function PhotoSection({
  onFile,
  preview,
  loading,
  fileInputRef,
  result,
  onClear
}: {
  onFile: (file: File) => void;
  preview: string | null;
  loading: boolean;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  result: PhotoResult | null;
  onClear: () => void;
}) {
  return (
    <div className="translate-photo">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.target.value = "";
        }}
      />
      {!preview ? (
        <button
          className="translate-photo__cta"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Camera size={22} />
          <strong>메뉴·간판 촬영</strong>
          <small>모바일이면 카메라로, PC면 갤러리에서 선택돼요</small>
        </button>
      ) : (
        <div className="translate-photo__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="업로드된 사진" />
          <div className="translate-photo__preview-actions">
            <button
              type="button"
              className="translate-result__action"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <ImageIcon size={13} />
              <span>다른 사진</span>
            </button>
            <button
              type="button"
              className="translate-result__action"
              onClick={onClear}
              disabled={loading}
            >
              <X size={13} />
              <span>지우기</span>
            </button>
          </div>
        </div>
      )}
      {loading && (
        <div className="translate-photo__loading">
          <Loader2 size={15} className="translate-submit__spin" />
          <span>사진 분석 중…</span>
        </div>
      )}
      {result && result.blocks.length === 0 && result.message && (
        <p className="translate-photo__empty">{result.message}</p>
      )}
    </div>
  );
}

function FavoritesList({
  items,
  supportsTts,
  speakingTtsKey,
  copied,
  onSpeak,
  onCopy,
  onRemove,
  onClear
}: {
  items: FavoriteItem[];
  supportsTts: boolean;
  speakingTtsKey: string | null;
  copied: string | null;
  onSpeak: (key: string, ja: string) => void;
  onCopy: (key: string, value: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const sortedItems = useMemo(() => items.slice().sort((a, b) => b.createdAt - a.createdAt), [items]);

  if (items.length === 0) {
    return (
      <div className="translate-empty">
        <Star size={24} />
        <strong>저장된 표현이 아직 없어요</strong>
        <p>번역·추천·답장·사진 결과의 ⭐를 누르면 여기 모입니다.</p>
      </div>
    );
  }

  return (
    <div className="translate-favs">
      <header className="translate-favs__head">
        <span>{items.length}개 저장됨</span>
        <button className="translate-favs__clear" onClick={onClear}>
          <Trash2 size={12} />
          모두 지우기
        </button>
      </header>
      <div className="translate-suggestions">
        {sortedItems.map((it) => {
          const speakKey = `fav-${it.id}-speak`;
          const copyKey = `fav-${it.id}-copy`;
          return (
            <article key={it.id} className="translate-sugg translate-sugg--fav">
              <header className="translate-sugg__head">
                <Star size={13} fill="currentColor" />
                {it.tone && (
                  <span className="translate-sugg__reason">
                    {toneMeta[it.tone as TonePreset]?.emoji ?? "•"} {toneMeta[it.tone as TonePreset]?.label ?? it.tone}
                  </span>
                )}
                {!it.tone && it.source === "photo" && (
                  <span className="translate-sugg__reason">📷 {it.context || "사진"}</span>
                )}
              </header>
              <p className="translate-sugg__ja">{it.ja}</p>
              {it.ko && <p className="translate-sugg__meaning">“{it.ko}”</p>}
              {it.hangulReading && <p className="translate-sugg__hangul">{it.hangulReading}</p>}
              {it.romaji && <p className="translate-sugg__romaji">{it.romaji}</p>}
              <div className="translate-sugg__actions">
                {supportsTts && (
                  <button
                    className={speakingTtsKey === speakKey ? "translate-result__action translate-result__action--on" : "translate-result__action"}
                    onClick={() => onSpeak(speakKey, it.ja)}
                  >
                    <Volume2 size={13} />
                    <span>{speakingTtsKey === speakKey ? "재생 중" : "듣기"}</span>
                  </button>
                )}
                <button className="translate-result__action" onClick={() => onCopy(copyKey, it.ja)}>
                  {copied === copyKey ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied === copyKey ? "복사됨" : "복사"}</span>
                </button>
                <button className="translate-result__action" onClick={() => onRemove(it.id)}>
                  <Trash2 size={13} />
                  <span>삭제</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
