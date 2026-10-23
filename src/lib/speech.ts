"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

/**
 * Checks if browser supports SpeechSynthesis and has a Kannada (kn-IN) voice available.
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
 * Speaks the provided text using the browser Web Speech API with kn-IN language.
 */
export function speakKannadaText(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "kn-IN";
    utterance.rate = 0.9; // Slightly slower for clear pronunciation
    utterance.pitch = 1.0;

    const knVoice = getKannadaVoice();
    if (knVoice) {
      utterance.voice = knVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn("Speech synthesis failed:", err);
    return false;
  }
}

function subscribeVoices(callback: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return () => {};
  }
  window.speechSynthesis.addEventListener("voiceschanged", callback);
  return () => {
    window.speechSynthesis.removeEventListener("voiceschanged", callback);
  };
}

function getVoiceSnapshot(): boolean {
  return Boolean(getKannadaVoice());
}

function getVoiceServerSnapshot(): boolean {
  return false;
}

/**
 * React hook to manage Kannada text-to-speech capabilities and playing states.
 */
export function useKannadaSpeech() {
  const hasVoice = useSyncExternalStore(
    subscribeVoices,
    getVoiceSnapshot,
    getVoiceServerSnapshot
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const speak = useCallback((text: string) => {
    setIsSpeaking(true);
    const ok = speakKannadaText(text);
    if (!ok) {
      setIsSpeaking(false);
      return;
    }

    // Reset speaking flag after brief timeout
    setTimeout(() => {
      setIsSpeaking(false);
    }, 2000);
  }, []);

  return { hasVoice, isSpeaking, speak };
}
