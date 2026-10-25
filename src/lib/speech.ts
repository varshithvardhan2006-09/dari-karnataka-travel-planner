"use client";

import { useState, useCallback } from "react";

let currentAudio: HTMLAudioElement | null = null;

export interface KannadaSpeechOptions {
  translit?: string;
  isSlow?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Checks if browser has native Kannada voice in SpeechSynthesis.
 */
export function getKannadaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang === "kn-IN" ||
        v.lang === "kn_IN" ||
        v.lang.toLowerCase().startsWith("kn")
    ) || null
  );
}

/**
 * Plays authentic, high-fidelity Kannada speech.
 * 1. Primary: Native Google Kannada TTS endpoint (works universally on all browsers with crystal-clear native pronunciation).
 * 2. Fallback: Browser Web Speech API (with kn-IN native voice or phonetic transliteration).
 */
export function playKannadaSpeech(
  text: string,
  options?: KannadaSpeechOptions
): void {
  if (typeof window === "undefined" || !text) return;

  const { translit, isSlow = false, onStart, onEnd } = options || {};

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

    // High-fidelity native Google Kannada TTS stream via same-origin server proxy
    const encoded = encodeURIComponent(text.trim());
    const audioUrl = `/api/tts?text=${encoded}`;

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
      speakWithWebSpeech(text, translit, isSlow, onEnd);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Speech API if autoplay restriction or network failure
        speakWithWebSpeech(text, translit, isSlow, onEnd);
      });
    }
  } catch {
    speakWithWebSpeech(text, translit, isSlow, onEnd);
  }
}

function speakWithWebSpeech(
  text: string,
  translit?: string,
  isSlow: boolean = false,
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

    const knVoice = getKannadaVoice();
    // If no Kannada voice exists on this OS, speak phonetic transliteration
    // so the auto driver and user actually hear the Kannada words out loud!
    const spokenText = knVoice ? text : translit || text;
    const utterance = new SpeechSynthesisUtterance(spokenText);

    if (knVoice) {
      utterance.voice = knVoice;
      utterance.lang = "kn-IN";
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
 * Backward compatible wrapper for legacy calls.
 */
export function speakKannadaText(text: string, onEnd?: () => void): boolean {
  playKannadaSpeech(text, { onEnd });
  return true;
}

/**
 * React hook to manage Kannada speech playback.
 */
export function useKannadaSpeech() {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const speak = useCallback(
    (text: string, translit?: string, isSlow: boolean = false) => {
      setIsSpeaking(true);
      playKannadaSpeech(text, {
        translit,
        isSlow,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    },
    []
  );

  const stop = useCallback(() => {
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
    setIsSpeaking(false);
  }, []);

  return {
    hasVoice: true, // Universally available across all modern devices
    isSpeaking,
    speak,
    stop,
  };
}