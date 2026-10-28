import { describe, it, expect } from "vitest";
import { escapeHtml, getGoogleMapsSearchUrl } from "@/lib/maps";
import { PlanSchema } from "@/lib/schema";
import { buildDeterministicPlan } from "@/lib/planner";
import { PlanRequest } from "@/lib/schema";

describe("Map popup HTML escaping", () => {
  it("neutralises markup that would otherwise execute inside a Leaflet popup", () => {
    const payload = `<img src=x onerror="window.pwned=1">`;
    const escaped = escapeHtml(payload);

    expect(escaped).not.toContain("<img");
    expect(escaped).not.toContain('"');
    expect(escaped).toContain("&lt;img");
    expect(escaped).toContain("&quot;");
  });

  it("escapes quotes so an attribute value cannot be broken out of", () => {
    expect(escapeHtml(`" onmouseover="alert(1)`)).toBe(
      "&quot; onmouseover=&quot;alert(1)"
    );
  });

  it("renders empty string for null and undefined rather than printing them", () => {
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(0)).toBe("0");
  });

  it("builds coordinate-based Google Maps links that carry no caller markup", () => {
    const url = getGoogleMapsSearchUrl({
      name_en: `<script>alert(1)</script>`,
      city: "Mysuru",
      lat: 12.3051,
      lng: 76.6551,
    });
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=12.3051,76.6551");
    expect(url).not.toContain("<");
  });

  it("percent-encodes the name when no coordinates are available", () => {
    const url = getGoogleMapsSearchUrl({ name_en: `<script>`, city: "Mysuru" });
    expect(url).not.toContain("<script>");
    expect(url).toContain("%3Cscript%3E");
  });
});

describe("Shared plan payloads are validated before being rendered", () => {
  const baseRequest: PlanRequest = {
    interests: ["heritage"],
    days: 2,
    start_city: "Mysuru",
    budget: "mid",
    pace: "relaxed",
    travellers: "couple",
    month: 11,
    lang: "en",
  };

  it("accepts a plan the app itself produced", () => {
    const plan = buildDeterministicPlan(baseRequest);
    expect(PlanSchema.safeParse(plan).success).toBe(true);
  });

  it("rejects a tampered payload that drops required cost fields", () => {
    const plan = buildDeterministicPlan(baseRequest) as unknown as Record<string, unknown>;
    const cost = { ...(plan.cost as Record<string, unknown>) };
    delete cost.total;
    const tampered = { ...plan, cost };

    expect(PlanSchema.safeParse(tampered).success).toBe(false);
  });

  it("rejects a payload whose days are not the expected shape", () => {
    expect(PlanSchema.safeParse({ days: [{ evil: true }] }).success).toBe(false);
    expect(PlanSchema.safeParse({ days: "not-an-array" }).success).toBe(false);
    expect(PlanSchema.safeParse(null).success).toBe(false);
  });
});

describe("Plan distance and cost are derived from the same legs", () => {
  it("records an approach leg on the first stop of every day", () => {
    const plan = buildDeterministicPlan({
      interests: ["heritage", "food"],
      days: 3,
      start_city: "Bengaluru",
      budget: "mid",
      pace: "balanced",
      travellers: "couple",
      month: 11,
      lang: "en",
    });

    plan.days.forEach((day) => {
      if (day.stops.length === 0) return;
      expect(day.stops[0].travel_from_prev).toBeTruthy();
      expect(day.stops[0].travel_from_prev!.km).toBeGreaterThanOrEqual(0);
    });
  });

  it("counts every recorded leg in the day's travel total", () => {
    const plan = buildDeterministicPlan({
      interests: ["heritage"],
      days: 2,
      start_city: "Bengaluru",
      budget: "mid",
      pace: "balanced",
      travellers: "couple",
      month: 11,
      lang: "en",
    });

    plan.days.forEach((day) => {
      const sumOfLegs = day.stops.reduce(
        (acc, s) => acc + (s.travel_from_prev?.min || 0),
        0
      );
      expect(day.travel_total_min).toBe(sumOfLegs);
    });
  });
});
