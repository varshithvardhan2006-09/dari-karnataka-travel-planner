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

const LANGUAGE_CONFIG: Record<
  string,
  {
    name: string;
    nativeName: string;
    title: string;
    badge: string;
    listenLabel: string;
    placeholder: string;
  }
> = {
  kn: {
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    title: "ಕನ್ನಡಕ್ಕೆ ಭಾಷಾಂತರಿಸಿ (Translate to Kannada)",
    badge: "ಕನ್ನಡ ನುಡಿ (Kannada)",
    listenLabel: "Listen (ಕೇಳಿ)",
    placeholder: "e.g. Please tell me how to reach Mysuru Palace from the bus stand...",
  },
  hi: {
    name: "Hindi",
    nativeName: "हिन्दी",
    title: "हिन्दी में अनुवाद (Translate to Hindi)",
    badge: "हिन्दी (Hindi)",
    listenLabel: "Listen (सुनें)",
    placeholder: "e.g. Please tell me how to reach Mysuru Palace from the bus stand...",
  },
  te: {
    name: "Telugu",
    nativeName: "తెలుగు",
    title: "తెలుగులోకి అనువదించండి (Translate to Telugu)",
    badge: "తెలుగు (Telugu)",
    listenLabel: "Listen (వినండి)",
    placeholder: "e.g. Please tell me how to reach Mysuru Palace from the bus stand...",
  },
  ta: {
    name: "Tamil",
    nativeName: "தமிழ்",
    title: "தமிழில் மொழிபெயர்க்கவும் (Translate to Tamil)",
    badge: "தமிழ் (Tamil)",
    listenLabel: "Listen (கேளுங்கள்)",
    placeholder: "e.g. Please tell me how to reach Mysuru Palace from the bus stand...",
  },
  ml: {
    name: "Malayalam",
    nativeName: "മലയാളം",
    title: "മലയാളത്തിലേക്ക് വിവർത്തനം ചെയ്യുക (Translate to Malayalam)",
    badge: "മലയാളം (Malayalam)",
    listenLabel: "Listen (കേൾക്കൂ)",
    placeholder: "e.g. Please tell me how to reach Mysuru Palace from the bus stand...",
  },
};

interface QuickPhraseItem {
  en: string;
  kn: string;
  kn_translit: string;
  hi: string;
  hi_translit: string;
  te: string;
  te_translit: string;
  ta: string;
  ta_translit: string;
  ml: string;
  ml_translit: string;
}

const QUICK_PHRASES: QuickPhraseItem[] = [
  {
    en: "How much is the auto fare?",
    kn: "ಆಟೋ ಬಾಡಿಗೆ ಎಷ್ಟು ಆಗುತ್ತದೆ?",
    kn_translit: "Auto baadige eshtu aaguttade?",
    hi: "ऑटो का किराया कितना है?",
    hi_translit: "Auto ka kiraya kitna hai?",
    te: "ఆటో ఛార్జీ ఎంత అవుతుంది?",
    te_translit: "Auto charge entha avuthundi?",
    ta: "ஆட்டோ கட்டணம் எவ்வளவு?",
    ta_translit: "Auto kattanam evvalavu?",
    ml: "ഓട്ടോ കൂലി എത്രയാണ്?",
    ml_translit: "Auto kooli ethrayanu?",
  },
  {
    en: "Please take me to the railway station.",
    kn: "ದಯವಿಟ್ಟು ರೈಲ್ವೆ ನಿಲ್ದಾಣಕ್ಕೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ.",
    kn_translit: "Dayavittu railway nildanakke karedukondu hogi.",
    hi: "कृपया मुझे रेलवे स्टेशन ले चलिए।",
    hi_translit: "Kripya mujhe railway station le chaliye.",
    te: "దయచేసి నన్ను రైల్వే స్టేషన్‌కు తీసుకెళ్లండి.",
    te_translit: "Dayachesi nannu railway station-ku theesukellandi.",
    ta: "தயவுசெய்து என்னை ரயில் நிலையத்திற்கு அழைத்துச் செல்லுங்கள்.",
    ta_translit: "Thayavuseithu ennai railway nilayathirku azhaithu chellungal.",
    ml: "ദയവായി എന്നെ റെയിൽവേ സ്റ്റേഷനിലേക്ക് കൊണ്ടുപോകൂ.",
    ml_translit: "Dayavaayi enne railway station-ilekku kondupookoo.",
  },
  {
    en: "Please stop the car here.",
    kn: "ದಯವಿಟ್ಟು ಕಾರನ್ನು ಇಲ್ಲಿಯೇ ನಿಲ್ಲಿಸಿ.",
    kn_translit: "Dayavittu car-annu illiye nillisi.",
    hi: "कृपया गाड़ी यहीं रोकिए।",
    hi_translit: "Kripya gaadi yahin rokiye.",
    te: "దయచేసి కారును ఇక్కడే ఆపండి.",
    te_translit: "Dayachesi car-nu ikkade aapandi.",
    ta: "தயவுசெய்து காரை இங்கே நிறுத்துங்கள்.",
    ta_translit: "Thayavuseithu kaarai ingae niruthungal.",
    ml: "ദയവായി വണ്ടി ഇവിടെ നിർത്തൂ.",
    ml_translit: "Dayavaayi vandi ivide nirthoo.",
  },
  {
    en: "Is this food vegetarian?",
    kn: "ಈ ಊಟ ಸಸ್ಯಾಹಾರವೇ?",
    kn_translit: "Ee oota sasyaahaarave?",
    hi: "क्या यह खाना शाकाहारी है?",
    hi_translit: "Kya yeh khana shakahari hai?",
    te: "ఈ భోజనం శాఖాహారమా?",
    te_translit: "Ee bhojanam shaakhaahaaramaa?",
    ta: "இந்த உணவு சைவமா?",
    ta_translit: "Indha unavu saivamaa?",
    ml: "ഈ ഭക്ഷണം സസ്യാഹാരമാണോ?",
    ml_translit: "Ee bhakshanam sasyaahaaramaano?",
  },
  {
    en: "Where is the ticket counter?",
    kn: "ಟಿಕೆಟ್ ಕೌಂಟರ್ ಎಲ್ಲಿದೆ?",
    kn_translit: "Ticket counter ellide?",
    hi: "टिकट काउंटर कहाँ है?",
    hi_translit: "Ticket counter kahan hai?",
    te: "టికెట్ కౌంటర్ ఎక్కడ ఉంది?",
    te_translit: "Ticket counter ekkada undi?",
    ta: "டிக்கெட் கவுண்டர் எங்கே உள்ளது?",
    ta_translit: "Ticket counter engae ulladhu?",
    ml: "ടിക്കറ്റ് കൗണ്ടർ എവിടെയാണ്?",
    ml_translit: "Ticket counter evideyaanu?",
  },
  {
    en: "Can you wait here for 10 minutes?",
    kn: "ದಯವಿಟ್ಟು ಹತ್ತು ನಿಮಿಷ ಇಲ್ಲಿಯೇ ಕಾಯಬಹುದೇ?",
    kn_translit: "Dayavittu hattu nimisha illiye kaayabahude?",
    hi: "क्या आप यहाँ 10 मिनट रुक सकते हैं?",
    hi_translit: "Kya aap yahan 10 minute ruk sakte hain?",
    te: "మీరు ఇక్కడ 10 నిమిషాలు వేచి ఉండగలరా?",
    te_translit: "Meeru ikkada 10 nimishaalu vechi undagalaraa?",
    ta: "நீங்கள் இங்கே 10 நிமிடங்கள் காத்திருக்க முடியுமா?",
    ta_translit: "Neengal ingae 10 nimidangal kaathirukka mudiyumaa?",
    ml: "നിങ്ങൾക്ക് ഇവിടെ 10 മിനിറ്റ് കാത്തുനിൽക്കാമോ?",
    ml_translit: "Ningalkku ivide 10 minute kaathunilkaamo?",
  },
  {
    en: "Where is the restroom / toilet?",
    kn: "ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?",
    kn_translit: "Shauchalaya ellide?",
    hi: "शौचालय कहाँ है?",
    hi_translit: "Shauchalay kahan hai?",
    te: "వాష్‌రూమ్ ఎక్కడ ఉంది?",
    te_translit: "Washroom ekkada undi?",
    ta: "கழிப்பறை எங்கே உள்ளது?",
    ta_translit: "Kazhipparai engae ulladhu?",
    ml: "ശൗചാലയം എവിടെയാണ്?",
    ml_translit: "Shouchalayam evideyaanu?",
  },
  {
    en: "How much does this cost?",
    kn: "ಇದರ ಬೆಲೆ ಎಷ್ಟು?",
    kn_translit: "Idara bele eshtu?",
    hi: "इसका दाम कितना है?",
    hi_translit: "Iska daam kitna hai?",
    te: "దీని ఖరీదు ఎంత?",
    te_translit: "Deeni khareedu entha?",
    ta: "இதன் விலை என்ன?",
    ta_translit: "Idhan vilai enna?",
    ml: "ഇതിന്റെ വില എത്രയാണ്?",
    ml_translit: "Ithinte vila ethrayaanu?",
  },
];

export default function ShowToLocalModal({
  place,
  isOpen,
  onClose,
}: ShowToLocalModalProps) {
  const [activeTab, setActiveTab] = useState<"destination" | "translator">("destination");
  const [targetLang, setTargetLang] = useState<string>("kn");
  const [isSlow, setIsSlow] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customSpokenText, setCustomSpokenText] = useState("");
  const [copied, setCopied] = useState(false);

  // Dynamic Translator State
  const [inputText, setInputText] = useState("");
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

  // Dynamic Destination phrase matching the chosen language
  const getDestinationInfo = (lang: string) => {
    switch (lang) {
      case "hi":
        return {
          title: "कृपया मुझे इस स्थान पर ले चलिए",
          sub: "Please take me to this destination",
          text: `कृपया मुझे ${place.name_en} ले चलिए।`,
          translit: `Kripya mujhe ${place.name_en} le chaliye`,
        };
      case "te":
        return {
          title: "దయచేసి నన్ను ఈ ప్రదేశానికి తీసుకెళ్లండి",
          sub: "Please take me to this destination",
          text: `దయచేసి నన్ను ${place.name_en}కు తీసుకెళ్లండి.`,
          translit: `Dayachesi nannu ${place.name_en}-ku theesukellandi`,
        };
      case "ta":
        return {
          title: "தயவுசெய்து என்னை இந்த இடத்திற்கு அழைத்துச் செல்லுங்கள்",
          sub: "Please take me to this destination",
          text: `தயவுசெய்து என்னை ${place.name_en}க்கு அழைத்துச் செல்லுங்கள்.`,
          translit: `Thayavuseithu ennai ${place.name_en}-kku azhaithu chellungal`,
        };
      case "ml":
        return {
          title: "ദയവായി എന്നെ ഈ സ്ഥലത്തേക്ക് കൊണ്ടുപോകൂ",
          sub: "Please take me to this destination",
          text: `ദയവായി എന്നെ ${place.name_en}ലേക്ക് കൊണ്ടുപോകൂ.`,
          translit: `Dayavaayi enne ${place.name_en}-lekku kondupookoo`,
        };
      case "kn":
      default:
        return {
          title: "ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಇಲ್ಲಿಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ",
          sub: "Please take me to this destination",
          text: `ದಯವಿಟ್ಟು ನನ್ನನ್ನು ${place.name_kn}ಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ.`,
          translit: `Dayavittu nannannu ${place.name_en}-ge karedukondu hogi`,
        };
    }
  };

  const destinationInfo = getDestinationInfo(targetLang);
  const activeSpokenText = customSpokenText || destinationInfo.text;

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
      lang: activeTab === "translator" ? targetLang : targetLang,
      translit: activeTab === "translator" ? transliteration : destinationInfo.translit,
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false);
      },
    });
  };

  const handleTranslate = async (textToTranslate?: string, langOverride?: string) => {
    const query = (textToTranslate || inputText).trim();
    if (!query) return;

    const target = langOverride || targetLang;
    setIsTranslating(true);
    setTranslateError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: query,
          sourceLang: "en",
          targetLang: target,
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

  const handleLanguageChange = (newLang: string) => {
    setTargetLang(newLang);
    stopKannadaSpeech();
    setIsPlaying(false);

    // 1. If currently displaying a quick phrase, switch immediately from pre-baked cache!
    const quickMatch = QUICK_PHRASES.find(
      (qp) => qp.en.toLowerCase().trim() === inputText.toLowerCase().trim()
    );
    if (quickMatch) {
      const langKey = newLang as keyof QuickPhraseItem;
      const translitKey = `${newLang}_translit` as keyof QuickPhraseItem;
      if (quickMatch[langKey]) {
        setTranslatedText(quickMatch[langKey]);
        setTransliteration(String(quickMatch[translitKey] || ""));
        setCustomSpokenText(quickMatch[langKey]);
        return;
      }
    }

    // 2. If user entered a custom sentence, translate into the new target language
    if (inputText.trim()) {
      handleTranslate(inputText.trim(), newLang);
    }
  };

  const handleSelectQuickPhrase = (phrase: QuickPhraseItem) => {
    setInputText(phrase.en);
    setTranslateError("");

    const langKey = targetLang as keyof QuickPhraseItem;
    const translitKey = `${targetLang}_translit` as keyof QuickPhraseItem;

    if (phrase[langKey]) {
      setTranslatedText(phrase[langKey]);
      setTransliteration(String(phrase[translitKey] || ""));
      setCustomSpokenText(phrase[langKey]);
    } else {
      handleTranslate(phrase.en, targetLang);
    }
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
      {/* Top Header with Tab Switcher & Global Language Selector */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between border-b border-white/15 pb-3 gap-2">
        {/* Tab Buttons */}
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

        {/* Global Language Selector & Close Button */}
        <div className="flex items-center gap-2">
          <select
            value={targetLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-black/40 border border-white/25 text-white rounded-xl px-2 sm:px-2.5 py-1.5 text-xs font-bold cursor-pointer focus:outline-none hover:bg-black/60 transition-colors shadow-2xs"
            aria-label="Select Target Language"
          >
            <option value="kn" className="bg-[#14202B]">ಕನ್ನಡ (Kannada)</option>
            <option value="hi" className="bg-[#14202B]">हिन्दी (Hindi)</option>
            <option value="te" className="bg-[#14202B]">తెలుగు (Telugu)</option>
            <option value="ta" className="bg-[#14202B]">தமிழ் (Tamil)</option>
            <option value="ml" className="bg-[#14202B]">മലയാളം (Malayalam)</option>
          </select>

          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>
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
                {destinationInfo.title}
              </h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium">
                {destinationInfo.sub}
              </p>
            </div>

            {/* Destination Highlight Box */}
            <div className="p-6 rounded-3xl bg-white/15 border border-white/20 backdrop-blur-md space-y-2">
              <div
                className={`font-heading font-extrabold text-3xl sm:text-5xl text-[#F2B705] leading-normal ${
                  targetLang === "kn" ? "font-kannada" : ""
                }`}
              >
                {targetLang === "kn" ? place.name_kn : place.name_en}
              </div>
              {targetLang !== "kn" && (
                <div className="text-white/95 font-bold text-xl sm:text-3xl font-kannada">
                  {place.name_kn}
                </div>
              )}
              {targetLang === "kn" && (
                <div className="text-white/95 font-bold text-lg sm:text-2xl">
                  {place.name_en}
                </div>
              )}
              <div className="text-white/75 text-xs sm:text-sm">
                {place.city}, Karnataka · {place.categories[0]}
              </div>

              <div className="text-sm font-semibold text-[#F2B705]/95 pt-1">
                Pronounce: {destinationInfo.translit}
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
                {LANGUAGE_CONFIG[targetLang]?.title || "Translate"}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                Type any sentence in English or tap a quick travel phrase below
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
                <span className="text-xs text-[#F2B705] font-bold">
                  {LANGUAGE_CONFIG[targetLang]?.badge || targetLang}
                </span>
              </div>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    LANGUAGE_CONFIG[targetLang]?.placeholder ||
                    "e.g. Please tell me how to reach Mysuru Palace..."
                  }
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
                    {LANGUAGE_CONFIG[targetLang]?.badge || "Translated Output"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(translatedText)}
                    className="text-xs text-white/80 hover:text-white bg-white/10 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>

                <div
                  className={`font-heading font-extrabold text-2xl sm:text-3xl text-white leading-normal ${
                    targetLang === "kn" ? "font-kannada" : ""
                  }`}
                >
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
                playAudio(destinationInfo.text, destinationInfo.translit, targetLang);
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
            <span className="truncate">
              {isPlaying ? "Stop" : (LANGUAGE_CONFIG[targetLang]?.listenLabel || "Listen")}
            </span>
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
