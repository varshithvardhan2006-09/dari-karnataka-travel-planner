import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

/**
 * Server-side audio proxy for authentic native Kannada speech.
 * Bypasses client-side browser Referer blocks and CORS restrictions,
 * delivering crystal-clear native Kannada MP3 audio across all devices.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");

    if (!text || text.trim().length === 0) {
      return new NextResponse("Missing text parameter", { status: 400 });
    }

    // Limit length to prevent abuse (Google TTS limit is ~200 chars per segment)
    const trimmed = text.trim().slice(0, 250);
    const encoded = encodeURIComponent(trimmed);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encoded}`;

    const ttsRes = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "audio/mpeg, audio/*;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!ttsRes.ok) {
      return new NextResponse(`TTS upstream error: ${ttsRes.status}`, {
        status: ttsRes.status,
      });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

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
