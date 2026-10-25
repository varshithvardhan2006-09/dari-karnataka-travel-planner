import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

const ALLOWED_LANGUAGES = new Set(["kn", "en", "hi", "te", "ta", "ml"]);

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

    // Limit length to prevent abuse (Google TTS limit is ~200 chars per segment)
    const trimmed = text.trim().slice(0, 250);
    const encoded = encodeURIComponent(trimmed);

    let audioBuffer: ArrayBuffer | null = null;

    // Upstream attempt 1: Google tw-ob audio endpoint
    try {
      const googleTtsUrl1 = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${safeLang}&client=tw-ob&q=${encoded}`;
      const ttsRes1 = await fetch(googleTtsUrl1, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "audio/mpeg, audio/*;q=0.9",
        },
        signal: AbortSignal.timeout(6000),
      });
      if (ttsRes1.ok) {
        audioBuffer = await ttsRes1.arrayBuffer();
      }
    } catch {
      // Fall through to secondary upstream
    }

    // Upstream attempt 2: Google gtx audio endpoint fallback
    if (!audioBuffer) {
      try {
        const googleTtsUrl2 = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${safeLang}&q=${encoded}`;
        const ttsRes2 = await fetch(googleTtsUrl2, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "audio/mpeg, audio/*;q=0.9",
          },
          signal: AbortSignal.timeout(6000),
        });
        if (ttsRes2.ok) {
          audioBuffer = await ttsRes2.arrayBuffer();
        }
      } catch {
        // Fallback exhausted
      }
    }

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
