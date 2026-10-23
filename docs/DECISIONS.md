# Technical Decisions & Architectural Choices (ADR Log)

## ADR 01: Next.js 16 + React 19 + Tailwind CSS Setup
- **Context:** Project scaffolded using Next.js 16 (App Router) and Tailwind CSS v4.
- **Decision:** Use Google Fonts (`Bricolage_Grotesque`, `Hanken_Grotesk`, `Noto_Sans_Kannada`) via `next/font/google` for optimal web font loading and zero layout shifts.
- **Rationale:** Ensures authentic Kannada rendering across all platforms without tofu boxes, alongside modern typography.

## ADR 02: Lightweight i18n via Custom React Context & useSyncExternalStore
- **Context:** App requires instantaneous switching between English and Kannada (ಕನ್ನಡ) without page reload.
- **Decision:** Implemented `useLang` hook backed by `LangContext` and static JSON dictionaries (`en.json` and `kn.json`) utilizing `useSyncExternalStore` for SSR hydration safety.
- **Persistence:** Selected locale is persisted in `localStorage` under key `dari_lang_preference` wrapped safely in `try/catch` to handle browser sandbox/incognito mode constraints.

## ADR 03: Place-ID Constrained LLM Architecture (Zero Hallucinations)
- **Context:** Generic LLM travel planners hallucinate fake monuments, invalid coordinates, or impossible geographic itineraries.
- **Decision:** The AI model is strictly constrained to choose and sequence existing place IDs from `data/places.json`. It is forbidden from inventing names, coordinates, or prices.
- **Validation:** Zod schemas validate every place ID against a runtime `Set`. Any unknown ID triggers a rejection and single retry with feedback, followed by deterministic fallback if unresolved.

## ADR 04: Zero Runtime LLM Kannada Translation
- **Context:** Generating regional Indian languages at runtime using cloud LLMs often results in unnatural grammar, hallucinated terms, or broken Unicode.
- **Decision:** All Kannada text (place names, descriptions, tips, phrases, UI labels) is pre-curated in UTF-8 JSON files (`places.json`, `phrases.json`, `kn.json`). The LLM generates only English notes.
- **Rationale:** Guarantees 100% linguistically correct and culturally respectful Kannada text.

## ADR 05: Offline & AI-Independent Deterministic Fallback Engine
- **Context:** AI APIs (Groq, Gemini) frequently experience rate limits, quota limits, or network latency during live demonstrations.
- **Decision:** Created `lib/planner.ts` with greedy nearest-neighbour geographic clustering, pace constraints, and meal stop insertion that runs entirely in Node.js without any API keys.
- **Benefit:** The application always returns a valid, high-quality itinerary even with zero API keys or during complete cloud provider outages.

## ADR 06: Geometric Routing & Travel Time Engine
- **Context:** Straight-line distances (Haversine) drastically underestimate travel times in Karnataka due to winding Western Ghats roads and state highways.
- **Decision:** Implemented `estimateRoadDistanceKm` using an empirical 1.3 road winding factor, and `estimateTravelTimeMin` assuming an average speed of 40 km/h plus a 10-minute buffer, rounded to the nearest 5 minutes.
- **Transport Mode:** Automatically selects auto (< 15 km), cab (< 120 km), or bus (>= 120 km).

## ADR 07: Mathematical Cost Invariant
- **Context:** Travel budget estimates are often vague and confusing.
- **Decision:** Enforced a strict mathematical invariant: `stay + food + transport + entry === total`.
- **Logic:** Budget tier sets daily per-person rates for stay and food; transport uses distance-based vehicle tariffs; entry fees are summed from the visited places dataset.

## ADR 08: Leaflet Client-Side Dynamic Import (SSR: false)
- **Context:** Leaflet touches `window` and `document` globals during initialization, which crashes Next.js server-side rendering.
- **Decision:** Loaded `TripMap` using Next.js `dynamic(() => import("@/components/TripMap"), { ssr: false })` with an animated pulse placeholder.

## ADR 09: Browser Web Speech API for Native Kannada Audio
- **Context:** Providing spoken audio for Kannada phrases without incurring paid third-party text-to-speech API charges or adding high-latency network requests.
- **Decision:** Utilized browser `window.speechSynthesis` with `lang="kn-IN"`. Detected voice availability dynamically and gracefully hid the speaker button when the host device lacks a Kannada voice engine.

## ADR 10: LZ-String URL State Compression (Database-Free Sharing)
- **Context:** Users need to share generated itineraries with companions without requiring backend databases or user authentication.
- **Decision:** Encoded the entire itinerary JSON string into the URL query parameter `?d=...` using `lz-string` URI-safe compression.
- **Benefit:** Instant, zero-cost, permanent sharing requiring no database maintenance or billing.

## ADR 11: Mobile-First Bottom Navigation & Stop Bottom Sheet
- **Context:** Travelers actively use itineraries on mobile phones while navigating on the road.
- **Decision:** On mobile viewports (< 1024px), replaced the side-by-side desktop view with 3 bottom tabs: `Plan`, `Map`, and `Phrases`. Integrated an interactive bottom sheet on the map screen to display the selected stop and its audio phrases without leaving the map.
