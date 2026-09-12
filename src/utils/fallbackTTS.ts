// Google TTS works reliably with shorter chunks.
const MAX_CHUNK_LENGTH = 100;

const GOOGLE_TTS_LANG: Record<string, string> = {
  en: 'en',
  hi: 'hi',
  gu: 'gu',
};

// Approximate spoken duration for progress UI.
const CHARS_PER_SECOND: Record<string, number> = {
  en: 14,
  hi: 12,
  gu: 12,
};

export function getFallbackTTSLanguage(lang: string): string {
  return GOOGLE_TTS_LANG[lang] || 'en';
}

export function buildFallbackTtsUrl(text: string, lang: string): string {
  const tl = getFallbackTTSLanguage(lang);
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(text)}`;
}

export function estimateFallbackDuration(text: string, lang: string): number {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  const chunks = splitTextForFallbackTTS(normalized);
  const charsPerSecond = CHARS_PER_SECOND[lang] || CHARS_PER_SECOND.en;
  return chunks.reduce((total, chunk) => total + chunk.length / charsPerSecond, 0);
}

export function estimateSpeechDuration(text: string, lang: string): number {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  if (lang === 'gu' || lang === 'hi') {
    const charsPerSecond = CHARS_PER_SECOND[lang];
    return normalized.length / charsPerSecond;
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return (wordCount / 150) * 60;
}

function pushHardSplit(value: string, chunks: string[]) {
  for (let index = 0; index < value.length; index += MAX_CHUNK_LENGTH) {
    chunks.push(value.slice(index, index + MAX_CHUNK_LENGTH));
  }
}

export function splitTextForFallbackTTS(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  const parts = normalized
    .split(/(?<=[\u0964\u0965.!?।])/)
    .map(part => part.trim())
    .filter(Boolean);

  let current = '';

  const pushCurrent = () => {
    if (current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
  };

  for (const part of parts) {
    if (part.length <= MAX_CHUNK_LENGTH) {
      const candidate = current ? `${current} ${part}` : part;
      if (candidate.length <= MAX_CHUNK_LENGTH) {
        current = candidate;
      } else {
        pushCurrent();
        current = part;
      }
      continue;
    }

    pushCurrent();
    pushHardSplit(part, chunks);
  }

  pushCurrent();

  if (!chunks.length) {
    pushHardSplit(normalized, chunks);
  }

  return chunks;
}
