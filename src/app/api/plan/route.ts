import { NextRequest, NextResponse } from "next/server";
import { PlanRequestSchema, Place } from "@/lib/schema";
import { generateItinerary } from "@/lib/ai";
import { buildDeterministicPlan } from "@/lib/planner";
import { getCustomizedSamplePlan } from "@/lib/samples";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readBodyWithLimit } from "@/lib/request-body";
import { countMatchingPlaces } from "@/lib/candidates";
import placesData from "../../../../data/places.json";

export const maxDuration = 30;

const allPlaces = placesData as Place[];

const MAX_BODY_BYTES = 32 * 1024;
const MIN_MATCHES_FOR_LONG_TRIP = 4;

const RATE_LIMIT = {
  name: "plan",
  limit: 12,
  windowMs: 60 * 1000,
};

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "dari-karnataka-planner",
      version: "0.1.0",
      places_count: allPlaces.length,
      timestamp: Date.now(),
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const simulateHeader = req.headers.get("x-simulate") || searchParams.get("simulate");

    // Simulation hooks for automated test verification. Never enabled in production.
    const isSimulateAllowed = process.env.NODE_ENV !== "production";
    if (isSimulateAllowed && simulateHeader) {
      if (simulateHeader === "429") {
        return NextResponse.json(
          { error: "busy", retry_after_s: 30 },
          { status: 429, headers: { "Retry-After": "30" } }
        );
      }

      if (simulateHeader === "few_matches" || simulateHeader === "zero_candidates") {
        return NextResponse.json(
          { error: "few_matches", match_count: simulateHeader === "zero_candidates" ? 0 : 3 },
          { status: 422 }
        );
      }
    }

    // Fast reject when the client declares an oversized body.
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "invalid_input", details: "Payload exceeds 32KB limit" },
        { status: 413 }
      );
    }

    // 1. Per-IP Rate Limiting
    const rateLimit = checkRateLimit(getClientIp(req), RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "busy", retry_after_s: rateLimit.retryAfterS },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterS) } }
      );
    }

    // 2. Validate JSON body with Zod
    // Measure the body itself too: Content-Length can be absent (chunked) or wrong.
    const rawBody = await readBodyWithLimit(req, MAX_BODY_BYTES);
    if (rawBody === null) {
      return NextResponse.json(
        { error: "invalid_input", details: "Payload exceeds 32KB limit" },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "invalid_input", details: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    const parseResult = PlanRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "invalid_input",
          details: parseResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const planRequest = parseResult.data;

    // A trip of 3+ days needs at least a few places matching the chosen interests
    const matchCount = countMatchingPlaces(planRequest.interests, allPlaces);
    if (planRequest.days > 2 && matchCount < MIN_MATCHES_FOR_LONG_TRIP) {
      return NextResponse.json(
        {
          error: "few_matches",
          match_count: matchCount,
          min_needed: MIN_MATCHES_FOR_LONG_TRIP,
        },
        { status: 422 }
      );
    }

    // 3. Generate Plan via Cascading Pipeline
    try {
      const plan = await generateItinerary(planRequest);
      return NextResponse.json({ plan }, { status: 200 });
    } catch (pipelineErr) {
      console.warn("Pipeline warning, executing fallback planner:", pipelineErr);
      try {
        const fallbackPlan = buildDeterministicPlan(planRequest);
        return NextResponse.json({ plan: fallbackPlan }, { status: 200 });
      } catch (fallbackErr) {
        console.warn("Deterministic planner exception, serving curated customized sample:", fallbackErr);
        const { plan: samplePlan } = getCustomizedSamplePlan(planRequest);
        return NextResponse.json({ plan: samplePlan }, { status: 200 });
      }
    }
  } catch (unexpectedErr) {
    console.error("Critical server error in POST /api/plan:", unexpectedErr);
    return NextResponse.json(
      {
        error: "server_error",
        message: "An unexpected server error occurred while processing the itinerary request. Please retry.",
      },
      { status: 500 }
    );
  }
}
