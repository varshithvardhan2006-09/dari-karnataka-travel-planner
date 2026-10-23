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
});
