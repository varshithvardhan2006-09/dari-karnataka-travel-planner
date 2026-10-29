# Dari (ದಾರಿ) — AI Travel Planner for Karnataka

<p align="center">
  <strong>An intelligent, bilingual travel planner combining constrained AI generation, geographic route clustering, itemized budget calculation, and authentic Kannada voice synthesis.</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react" alt="React" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Tests-128%20Passed-brightgreen?style=for-the-badge&logo=vitest" alt="Vitest" /></a>
  <a href="https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/varshithvardhan2006-09/dari-karnataka-travel-planner/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI" alt="Dari CI Status" /></a>
  <a href="https://dari-karnataka-travel-planner.vercel.app"><img src="https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge&logo=vercel" alt="Vercel" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <a href="https://dari-karnataka-travel-planner.vercel.app"><strong>Explore Live Deployment ↗</strong></a> •
  <a href="https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner"><strong>GitHub Repository</strong></a> •
  <a href="docs/Dari-Presentation.pdf"><strong>Hackathon Presentation</strong></a> •
  <a href="https://dari-karnataka-travel-planner.vercel.app/credits"><strong>Photo Credits & Licensing</strong></a>
</p>

---

## 🧭 Overview

**Dari (ದಾರಿ — *The Way / The Path*)** is an intelligent, culture-first AI travel planner built with pride for Karnataka and the Kannada language.

Most generic AI planners (such as raw ChatGPT or Gemini prompts) suffer from severe practical deficiencies: they hallucinate non-existent monuments, combine sights in different districts on the same morning, invent arbitrary driving times, emit broken machine-translated Kannada, and fail completely when rate-limited.

**Dari solves this at the architectural layer** with a constrained candidate whitelist, deterministic geographic clustering, true multilingual separation, and a zero-downtime offline fallback engine that runs reliably even without API keys.

---

## 📑 Table of Contents

- [🧭 Overview](#-overview)
- [📊 Hackathon Presentation](#-hackathon-presentation)
- [📸 Application Preview & Interface](#-application-preview--interface)
- [🌟 Key Highlights & Engineering Features](#-key-highlights--engineering-features)
  - [1. Constrained Place-ID Architecture (Zero Hallucination)](#1-constrained-place-id-architecture-zero-hallucination)
  - [2. High-Fidelity Kannada Audio & "Show to Local" Driver Cards](#2-high-fidelity-kannada-audio--show-to-local-driver-cards)
  - [3. Comprehensive Deterministic Geographic Engine](#3-comprehensive-deterministic-geographic-engine)
  - [4. Transparent Itemized Budget Engine](#4-transparent-itemized-budget-engine)
  - [5. URL Sharing & Calendar Integration (Zero Database Dependency)](#5-url-sharing--calendar-integration-zero-database-dependency)
- [🏛️ System Architecture & Request Flow](#️-system-architecture--request-flow)
- [🗺️ Curated Karnataka Dataset (39 Destinations)](#️-curated-karnataka-dataset-39-destinations)
  - [🏛️ Primary Data Sources & Provenance](#️-primary-data-sources--provenance)
- [🛠️ Technology Stack](#️-technology-stack)
- [⚡ Quick Start & Local Setup](#-quick-start--local-setup)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Clone & Install](#2-clone--install)
  - [3. Environment Variables](#3-environment-variables)
  - [4. Development Server](#4-development-server)
  - [5. Running Tests & Quality Checks](#5-running-tests--quality-checks)
- [🧪 Test Suite & Quality Assurance](#-test-suite--quality-assurance)
- [📡 API Reference](#-api-reference)
  - [`POST /api/plan`](#post-apiplan)
  - [`GET /api/plan`](#get-apiplan)
  - [`POST /api/translate`](#post-apitranslate)
  - [`GET /api/tts`](#get-apitts)
- [🔒 Security & Data Integrity](#-security--data-integrity)
- [🚀 Roadmap & Future Enhancements](#-roadmap--future-enhancements)
- [👨‍💻 Author & Project Credits](#-author--project-credits)

---

## 📊 Hackathon Presentation

Dari was submitted to the **Kannada Digital Innovation Hackathon 2026** in the **Travel & Tourism** track.

| Format | File |
|---|---|
| PDF (opens in the browser) | [`docs/Dari-Presentation.pdf`](docs/Dari-Presentation.pdf) |

The eight slides follow the submission guidelines: Participant Info · Problem Statement · Existing System · How the Solution Is Different · Approach · Tech Stack · Architecture Diagram · Conclusion (including the business model and future scope).

---

## 📸 Application Preview & Interface

| 1. Landing & Destination Discovery | 2. Planner Form & Preference Brief |
|:---:|:---:|
| ![Landing Screen](assets/screenshots/01-landing.png) | ![Planner Form](assets/screenshots/02-planner-form.png) |
| *Bento SVG scene illustrations, search bar, and Karnataka region explorer* | *8 live interest categories, party size, transport mode, and sticky brief* |

| 3. Cascading AI Progress | 4. Interactive Itinerary & Route Map |
|:---:|:---:|
| ![Generating State](assets/screenshots/03-generating.png) | ![Itinerary and Map](assets/screenshots/04-itinerary-map.png) |
| *5-stage real-time progress indicator with candidate previews* | *Multi-day schedule, Leaflet map with custom numbered pins, and donut cost chart* |

| 5. Kannada Mode & Stop Details | 6. Mobile Experience (360px) |
|:---:|:---:|
| ![Kannada Mode](assets/screenshots/05-kannada-mode.png) | ![Mobile View](assets/screenshots/07-mobile.png) |
| *100% pre-curated Kannada UI, stop drawer facts, and "Show to Local" driver screen* | *Mobile-optimized view with bottom navigation (Plan, Map, Phrases, Saved)* |

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
- **Audio Stream (`/api/tts`):** Native pronunciation streamed with `Accept-Ranges: bytes` support across desktop and mobile browsers, supporting Kannada, Hindi, Telugu, Tamil, Malayalam, and English.
- **Dynamic Multi-Language AI Translator (`/api/translate`):** Instant conversational translation tailored for local interactions, powered by Groq and Gemini with an offline emergency travel dictionary.
- **Phonetic Fallback:** On operating systems lacking native `kn-IN` voice packs, the engine automatically speaks phonetically transliterated English so drivers and travelers can clearly hear the words out loud.
- **Driver Communication Cards:** Full-screen, high-contrast modal displaying *"ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಇಲ್ಲಿಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ"* (*Please take me here*) with destination Kannada script, English title, district, and one-tap voice pronunciation.
- **Verified Google Maps Integration:** Direct coordinate-based deep links (`query=lat,lng`) and turn-by-turn navigation links with contextual search fallbacks across all 39 destinations.

### 3. Comprehensive Deterministic Geographic Engine
- **Accurate Travel Times:** Uses Haversine distance with a 1.3 road curvature factor, 40 km/h baseline speed, and a 10-minute traffic buffer rounded to 5-minute windows.
- **Round-Trip Mileage:** Accounts for initial departure hub transfers, inter-stop road legs, inter-day hotel transfers, and the return journey back to the origin city.
- **Lunch Stop Routing:** Automatically inserts meal stops between 12:30 and 14:00 at verified local eateries.
- **Strict Scheduling Windows:** Enforces that morning visits commence between 08:30 and 10:00, and daily itineraries conclude before the 19:30 evening cutoff.

### 4. Transparent Itemized Budget Engine
Calculates honest, mathematical costs:
$$\text{Total} = \text{Lodging} + \text{Food} + \text{Transport} + \text{Entry Fees}$$
- **Lodging:** ₹0 for single-day trips; tier-based room scaling for solo, couples, families, and custom party sizes (1–10 people).
- **Transport:** Customized per transport preference (Cab at ₹16–20/km, Own Car at ₹13/km + tolls, or Public Bus/Train transit at ₹4/km per person).
- **Entry Fees:** Exact sum of verified ticket prices scaled per person.

### 5. URL Sharing & Calendar Integration (Zero Database Dependency)
- **LZ-String Compression:** Serializes complete itinerary objects into URL query parameter `?d=...`, enabling instant trip sharing with zero server storage overhead.
- **RFC 5545 iCalendar (`.ics`):** One-click download of `.ics` calendar files with precise local timezone timestamps, calendar notifications, and destination notes.
- **Local Storage ("My Trips"):** Automatically caches up to 10 generated itineraries on-device for instant offline recall.

---

## 🏛️ System Architecture & Request Flow

<p align="center">
  <img src="assets/screenshots/00-architecture.png" alt="System Architecture Diagram" width="100%" style="border-radius: 12px; max-width: 800px;" />
</p>

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
    ├── Tier 1: Groq API (llama-3.3-70b-versatile in structured JSON mode)
    ├── Tier 2: Google Gemini API (gemini-1.5-flash)
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

### 🏛️ Primary Data Sources & Provenance

To guarantee 99%+ factual accuracy and eliminate AI hallucinations, all data points in Dari are anchored to verified public and government authorities:

| Domain | Primary Authority Source | What It Powers |
|---|---|---|
| **Heritage & Monuments** | [Archaeological Survey of India (ASI)](https://asi.nic.in) & [UNESCO](https://whc.unesco.org) | Exact entry tariffs, opening hours, and historical notes for Hampi, Pattadakal, Badami, Belur, and Halebidu |
| **Karnataka Tourism** | [Department of Tourism, Govt of Karnataka](https://karnatakatourism.org) & [KSTDC](https://kstdc.co) | Regional travel circuits, verified highlights, and seasonal travel windows |
| **Palaces & Temples** | [Mysore Palace Board](https://mysorepalace.karnataka.gov.in) & Official Temple Trusts | Royal palace entry ticketing and sacred sanctum darshan timings |
| **GPS & Route Routing** | [OpenStreetMap (OSM)](https://www.openstreetmap.org) & [Google Maps](https://maps.google.com) | Exact coordinates, road distance calculations, and turn-by-turn navigation deep links |
| **Weather & Monsoons** | [India Meteorological Department (IMD)](https://mausam.imd.gov.in) | Seasonal month recommendations (monsoon windows in the Ghats vs dry winter in the plains) |
| **Language & Audio** | Native Kannada Curators & [Google Speech](https://cloud.google.com/text-to-speech) | 100% human-verified Kannada phrases, phonetic transliterations, and native voice audio |

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
| **AI Providers** | **Groq** (`llama-3.3-70b-versatile`) & **Google Gemini** (`gemini-1.5-flash`) | Low-latency inference with cascading fallback |
| **Audio & Speech** | **Google Neural TTS Proxy** + **Web Speech API** | Authentic native Kannada speech streaming with phonetic transliteration |
| **URL Compression**| **LZ-String 1.5** | High-ratio compression for stateless itinerary sharing |
| **Calendar** | **iCalendar RFC 5545** | Standard calendar event file generation client-side |
| **Testing** | **Vitest 5.0** (18 suites, 128 tests) | Fast unit, schema, geographic, and API integration testing |
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
GROQ_MODEL=llama-3.3-70b-versatile

# Secondary Fallback AI Provider (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Base App URL
NEXT_PUBLIC_APP_URL=https://dari-karnataka-travel-planner.vercel.app
```

Both model names are overridable; the values above are the defaults the code
falls back to when the variable is unset.

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Running Tests & Quality Checks
```bash
# Run unit & integration test suite (128 tests)
npm run test

# Run ESLint validation
npm run lint

# Build for production
npm run build

# Regenerate the curated sample itineraries in data/samples/
npm run generate:samples
```

The test suite is read-only: it never writes to the repository. The four curated
samples in `data/samples/` are produced by `npm run generate:samples`, and the
suite checks the committed files still match what the planner produces. If a
planner, cost or geo change alters them, the samples test fails and names the
command to run.

---

## 🧪 Test Suite & Quality Assurance

Dari maintains comprehensive automated test coverage across **18 test suites (128 tests)** verifying geographic route clustering, schedule constraints, itemized cost invariants, multi-language speech, offline translation fallbacks, per-route rate limiting, shared-link payload validation, and drift between the planner and the committed sample itineraries. The suite is fully offline: every external provider is stubbed, so no test depends on network access. Run it locally:

```bash
npm test
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

### `POST /api/translate`
Instant conversational travel translation across South Indian languages.

- **Supported Languages:** `kn` (Kannada), `hi` (Hindi), `te` (Telugu), `ta` (Tamil), `ml` (Malayalam), `en` (English).
- **Payload Limits:** Maximum 8KB body (HTTP 413) and 500 characters of text (HTTP 400).
- **Rate Limit:** 20 requests per minute per IP (HTTP 429 with `Retry-After`).
- **Errors:** `400` malformed JSON, unsupported language pair, or missing text · `503` when every provider and the offline dictionary are exhausted.
- **Request Body:**
```json
{
  "text": "Where is the bus stand?",
  "sourceLang": "en",
  "targetLang": "kn"
}
```
- **Response (200 OK):**
```json
{
  "translatedText": "ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?",
  "transliteration": "Bus nildana ellide?",
  "sourceLang": "en",
  "targetLang": "kn",
  "provider": "ai-groq"
}
```

### `GET /api/tts?text=...&lang=kn`
Streams authentic native speech audio for Kannada (`kn`), Hindi (`hi`), Telugu (`te`), Tamil (`ta`), Malayalam (`ml`), or English (`en`).

- **Response:** `200 OK`
- **Headers:** `Content-Type: audio/mpeg`, `Accept-Ranges: bytes`, `Cache-Control: public, max-age=604800, immutable`.
- **Rate Limit:** 60 requests per minute per IP (HTTP 429 with `Retry-After`).
- **Errors:** `400` missing or empty text · `502` when every upstream speech endpoint is unreachable.

---

## 🔒 Security & Data Integrity

- **Zero Secrets in Git History:** All sensitive keys reside strictly in `.env.local` (git-ignored) and are never committed.
- **Payload Size Guards:** Strict 32KB request boundary on `/api/plan` and 8KB on `/api/translate` protect serverless lambdas against memory exhaustion attacks.
- **Rate Limiting on Every Route:** All three API routes enforce a per-IP sliding window (`/api/plan` 12/min, `/api/translate` 20/min, `/api/tts` 60/min, each returning HTTP 429 with `Retry-After`), so the speech proxy cannot be used as an open relay and the translator cannot drain upstream AI quota.
- **Untrusted Shared Links:** A `?d=` itinerary payload is strictly validated against `PlanSchema` before anything is rendered, and every value interpolated into a map popup is HTML-escaped.
- **Fail-Safe Privacy:** No personal identifiable information (PII) is stored on servers; all saved trips persist exclusively in browser local storage.
- **Open Photo Licensing:** Destination previews currently ship as original inline SVG scene illustrations (Palace, Hampi, Coast) with zero external copyright dependencies. [`scripts/fetch-images.mjs`](scripts/fetch-images.mjs) can populate the dataset with freely licensed Wikimedia Commons photography (CC0, CC BY, CC BY-SA, Public Domain); any photo added that way is attributed automatically at [`/credits`](https://dari-karnataka-travel-planner.vercel.app/credits).

---

## 🚀 Roadmap & Future Enhancements

The following engineering enhancements are planned for upcoming releases:

| Area | Feature | Description & Technical Approach |
|---|---|---|
| 🚌 **Public Transit** | **Live KSRTC & KSTDC Integration** | Direct integration with Karnataka State Road Transport Corporation (KSRTC) schedules, Airavat bus bookings, and KSTDC guided package tours for inter-city travel. |
| 📶 **Offline Resilience** | **Progressive Web App (PWA) with Offline Maps** | Service worker caching of Leaflet map tiles, audio phrase streams, and generated itineraries for 100% offline reliability in deep Western Ghats valleys and remote heritage areas. |
| 🌦️ **Smart Telemetry** | **Monsoon & Temple Darshan Predictive Engine** | Real-time crowd wait-time telemetry for major sanctums (e.g., Kukke Subramanya, Dharmasthala, Chamundi Hill) and weather-aware route re-routing during heavy monsoon landslides. |
| 🎙️ **Voice Co-Pilot** | **Hands-Free Driving Companion** | Voice-driven itinerary adjustments allowing drivers to query stops hands-free (*"Hey Dari, find an authentic Benne Dosa stop within 15 km"*). |
| 🏛️ **Heritage AR** | **Camera AR Monument Narrator** | WebXR-based augmented reality lens that recognizes Hoysala stone carvings and Vijayanagara ruins to deliver rich historical commentary in spoken Kannada. |
| 🌐 **Distributed Infra** | **Multi-Region Edge Rate Limiting** | Distributed Upstash Redis / Vercel KV rate limiting with global edge synchronization to complement container-level sliding windows. |
| 🤝 **Local Ecosystem** | **Certified Homestays & Local Artisans** | Direct directory links to certified Malenadu coffee homestays and traditional GI-tagged artisan craft clusters (Channapatna toys, Ilkal sarees, Mysuru silk). |

---

## 👨‍💻 Author & Project Credits

- **Developer:** [Varshith Vardhan](https://github.com/varshithvardhan2006-09)
- **Project:** Dari (ದಾರಿ) — AI Travel Planner for Karnataka
- **Live Deployment:** [dari-karnataka-travel-planner.vercel.app](https://dari-karnataka-travel-planner.vercel.app)
- **License:** [MIT License](LICENSE) — Open source and built with pride for Karnataka and the Kannada language.
