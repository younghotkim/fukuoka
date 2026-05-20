// Browser-native TTS using SpeechSynthesis. Free, instant, no API key.
// iOS Safari ships Kyoko/Otoya for Japanese; Chrome ships Google Japanese voices.
// We prefer the best-sounding voice we can find, fall back gracefully.

export type SpeakLang = "ja" | "ko";

const LANG_TAG: Record<SpeakLang, string> = { ja: "ja-JP", ko: "ko-KR" };

// Voice quality preferences per platform. Higher index in the preferred list = checked first.
// `name` values are case-insensitive substring matches against `SpeechSynthesisVoice.name`.
const PREFERRED: Record<SpeakLang, string[]> = {
  // iOS: Kyoko (premium), Otoya. macOS Safari shares these. Chrome: "Google 日本語".
  ja: ["kyoko", "otoya", "google 日本語", "google ja-jp", "siri"],
  // iOS: Yuna/Sora. Chrome: "Google 한국의".
  ko: ["yuna", "sora", "google 한국의", "google ko-kr", "siri"]
};

function pickVoice(lang: SpeakLang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const tag = LANG_TAG[lang];
  const langMatches = voices.filter((v) => v.lang === tag || v.lang.startsWith(`${lang}-`) || v.lang === lang);
  if (langMatches.length === 0) return null;
  const wanted = PREFERRED[lang];
  for (const want of wanted) {
    const found = langMatches.find((v) => v.name.toLowerCase().includes(want));
    if (found) return found;
  }
  // Prefer non-default-low-quality voices when there's a localService flag.
  const local = langMatches.find((v) => v.localService);
  return local ?? langMatches[0];
}

let cachedVoices: SpeechSynthesisVoice[] | null = null;

async function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length > 0) {
    cachedVoices = now;
    return now;
  }
  // Some browsers populate asynchronously — wait for voiceschanged, max 1s.
  return await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const v = synth.getVoices();
      cachedVoices = v;
      resolve(v);
    };
    synth.addEventListener("voiceschanged", finish, { once: true });
    window.setTimeout(finish, 1000);
  });
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function speak(text: string, lang: SpeakLang, opts?: { rate?: number; pitch?: number }) {
  if (!ttsSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  // Cancel anything currently speaking so successive clicks aren't queued forever.
  synth.cancel();

  const voices = cachedVoices ?? (await ensureVoices());
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = LANG_TAG[lang];
  utter.rate = opts?.rate ?? 0.95; // slightly slower — clearer for the listener
  utter.pitch = opts?.pitch ?? 1.0;
  const voice = pickVoice(lang, voices);
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

export function stopSpeaking() {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
}
