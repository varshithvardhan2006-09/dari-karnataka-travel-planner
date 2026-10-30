import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as POST_PLAN } from "@/app/api/plan/route";
import { POST as POST_TRANSLATE } from "@/app/api/translate/route";
import { resetRateLimits } from "@/lib/rate-limit";
import { rehydrateSharedPlan } from "@/lib/share";
import { getSamplePlan } from "@/lib/samples";
import { buildDeterministicPlan } from "@/lib/planner";
import { buildCandidatesPromptPayload, SYSTEM_PROMPT_TEMPLATE, DEFAULT_GEMINI_MODEL, DEFAULT_GROQ_MODEL } from "@/lib/ai";
import { getCandidates, getStartCityCoordinates } from "@/lib/candidates";
import { PlanRequest, PlanSchema } from "@/lib/schema";

const baseRequest: PlanRequest = {
  interests: ["heritage", "nature"],
  days: 3,
  start_city: "Mysuru",
  budget: "premium",
  pace: "balanced",
  travellers: "family",
  month: 1,
  lang: "en",
};

// A ReadableStream body has no Content-Length, like a chunked upload.
function streamBody(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

beforeEach(() => resetRateLimits());

describe("Request size limits measure the real body", () => {
  it("rejects an oversized /api/plan body sent without Content-Length", async () => {
    const big = JSON.stringify({ ...baseRequest, padding: "x".repeat(40 * 1024) });
    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      body: streamBody(big),
      duplex: "half", // required by undici for streamed request bodies
    });
    expect(req.headers.get("content-length")).toBeNull();
    const res = await POST_PLAN(req);
    expect(res.status).toBe(413);
  });

  it("rejects an oversized /api/translate body sent without Content-Length", async () => {
    const big = JSON.stringify({ text: "hi", padding: "x".repeat(10 * 1024) });
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: streamBody(big),
      duplex: "half", // required by undici for streamed request bodies
    });
    const res = await POST_TRANSLATE(req);
    expect(res.status).toBe(413);
  });
});

describe("Lookups ignore Object prototype keys", () => {
  it("rejects 'constructor' as a translation language", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "hello", sourceLang: "constructor", targetLang: "kn" }),
    });
    const res = await POST_TRANSLATE(req);
    expect(res.status).toBe(400);
  });

  it("falls back to a real sample plan for ?sample=constructor", () => {
    const plan = getSamplePlan("constructor");
    expect(PlanSchema.safeParse(plan).success).toBe(true);
    expect(getSamplePlan("__proto__").days.length).toBeGreaterThan(0);
  });
});

describe("Shared links are rebuilt from the dataset", () => {
  it("replaces tampered place names, fees and source links with dataset values", () => {
    const plan = buildDeterministicPlan(baseRequest);
    const original = plan.days[0].stops[0].place;
    const tampered = structuredClone(plan);
    tampered.days[0].stops[0].place = {
      ...original,
      name_en: "Fake Palace",
      entry_inr: 1,
      source_url: "javascript:alert(1)",
    };

    const rebuilt = rehydrateSharedPlan(tampered);
    expect(rebuilt).not.toBeNull();
    expect(rebuilt!.days[0].stops[0].place).toEqual(original);
  });

  it("rejects a link that names a place outside the dataset", () => {
    const plan = buildDeterministicPlan(baseRequest);
    const tampered = structuredClone(plan);
    tampered.days[0].stops[0].place_id = "made_up_place";
    expect(rehydrateSharedPlan(tampered)).toBeNull();
  });
});

describe("Plans carry the trip they were built for", () => {
  it("stores start city, budget, travellers, month and transport on the plan", () => {
    const plan = buildDeterministicPlan({ ...baseRequest, transport_mode: "bus_train" });
    expect(plan.trip).toEqual({
      start_city: "Mysuru",
      budget: "premium",
      travellers: "family",
      month: 1,
      transport_mode: "bus_train",
    });
    expect(PlanSchema.safeParse(plan).success).toBe(true);
  });
});

describe("Titles and prompts", () => {
  it("writes '1-Day', not '1 Days', and capitalises interests", () => {
    const plan = buildDeterministicPlan({ ...baseRequest, days: 1 });
    expect(plan.title).toBe("1-Day Heritage & Nature Journey");
  });

  it("leaves no unfilled placeholders after the prompt is prepared", () => {
    const prepared = SYSTEM_PROMPT_TEMPLATE.replaceAll("{days}", "3")
      .replaceAll("{min_stops}", "3")
      .replaceAll("{max_stops}", "4");
    expect(prepared).not.toMatch(/\{(days|min_stops|max_stops)\}/);
  });

  it("sends a compact candidate table that keeps every id", () => {
    const candidates = getCandidates(baseRequest);
    const payload = buildCandidatesPromptPayload(candidates);
    expect(payload.split("\n")).toHaveLength(candidates.length + 1);
    for (const c of candidates) expect(payload).toContain(c.id);
    expect(payload.length).toBeLessThan(5000);
  });

  it("defaults to models the providers still serve", () => {
    expect(DEFAULT_GROQ_MODEL).toBe("openai/gpt-oss-120b");
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-flash-latest");
  });
});

describe("Start city matching", () => {
  it("does not resolve one or two letters to an arbitrary place", () => {
    expect(getStartCityCoordinates("a").isRecognized).toBe(false);
    expect(getStartCityCoordinates("Hampi").isRecognized).toBe(true);
  });
});
