import { describe, it, expect, vi, afterEach } from "vitest";
import {
  withModelFallback,
  isMissingModelError,
  generateItinerary,
  DEFAULT_GROQ_MODEL,
} from "@/lib/ai";
import { PlanRequest } from "@/lib/schema";
import { buildDeterministicPlan } from "@/lib/planner";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Model fallback", () => {
  it("recognises retired-model errors but not temporary failures", () => {
    expect(
      isMissingModelError(new Error("Gemini API error (404): model not found"))
    ).toBe(true);
    expect(
      isMissingModelError(
        new Error("Groq API error (400): model_decommissioned")
      )
    ).toBe(true);
    expect(
      isMissingModelError(new Error("Groq API error (429): rate limit"))
    ).toBe(false);
    expect(
      isMissingModelError(new Error("Gemini API error (503): high demand"))
    ).toBe(false);
  });

  it("retries with the default model only when the configured one is gone", async () => {
    const call = vi.fn(async (model: string) => {
      if (model === "old-model") throw new Error("API error (404): not found");
      return `ok:${model}`;
    });
    const onFallback = vi.fn();
    await expect(
      withModelFallback("old-model", "new-model", call, onFallback)
    ).resolves.toBe("ok:new-model");
    expect(onFallback).toHaveBeenCalledWith("new-model");

    const busy = vi.fn(async () => {
      throw new Error("API error (429): rate limit");
    });
    await expect(
      withModelFallback("old-model", "new-model", busy)
    ).rejects.toThrow("429");
    expect(busy).toHaveBeenCalledTimes(1);
  });

  it("still plans with Groq when GROQ_MODEL names a retired model", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubEnv("GROQ_MODEL", "retired-model");
    vi.stubEnv("GEMINI_API_KEY", "");

    const request: PlanRequest = {
      interests: ["heritage"],
      days: 1,
      start_city: "Mysuru",
      budget: "mid",
      pace: "relaxed",
      travellers: "couple",
      month: 11,
      lang: "en",
    };
    // A valid answer in the model's output format, built from a real rule-based plan.
    const reference = buildDeterministicPlan(request);
    const plan = {
      title: reference.title,
      summary: reference.summary,
      days: reference.days.map((d) => ({
        day: d.day,
        theme: d.theme,
        stops: d.stops.map((s) => ({
          place_id: s.place_id,
          start: s.start,
          note_en: "Worth the visit.",
        })),
      })),
      tips: reference.tips,
    };

    const models: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const { model } = JSON.parse(String(init.body));
        models.push(model);
        if (model === "retired-model") {
          return new Response(
            '{"error":{"message":"The model does not exist"}}',
            { status: 404 }
          );
        }
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(plan) } }],
          }),
          {
            status: 200,
          }
        );
      })
    );

    const result = await generateItinerary(request);
    expect(models).toEqual(["retired-model", DEFAULT_GROQ_MODEL]);
    expect(result.source).toBe("ai-groq");
  });
});
