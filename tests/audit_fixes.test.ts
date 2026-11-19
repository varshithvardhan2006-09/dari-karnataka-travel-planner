import { describe, it, expect, beforeEach, vi } from "vitest";
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
  it("stores the trip request (city, budget, group, month, transport, interests, pace) on the plan", () => {
    const plan = buildDeterministicPlan({ ...baseRequest, transport_mode: "bus_train" });
    expect(plan.trip).toEqual({
      start_city: "Mysuru",
      budget: "premium",
      travellers: "family",
      month: 1,
      transport_mode: "bus_train",
      interests: ["heritage", "nature"],
      pace: "balanced",
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

describe("Schedules and costs", () => {
  it("rejects an AI plan whose real schedule runs past 19:30", async () => {
    const { validateAIOutput } = await import("@/lib/planner");
    const ids = ["mysore-zoo", "mysore-palace", "chamundi-hill", "brindavan-gardens", "devaraja-market", "mylari-dosa"];
    const plan = {
      title: "t",
      summary: "s",
      tips: [],
      days: [{ day: 1, theme: "x", stops: ids.map((id, i) => ({ place_id: id, start: `09:${String(i * 5).padStart(2, "0")}`, note_en: "n" })) }],
    };
    const result = validateAIOutput(plan, { ...baseRequest, days: 1, pace: "packed", start_city: "Mysuru" });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/19:30/);
  });

  it("schedules meal places inside their meal time", () => {
    const meal: Record<string, string> = { breakfast: "07:30-11:00", lunch: "11:30-15:00", snack: "10:00-18:00", dinner: "17:30-19:30" };
    for (const interests of [["food"], ["food", "heritage"], ["food", "culture"]] as const) {
      for (const start_city of ["Bengaluru", "Mysuru", "Udupi"]) {
        const plan = buildDeterministicPlan({ ...baseRequest, interests: [...interests], start_city, days: 3 });
        for (const stop of plan.days.flatMap((d) => d.stops)) {
          if (!stop.place.is_meal) continue;
          const [from, to] = meal[stop.place.is_meal].split("-");
          expect(stop.start >= from && stop.start <= to, `${stop.place_id} at ${stop.start}`).toBe(true);
        }
      }
    }
  });

  it("does not add meal prices to entry fees", async () => {
    const { calculateTripCost } = await import("@/lib/cost");
    const places = getCandidates({ ...baseRequest, interests: ["food"] }).filter((p) => p.is_meal);
    const cost = calculateTripCost({ days: 1, budget: "mid", travellers: "solo", totalKm: 0, visitedPlaces: places });
    expect(places.length).toBeGreaterThan(0);
    expect(cost.entry).toBe(0);
  });
});

describe("Speech proxy", () => {
  it("refuses to pass on (and cache) a non-audio upstream reply", async () => {
    const { GET } = await import("@/app/api/tts/route");
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response("<html>unusual traffic</html>", { status: 200, headers: { "Content-Type": "text/html" } })
    );
    const res = await GET(new NextRequest("http://localhost:3000/api/tts?text=Namaskara&lang=kn"));
    expect(res.status).toBe(502);
    spy.mockRestore();
  });
});

describe("Shared links cannot show invented costs or text", () => {
  it("keeps the real cost for a genuine plan and recalculates a tampered one", () => {
    const plan = buildDeterministicPlan(baseRequest);
    expect(rehydrateSharedPlan(structuredClone(plan))!.cost).toEqual(plan.cost);

    const tampered = structuredClone(plan);
    tampered.cost = { ...tampered.cost, total: 1, stay: 0 };
    tampered.title = "x".repeat(5000);
    const rebuilt = rehydrateSharedPlan(tampered)!;
    expect(rebuilt.cost).toEqual(plan.cost);
    expect(rebuilt.title.length).toBeLessThanOrEqual(120);
  });

  it("rejects links with broken day numbering or too many days", () => {
    const plan = buildDeterministicPlan(baseRequest);
    const renumbered = structuredClone(plan);
    renumbered.days[1].day = 7;
    expect(rehydrateSharedPlan(renumbered)).toBeNull();

    const long = structuredClone(plan);
    long.days = Array.from({ length: 8 }, (_, i) => ({ ...plan.days[0], day: i + 1 }));
    expect(rehydrateSharedPlan(long)).toBeNull();
  });
});
