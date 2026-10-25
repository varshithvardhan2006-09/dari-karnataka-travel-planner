"use client";

import { useState, useCallback } from "react";

let currentAudio: HTMLAudioElement | null = null;

export interface KannadaSpeechOptions {
  translit?: string;
  isSlow?: boolean;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Checks if browser has native voice in SpeechSynthesis for specified language.
 */
export function getLanguageVoice(langCode: string = "kn"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const normalized = langCode.toLowerCase();
  return (
    voices.find(
      (v) =>
        v.lang.toLowerCase().replace(/_/g, "-") === `${normalized}-in` ||
        v.lang.toLowerCase().startsWith(normalized)
    ) || null
  );
}

/**
 * Legacy alias for backwards compatibility.
 */
export function getKannadaVoice(): SpeechSynthesisVoice | null {
  return getLanguageVoice("kn");
}

/**
 * Plays authentic, high-fidelity speech.
 * 1. Primary: Native Google TTS endpoint via same-origin server proxy (supports kn, hi, te, ta, ml, en).
 * 2. Fallback: Browser Web Speech API (with native voice or phonetic transliteration).
 */
export function playKannadaSpeech(
  text: string,
  options?: KannadaSpeechOptions
): void {
  if (typeof window === "undefined" || !text) return;

  const { translit, isSlow = false, lang = "kn", onStart, onEnd } = options || {};

  try {
    // Cancel any currently playing audio stream
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    onStart?.();

    // High-fidelity native Google TTS stream via same-origin server proxy
    const encoded = encodeURIComponent(text.trim());
    const audioUrl = `/api/tts?text=${encoded}&lang=${encodeURIComponent(lang)}`;

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audio.volume = 1.0;
    currentAudio = audio;

    // Safely set playback rate once metadata loads (prevents InvalidStateError on iOS Safari)
    audio.addEventListener("loadedmetadata", () => {
      try {
        if (isSlow) {
          audio.playbackRate = 0.75;
        }
      } catch {
        // ignore
      }
    });

    audio.onended = () => {
      currentAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      // Fallback to browser Web Speech API
      speakWithWebSpeech(text, translit, isSlow, lang, onEnd);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Speech API if autoplay restriction or network failure
        speakWithWebSpeech(text, translit, isSlow, lang, onEnd);
      });
    }
  } catch {
    speakWithWebSpeech(text, translit, isSlow, lang, onEnd);
  }
}

function speakWithWebSpeech(
  text: string,
  translit?: string,
  isSlow: boolean = false,
  langCode: string = "kn",
  onEnd?: () => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  try {
    // Unstick Chromium/Safari speech synthesis if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const nativeVoice = getLanguageVoice(langCode);
    // If no native voice exists on this OS, speak phonetic transliteration
    // so the listener actually hears the intended words out loud!
    const spokenText = nativeVoice ? text : translit || text;
    const utterance = new SpeechSynthesisUtterance(spokenText);

    if (nativeVoice) {
      utterance.voice = nativeVoice;
      utterance.lang = nativeVoice.lang || `${langCode}-IN`;
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = isSlow ? 0.75 : 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

/**
 * Halts any active Kannada audio playback or Web Speech synthesis immediately.
 */
export function stopKannadaSpeech(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Backward compatible wrapper for legacy calls.
 */
export function speakKannadaText(text: string, onEnd?: () => void): boolean {
  playKannadaSpeech(text, { onEnd });
  return true;
}

/**
 * React hook to manage Kannada speech playback with Play, Stop, and Replay controls.
 */
export function useKannadaSpeech() {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastText, setLastText] = useState<string>("");
  const [lastTranslit, setLastTranslit] = useState<string | undefined>(undefined);
  const [lastLang, setLastLang] = useState<string>("kn");
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);

  const speak = useCallback(
    (text: string, translit?: string, isSlow: boolean = false, lang: string = "kn") => {
      if (!text || !text.trim()) return;
      setLastText(text);
      setLastTranslit(translit);
      setLastLang(lang);
      setIsSpeaking(true);
      playKannadaSpeech(text, {
        translit,
        isSlow,
        lang,
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          setHasPlayed(true);
        },
      });
    },
    []
  );

  const stop = useCallback(() => {
    stopKannadaSpeech();
    setIsSpeaking(false);
  }, []);

  const replay = useCallback(
    (isSlow: boolean = false) => {
      if (!lastText) return;
      speak(lastText, lastTranslit, isSlow, lastLang);
    },
    [lastText, lastTranslit, lastLang, speak]
  );

  return {
    hasVoice: true, // Universally available across all modern devices
    isSpeaking,
    hasPlayed,
    speak,
    stop,
    replay,
  };
}
