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
export function speakKannadaText(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "kn-IN";
    utterance.rate = 0.9; // Slightly slower for clear pronunciation
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleEnd = () => {
      setIsSpeaking(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const ok = speakKannadaText(text, handleEnd);
    if (!ok) {
      setIsSpeaking(false);
      return;
    }

    // Safety fallback timeout in case onend doesn't fire
    timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, 4000);
  }, []);

  return { hasVoice, isSpeaking, speak };
}
