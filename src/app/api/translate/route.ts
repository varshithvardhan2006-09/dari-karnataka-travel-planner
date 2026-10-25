import { NextRequest, NextResponse } from "next/server";
import phrasesData from "../../../../data/phrases.json";

export const maxDuration = 15;

const SUPPORTED_LANGUAGES: Record<string, string> = {
  kn: "Kannada",
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  ml: "Malayalam",
};

interface TranslateRequestBody {
  text: string;
  sourceLang?: string;
  targetLang?: string;
}

const COMMON_OFFLINE_PHRASES: Record<string, { kn: string; translit: string }> = {
  "thank you": { kn: "ಧನ್ಯವಾದಗಳು", translit: "Dhanyavadagalu" },
  "thanks": { kn: "ಧನ್ಯವಾದ", translit: "Dhanyavada" },
  "hello": { kn: "ನಮಸ್ಕಾರ", translit: "Namaskara" },
  "hi": { kn: "ನಮಸ್ಕಾರ", translit: "Namaskara" },
  "greetings": { kn: "ನಮಸ್ಕಾರಗಳು", translit: "Namaskaragalu" },
  "please": { kn: "ದಯವಿಟ್ಟು", translit: "Dayavittu" },
  "how much": { kn: "ಎಷ್ಟು?", translit: "Eshtu?" },
  "water": { kn: "ನೀರು", translit: "Neeru" },
  "food": { kn: "ಊಟ", translit: "Oota" },
  "where is this": { kn: "ಇದು ಎಲ್ಲಿ ಇದೆ?", translit: "Idu elli ide?" },
  "help": { kn: "ಸಹಾಯ ಮಾಡಿ", translit: "Sahaya maadi" },
  "yes": { kn: "ಹೌದು", translit: "Haudu" },
  "no": { kn: "ಇಲ್ಲ", translit: "Illa" },
  "stop": { kn: "ನಿಲ್ಲಿಸಿ", translit: "Nillisi" },
  "good": { kn: "ಚೆನ್ನಾಗಿದೆ", translit: "Chennagide" },
};

function lookupOfflinePhrase(
  query: string,
  sourceLang: string,
  targetLang: string
): { translatedText: string; transliteration?: string } | null {
  const normalized = query.trim().toLowerCase().replace(/[.,!?;:]/g, "");

  // English -> Kannada lookup
  if (sourceLang === "en" && targetLang === "kn") {
    if (COMMON_OFFLINE_PHRASES[normalized]) {
      const match = COMMON_OFFLINE_PHRASES[normalized];
      return { translatedText: match.kn, transliteration: match.translit };
    }

    const phraseMatch = (phrasesData as Array<{ en: string; kn: string; translit: string }>).find(
      (p) => p.en.toLowerCase().includes(normalized) || normalized.includes(p.en.toLowerCase())
    );
    if (phraseMatch) {
      return { translatedText: phraseMatch.kn, transliteration: phraseMatch.translit };
    }
  }

  // Kannada -> English lookup
  if (sourceLang === "kn" && targetLang === "en") {
    for (const [enKey, val] of Object.entries(COMMON_OFFLINE_PHRASES)) {
      if (val.kn === query.trim() || val.translit.toLowerCase() === normalized) {
        return { translatedText: enKey };
      }
    }
  }

  return null;
}

/**
 * Calls Groq for high-speed natural translation.
 */
async function translateWithGroq(
  text: string,
  sourceLangName: string,
  targetLangName: string,
  apiKey: string,
  model: string = "llama-3.3-70b-versatile"
): Promise<{ translatedText: string; transliteration?: string }> {
  const systemPrompt = `You are an expert travel translator specializing in South Indian languages, particularly natural conversational Kannada for tourists.
Translate the user's text from ${sourceLangName} to ${targetLangName}.
Requirements:
1. Provide a natural, polite, authentic conversational translation suitable for speaking to a local driver, guide, or shopkeeper in Karnataka.
2. If the target is Kannada, provide BOTH the Kannada script translation AND a clear English phonetic transliteration (how to pronounce it).
3. Return STRICTLY valid JSON with no extra commentary:
{
  "translatedText": "...",
  "transliteration": "..."
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    throw new Error(`Groq translation error (${res.status})`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(raw);
  return {
    translatedText: String(parsed.translatedText || "").trim(),
    transliteration: parsed.transliteration ? String(parsed.transliteration).trim() : undefined,
  };
}

/**
 * Calls Gemini as a reliable fallback translation provider.
 */
async function translateWithGemini(
  text: string,
  sourceLangName: string,
  targetLangName: string,
  apiKey: string,
  model: string = "gemini-1.5-flash"
): Promise<{ translatedText: string; transliteration?: string }> {
  const systemPrompt = `Translate the text from ${sourceLangName} to ${targetLangName} naturally for a traveler in Karnataka.
Output STRICT JSON:
{
  "translatedText": "...",
  "transliteration": "..."
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nText to translate: ${text}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    throw new Error(`Gemini translation error (${res.status})`);
  }

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = JSON.parse(raw);
  return {
    translatedText: String(parsed.translatedText || "").trim(),
    transliteration: parsed.transliteration ? String(parsed.transliteration).trim() : undefined,
  };
}

/**
 * Free universal fallback translator using public translation API.
 * Ensures translation ALWAYS succeeds even if LLM quotas/keys are exhausted.
 */
async function translateWithPublicFallback(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string; transliteration?: string }> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    throw new Error("Public translation endpoint unavailable");
  }
  const json = await res.json();
  // Format is [[["translatedText", "originalText", ...]]]
  const translated = (json[0] as Array<[string, string]>)
    .map((item) => item[0])
    .filter(Boolean)
    .join("");

  return { translatedText: translated.trim() };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateRequestBody;
    const { text, sourceLang = "en", targetLang = "kn" } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required for translation." }, { status: 400 });
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Text exceeds maximum allowed length of 500 characters." },
        { status: 400 }
      );
    }

    const sLang = sourceLang.toLowerCase();
    const tLang = targetLang.toLowerCase();

    if (!SUPPORTED_LANGUAGES[sLang] || !SUPPORTED_LANGUAGES[tLang]) {
      return NextResponse.json(
        { error: `Unsupported language pair: ${sLang} to ${tLang}` },
        { status: 400 }
      );
    }

    if (sLang === tLang) {
      return NextResponse.json({
        translatedText: text.trim(),
        transliteration: undefined,
        sourceLang: sLang,
        targetLang: tLang,
        provider: "noop",
      });
    }

    const sourceLangName = SUPPORTED_LANGUAGES[sLang];
    const targetLangName = SUPPORTED_LANGUAGES[tLang];
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Try Groq (ultra fast response)
    if (groqKey) {
      try {
        const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
        const result = await translateWithGroq(text.trim(), sourceLangName, targetLangName, groqKey, groqModel);
        if (result.translatedText) {
          return NextResponse.json({
            ...result,
            sourceLang: sLang,
            targetLang: tLang,
            provider: "ai-groq",
          });
        }
      } catch {
        // Fall through to Gemini
      }
    }

    // 2. Try Gemini
    if (geminiKey) {
      try {
        const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const result = await translateWithGemini(text.trim(), sourceLangName, targetLangName, geminiKey, geminiModel);
        if (result.translatedText) {
          return NextResponse.json({
            ...result,
            sourceLang: sLang,
            targetLang: tLang,
            provider: "ai-gemini",
          });
        }
      } catch {
        // Fall through to public endpoint
      }
    }

    // 3. Try universal public fallback
    try {
      const fallbackResult = await translateWithPublicFallback(text.trim(), sLang, tLang);
      if (fallbackResult.translatedText) {
        return NextResponse.json({
          ...fallbackResult,
          sourceLang: sLang,
          targetLang: tLang,
          provider: "fallback-translator",
        });
      }
    } catch {
      // Continue to offline dictionary
    }

    // 4. Offline Travel Dictionary Fallback (ensures offline and CI test resilience)
    const offlineResult = lookupOfflinePhrase(text.trim(), sLang, tLang);
    if (offlineResult) {
      return NextResponse.json({
        ...offlineResult,
        sourceLang: sLang,
        targetLang: tLang,
        provider: "offline-dictionary",
      });
    }

    throw new Error("Translation service temporarily unavailable. Please retry.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation service encountered an error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
