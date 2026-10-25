import { describe, it, expect, vi } from "vitest";
import { POST } from "../src/app/api/translate/route";
import { NextRequest } from "next/server";

describe("POST /api/translate", () => {
  it("rejects empty text with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "   " }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Text is required");
  });

  it("rejects excessively long text with 400", async () => {
    const longText = "a".repeat(501);
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: longText }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("maximum allowed length");
  });

  it("rejects unsupported language pair with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Hello", sourceLang: "en", targetLang: "xyz" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Unsupported language pair");
  });

  it("returns same text when source equals target language", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Namaskara", sourceLang: "kn", targetLang: "kn" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("Namaskara");
    expect(data.provider).toBe("noop");
  });

  it("translates English to Kannada using the fallback translation pipeline", async () => {
    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Thank you", sourceLang: "en", targetLang: "kn" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBeDefined();
    expect(data.targetLang).toBe("kn");
    expect(data.sourceLang).toBe("en");
  });

  it("translates offline travel phrases reliably even if upstream endpoints fail", async () => {
    const originalFetch = globalThis.fetch;
    // Simulate cloud endpoint failure / network offline
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network unreachable"));

    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Please", sourceLang: "en", targetLang: "kn" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("ದಯವಿಟ್ಟು");
    expect(data.provider).toBe("offline-dictionary");

    globalThis.fetch = originalFetch;
  });
});
