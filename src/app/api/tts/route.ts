import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 15;

const ALLOWED_LANGUAGES = new Set(["kn", "en", "hi", "te", "ta", "ml"]);

const MAX_TEXT_LENGTH = 250;
const UPSTREAM_TIMEOUT_MS = 6000;

const RATE_LIMIT = {
  name: "tts",
  limit: 60,
  windowMs: 60 * 1000,
};

const UPSTREAM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "audio/mpeg, audio/*;q=0.9",
};

/**
 * Fetches speech audio from an upstream endpoint, returning null on any failure.
 */
async function fetchUpstreamAudio(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, {
      headers: UPSTREAM_HEADERS,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return buffer.byteLength > 0 ? buffer : null;
  } catch {
    return null;
  }
}

/**
 * Server-side audio proxy for authentic native speech.
 * Bypasses client-side browser Referer blocks and CORS restrictions,
 * delivering crystal-clear native audio across all devices.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const requestedLang = (searchParams.get("lang") || "kn").toLowerCase().trim();
    const safeLang = ALLOWED_LANGUAGES.has(requestedLang) ? requestedLang : "kn";

    if (!text || text.trim().length === 0) {
      return new NextResponse("Missing text parameter", { status: 400 });
    }

    // Per-IP rate limiting: this route proxies an upstream service, so it must
    // not be usable as an open relay.
    const rateLimit = checkRateLimit(getClientIp(req), RATE_LIMIT);
    if (!rateLimit.allowed) {
      return new NextResponse("Too many speech requests, please slow down", {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterS) },
      });
    }

    // Limit length to prevent abuse (Google TTS limit is ~200 chars per segment)
    const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
    const encoded = encodeURIComponent(trimmed);

    const audioBuffer =
      // Upstream attempt 1: Google tw-ob audio endpoint
      (await fetchUpstreamAudio(
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${safeLang}&client=tw-ob&q=${encoded}`
      )) ??
      // Upstream attempt 2: Google gtx audio endpoint fallback
      (await fetchUpstreamAudio(
        `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${safeLang}&q=${encoded}`
      ));

    if (!audioBuffer) {
      return new NextResponse("TTS audio stream temporarily unavailable", {
        status: 502,
      });
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "TTS error";
    return new NextResponse(msg, { status: 500 });
  }
}
