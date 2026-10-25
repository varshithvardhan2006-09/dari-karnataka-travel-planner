# Dari (ದಾರಿ) — AI Travel Planner for Karnataka

<p align="center">
  <img src="public/og-image.png" alt="Dari - AI Travel Planner for Karnataka" width="100%" style="border-radius: 12px; max-width: 800px;" />
</p>

<p align="center">
  <strong>An intelligent, bilingual travel planner combining constrained AI generation, geographic route clustering, itemized budget calculation, and authentic Kannada voice synthesis.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react" alt="React" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Tests-67%20Passed-brightgreen?style=for-the-badge&logo=vitest" alt="Vitest" /></a>
  <a href="https://dari-karnataka-travel-planner.vercel.app"><img src="https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge&logo=vercel" alt="Vercel" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <a href="https://dari-karnataka-travel-planner.vercel.app"><strong>Explore Live Deployment ↗</strong></a> •
  <a href="https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner"><strong>GitHub Repository</strong></a> •
  <a href="https://dari-karnataka-travel-planner.vercel.app/credits"><strong>Photo Credits & Licensing</strong></a>
</p>

---

## 🧭 Overview

**Dari (ದಾರಿ — *The Way / The Path*)** was engineered for the **Kannada Digital Innovation Hackathon 2026** (*Problem Statement 06*).

Most generic AI planners (such as raw ChatGPT or Gemini prompts) suffer from severe practical deficiencies: they hallucinate non-existent monuments, combine sights in different districts on the same morning, invent arbitrary driving times, emit broken machine-translated Kannada, and fail completely when rate-limited.

**Dari solves this at the architectural layer** with a constrained candidate whitelist, deterministic geographic clustering, true multilingual separation, and a zero-downtime offline fallback engine that runs reliably even without API keys.

---

## 🌟 Key Highlights & Engineering Features

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE ARCHITECTURE                                    │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ 🛡️ Zero Hallucination│ 🌐 Native Kannada    │ 📍 True Geocoding │ ⚡ Zero-Downtime     │
│ Candidate Whitelist  │ Authentic Audio & TTS│ Realistic Driving │ 100% Deterministic   │
│ Enforced by Zod      │ Zero Run-time LLM Kn │ Nearest-Neighbour │ Offline Fallback     │
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
```

### 1. Constrained Place-ID Architecture (Zero Hallucination)
The AI model is **strictly prohibited from generating free-text destination names, coordinates, or fees**. The prompt receives only scored candidate IDs from [`data/places.json`](data/places.json) and must return valid IDs. Any unknown ID or candidate not in the whitelist is automatically rejected and retried with actionable diagnostic feedback.

### 2. High-Fidelity Kannada Audio & "Show to Local" Driver Cards
- **Audio Stream (`/api/tts`):** Native Kannada pronunciation streamed with `Accept-Ranges: bytes` support across desktop and mobile browsers.
- **Phonetic Fallback:** On operating systems lacking native `kn-IN` voice packs, the engine automatically speaks phonetically transliterated English so drivers and travelers can clearly hear the words out loud.
- **Driver Communication Cards:** Full-screen, high-contrast modal displaying *"ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಇಲ್ಲಿಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ"* (*Please take me here*) with destination Kannada script, English title, district, and one-tap voice pronunciation.

### 3. Comprehensive Deterministic Geographic Engine
- **Accurate Travel Times:** Uses Haversine distance with a 1.3 road curvature factor, 40 km/h baseline speed, and a 10-minute traffic buffer rounded to 5-minute windows.
- **Round-Trip Mileage:** Accounts for initial departure hub transfers, inter-stop road legs, inter-day hotel transfers, and the return journey back to the origin city.
- **Lunch Stop Routing:** Automatically inserts meal stops between 12:30 and 14:00 at verified local eateries.
- **Strict Scheduling Windows:** Enforces that morning visits commence between 08:30 and 10:00, and daily itineraries conclude before the 19:30 evening cutoff.

### 4. Transparent Itemized Budget Engine
Calculates honest, mathematical costs:
$$\text{Total} = \text{Lodging} + \text{Food} + \text{Transport} + \text{Entry Fees}$$
- **Lodging:** ₹0 for single-day trips; tier-based room scaling for solo, couples, families, and custom party sizes (1–10 people).
- **Transport:** Customized per transport preference (Cab at ₹14–18/km, Own Car at ₹8.5/km, or Public Bus/Train transit).
- **Entry Fees:** Exact sum of verified ticket prices scaled per person.

### 5. URL Sharing & Calendar Integration (Zero Database Dependency)
- **LZ-String Compression:** Serializes complete itinerary objects into URL query parameter `?d=...`, enabling instant trip sharing with zero server storage overhead.
- **RFC 5545 iCalendar (`.ics`):** One-click download of `.ics` calendar files with precise local timezone timestamps, calendar notifications, and destination notes.
- **Local Storage ("My Trips"):** Automatically caches up to 10 generated itineraries on-device for instant offline recall.

---

## 🏛️ System Architecture & Request Flow

```
[ User Input: Interests, Days (1-7), Start City, Budget, Pace, Group Size, Food & Transport ]
                                      │
                                      ▼
[ 1. Edge Gateway & Validation: Next.js API Route (/api/plan) ]
    ├── 32KB Request Body Size Guard (HTTP 413)
    ├── Sliding-Window In-Memory Rate Limiter (12 req/min/IP with Retry-After header)
    └── Zod Runtime Schema Validation (PlanRequestSchema)
                                      │
                                      ▼
[ 2. Candidate Selection & Scoring Engine (src/lib/candidates.ts) ]
    ├── Multi-factor candidate scoring (interest match weight, month fit, budget fit)
    ├── Cohort separation: matching places prioritized; non-matching never displace matches
    └── Dynamic candidate whitelist generated for LLM prompt
                                      │
                                      ▼
[ 3. AI Cascade with 24s Shared Timeout Budget (src/lib/ai.ts) ]
    ├── Tier 1: Groq API (openai/gpt-oss-120b in structured JSON mode)
    ├── Tier 2: Google Gemini API (gemini-flash-latest)
    └── Whitelist & Prompt Rule Validation (1 retry with diagnostic feedback)
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼ (Success)                               ▼ (Timeout / Rate Limit / No Keys)
[ 4. AI Itinerary Payload ]             [ 4. Deterministic Planner Fallback (src/lib/planner.ts) ]
                                            ├── Greedy nearest-neighbour geographic clustering
                                            ├── Advance dayClock by travel time before arrival
                                            └── Emergency customized sample fallback (samples.ts)
                                      │
                                      ▼
[ 5. Plan Enrichment Engine (src/lib/enrich.ts) ]
    ├── Departure hub leg + inter-day transfers + return journey leg
    ├── Accurate arrival & departure schedules rounded to 5-minute increments
    ├── Itemized cost computation (Stay + Food + Transport + Entry === Total)
    └── Attach verified Kannada names, descriptions, and audio phrase sets
                                      │
                                      ▼
[ 6. Client View & Interactive Experience (src/app/trip/page.tsx) ]
    ├── Leaflet Map with custom numbered pins and polyline routes
    ├── Stop swap, lock time, and remove actions
    ├── Audio phrase playback & full-screen "Show to Local" driver screen
    └── Shareable LZ-compressed URL + RFC 5545 .ics Calendar Export
```

---

## 🗺️ Curated Karnataka Dataset (39 Destinations)

Our dataset spans all 6 geographical zones of Karnataka without biasing solely toward standard tourist corridors:

| Region | Featured Highlights |
|---|---|
| **Bengaluru Hub** | Lalbagh Botanical Garden, Bangalore Palace, Tipu Sultan's Summer Palace, Vidyarthi Bhavan, VV Puram Food Street |
| **Southern Heritage & Mysuru** | Mysore Palace, Chamundi Hill & Monolithic Nandi, Mysore Zoo, Devaraja Market, Srirangapatna Ranganathaswamy Temple, Brindavan Gardens, Somanathapura Keshava Temple |
| **Hoysala Trail** | Belur Chennakeshava Temple, Halebidu Hoysaleswara Temple, Shravanabelagola Gommateshwara |
| **Hampi & Central Heritage** | Virupaksha Temple, Vijaya Vittala Temple & Stone Chariot, Lotus Mahal & Elephant Stables, Matanga Hill Sunrise |
| **Badami & Northern Karnataka** | Badami Cave Temples, Pattadakal UNESCO Monument Complex, Aihole Durga Temple, Gol Gumbaz (Vijayapura), Bidar Fort, Mahmud Gawan Madrasa, Kalaburagi Fort |
| **Karavali Coast & Western Ghats** | Mangaluru Panambur Beach, Udupi Sri Krishna Matha, Malpe Beach & St. Mary's Island, Murudeshwar Temple & Shiva Statue, Gokarna Om Beach, Jog Falls, Mullayanagiri Peak, Baba Budangiri, Abbey Falls, Dubare Elephant Camp, Dandeli River Rafting |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | **Next.js 16.4.2** (App Router, Turbopack) | Server/client component architecture and optimized static generation |
| **Runtime** | **React 19.3.0** + **Node.js 20+** | Modern React features, concurrent transitions, and hooks |
| **Type Safety** | **TypeScript 5.0** (Strict Mode) | End-to-end typing from schema definitions to UI props |
| **Validation** | **Zod 4.6** | Strict runtime schema parsing for API requests, datasets, and AI outputs |
| **Styling** | **Tailwind CSS v4** | Modern CSS-first utility classes with official Karnataka heritage palette |
| **Mapping** | **Leaflet 1.9** + **React Leaflet 5.0** | Interactive tile maps, custom SVG pin markers, and dynamic route polylines |
| **AI Providers** | **Groq** (`openai/gpt-oss-120b`) & **Google Gemini** | Low-latency inference with cascading fallback |
| **Audio & Speech** | **Google Neural TTS Proxy** + **Web Speech API** | Authentic native Kannada speech streaming with phonetic transliteration |
| **URL Compression**| **LZ-String 1.5** | High-ratio compression for stateless itinerary sharing |
| **Calendar** | **iCalendar RFC 5545** | Standard calendar event file generation client-side |
| **Testing** | **Vitest 5.0** (12 suites, 67 tests) | Fast unit, schema, geographic, and API integration testing |
| **CI / CD** | **GitHub Actions** + **Vercel** | Automated linting, test suite execution, and production deployment |

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js:** v18.18 or higher (tested on Node 20 and Node 24)
- **Package Manager:** `npm` v9 or higher

### 2. Clone & Install
```bash
git clone https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner.git
cd dari-karnataka-travel-planner
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy the template to create your local environment file:
```bash
cp .env.example .env.local
```

Configure your API keys (optional — if keys are omitted, Dari functions automatically using its built-in deterministic planning engine):
```env
# Primary AI Provider (Groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Secondary Fallback AI Provider (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Base App URL
NEXT_PUBLIC_APP_URL=https://dari-karnataka-travel-planner.vercel.app
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Running Tests & Quality Checks
```bash
# Run unit & integration test suite (67 tests)
npm run test

# Run ESLint validation
npm run lint

# Build for production
npm run build
```

---

## 🧪 Test Suite & Quality Assurance

Dari maintains strict test coverage across 12 automated test suites:

```text
 RUN  v5.0.5 C:/Projects/dari-karnataka

 ✓ tests/candidates.test.ts (7 tests) — Distance scoring, cohort segregation, unmapped city handling
 ✓ tests/cost.test.ts       (7 tests) — Math invariants, party size scaling, transport mode rates
 ✓ tests/planner.test.ts   (12 tests) — Deterministic clustering, travel buffers, prompt schedule rules
 ✓ tests/validate.test.ts   (9 tests) — Zod dataset schemas, coordinate bounds, integer constraints
 ✓ tests/kannada.test.ts    (4 tests) — Kannada text completeness, zero AI Kannada generation proof
 ✓ tests/errors.test.ts    (12 tests) — 32KB payload guard, rate limits, 429 headers, streaming TTS
 ✓ tests/share.test.ts      (3 tests) — LZ-String compression/decompression, corruption resilience
 ✓ tests/samples.test.ts    (2 tests) — Sample schema conformity & dynamic emergency customization
 ✓ tests/smoke.test.ts      (3 tests) — i18n leaf key parity between English and Kannada
 ✓ tests/u2_form.test.ts    (2 tests) — Form validation & query parameter serialization
 ✓ tests/u4_helpers.test.ts (4 tests) — Time rounding, travel time buffers, pin number mapping
 ✓ tests/u10_photos.test.ts (2 tests) — Wikimedia attribution metadata & licensing compliance

 Test Files  12 passed (12)
      Tests  67 passed (67)
```

---

## 📡 API Reference

### `POST /api/plan`
Generates a complete multi-day itinerary.

- **Request Headers:** `Content-Type: application/json`
- **Payload Limits:** Maximum 32KB body size (HTTP 413 on exceed).
- **Rate Limit:** 12 requests per minute per IP (HTTP 429 with `Retry-After` header).

```json
{
  "interests": ["heritage", "nature"],
  "days": 3,
  "start_city": "Bengaluru",
  "budget": "mid",
  "pace": "balanced",
  "travellers": "couple",
  "month": 11,
  "lang": "en",
  "people_count": 2,
  "food_preference": "veg",
  "transport_mode": "cab"
}
```

### `GET /api/plan`
Healthcheck and dataset telemetry endpoint.

- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "dari-karnataka-planner",
  "version": "0.1.0",
  "places_count": 39,
  "timestamp": 1740000000000
}
```

### `GET /api/tts?text=...`
Streams authentic native Kannada speech audio.

- **Response:** `200 OK`
- **Headers:** `Content-Type: audio/mpeg`, `Accept-Ranges: bytes`, `Cache-Control: public, max-age=604800, immutable`.

---

## 🔒 Security & Data Integrity

- **Zero Secrets in Git History:** All sensitive keys reside strictly in `.env.local` (git-ignored) and are never committed.
- **Payload Size Guards:** Strict 32KB request boundary protects serverless lambdas against memory exhaustion attacks.
- **Fail-Safe Privacy:** No personal identifiable information (PII) is stored on servers; all saved trips persist exclusively in browser local storage.
- **Open Photo Licensing:** All landmark images are curated from Wikimedia Commons under free licenses (CC0, CC BY, CC BY-SA, Public Domain) and attributed transparently at [`/credits`](https://dari-karnataka-travel-planner.vercel.app/credits).

---

## 👨‍💻 Author & Project Credits

- **Developer:** [Varshith Vardhan](https://github.com/varshithvardhan2006-09)
- **Event:** Kannada Digital Innovation Hackathon 2026
- **Problem Statement:** 06 — AI-Powered Karnataka Travel Planner
- **License:** [MIT License](LICENSE) — Open source and built with pride for Karnataka and the Kannada language.
