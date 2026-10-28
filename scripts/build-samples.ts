import { Plan, PlanSchema } from "../src/lib/schema";
import { buildDeterministicPlan } from "../src/lib/planner";
import { SAMPLE_CONFIGS, SampleConfig } from "./sample-configs";

/**
 * Builds one curated sample itinerary from its config.
 *
 * This is the single source of truth for sample content: the generator script
 * writes its output to data/samples/, and the test suite calls the same
 * function to check the committed files still match.
 */
export function buildSamplePlan(config: SampleConfig): Plan {
  const plan = buildDeterministicPlan(config.req);
  plan.source = "sample";
  plan.title = config.title;
  plan.summary = config.summary;

  const result = PlanSchema.safeParse(plan);
  if (!result.success) {
    throw new Error(
      `Generated sample "${config.file}" does not satisfy PlanSchema:\n` +
        result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
    );
  }

  return plan;
}

/**
 * Serializes a sample plan exactly as it is stored on disk, so generated and
 * committed content can be compared.
 */
export function serializeSamplePlan(plan: Plan): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

/**
 * Normalizes line endings before comparing file contents.
 *
 * Git is commonly configured with `core.autocrlf=true` on Windows, so a fresh
 * clone can hold CRLF while this script writes LF. Comparing normalized text
 * keeps the drift check about content rather than checkout settings.
 */
export function normalizeEol(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

/**
 * Builds every curated sample, keyed by its filename.
 */
export function buildAllSamplePlans(): Map<string, Plan> {
  return new Map(SAMPLE_CONFIGS.map((config) => [config.file, buildSamplePlan(config)]));
}
