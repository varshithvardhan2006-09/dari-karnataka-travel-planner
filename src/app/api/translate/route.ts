import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import phrasesData from "../../../../data/phrases.json";

export const maxDuration = 15;

const MAX_TEXT_LENGTH = 500;
const MAX_BODY_BYTES = 8 * 1024;

const RATE_LIMIT = {
  name: "translate",
  limit: 20,
  windowMs: 60 * 1000,
};

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

interface OfflinePhraseEntry {
  text: string;
  translit?: string;
}

const COMMON_OFFLINE_PHRASES: Record<string, Partial<Record<string, OfflinePhraseEntry>>> = {
  "thank you": {
    kn: { text: "ಧನ್ಯವಾದಗಳು", translit: "Dhanyavadagalu" },
    hi: { text: "धन्यवाद", translit: "Dhanyavaad" },
    te: { text: "ధన్యవాదాలు", translit: "Dhanyavaadaalu" },
    ta: { text: "நன்றி", translit: "Nandri" },
    ml: { text: "നന്ദി", translit: "Nandi" },
  },
  "thanks": {
    kn: { text: "ಧನ್ಯವಾದ", translit: "Dhanyavada" },
    hi: { text: "धन्यवाद", translit: "Dhanyavaad" },
    te: { text: "ధన్యవాదాలు", translit: "Dhanyavaadaalu" },
    ta: { text: "நன்றி", translit: "Nandri" },
    ml: { text: "നന്ദി", translit: "Nandi" },
  },
  "hello": {
    kn: { text: "ನಮಸ್ಕಾರ", translit: "Namaskara" },
    hi: { text: "नमस्ते", translit: "Namaste" },
    te: { text: "నమస్కారం", translit: "Namaskaram" },
    ta: { text: "வணக்கம்", translit: "Vanakkam" },
    ml: { text: "നമസ്കാരം", translit: "Namaskaram" },
  },
  "hi": {
    kn: { text: "ನಮಸ್ಕಾರ", translit: "Namaskara" },
    hi: { text: "नमस्ते", translit: "Namaste" },
    te: { text: "నమస్కారం", translit: "Namaskaram" },
    ta: { text: "வணக்கம்", translit: "Vanakkam" },
    ml: { text: "നമസ്കാരം", translit: "Namaskaram" },
  },
  "greetings": {
    kn: { text: "ನಮಸ್ಕಾರಗಳು", translit: "Namaskaragalu" },
    hi: { text: "नमस्कार", translit: "Namaskar" },
    te: { text: "నమస్కారములు", translit: "Namaskaaramulu" },
    ta: { text: "வணக்கங்கள்", translit: "Vanakkangal" },
    ml: { text: "നമസ്കാരം", translit: "Namaskaram" },
  },
  "please": {
    kn: { text: "ದಯವಿಟ್ಟು", translit: "Dayavittu" },
    hi: { text: "कृपया", translit: "Kripya" },
    te: { text: "దయచేసి", translit: "Dayachesi" },
    ta: { text: "தயவுசெய்து", translit: "Thayavuseithu" },
    ml: { text: "ദയവായി", translit: "Dayavaayi" },
  },
  "how much": {
    kn: { text: "ಎಷ್ಟು?", translit: "Eshtu?" },
    hi: { text: "कितना है?", translit: "Kitna hai?" },
    te: { text: "ఎంత?", translit: "Entha?" },
    ta: { text: "எவ்வளவு?", translit: "Evvalavu?" },
    ml: { text: "എത്രയാണ്?", translit: "Ethrayaanu?" },
  },
  "water": {
    kn: { text: "ನೀರು", translit: "Neeru" },
    hi: { text: "पानी", translit: "Paani" },
    te: { text: "నీళ్లు", translit: "Neellu" },
    ta: { text: "தண்ணீர்", translit: "Thanneer" },
    ml: { text: "വെള്ളം", translit: "Vellam" },
  },
  "food": {
    kn: { text: "ಊಟ", translit: "Oota" },
    hi: { text: "खाना", translit: "Khaana" },
    te: { text: "భోజనం", translit: "Bhojanam" },
    ta: { text: "உணவு", translit: "Unavu" },
    ml: { text: "ഭക്ഷണം", translit: "Bhakshanam" },
  },
  "tea": {
    kn: { text: "ಚಹಾ", translit: "Chaha" },
    hi: { text: "चाय", translit: "Chai" },
    te: { text: "టీ", translit: "Tea" },
    ta: { text: "தேநீர்", translit: "Theneer" },
    ml: { text: "ചായ", translit: "Chaya" },
  },
  "coffee": {
    kn: { text: "ಕಾಫಿ", translit: "Kaafi" },
    hi: { text: "कॉफ़ी", translit: "Coffee" },
    te: { text: "కాఫీ", translit: "Coffee" },
    ta: { text: "காபி", translit: "Kaapi" },
    ml: { text: "കാപ്പി", translit: "Kaappi" },
  },
  "where is this": {
    kn: { text: "ಇದು ಎಲ್ಲಿ ಇದೆ?", translit: "Idu elli ide?" },
    hi: { text: "यह कहाँ है?", translit: "Yeh kahan hai?" },
    te: { text: "ఇది ఎక్కడ ఉంది?", translit: "Idi ekkada undi?" },
    ta: { text: "இது எங்கே உள்ளது?", translit: "Idhu engae ulladhu?" },
    ml: { text: "ഇത് എവിടെയാണ്?", translit: "Ithu evideyaanu?" },
  },
  "where is the bus stand": {
    kn: { text: "ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?", translit: "Bus nildana ellide?" },
    hi: { text: "बस स्टैंड कहाँ है?", translit: "Bus stand kahan hai?" },
    te: { text: "బస్ స్టాండ్ ఎక్కడ ఉంది?", translit: "Bus stand ekkada undi?" },
    ta: { text: "பேருந்து நிலையம் எங்கே?", translit: "Paerundhu nilayam engae?" },
    ml: { text: "ബസ് സ്റ്റാൻഡ് എവിടെയാണ്?", translit: "Bus stand evideyaanu?" },
  },
  "help": {
    kn: { text: "ಸಹಾಯ ಮಾಡಿ", translit: "Sahaya maadi" },
    hi: { text: "मदद कीजिए", translit: "Madad kijiye" },
    te: { text: "సహాయం చేయండి", translit: "Sahaayam cheyandi" },
    ta: { text: "உதவி செய்யுங்கள்", translit: "Udhavi seiyungal" },
    ml: { text: "സഹായിക്കൂ", translit: "Sahaayikku" },
  },
  "yes": {
    kn: { text: "ಹೌದು", translit: "Haudu" },
    hi: { text: "हाँ", translit: "Haan" },
    te: { text: "అవును", translit: "Avunu" },
    ta: { text: "ஆம்", translit: "Aam" },
    ml: { text: "അതെ", translit: "Athe" },
  },
  "no": {
    kn: { text: "ಇಲ್ಲ", translit: "Illa" },
    hi: { text: "नहीं", translit: "Nahi" },
    te: { text: "కాదు", translit: "Kaadu" },
    ta: { text: "இல்லை", translit: "Illai" },
    ml: { text: "അല്ല", translit: "Alla" },
  },
  "stop": {
    kn: { text: "ನಿಲ್ಲಿಸಿ", translit: "Nillisi" },
    hi: { text: "रोकिए", translit: "Rokiye" },
    te: { text: "ఆపండి", translit: "Aapandi" },
    ta: { text: "நிறுத்துங்கள்", translit: "Niruthungal" },
    ml: { text: "നിർത്തൂ", translit: "Nirthu" },
  },
  "good": {
    kn: { text: "ಚೆನ್ನಾಗಿದೆ", translit: "Chennagide" },
    hi: { text: "अच्छा है", translit: "Achha hai" },
    te: { text: "బాగుంది", translit: "Baagundi" },
    ta: { text: "நன்றாக உள்ளது", translit: "Nandraaga ulladhu" },
    ml: { text: "നന്നായിട്ടുണ്ട്", translit: "Nannaayittundu" },
  },
  "welcome": {
    kn: { text: "ಸುಸ್ವಾಗತ", translit: "Susvaagata" },
    hi: { text: "स्वागत है", translit: "Swagat hai" },
    te: { text: "స్వాగతం", translit: "Swaagatham" },
    ta: { text: "வரவேற்கிறோம்", translit: "Varaverkirom" },
    ml: { text: "സ്വാഗതം", translit: "Swaagatham" },
  },
  "how much is the auto fare": {
    kn: { text: "ಆಟೋ ಬಾಡಿಗೆ ಎಷ್ಟು ಆಗುತ್ತದೆ?", translit: "Auto baadige eshtu aaguttade?" },
    hi: { text: "ऑटो का किराया कितना है?", translit: "Auto ka kiraya kitna hai?" },
    te: { text: "ఆటో ఛార్జీ ఎంత అవుతుంది?", translit: "Auto charge entha avuthundi?" },
    ta: { text: "ஆட்டோ கட்டணம் எவ்வளவு?", translit: "Auto kattanam evvalavu?" },
    ml: { text: "ഓട്ടോ കൂലി എത്രയാണ്?", translit: "Auto kooli ethrayanu?" },
  },
  "please take me to the railway station": {
    kn: { text: "ದಯವಿಟ್ಟು ರೈಲ್ವೆ ನಿಲ್ದಾಣಕ್ಕೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ.", translit: "Dayavittu railway nildanakke karedukondu hogi." },
    hi: { text: "कृपया मुझे रेलवे स्टेशन ले चलिए।", translit: "Kripya mujhe railway station le chaliye." },
    te: { text: "దయచేసి నన్ను రైల్వే స్టేషన్‌కు తీసుకెళ్లండి.", translit: "Dayachesi nannu railway station-ku theesukellandi." },
    ta: { text: "தயவுசெய்து என்னை ரயில் நிலையத்திற்கு அழைத்துச் செல்லுங்கள்.", translit: "Thayavuseithu ennai railway nilayathirku azhaithu chellungal." },
    ml: { text: "ദയവായി എന്നെ റെയിൽവേ സ്റ്റേഷനിലേക്ക് കൊണ്ടുപോകൂ.", translit: "Dayavaayi enne railway station-ilekku kondupookoo." },
  },
  "please stop the car here": {
    kn: { text: "ದಯವಿಟ್ಟು ಕಾರನ್ನು ಇಲ್ಲಿಯೇ ನಿಲ್ಲಿಸಿ.", translit: "Dayavittu car-annu illiye nillisi." },
    hi: { text: "कृपया गाड़ी यहीं रोकिए।", translit: "Kripya gaadi yahin rokiye." },
    te: { text: "దయచేసి కారును ఇక్కడే ఆపండి.", translit: "Dayachesi car-nu ikkade aapandi." },
    ta: { text: "தயவுசெய்து காரை இங்கே நிறுத்துங்கள்.", translit: "Thayavuseithu kaarai ingae niruthungal." },
    ml: { text: "ദയവായി വണ്ടി ഇവിടെ നിർത്തൂ.", translit: "Dayavaayi vandi ivide nirthoo." },
  },
  "is this food vegetarian": {
    kn: { text: "ಈ ಊಟ ಸಸ್ಯಾಹಾರವೇ?", translit: "Ee oota sasyaahaarave?" },
    hi: { text: "क्या यह खाना शाकाहारी है?", translit: "Kya yeh khana shakahari hai?" },
    te: { text: "ఈ భోజనం శాఖాహారమా?", translit: "Ee bhojanam shaakhaahaaramaa?" },
    ta: { text: "இந்த உணவு சைவமா?", translit: "Indha unavu saivamaa?" },
    ml: { text: "ഈ ഭക്ഷണം സസ്യാഹാരമാണോ?", translit: "Ee bhakshanam sasyaahaaramaano?" },
  },
  "where is the ticket counter": {
    kn: { text: "ಟಿಕೆಟ್ ಕೌಂಟರ್ ಎಲ್ಲಿದೆ?", translit: "Ticket counter ellide?" },
    hi: { text: "टिकट काउंटर कहाँ है?", translit: "Ticket counter kahan hai?" },
    te: { text: "టికెట్ కౌంటర్ ఎక్కడ ఉంది?", translit: "Ticket counter ekkada undi?" },
    ta: { text: "டிக்கெட் கவுண்டர் எங்கே உள்ளது?", translit: "Ticket counter engae ulladhu?" },
    ml: { text: "ടിക്കറ്റ് കൗണ്ടർ എവിടെയാണ്?", translit: "Ticket counter evideyaanu?" },
  },
  "can you wait here for 10 minutes": {
    kn: { text: "ದಯವಿಟ್ಟು ಹತ್ತು ನಿಮಿಷ ಇಲ್ಲಿಯೇ ಕಾಯಬಹುದೇ?", translit: "Dayavittu hattu nimisha illiye kaayabahude?" },
    hi: { text: "क्या आप यहाँ 10 मिनट रुक सकते हैं?", translit: "Kya aap yahan 10 minute ruk sakte hain?" },
    te: { text: "మీరు ఇక్కడ 10 నిమిషాలు వేచి ఉండగలరా?", translit: "Meeru ikkada 10 nimishaalu vechi undagalaraa?" },
    ta: { text: "நீங்கள் இங்கே 10 நிமிடங்கள் காத்திருக்க முடியுமா?", translit: "Neengal ingae 10 nimidangal kaathirukka mudiyumaa?" },
    ml: { text: "നിങ്ങൾക്ക് ഇവിടെ 10 മിനിറ്റ് കാത്തുനിൽക്കാമോ?", translit: "Ningalkku ivide 10 minute kaathunilkaamo?" },
  },
};

function lookupOfflinePhrase(
  query: string,
  sourceLang: string,
  targetLang: string
): { translatedText: string; transliteration?: string } | null {
  const normalized = query.trim().toLowerCase().replace(/[.,!?;:]/g, "");

  // English -> Target Language lookup
  if (sourceLang === "en") {
    const entry = COMMON_OFFLINE_PHRASES[normalized];
    if (entry && entry[targetLang]) {
      return {
        translatedText: entry[targetLang]!.text,
        transliteration: entry[targetLang]!.translit,
      };
    }

    if (targetLang === "kn") {
      const phraseMatch = (phrasesData as Array<{ en: string; kn: string; translit: string }>).find(
        (p) => {
          const pNorm = p.en.toLowerCase().replace(/[.,!?;:]/g, "").trim();
          return pNorm === normalized;
        }
      );
      if (phraseMatch) {
        return { translatedText: phraseMatch.kn, transliteration: phraseMatch.translit };
      }
    }
  }

  // Source Language -> English lookup
  if (targetLang === "en") {
    for (const [enKey, val] of Object.entries(COMMON_OFFLINE_PHRASES)) {
      const targetObj = val[sourceLang];
      if (
        targetObj &&
        (targetObj.text === query.trim() ||
          (targetObj.translit && targetObj.translit.toLowerCase() === normalized))
      ) {
        return { translatedText: enKey };
      }
    }

    if (sourceLang === "kn") {
      const phraseMatchKn = (phrasesData as Array<{ en: string; kn: string; translit: string }>).find(
        (p) => p.kn.trim() === query.trim() || p.translit.toLowerCase().trim() === normalized
      );
      if (phraseMatchKn) {
        return { translatedText: phraseMatchKn.en };
      }
    }
  }

  // Cross-language lookup between regional languages (e.g. kn -> hi, hi -> te)
  if (sourceLang !== "en" && targetLang !== "en") {
    for (const val of Object.values(COMMON_OFFLINE_PHRASES)) {
      const srcObj = val[sourceLang];
      const tgtObj = val[targetLang];
      if (
        srcObj &&
        tgtObj &&
        (srcObj.text === query.trim() ||
          (srcObj.translit && srcObj.translit.toLowerCase() === normalized))
      ) {
        return {
          translatedText: tgtObj.text,
          transliteration: tgtObj.translit,
        };
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
  const systemPrompt = `You are an expert travel translator specializing in Indian languages (Kannada, Hindi, Telugu, Tamil, Malayalam) for tourists.
Translate the user's text from ${sourceLangName} to ${targetLangName}.
Requirements:
1. Provide a natural, polite, authentic conversational translation suitable for speaking to a local driver, guide, or shopkeeper in Karnataka and South India.
2. Provide BOTH the native script translation in ${targetLangName} AND a clear English phonetic transliteration (how an English speaker should pronounce it).
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
  const systemPrompt = `Translate the text from ${sourceLangName} to ${targetLangName} naturally for a traveler in Karnataka and South India.
Provide BOTH the native script translation in ${targetLangName} AND an English phonetic pronunciation transliteration.
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
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    throw new Error("Public translation endpoint unavailable");
  }
  const json = await res.json();
  let transliteration: string | undefined;
  const translatedParts: string[] = [];

  if (Array.isArray(json) && Array.isArray(json[0])) {
    for (const item of json[0]) {
      if (item && typeof item[0] === "string") {
        translatedParts.push(item[0]);
      }
      if (item && item[0] === null && typeof item[2] === "string" && item[2].trim()) {
        transliteration = item[2].trim();
      }
    }
  }

  return {
    translatedText: translatedParts.join("").trim(),
    transliteration,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Per-IP rate limiting: this route spends upstream AI quota, so it must not
    // be usable as an open relay.
    const rateLimit = checkRateLimit(getClientIp(req), RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many translation requests. Please retry shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterS) } }
      );
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Payload exceeds 8KB limit." },
        { status: 413 }
      );
    }

    let body: TranslateRequestBody;
    try {
      body = (await req.json()) as TranslateRequestBody;
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
    }

    const { text, sourceLang = "en", targetLang = "kn" } = body || {};

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required for translation." }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (typeof sourceLang !== "string" || typeof targetLang !== "string") {
      return NextResponse.json(
        { error: "sourceLang and targetLang must be language codes." },
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

    // Fast-path: Check offline travel dictionary for exact phrase matches (0ms response, zero quota usage)
    const instantMatch = lookupOfflinePhrase(text.trim(), sLang, tLang);
    if (instantMatch) {
      return NextResponse.json({
        ...instantMatch,
        sourceLang: sLang,
        targetLang: tLang,
        provider: "offline-dictionary",
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

    return NextResponse.json(
      { error: "Translation service temporarily unavailable. Please retry." },
      { status: 503 }
    );
  } catch (err: unknown) {
    console.warn(
      "Unexpected error in POST /api/translate:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Translation service encountered an error. Please retry." },
      { status: 500 }
    );
  }
}
