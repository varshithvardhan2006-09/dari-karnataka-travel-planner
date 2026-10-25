import { describe, it, expect } from "vitest";
import en from "../src/lib/i18n/en.json";
import kn from "../src/lib/i18n/kn.json";

describe("i18n dictionary structure", () => {
  it("contains matching top-level keys in English and Kannada", () => {
    expect(Object.keys(en)).toEqual(Object.keys(kn));
  });

  it("contains required landing keys", () => {
    expect(en.landing.title).toBeDefined();
    expect(kn.landing.title).toBeDefined();
    expect(en.landing.cta_plan).toBeDefined();
    expect(kn.landing.cta_plan).toBeDefined();
  });

  it("ensures all leaf keys in en.json exist in kn.json", () => {
    function getLeafPaths(obj: Record<string, unknown>, prefix = ""): string[] {
      let paths: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          paths = paths.concat(getLeafPaths(value as Record<string, unknown>, fullPath));
        } else {
          paths.push(fullPath);
        }
      }
      return paths;
    }

    const enLeaves = getLeafPaths(en as unknown as Record<string, unknown>);
    const knLeaves = new Set(getLeafPaths(kn as unknown as Record<string, unknown>));

    const missingInKn = enLeaves.filter((path) => !knLeaves.has(path));
    expect(missingInKn).toEqual([]);
  });
});
