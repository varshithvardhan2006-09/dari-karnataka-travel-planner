"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Place } from "@/lib/schema";
import { playKannadaSpeech, stopKannadaSpeech } from "@/lib/speech";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps";

interface ShowToLocalModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PHRASES = [
  { en: "How much is the auto fare?", kn: "ಆಟೋ ಬಾಡಿಗೆ ಎಷ್ಟು ಆಗುತ್ತದೆ?", translit: "Auto baadige eshtu aaguttade?" },
  { en: "Please take me to the railway station.", kn: "ದಯವಿಟ್ಟು ರೈಲ್ವೆ ನಿಲ್ದಾಣಕ್ಕೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ.", translit: "Dayavittu railway nildanakke karedukondu hogi." },
  { en: "Please stop the car here.", kn: "ದಯವಿಟ್ಟು ಕಾರನ್ನು ಇಲ್ಲಿಯೇ ನಿಲ್ಲಿಸಿ.", translit: "Dayavittu car-annu illiye nillisi." },
  { en: "Is this food vegetarian?", kn: "ಈ ಊಟ ಸಸ್ಯಾಹಾರವೇ?", translit: "Ee oota sasyaahaarave?" },
  { en: "Where is the ticket counter?", kn: "ಟಿಕೆಟ್ ಕೌಂಟರ್ ಎಲ್ಲಿದೆ?", translit: "Ticket counter ellide?" },
  { en: "Can you wait here for 10 minutes?", kn: "ದಯವಿಟ್ಟು ಹತ್ತು ನಿಮಿಷ ಇಲ್ಲಿಯೇ ಕಾಯಬಹುದೇ?", translit: "Dayavittu hattu nimisha illiye kaayabahude?" },
];

export default function ShowToLocalModal({
  place,
  isOpen,
  onClose,
}: ShowToLocalModalProps) {
  const [activeTab, setActiveTab] = useState<"destination" | "translator">("destination");
  const [isSlow, setIsSlow] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customSpokenText, setCustomSpokenText] = useState("");
  const [copied, setCopied] = useState(false);

  // Dynamic Translator State
  const [inputText, setInputText] = useState("");
  const [targetLang, setTargetLang] = useState("kn");
  const [translatedText, setTranslatedText] = useState("");
  const [transliteration, setTransliteration] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  // Close on Escape & stop speech on close
  const handleClose = useCallback(() => {
    stopKannadaSpeech();
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !place) return null;

  const destinationPhraseKn = `ದಯವಿಟ್ಟು ನನ್ನನ್ನು ${place.name_kn}ಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ`;
  const destinationTranslit = `Dayavittu nannannu ${place.name_en}-ge karedukondu hogi`;
  const activeSpokenText = customSpokenText || destinationPhraseKn;

  const playAudio = (text: string, translit?: string, langCode: string = "kn") => {
    if (isPlaying) {
      stopKannadaSpeech();
      setIsPlaying(false);
      return;
    }

    setCustomSpokenText(text);
    setIsPlaying(true);

    playKannadaSpeech(text, {
      translit,
      isSlow,
      lang: langCode,
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false);
      },
    });
  };

  const handleReplayAudio = () => {
    if (!activeSpokenText) return;
    setIsPlaying(true);
    playKannadaSpeech(activeSpokenText, {
      isSlow,
      lang: activeTab === "translator" ? targetLang : "kn",
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false);
      },
    });
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const query = (textToTranslate || inputText).trim();
    if (!query) return;

    setIsTranslating(true);
    setTranslateError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: query,
          sourceLang: "en",
          targetLang,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Translation failed with status ${res.status}`);
      }

      const data = await res.json();
      setTranslatedText(data.translatedText);
      setTransliteration(data.transliteration || "");
      setCustomSpokenText(data.translatedText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Translation service unavailable";
      setTranslateError(msg);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSelectQuickPhrase = (phrase: typeof QUICK_PHRASES[0]) => {
    setInputText(phrase.en);
    setTranslatedText(phrase.kn);
    setTransliteration(phrase.translit);
    setCustomSpokenText(phrase.kn);
    setTranslateError("");
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Show to local driver and AI Travel Translator"
      className="fixed inset-0 z-[1300] bg-[#58101B] text-white flex flex-col justify-between pt-[calc(1.2rem+env(safe-area-inset-top,0px))] pb-[calc(1.2rem+env(safe-area-inset-bottom,0px))] px-4 sm:px-8 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Header & Tab Navigation */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-b border-white/15 pb-3">
        <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab("destination");
              stopKannadaSpeech();
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "destination"
                ? "bg-[#F2B705] text-[#14202B] shadow-xs"
                : "text-white/80 hover:text-white"
            }`}
          >
            📍 ಸ್ಥಳ (Destination)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("translator");
              stopKannadaSpeech();
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "translator"
                ? "bg-[#F2B705] text-[#14202B] shadow-xs"
                : "text-white/80 hover:text-white"
            }`}
          >
            ✦ AI ನುಡಿ (Translator)
          </button>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          ✕ Close
        </button>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-5 max-w-2xl mx-auto w-full space-y-5">
        {/* TAB 1: DESTINATION CARD */}
        {activeTab === "destination" && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#F2B705]">
                SHOW TO LOCAL DRIVER / GUIDE
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white leading-[1.3] tracking-tight mt-1">
                ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಇಲ್ಲಿಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ
              </h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium">
                Please take me to this destination
              </p>
            </div>

            {/* Destination Highlight Box */}
            <div className="p-6 rounded-3xl bg-white/15 border border-white/20 backdrop-blur-md space-y-2">
              <div className="font-heading font-extrabold text-3xl sm:text-5xl text-[#F2B705] leading-normal font-kannada">
                {place.name_kn}
              </div>
              <div className="text-white/95 font-bold text-lg sm:text-2xl">
                {place.name_en}
              </div>
              <div className="text-white/75 text-xs sm:text-sm">
                {place.city}, Karnataka · {place.categories[0]}
              </div>

              <div className="pt-2">
                <a
                  href={getGoogleMapsDirectionsUrl(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
                >
                  <span>🗺️</span>
                  <span>Open Directions in Google Maps ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC AI TRAVEL TRANSLATOR */}
        {activeTab === "translator" && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#F2B705]">
                DYNAMIC AI TRAVEL TRANSLATOR
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-3xl text-white leading-tight mt-1">
                ಕನ್ನಡಕ್ಕೆ ಭಾಷಾಂತರಿಸಿ (Translate to Kannada)
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                Type any sentence in English or select a quick travel phrase
              </p>
            </div>

            {/* Quick Phrase Chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Quick Travel Phrases:
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {QUICK_PHRASES.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuickPhrase(qp)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs text-left transition-colors cursor-pointer border border-white/10"
                  >
                    {qp.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/90">
                  Your sentence (English):
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-black/30 border border-white/20 text-white rounded-lg px-2 py-0.5 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="kn" className="bg-[#14202B]">Target: Kannada (ಕನ್ನಡ)</option>
                  <option value="hi" className="bg-[#14202B]">Target: Hindi (हिन्दी)</option>
                  <option value="te" className="bg-[#14202B]">Target: Telugu (తెలుగు)</option>
                  <option value="ta" className="bg-[#14202B]">Target: Tamil (தமிழ்)</option>
                  <option value="ml" className="bg-[#14202B]">Target: Malayalam (മലയാളം)</option>
                </select>
              </div>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g. Please tell me how to reach Mysuru Palace from the bus stand..."
                  rows={2}
                  maxLength={500}
                  className="w-full p-3 rounded-2xl bg-white/10 border border-white/25 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#F2B705] transition-colors resize-none"
                />
                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText("");
                      setTranslatedText("");
                      setTransliteration("");
                    }}
                    className="absolute top-2 right-2 text-white/60 hover:text-white text-xs px-2 py-0.5 rounded bg-black/20"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={!inputText.trim() || isTranslating}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F2B705] hover:bg-[#e0a800] text-[#14202B] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>✦</span>
                <span>{isTranslating ? "Translating..." : "Translate with AI"}</span>
              </button>

              {translateError && (
                <div className="p-2.5 rounded-xl bg-red-900/60 border border-red-500/40 text-xs text-red-200">
                  {translateError}
                </div>
              )}
            </div>

            {/* Translated Output Card */}
            {translatedText && (
              <div className="p-5 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F2B705]">
                    {targetLang === "kn" ? "ಕನ್ನಡ ನುಡಿ (Kannada)" : "Translated Output"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(translatedText)}
                    className="text-xs text-white/80 hover:text-white bg-white/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>

                <div className="font-heading font-extrabold text-2xl sm:text-3xl text-white leading-normal font-kannada">
                  {translatedText}
                </div>

                {transliteration && (
                  <div className="text-sm font-semibold text-[#F2B705]/95 mt-1">
                    Pronounce: {transliteration}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Speech Controls (Listen / Stop / Replay / Speed) */}
      <div className="max-w-2xl mx-auto w-full space-y-3 pt-3 border-t border-white/15">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Play/Listen button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === "destination") {
                playAudio(destinationPhraseKn, destinationTranslit, "kn");
              } else if (translatedText) {
                playAudio(translatedText, transliteration, targetLang);
              }
            }}
            disabled={activeTab === "translator" && !translatedText}
            className={`py-3 px-3 rounded-2xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:opacity-40 ${
              isPlaying
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#F2B705] text-[#14202B] hover:bg-[#e0a800] active:scale-95"
            }`}
          >
            <span>{isPlaying ? "⏹️" : "🔊"}</span>
            <span className="truncate">{isPlaying ? "Stop" : "Listen (ಕೇಳಿ)"}</span>
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplayAudio}
            disabled={!activeSpokenText || isPlaying}
            className="py-3 px-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer disabled:opacity-40 active:scale-95"
          >
            <span>🔁</span>
            <span>Replay</span>
          </button>

          {/* Speed Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSlow(!isSlow)}
            className={`py-3 px-3 rounded-2xl font-heading font-extrabold text-xs sm:text-sm border transition-all cursor-pointer ${
              isSlow
                ? "bg-white text-[#8E1F2F] border-white shadow-xs"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            {isSlow ? "Slow: ON (0.75x)" : "Speed: Normal"}
          </button>
        </div>

        <p className="text-center text-[11px] text-white/60">
          Hold your phone toward the local driver, guide, or shopkeeper
        </p>
      </div>
    </div>
  );
}
