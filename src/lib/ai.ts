import { PlanRequest, AIModelOutput, AIModelOutputSchema, Place, Plan } from "./schema";
import { getCandidates } from "./candidates";
import { PACE_STOP_LIMITS, validateAIOutput, buildDeterministicPlan } from "./planner";
import { enrichPlan } from "./enrich";

export const SYSTEM_PROMPT_TEMPLATE = `You are a Karnataka trip planner. You receive a trip brief and a list of CANDIDATE PLACES.
Rules:
1. Use ONLY place ids from the candidate list. Never invent places, ids, prices or distances.
2. Produce exactly {days} days. Each day holds {min_stops} to {max_stops} stops.
3. Put geographically close places on the same day. Use the lat/lng provided. Avoid days with more than 4 hours of driving in total.
4. Respect each stop's duration_min. Start between 08:30 and 10:00 and finish before 19:30. Include a meal stop around 12:30 to 14:00 when a meal place is available.
5. Match the traveller's interests and pace. Prefer places whose best_months include the travel month.
6. Write one short note per stop in plain English (max 18 words): why it fits and one practical tip.
7. Output valid JSON only, matching the schema. No prose outside the JSON.`;

/**
 * Builds the candidate summary sent to the LLM (keeps token count lean).
 */
export function buildCandidatesPromptPayload(candidates: Place[]): string {
  const compact = candidates.map((p) => ({
    id: p.id,
    name: p.name_en,
    region: p.region,
    city: p.city,
    lat: p.lat,
    lng: p.lng,
    categories: p.categories,
    duration_min: p.duration_min,
    is_meal: p.is_meal || false,
    best_months: p.best_months,
  }));
  return JSON.stringify(compact, null, 2);
}

/**
 * Calls Groq API in JSON mode.
 */
async function callGroqAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string = "openai/gpt-oss-120b"
): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(18000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}

/**
 * Calls Google Gemini REST API with JSON response format.
 */
async function callGeminiAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string = "gemini-2.5-flash"
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    }),
    signal: AbortSignal.timeout(18000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Parses, cleans, and validates raw LLM JSON text against the Zod schema.
 */
function parseAndValidateModelOutput(
  rawText: string,
  request: PlanRequest
): { success: true; data: AIModelOutput } | { success: false; errors: string[] } {
  try {
    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const schemaResult = AIModelOutputSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        success: false,
        errors: schemaResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
    }

    const businessValidation = validateAIOutput(schemaResult.data, request);
    if (!businessValidation.valid) {
      return {
        success: false,
        errors: businessValidation.errors,
      };
    }

    return { success: true, data: schemaResult.data };
  } catch (err: unknown) {
    return {
      success: false,
      errors: [err instanceof Error ? err.message : "Invalid JSON syntax"],
    };
  }
}

/**
 * Master itinerary generation pipeline:
 * 1. Filter candidates
 * 2. Try Groq
 * 3. Try Gemini
 * 4. Retry on validation error
 * 5. Fallback to deterministic planner
 */
export async function generateItinerary(request: PlanRequest): Promise<Plan> {
  const candidates = getCandidates(request);
  if (candidates.length === 0) {
    return buildDeterministicPlan(request);
  }

  const limits = PACE_STOP_LIMITS[request.pace] || PACE_STOP_LIMITS.balanced;
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace("{days}", request.days.toString())
    .replace("{min_stops}", limits.min.toString())
    .replace("{max_stops}", limits.max.toString());

  const userPrompt = `TRIP BRIEF:
- Days: ${request.days}
- Start City: ${request.start_city}
- Interests: ${request.interests.join(", ")}
- Budget Tier: ${request.budget}
- Pace: ${request.pace} (${limits.min} to ${limits.max} stops/day)
- Travellers: ${request.travellers}
- Month: ${request.month}

CANDIDATE PLACES (Use ONLY these place IDs):
${buildCandidatesPromptPayload(candidates)}`;

  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Provider cascade: 1) Groq
  if (groqKey && groqKey.trim().length > 0) {
    try {
      const rawText = await callGroqAPI(systemPrompt, userPrompt, groqKey, groqModel);
      const validation = parseAndValidateModelOutput(rawText, request);

      if (validation.success) {
        return enrichPlan(validation.data, request, "ai-groq");
      }

      // Retry once with error feedback
      const retryPrompt = `${userPrompt}\n\nYour previous response failed with these validation errors. Please correct them and return ONLY valid JSON matching the schema:\n${validation.errors.join("\n")}`;
      const retryText = await callGroqAPI(systemPrompt, retryPrompt, groqKey, groqModel);
      const retryValidation = parseAndValidateModelOutput(retryText, request);

      if (retryValidation.success) {
        return enrichPlan(retryValidation.data, request, "ai-groq");
      }
    } catch {
      // Groq failed, fall through to Gemini
    }
  }

  // Provider cascade: 2) Gemini
  if (geminiKey && geminiKey.trim().length > 0) {
    try {
      const rawText = await callGeminiAPI(systemPrompt, userPrompt, geminiKey, geminiModel);
      const validation = parseAndValidateModelOutput(rawText, request);

      if (validation.success) {
        return enrichPlan(validation.data, request, "ai-gemini");
      }

      // Retry once with error feedback
      const retryPrompt = `${userPrompt}\n\nYour previous response failed with these validation errors. Please correct them and return ONLY valid JSON matching the schema:\n${validation.errors.join("\n")}`;
      const retryText = await callGeminiAPI(systemPrompt, retryPrompt, geminiKey, geminiModel);
      const retryValidation = parseAndValidateModelOutput(retryText, request);

      if (retryValidation.success) {
        return enrichPlan(retryValidation.data, request, "ai-gemini");
      }
    } catch {
      // Gemini failed, fall through to deterministic planner
    }
  }

  // Provider cascade: 3) Deterministic Planner (zero-failure guarantee)
  return buildDeterministicPlan(request);
}
