"use client";

import React from "react";
import { Phrase } from "@/lib/schema";
import { useKannadaSpeech } from "@/lib/speech";

interface PhraseCardProps {
  phrases: Phrase[];
  noMargin?: boolean;
  className?: string;
}

export default function PhraseCard({
  phrases,
  noMargin = false,
  className = "",
}: PhraseCardProps) {
  const { hasVoice, speak } = useKannadaSpeech();

  if (!phrases || phrases.length === 0) return null;

  const marginClass = noMargin ? "ml-0" : "ml-8 sm:ml-14";

  return (
    <div
      className={`mt-3 ${marginClass} bg-[#FDF2CC] rounded-2xl p-3.5 sm:p-5 border border-[#F2B705]/60 shadow-2xs min-w-0 max-w-full ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D05]">
          ಇಲ್ಲಿ ಹೇಳಿ · SAY IT HERE
        </span>
      </div>

      {/* Phrases List */}
      <div className="space-y-3.5">
        {phrases.map((phrase) => (
          <div
            key={phrase.id}
            className="flex items-center justify-between gap-3 pb-3 border-b border-[#F2B705]/30 last:border-0 last:pb-0"
          >
            {/* Phrase Kannada Text & English Transliteration */}
            <div className="flex-1 min-w-0">
              <div className="font-kannada font-bold text-base text-[#14202B] leading-snug">
                {phrase.kn}
              </div>
              <div className="text-xs text-[#586673] mt-0.5 leading-tight">
                <span className="italic">{phrase.translit}</span> ·{" "}
                <span>{phrase.en}</span>
              </div>
            </div>

            {/* Audio Speaker Button (conditionally rendered when voice is supported) */}
            {hasVoice && (
              <button
                type="button"
                onClick={() => speak(phrase.kn, phrase.translit)}
                aria-label={`Listen to Kannada phrase: ${phrase.translit}`}
                className="w-9 h-9 flex-shrink-0 rounded-full bg-[#8E1F2F] hover:bg-[#781926] active:scale-95 text-white flex items-center justify-center shadow-xs transition-transform cursor-pointer"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9.77H8v-2h3.5l4.5-4.5v11l-4.5-4.5zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
