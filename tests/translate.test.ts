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

  it("handles custom sentence translations using the upstream/public fallback pipeline", async () => {
    const originalFetch = globalThis.fetch;
    // Mock public Google Translate response for novel arbitrary sentence
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [[["ಕರ್ನಾಟಕದ ಹವಾಮಾನ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.", "The weather in Karnataka is very pleasant."]]],
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "The weather in Karnataka is very pleasant.",
        sourceLang: "en",
        targetLang: "kn",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("ಕರ್ನಾಟಕದ ಹವಾಮಾನ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.");
    expect(data.provider).toBe("fallback-translator");

    globalThis.fetch = originalFetch;
  });

  it("translates offline travel phrases across all supported Indian languages (hi, te, ta, ml)", async () => {
    const originalFetch = globalThis.fetch;
    // Simulate cloud endpoint failure / network offline
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network unreachable"));

    // 1. Hindi test
    const reqHi = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Please stop the car here", sourceLang: "en", targetLang: "hi" }),
    });
    const resHi = await POST(reqHi);
    expect(resHi.status).toBe(200);
    const dataHi = await resHi.json();
    expect(dataHi.translatedText).toBe("कृपया गाड़ी यहीं रोकिए।");
    expect(dataHi.transliteration).toContain("Kripya");
    expect(dataHi.targetLang).toBe("hi");

    // 2. Telugu test
    const reqTe = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Where is the ticket counter", sourceLang: "en", targetLang: "te" }),
    });
    const resTe = await POST(reqTe);
    expect(resTe.status).toBe(200);
    const dataTe = await resTe.json();
    expect(dataTe.translatedText).toBe("టికెట్ కౌంటర్ ఎక్కడ ఉంది?");
    expect(dataTe.targetLang).toBe("te");

    // 3. Tamil test
    const reqTa = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Thank you", sourceLang: "en", targetLang: "ta" }),
    });
    const resTa = await POST(reqTa);
    expect(resTa.status).toBe(200);
    const dataTa = await resTa.json();
    expect(dataTa.translatedText).toBe("நன்றி");
    expect(dataTa.targetLang).toBe("ta");

    // 4. Malayalam test
    const reqMl = new NextRequest("http://localhost:3000/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Water", sourceLang: "en", targetLang: "ml" }),
    });
    const resMl = await POST(reqMl);
    expect(resMl.status).toBe(200);
    const dataMl = await resMl.json();
    expect(dataMl.translatedText).toBe("വെള്ളം");
    expect(dataMl.targetLang).toBe("ml");

    globalThis.fetch = originalFetch;
  });
});
