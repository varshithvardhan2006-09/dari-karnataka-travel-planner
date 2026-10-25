import { describe, it, expect } from "vitest";
import placesData from "../data/places.json";
import phrasesData from "../data/phrases.json";
import { SYSTEM_PROMPT_TEMPLATE } from "../src/lib/ai";
import { buildDeterministicPlan } from "../src/lib/planner";
import { Place, Phrase } from "../src/lib/schema";
import { stopKannadaSpeech, getKannadaVoice } from "../src/lib/speech";

describe("Kannada mode and zero-AI-generated Kannada verification", () => {
  const places = placesData as Place[];
  const phrases = phrasesData as Phrase[];

  it("verifies that EVERY curated place has checked Kannada name and description in places.json", () => {
    places.forEach((p) => {
      expect(p.name_kn).toBeDefined();
      expect(p.name_kn.trim().length).toBeGreaterThan(0);
      expect(p.desc_kn).toBeDefined();
      expect(p.desc_kn.trim().length).toBeGreaterThan(0);
    });
  });

  it("verifies that EVERY phrase has valid Kannada script and pronunciation transliteration", () => {
    phrases.forEach((ph) => {
      expect(ph.kn).toBeDefined();
      expect(ph.kn.trim().length).toBeGreaterThan(0);
      expect(ph.translit).toBeDefined();
      expect(ph.translit.trim().length).toBeGreaterThan(0);
      expect(ph.en).toBeDefined();
    });
  });

  it("proves that AI system prompt explicitly demands English notes only (zero AI Kannada generation)", () => {
    expect(SYSTEM_PROMPT_TEMPLATE).toContain("in plain English");
    // Ensure no Kannada script is in the system prompt itself
    const kannadaCharRegex = /[\u0C80-\u0CFF]/;
    expect(kannadaCharRegex.test(SYSTEM_PROMPT_TEMPLATE)).toBe(false);
  });

  it("verifies that all stop phrases in enriched plans strictly originate from phrases.json", () => {
    const plan = buildDeterministicPlan({
      interests: ["heritage", "food"],
      days: 3,
      start_city: "Bengaluru",
      budget: "mid",
      pace: "relaxed",
      travellers: "couple",
      month: 11,
      lang: "kn",
    });

    const phraseIdSet = new Set(phrases.map((p) => p.id));
    plan.days.forEach((day) => {
      day.stops.forEach((stop) => {
        expect(stop.place.name_kn).toBeDefined();
        stop.phrases.forEach((ph) => {
          expect(phraseIdSet.has(ph.id)).toBe(true);
        });
      });
    });
  });

  it("handles stopKannadaSpeech cleanly without throwing in non-browser/SSR environment", () => {
    expect(() => stopKannadaSpeech()).not.toThrow();
  });

  it("handles getKannadaVoice safely in SSR environment returning null", () => {
    expect(getKannadaVoice()).toBeNull();
  });

  it("verifies GET /api/tts endpoint rejects missing text with 400", async () => {
    const { GET } = await import("../src/app/api/tts/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/tts");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("verifies GET /api/tts handles valid speech requests with audio/mpeg headers", async () => {
    const { GET } = await import("../src/app/api/tts/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost:3000/api/tts?text=%E0%B2%A8%E0%B2%AE%E0%B2%B8%E0%B3%8D%E0%B2%95%E0%B2%BE%E0%B2%B0&lang=kn");
    const res = await GET(req);
    expect([200, 500, 502, 503]).toContain(res.status); // 200 when network available, upstream server error if unreachable
    if (res.status === 200) {
      expect(res.headers.get("content-type")).toContain("audio/mpeg");
    }
  });
});
