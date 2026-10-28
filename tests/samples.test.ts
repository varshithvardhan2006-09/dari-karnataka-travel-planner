import { describe, it, expect } from "vitest";
import { PlanSchema, PlanRequest } from "@/lib/schema";
import { getCustomizedSamplePlan, getSamplePlan, SAMPLE_PLANS } from "@/lib/samples";
import { SAMPLE_CONFIGS } from "../scripts/sample-configs";
import { buildSamplePlan, serializeSamplePlan, normalizeEol } from "../scripts/build-samples";
import fs from "fs";
import path from "path";

const REGENERATE_HINT =
  'run "npm run generate:samples" and commit the result if the change is intended';

/**
 * These tests are read-only. Generating the sample files is the job of
 * scripts/generate-samples.mjs, so running the suite never mutates the
 * repository and a sample that drifts from the planner fails loudly instead of
 * being silently overwritten.
 */
describe("Curated sample itineraries", () => {
  const samplesDir = path.resolve(process.cwd(), "data/samples");

  it.each(SAMPLE_CONFIGS.map((c) => [c.file, c] as const))(
    "%s on disk matches what the planner currently produces",
    (file, config) => {
      const filePath = path.join(samplesDir, file);
      expect(
        fs.existsSync(filePath),
        `data/samples/${file} is missing — ${REGENERATE_HINT}`
      ).toBe(true);

      // Normalized so the check is about content, not the clone's line endings
      const committed = normalizeEol(fs.readFileSync(filePath, "utf-8"));
      const expected = normalizeEol(serializeSamplePlan(buildSamplePlan(config)));

      expect(
        committed,
        `data/samples/${file} is out of date with the planner — ${REGENERATE_HINT}`
      ).toBe(expected);
    }
  );

  it.each(SAMPLE_CONFIGS.map((c) => [c.file, c] as const))(
    "%s satisfies PlanSchema and the cost invariant",
    (file, config) => {
      const committed = JSON.parse(
        fs.readFileSync(path.join(samplesDir, file), "utf-8")
      );

      const parsed = PlanSchema.safeParse(committed);
      if (!parsed.success) {
        console.error(`Validation failed for ${file}:`, parsed.error.issues);
      }
      expect(parsed.success).toBe(true);

      expect(committed.source).toBe("sample");
      expect(committed.title).toBe(config.title);
      expect(committed.days.length).toBe(config.req.days);
      expect(committed.days.map((d: { day: number }) => d.day)).toEqual(
        Array.from({ length: config.req.days }, (_, i) => i + 1)
      );
      expect(committed.cost.total).toBe(
        committed.cost.stay +
          committed.cost.food +
          committed.cost.transport +
          committed.cost.entry
      );
    }
  );

  it("exposes every generated sample under the key the UI requests", () => {
    SAMPLE_CONFIGS.forEach((config) => {
      expect(SAMPLE_PLANS[config.key], `SAMPLE_PLANS is missing "${config.key}"`).toBeDefined();
      expect(getSamplePlan(config.key).title).toBe(config.title);
    });
  });

  it("falls back to the mixed sample for an unknown key", () => {
    expect(getSamplePlan("does-not-exist")).toBe(SAMPLE_PLANS.mixed);
  });

  it("customizes emergency sample plans to match requested days, people count, and budget", () => {
    const singleDayRequest: PlanRequest = {
      interests: ["heritage"],
      days: 1,
      start_city: "Bengaluru",
      budget: "budget",
      pace: "relaxed",
      travellers: "solo",
      month: 11,
      lang: "en",
      people_count: 5,
    };

    const { plan: customized1Day } = getCustomizedSamplePlan(singleDayRequest);

    // Must be sliced to 1 day exactly
    expect(customized1Day.days.length).toBe(1);
    expect(customized1Day.days[0].day).toBe(1);
    expect(customized1Day.cost.people).toBe(5);
    // 1-day trip has 0 lodging stay cost
    expect(customized1Day.cost.stay).toBe(0);
    expect(customized1Day.cost.total).toBe(
      customized1Day.cost.stay +
        customized1Day.cost.food +
        customized1Day.cost.transport +
        customized1Day.cost.entry
    );
    expect(customized1Day.source).toBe("sample");

    const multiDayRequest: PlanRequest = {
      interests: ["nature", "wildlife"],
      days: 5,
      start_city: "Mysuru",
      budget: "premium",
      pace: "packed",
      travellers: "friends",
      month: 12,
      lang: "en",
      people_count: 4,
      transport_mode: "own_car",
    };

    const { plan: customized5Day } = getCustomizedSamplePlan(multiDayRequest);
    expect(customized5Day.days.length).toBe(5);
    // Days must be sequentially numbered 1 to 5
    expect(customized5Day.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(customized5Day.cost.people).toBe(4);
    expect(customized5Day.cost.total).toBe(
      customized5Day.cost.stay +
        customized5Day.cost.food +
        customized5Day.cost.transport +
        customized5Day.cost.entry
    );
  });

  it("does not modify any sample file when the suite runs", () => {
    // Guards the property this split exists to protect.
    const before = SAMPLE_CONFIGS.map((c) =>
      fs.readFileSync(path.join(samplesDir, c.file), "utf-8")
    );
    SAMPLE_CONFIGS.forEach((c) => buildSamplePlan(c));
    const after = SAMPLE_CONFIGS.map((c) =>
      fs.readFileSync(path.join(samplesDir, c.file), "utf-8")
    );
    expect(after).toEqual(before);
  });
});
