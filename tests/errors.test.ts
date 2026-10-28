import { describe, it, expect, vi, afterEach } from "vitest";
import { POST, GET as GET_PLAN } from "@/app/api/plan/route";
import { GET as GET_TTS } from "@/app/api/tts/route";
import { NextRequest } from "next/server";
import { getSamplePlan, getSamplePlanForInterests } from "@/lib/samples";
import { PlanSchema } from "@/lib/schema";

/**
 * Stubs the Google TTS upstream so /api/tts can be asserted without network
 * access (the route itself would otherwise make two real 6s requests).
 */
function stubTtsUpstream(ok: boolean = true) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    ok
      ? new Response(new Uint8Array([0xff, 0xfb, 0x90, 0x00]), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        })
      : new Response("upstream down", { status: 503 })
  );
}

describe("Stage 6: Error, Empty, and Fallback States", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects malformed JSON body with 400 invalid_input", async () => {
    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "this is not valid json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_input");
  });

  it("rejects invalid request fields with 400 invalid_input details", async () => {
    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: [], // empty interests violates min(1)
        days: 10, // violates max(7)
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_input");
    expect(Array.isArray(data.details)).toBe(true);
  });

  it("handles 429 busy state correctly when rate limit or simulation is triggered", async () => {
    const req = new NextRequest("http://localhost:3000/api/plan?simulate=429", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: ["heritage"],
        days: 3,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "relaxed",
        travellers: "couple",
        month: 11,
        lang: "en",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("busy");
    expect(data.retry_after_s).toBeGreaterThanOrEqual(1);
  });

  it("handles few_matches / zero candidates state correctly", async () => {
    const req = new NextRequest("http://localhost:3000/api/plan?simulate=zero_candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: ["beach"],
        days: 5,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "relaxed",
        travellers: "couple",
        month: 11,
        lang: "en",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe("few_matches");
    expect(data.match_count).toBe(0);
  });

  it("never exposes raw provider error and falls back gracefully", async () => {
    // Valid request with no AI keys configured
    const req = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: ["heritage", "culture"],
        days: 2,
        start_city: "Mysuru",
        budget: "mid",
        pace: "balanced",
        travellers: "solo",
        month: 10,
        lang: "en",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan).toBeDefined();
    expect(["planner", "sample", "ai-groq", "ai-gemini"]).toContain(data.plan.source);
    expect(PlanSchema.safeParse(data.plan).success).toBe(true);
  });

  it("loads all 4 curated samples correctly via getSamplePlan", () => {
    const samples = ["heritage", "nature", "food", "mixed"];
    samples.forEach((key) => {
      const plan = getSamplePlan(key);
      expect(plan).toBeDefined();
      expect(plan.source).toBe("sample");
      expect(PlanSchema.safeParse(plan).success).toBe(true);
      expect(plan.days.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("selects appropriate sample based on interests via getSamplePlanForInterests", () => {
    expect(getSamplePlanForInterests(["heritage"]).key).toBe("heritage");
    expect(getSamplePlanForInterests(["nature"]).key).toBe("nature");
    expect(getSamplePlanForInterests(["food"]).key).toBe("food");
    expect(getSamplePlanForInterests(["adventure", "coffee"]).key).toBe("nature");
  });

  it("handles GET /api/plan health check correctly", async () => {
    const res = await GET_PLAN();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("dari-karnataka-planner");
    expect(data.places_count).toBeGreaterThan(30);
  });

  it("rejects GET /api/tts when text parameter is missing or empty", async () => {
    const reqMissing = new NextRequest("http://localhost:3000/api/tts");
    const resMissing = await GET_TTS(reqMissing);
    expect(resMissing.status).toBe(400);

    const reqEmpty = new NextRequest("http://localhost:3000/api/tts?text=%20%20");
    const resEmpty = await GET_TTS(reqEmpty);
    expect(resEmpty.status).toBe(400);
  });

  it("handles valid GET /api/tts streaming audio correctly with Accept-Ranges", async () => {
    stubTtsUpstream(true);
    const req = new NextRequest("http://localhost:3000/api/tts?text=Namaskara");
    const res = await GET_TTS(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Cache-Control")).toContain("max-age=604800");
  });

  it("returns 502 from GET /api/tts when every speech upstream is unreachable", async () => {
    stubTtsUpstream(false);
    const req = new NextRequest("http://localhost:3000/api/tts?text=Namaskara&lang=kn");
    const res = await GET_TTS(req);
    expect(res.status).toBe(502);
  });

  it("returns 413 Payload Too Large when request body exceeds 32KB", async () => {
    const reqLarge = new NextRequest("http://localhost:3000/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "40000",
      },
      body: JSON.stringify({ long_data: "x".repeat(35000) }),
    });

    const resLarge = await POST(reqLarge);
    expect(resLarge.status).toBe(413);
  });

  it("includes Retry-After header on 429 rate limit responses", async () => {
    const reqSimulate429 = new NextRequest("http://localhost:3000/api/plan?simulate=429", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-simulate": "429",
      },
      body: JSON.stringify({
        interests: ["heritage"],
        days: 3,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "relaxed",
        travellers: "couple",
        month: 11,
        lang: "en",
      }),
    });

    const res429 = await POST(reqSimulate429);
    expect(res429.status).toBe(429);
    expect(res429.headers.get("Retry-After")).toBe("30");
  });
});
