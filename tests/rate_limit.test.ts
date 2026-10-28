import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp, resetRateLimits } from "@/lib/rate-limit";

describe("Shared sliding-window rate limiter", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests up to the limit and rejects the next one", () => {
    const options = { name: "unit", limit: 3, windowMs: 60_000 };
    const results = [1, 2, 3, 4].map(() => checkRateLimit("1.2.3.4", options));

    expect(results.slice(0, 3).every((r) => r.allowed)).toBe(true);
    expect(results[3].allowed).toBe(false);
    expect(results[3].retryAfterS).toBeGreaterThan(0);
  });

  it("keeps a separate window per bucket name", () => {
    const a = { name: "bucket-a", limit: 1, windowMs: 60_000 };
    const b = { name: "bucket-b", limit: 1, windowMs: 60_000 };

    expect(checkRateLimit("9.9.9.9", a).allowed).toBe(true);
    expect(checkRateLimit("9.9.9.9", a).allowed).toBe(false);
    // A different route's bucket is unaffected by the exhausted one
    expect(checkRateLimit("9.9.9.9", b).allowed).toBe(true);
  });

  it("keeps a separate window per client IP", () => {
    const options = { name: "per-ip", limit: 1, windowMs: 60_000 };
    expect(checkRateLimit("10.0.0.1", options).allowed).toBe(true);
    expect(checkRateLimit("10.0.0.1", options).allowed).toBe(false);
    expect(checkRateLimit("10.0.0.2", options).allowed).toBe(true);
  });

  it("frees the window again once requests age out", () => {
    const options = { name: "expiry", limit: 1, windowMs: 1_000 };
    const now = Date.now();
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValue(now);
    expect(checkRateLimit("5.5.5.5", options).allowed).toBe(true);
    expect(checkRateLimit("5.5.5.5", options).allowed).toBe(false);

    nowSpy.mockReturnValue(now + 1_500);
    expect(checkRateLimit("5.5.5.5", options).allowed).toBe(true);

    nowSpy.mockRestore();
  });

  it("reads the client IP from proxy headers, falling back to loopback", () => {
    const forwarded = new NextRequest("http://localhost:3000/api/plan", {
      headers: { "x-forwarded-for": "203.0.113.9, 70.41.3.18" },
    });
    expect(getClientIp(forwarded)).toBe("203.0.113.9");

    const realIp = new NextRequest("http://localhost:3000/api/plan", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    expect(getClientIp(realIp)).toBe("198.51.100.4");

    expect(getClientIp(new NextRequest("http://localhost:3000/api/plan"))).toBe("127.0.0.1");
  });
});

describe("Route handlers enforce their own rate limits", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rate limits GET /api/tts so it cannot be used as an open audio relay", async () => {
    // Stub the speech upstream: this test must never reach the network.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([0xff, 0xfb, 0x90, 0x00]), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      })
    );

    const { GET } = await import("@/app/api/tts/route");
    const call = () =>
      GET(
        new NextRequest("http://localhost:3000/api/tts?text=Namaskara", {
          headers: { "x-forwarded-for": "66.66.66.66" },
        })
      );

    let limited: Response | null = null;
    for (let i = 0; i < 61 && !limited; i++) {
      const res = await call();
      if (res.status === 429) limited = res;
    }

    expect(limited).not.toBeNull();
    expect(limited!.headers.get("Retry-After")).toBeTruthy();
  });

  it("rate limits POST /api/translate so it cannot drain upstream AI quota", async () => {
    const { POST } = await import("@/app/api/translate/route");
    const call = () =>
      POST(
        new NextRequest("http://localhost:3000/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "77.77.77.77",
          },
          // A known offline phrase keeps every call on the local dictionary path.
          body: JSON.stringify({ text: "thank you", sourceLang: "en", targetLang: "kn" }),
        })
      );

    let limited: Response | null = null;
    for (let i = 0; i < 21 && !limited; i++) {
      const res = await call();
      if (res.status === 429) limited = res;
    }

    expect(limited).not.toBeNull();
    expect(limited!.headers.get("Retry-After")).toBeTruthy();
  });

  it("rejects an oversized POST /api/translate body with 413", async () => {
    const { POST } = await import("@/app/api/translate/route");
    const res = await POST(
      new NextRequest("http://localhost:3000/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "90000",
          "x-forwarded-for": "88.88.88.88",
        },
        body: JSON.stringify({ text: "x".repeat(60000) }),
      })
    );
    expect(res.status).toBe(413);
  });

  it("rejects malformed JSON on POST /api/translate with 400, not 500", async () => {
    const { POST } = await import("@/app/api/translate/route");
    const res = await POST(
      new NextRequest("http://localhost:3000/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "99.99.99.99",
        },
        body: "{ not json",
      })
    );
    expect(res.status).toBe(400);
  });
});
