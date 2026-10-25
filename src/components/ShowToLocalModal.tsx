"use client";

import React, { useState, useEffect } from "react";
import { Place } from "@/lib/schema";
import { playKannadaSpeech } from "@/lib/speech";

interface ShowToLocalModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShowToLocalModal({
  place,
  isOpen,
  onClose,
}: ShowToLocalModalProps) {
  const [isSlow, setIsSlow] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  const phraseText = `ದಯವಿಟ್ಟು ನನ್ನನ್ನು ${place.name_kn}ಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ`;

  const playAudio = () => {
    playKannadaSpeech(phraseText, {
      isSlow,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-[#6B1421] text-white flex flex-col justify-between p-6 sm:p-10 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase text-white/80">
          SHOW TO LOCAL
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Main Request in Large Kannada */}
      <div className="my-auto space-y-6 max-w-2xl mx-auto text-center sm:text-left">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-white leading-[1.4] tracking-tight">
            ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಇಲ್ಲಿಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ
          </h1>
          <p className="text-white/80 text-sm sm:text-lg mt-2 font-medium">
            Please take me here
          </p>
        </div>

        {/* Destination Card */}
        <div className="p-6 rounded-3xl bg-white/15 border border-white/20 backdrop-blur-md">
          <div className="font-heading font-extrabold text-3xl sm:text-4xl text-[#F2B705] leading-normal">
            {place.name_kn}
          </div>
          <div className="text-white/90 font-bold text-lg sm:text-xl mt-1">
            {place.name_en}
          </div>
          <div className="text-white/70 text-sm mt-1">
            {place.city}, Karnataka
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="max-w-2xl mx-auto w-full space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={playAudio}
            className="py-4 px-6 rounded-2xl bg-[#F2B705] text-[#14202B] font-heading font-extrabold text-base flex items-center justify-center gap-2 hover:bg-[#e0a800] active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <span>{isPlaying ? "⏹️" : "🔊"}</span>
            <span>{isPlaying ? "ಆಲಿಸಲಾಗುತ್ತಿದೆ..." : "ಧ್ವನಿ ಪ್ಲೇ ಮಾಡಿ (Play)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSlow(!isSlow)}
            className={`py-4 px-6 rounded-2xl font-heading font-extrabold text-base border transition-all cursor-pointer ${
              isSlow
                ? "bg-white text-[#8E1F2F] border-white"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
          >
            {isSlow ? "Slow: ON" : "Slow"}
          </button>
        </div>
        <p className="text-center text-xs text-white/60">
          Hold your phone toward the driver or shopkeeper
        </p>
      </div>
    </div>
  );
}