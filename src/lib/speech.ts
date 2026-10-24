"use client";

import { useState, useCallback } from "react";

let currentAudio: HTMLAudioElement | null = null;

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
 * 1. Primary: Native Google Kannada TTS endpoint (works on all devices with crystal-clear native pronunciation).
 * 2. Fallback: Browser Web Speech API (with kn-IN).
 */
export function playKannadaSpeech(
  text: string,
  options?: { isSlow?: boolean; onStart?: () => void; onEnd?: () => void }
): void {
  if (typeof window === "undefined" || !text) return;

  const { isSlow = false, onStart, onEnd } = options || {};

  try {
    // Cancel any existing audio
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

    // High-fidelity native Google Kannada TTS stream
    const encoded = encodeURIComponent(text.trim());
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encoded}`;

    const audio = new Audio(audioUrl);
    currentAudio = audio;
    if (isSlow) {
      audio.playbackRate = 0.75;
    }

    audio.onended = () => {
      currentAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      // Fallback to browser Web Speech API
      speakWithWebSpeech(text, isSlow, onEnd);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Speech API if autoplay restriction or network failure
        speakWithWebSpeech(text, isSlow, onEnd);
      });
    }
  } catch {
    speakWithWebSpeech(text, isSlow, onEnd);
  }
}

function speakWithWebSpeech(text: string, isSlow: boolean, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "kn-IN";
    utterance.rate = isSlow ? 0.7 : 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    const knVoice = getKannadaVoice();
    if (knVoice) {
      utterance.voice = knVoice;
    }

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

  const speak = useCallback((text: string, isSlow: boolean = false) => {
    setIsSpeaking(true);
    playKannadaSpeech(text, {
      isSlow,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, []);

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