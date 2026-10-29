"use client";

import React from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";

const LAST_UPDATED = { en: "29 October 2026", kn: "29 ಅಕ್ಟೋಬರ್ 2026" };

type Section = { titleEn: string; titleKn: string; en: string[]; kn: string[] };

// Every statement here must match what the code actually does. Update it when data flows change.
const SECTIONS: Section[] = [
  {
    titleEn: "Stored only in your browser",
    titleKn: "ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗುತ್ತದೆ",
    en: [
      "Your language choice, the last 10 trips you opened and the phrases you saved are kept in your browser's local storage.",
      "They never leave your device. Clearing this site's data in your browser deletes them.",
    ],
    kn: [
      "ನಿಮ್ಮ ಭಾಷೆಯ ಆಯ್ಕೆ, ನೀವು ತೆರೆದ ಕೊನೆಯ 10 ಪ್ರವಾಸಗಳು ಮತ್ತು ಉಳಿಸಿದ ನುಡಿಗಟ್ಟುಗಳು ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನ ಲೋಕಲ್ ಸ್ಟೋರೇಜ್‌ನಲ್ಲಿ ಇರುತ್ತವೆ.",
      "ಅವು ನಿಮ್ಮ ಸಾಧನದಿಂದ ಹೊರಹೋಗುವುದಿಲ್ಲ. ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಈ ತಾಣದ ಡೇಟಾ ಅಳಿಸಿದರೆ ಅವು ಅಳಿಯುತ್ತವೆ.",
    ],
  },
  {
    titleEn: "Sent to our server to build your plan",
    titleKn: "ಯೋಜನೆ ರಚಿಸಲು ನಮ್ಮ ಸರ್ವರ್‌ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ",
    en: [
      "Your trip brief: interests, number of days, start city, budget, pace, who is travelling, month, and any food, transport or walking preferences.",
      "Text you type into the quick translator, and the phrase text you ask to hear.",
      "None of this is saved. There is no database; the server answers the request and keeps nothing.",
    ],
    kn: [
      "ನಿಮ್ಮ ಪ್ರವಾಸದ ವಿವರ: ಆಸಕ್ತಿಗಳು, ದಿನಗಳು, ಆರಂಭದ ನಗರ, ಬಜೆಟ್, ವೇಗ, ಪ್ರಯಾಣಿಕರು, ತಿಂಗಳು ಮತ್ತು ಊಟ, ಸಾರಿಗೆ ಅಥವಾ ನಡಿಗೆಯ ಆದ್ಯತೆಗಳು.",
      "ತ್ವರಿತ ಅನುವಾದಕದಲ್ಲಿ ನೀವು ಬರೆಯುವ ಪಠ್ಯ ಮತ್ತು ನೀವು ಕೇಳಲು ಬಯಸುವ ನುಡಿಗಟ್ಟು.",
      "ಇವುಗಳಲ್ಲಿ ಯಾವುದನ್ನೂ ಉಳಿಸುವುದಿಲ್ಲ. ಡೇಟಾಬೇಸ್ ಇಲ್ಲ; ಸರ್ವರ್ ಉತ್ತರ ನೀಡಿ ಏನನ್ನೂ ಇಟ್ಟುಕೊಳ್ಳುವುದಿಲ್ಲ.",
    ],
  },
  {
    titleEn: "Services that receive data",
    titleKn: "ಡೇಟಾ ಪಡೆಯುವ ಸೇವೆಗಳು",
    en: [
      "Groq and Google Gemini receive your trip brief and the shortlisted places, to order the itinerary. They receive translator text too.",
      "Google Translate receives translator text when the AI providers are unavailable, and the phrase text for audio.",
      "OpenStreetMap serves the map tiles, so your browser connects to it directly.",
      "Vercel hosts Dari and may keep standard request logs, such as IP address and time, under its own privacy policy.",
      "Google Maps is opened only when you tap a directions link.",
    ],
    kn: [
      "ಪ್ರವಾಸ ಕ್ರಮ ರೂಪಿಸಲು Groq ಮತ್ತು Google Gemini ನಿಮ್ಮ ಪ್ರವಾಸದ ವಿವರ ಮತ್ತು ಆಯ್ದ ಸ್ಥಳಗಳನ್ನು ಪಡೆಯುತ್ತವೆ. ಅನುವಾದಕದ ಪಠ್ಯವನ್ನೂ ಪಡೆಯುತ್ತವೆ.",
      "AI ಲಭ್ಯವಿಲ್ಲದಾಗ ಅನುವಾದಕದ ಪಠ್ಯ ಮತ್ತು ಧ್ವನಿಗಾಗಿ ನುಡಿಗಟ್ಟುಗಳನ್ನು Google Translate ಪಡೆಯುತ್ತದೆ.",
      "ನಕ್ಷೆಯ ಚಿತ್ರಗಳನ್ನು OpenStreetMap ನೀಡುತ್ತದೆ; ನಿಮ್ಮ ಬ್ರೌಸರ್ ನೇರವಾಗಿ ಅದಕ್ಕೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
      "Dari ಅನ್ನು Vercel ಹೋಸ್ಟ್ ಮಾಡುತ್ತದೆ ಮತ್ತು ಅದರ ಸ್ವಂತ ನೀತಿಯಂತೆ IP ವಿಳಾಸ ಮತ್ತು ಸಮಯದಂತಹ ಸಾಮಾನ್ಯ ದಾಖಲೆಗಳನ್ನು ಇಟ್ಟುಕೊಳ್ಳಬಹುದು.",
      "ದಿಕ್ಕುಗಳ ಲಿಂಕ್ ಒತ್ತಿದಾಗ ಮಾತ್ರ Google Maps ತೆರೆಯುತ್ತದೆ.",
    ],
  },
  {
    titleEn: "Share links",
    titleKn: "ಹಂಚಿಕೆ ಲಿಂಕ್‌ಗಳು",
    en: [
      "A share link carries the whole plan inside the URL. Nothing is stored on a server, but anyone you send the link to can open the plan.",
    ],
    kn: [
      "ಹಂಚಿಕೆ ಲಿಂಕ್ ಸಂಪೂರ್ಣ ಯೋಜನೆಯನ್ನು URL ಒಳಗೆಯೇ ಹೊಂದಿರುತ್ತದೆ. ಸರ್ವರ್‌ನಲ್ಲಿ ಏನನ್ನೂ ಉಳಿಸುವುದಿಲ್ಲ, ಆದರೆ ಲಿಂಕ್ ಪಡೆದ ಯಾರಾದರೂ ಯೋಜನೆಯನ್ನು ನೋಡಬಹುದು.",
    ],
  },
  {
    titleEn: "Abuse protection",
    titleKn: "ದುರುಪಯೋಗ ತಡೆ",
    en: [
      "To limit how many requests one device can make, the server keeps your IP address in memory for about one minute. It is never written to disk.",
    ],
    kn: [
      "ಒಂದು ಸಾಧನ ಮಾಡಬಹುದಾದ ವಿನಂತಿಗಳನ್ನು ಮಿತಿಗೊಳಿಸಲು ಸರ್ವರ್ ನಿಮ್ಮ IP ವಿಳಾಸವನ್ನು ಸುಮಾರು ಒಂದು ನಿಮಿಷ ಮೆಮೊರಿಯಲ್ಲಿ ಇಡುತ್ತದೆ. ಅದನ್ನು ಎಂದಿಗೂ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.",
    ],
  },
  {
    titleEn: "What Dari does not do",
    titleKn: "ದಾರಿ ಏನು ಮಾಡುವುದಿಲ್ಲ",
    en: [
      "No accounts, no sign-up and no passwords.",
      "No cookies, no analytics and no advertising trackers.",
      "No access to your location, contacts or camera.",
    ],
    kn: [
      "ಖಾತೆ, ನೋಂದಣಿ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಇಲ್ಲ.",
      "ಕುಕೀಗಳು, ವಿಶ್ಲೇಷಣೆ ಅಥವಾ ಜಾಹೀರಾತು ಟ್ರ್ಯಾಕರ್‌ಗಳು ಇಲ್ಲ.",
      "ನಿಮ್ಮ ಸ್ಥಳ, ಸಂಪರ್ಕಗಳು ಅಥವಾ ಕ್ಯಾಮೆರಾ ಬಳಕೆ ಇಲ್ಲ.",
    ],
  },
];

export default function PrivacyPage() {
  const { lang } = useLang();
  const kn = lang === "kn";

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E1F2F] hover:underline mb-3"
        >
          <span>←</span>
          <span>{kn ? "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ" : "Back to Home"}</span>
        </Link>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#14202B] tracking-tight">
          {kn ? "ಗೌಪ್ಯತಾ ನೀತಿ" : "Privacy Policy"}
        </h1>
        <p className="text-sm text-[#586673] mt-2 leading-relaxed">
          {kn
            ? "ದಾರಿ ಬಳಸಲು ಖಾತೆ ಬೇಕಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರವಾಸ ಯೋಜಿಸಲು ಬೇಕಾದಷ್ಟು ಡೇಟಾವನ್ನು ಮಾತ್ರ ಬಳಸುತ್ತೇವೆ ಮತ್ತು ಅದನ್ನು ಉಳಿಸುವುದಿಲ್ಲ."
            : "Dari works without an account. It uses only the data needed to plan your trip, and it does not store that data."}
        </p>
        <p className="text-xs text-[#8A99A8] mt-2">
          {kn ? "ಕೊನೆಯ ನವೀಕರಣ: " : "Last updated: "}
          {kn ? LAST_UPDATED.kn : LAST_UPDATED.en}
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <section key={s.titleEn} className="bg-white rounded-2xl border border-[#DCE1DD] shadow-xs p-6">
            <h2 className="font-heading font-bold text-lg text-[#14202B]">{kn ? s.titleKn : s.titleEn}</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#3E4E5C] leading-relaxed list-disc pl-5 marker:text-[#8E1F2F]">
              {(kn ? s.kn : s.en).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#DCE1DD] text-xs text-[#586673] leading-relaxed">
        <strong>{kn ? "ಸಂಪರ್ಕ:" : "Contact:"}</strong>{" "}
        {kn ? "ಗೌಪ್ಯತೆಯ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ " : "For privacy questions, open an issue on "}
        <a
          href="https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8E1F2F] font-semibold hover:underline"
        >
          GitHub ↗
        </a>
        {kn ? " ನಲ್ಲಿ ಸಮಸ್ಯೆ ತೆರೆಯಿರಿ." : "."}
      </div>
    </div>
  );
}
