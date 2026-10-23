# Dari (ದಾರಿ) - AI Travel Planner for Karnataka

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-37%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Problem Statement 06:** AI-powered travel planner that creates personalized Karnataka itineraries based on interests, available time, budget, and preferred type of experience.
>
> Built for the **Kannada Digital Innovation Hackathon 2026** ("Code. Create. Celebrate Kannada.").
>
> **Live URL:** [https://dari-karnataka.vercel.app](https://dari-karnataka.vercel.app)

---

## 📸 Screenshots

| 1. Landing & Bento Discovery | 2. Planner Form & Live Brief |
|:---:|:---:|
| ![Landing Screen](docs/mockups/01-landing.png) | ![Planner Form](docs/mockups/02-planner-form.png) |

| 3. Generating State | 4. Itinerary & Leaflet Route Map |
|:---:|:---:|
| ![Generating State](docs/mockups/03-generating.png) | ![Itinerary and Map](docs/mockups/04-itinerary-map.png) |

| 5. Kannada Mode (ಕನ್ನಡ) & Phrases | 6. Mobile Experience (360px) |
|:---:|:---:|
| ![Kannada Mode](docs/mockups/05-kannada-mode.png) | ![Mobile View](docs/mockups/07-mobile.png) |

---

## 🌟 What Makes Dari Different

Generic AI planners (like ChatGPT or Google Gemini prompts) suffer from severe hallucinations: they invent non-existent monuments, combine sights in different cities on the same morning, estimate absurd driving times, output garbled machine-translated Kannada, and break completely when rate-limited.

**Dari solves this with 5 architectural innovations:**

1. **Constrained Place-ID Architecture (Zero Hallucinations):**
   The AI model is **never allowed to generate free-text place names, coordinates, or prices**. It is given candidate IDs from `data/places.json` and may only return an ordered list of valid IDs. If any ID is unrecognized, the server rejects the response, triggers one retry, and falls back to our deterministic planner.
2. **First-Class Kannada (ಕನ್ನಡ) without Runtime LLM Translation:**
   One toggle instantly switches the entire interface, place names, descriptions, tips, and phrases to verified Kannada. Every Kannada string is pre-curated in `data/places.json`, `data/phrases.json`, or `src/lib/i18n/kn.json` — zero garbled machine translation.
3. **Contextual Phrases with Native Audio at Every Stop:**
   Every stop card includes 2 to 3 practical Kannada phrases with script, English transliteration, English meaning, and browser Web Speech (`speechSynthesis`, `lang="kn-IN"`) audio.
4. **100% Offline & Deterministic Fallback:**
   Even if both Groq and Gemini are completely down or no API keys are provided, Dari builds a complete, geographically clustered, realistic itinerary using `lib/planner.ts` with no raw provider error ever reaching the user.
5. **Beyond the Golden Triangle:**
   Our dataset covers 36 hand-curated places across all regions of Karnataka:
   - **Kalyana-Karnataka:** Bidar Fort, Kalaburagi Fort & Jami Masjid
   - **Badami-Bagalkot:** Badami Cave Temples, Pattadakal, Aihole, Gol Gumbaz
   - **Karavali Coast:** Mangaluru, Udupi Sri Krishna Matha, Gokarna, Murudeshwar, Malpe
   - **Malenadu:** Chikkamagaluru Coffee Estates, Mullayanagiri, Jog Falls, Abbey Falls
   - **Southern Heritage:** Mysuru, Belur, Halebidu, Somanathapura, Shravanabelagola, Bandipur

---

## 🏛️ System Architecture & Data Flow

![Architecture Diagram](docs/mockups/00-architecture.png)

### The Request Pipeline (`POST /api/plan`)

```
[ User Input: Interests, Days (1-7), Start City, Budget, Pace, Travellers, Month ]
                               │
                               ▼
[ 1. Zod Request Validation & In-Memory Rate Limiting (12 req/min/IP) ]
                               │
                               ▼
[ 2. Candidate Filtering & Scoring (lib/candidates.ts) ]
   ├── Distance from start city (Haversine km)
   ├── Best travel month bonus
   ├── Budget tier compatibility
   └── Keeps ~2.5x stops needed
                               │
                               ▼
[ 3. Cascading AI Execution (lib/ai.ts) ]
   ├── Primary: Groq API (Llama 3.3 70B Versatile, JSON Mode)
   ├── Secondary Fallback: Google Gemini API (Gemini 2.5 Flash)
   └── Validates place IDs with Zod (1 retry with feedback)
                               │
                               ▼ (on AI failure, timeout, or missing keys)
[ 4. Deterministic Planner Fallback (lib/planner.ts) ]
   ├── Greedy nearest-neighbour clustering
   ├── Pace stop limit enforcement
   └── Meal stop insertion at lunch hours
                               │
                               ▼
[ 5. Plan Enrichment Engine (lib/enrich.ts) ]
   ├── Road distance (Haversine × 1.3 factor)
   ├── Realistic drive times (40 km/h + 10 min buffer, rounded to 5 min)
   ├── Transport mode selection (Auto < 15km, Cab < 120km, Bus >= 120km)
   ├── Itemized rupee cost calculation (Stay + Food + Transport + Entry === Total)
   └── Attaches localized Kannada text and audio phrases
                               │
                               ▼
[ Final JSON Plan returned to Client with source: "ai-groq" | "ai-gemini" | "planner" | "sample" ]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16.4.2 (App Router) + React 19 | Server & client routing in unified deployment |
| **Language** | TypeScript 5.0 (Strict mode) | Compile-time safety and self-documenting code |
| **Styling** | Tailwind CSS v4 | Rapid responsive UI with Karnataka flag tokens (`#8E1F2F` crimson, `#F2B705` gold) |
| **Typography** | Bricolage Grotesque, Hanken Grotesk, Noto Sans Kannada | Correct native Kannada rendering across all platforms |
| **Map Engine** | Leaflet 1.9 + React-Leaflet 5 + OpenStreetMap | Zero API key required, free open-source map tiles |
| **Primary AI** | Groq API (`llama-3.3-70b-versatile`) | Blazing fast inference (< 1.5s), JSON mode |
| **Fallback AI** | Google Gemini API (`gemini-2.5-flash`) | High reliability secondary cloud provider |
| **Validation** | Zod 4 | Runtime input validation and AI output schema guarantees |
| **URL Compression** | LZ-String 1.5 | Compresses entire JSON itinerary into URL `?d=...` for instant database-free sharing |
| **Speech** | Web Speech API (`speechSynthesis`, `lang="kn-IN"`) | Native on-device Kannada audio without paid TTS APIs |
| **Testing** | Vitest 5.0 (9 test suites, 37 tests) | Ultra-fast unit & integration testing |
| **Deployment** | Vercel (Edge & Serverless) | Global CDN with zero infrastructure management |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.18+ or Node 20+ (tested on Node 20 and Node 24)
- npm 9+

### 2. Installation
```bash
git clone https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner.git
cd dari-karnataka-travel-planner
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your API keys (optional — Dari runs in deterministic mode if keys are omitted):
```env
# Primary AI Provider (Groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Fallback AI Provider (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Base URL for Open Graph Social Sharing
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Test Suite
```bash
npm run test
```
Runs 37 automated tests across 9 test suites:
- Candidate scoring and geographic distance tests
- Cost math invariant tests (`stay + food + transport + entry === total`)
- Deterministic fallback planner tests
- AI cascade error rejection & retry tests
- Zod schema validator tests
- Share link compression/decompression tests
- Kannada language and audio phrase tests
- Sample itinerary schema conformity tests
- Error recovery & 429 rate limit tests

### 6. Building for Production
```bash
npm run build
npm run start
```

---

## 📱 Mobile-First Design (Tested at 360px)

Dari is engineered mobile-first:
- **Bottom Navigation Bar:** Mobile users get fixed bottom tabs:
  - **Plan:** Day tabs, stop cards, itemized cost bar
  - **Map:** Fullscreen interactive map with animated pins and colored route lines
  - **Phrases:** Full Kannada phrasebook for the day's stops with audio playback
- **Interactive Map Bottom Sheet:** Clicking any pin surfaces a bottom sheet with the place name, timings, entry fee, and embedded Kannada audio phrase card.
- **Zero Horizontal Scroll:** Form chips, segmented controls, and tables adapt gracefully to 360px viewport widths.

---

## 📁 Repository Structure

```
dari-karnataka/
├── public/
│   ├── favicon.ico            # 32x32 Karnataka-branded icon
│   └── og-image.png           # 1200x630 social share preview
├── data/
│   ├── places.json            # 36 hand-curated Karnataka places
│   ├── phrases.json           # 15 contextual Kannada phrases
│   └── samples/               # 4 pre-computed verified itineraries
│       ├── heritage.json      # Royal Mysuru & Hoysala Trail (3 days)
│       ├── nature.json        # Western Ghats & Wildlife (3 days)
│       ├── food.json          # Karavali Coast & Culinary (3 days)
│       └── mixed.json         # Karnataka Grand Panorama (4 days)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Fonts, metadataBase, LangProvider
│   │   ├── globals.css        # Tailwind theme & colour tokens
│   │   ├── page.tsx           # Landing page with bento destination cards
│   │   ├── opengraph-image.tsx# Dynamic Edge Open Graph image
│   │   ├── plan/page.tsx      # Planner form & trip brief
│   │   ├── trip/page.tsx      # Results screen, tabs, Leaflet map, mobile view
│   │   └── api/plan/route.ts  # Next.js API route with rate limiting
│   ├── components/
│   │   ├── PlannerForm.tsx    # Interactive form with live match counter
│   │   ├── ProgressSteps.tsx  # 5-step animated generation progress
│   │   ├── DayTabs.tsx        # Day switcher with city badges
│   │   ├── StopCard.tsx       # Timing, duration, entry fee, travel chip
│   │   ├── PhraseCard.tsx     # Kannada audio phrase with kn-IN speech
│   │   ├── TripMap.tsx        # Leaflet map (SSR: false), day pins, polylines
│   │   ├── CostSummary.tsx    # Itemized dark ink cost bar
│   │   ├── LangToggle.tsx     # EN / ಕನ್ನಡ toggle with persistence
│   │   ├── ErrorState.tsx     # 429 busy, few matches, fallback cards
│   │   └── Navbar.tsx         # Responsive header
│   └── lib/
│       ├── schema.ts          # Complete Zod schemas & TypeScript types
│       ├── candidates.ts      # Multi-factor scoring algorithm
│       ├── geo.ts             # Haversine distance, road factor, travel times
│       ├── cost.ts            # Deterministic rupee budget estimation
│       ├── planner.ts         # Greedy nearest-neighbour fallback planner
│       ├── ai.ts              # Groq -> Gemini -> Fallback cascade client
│       ├── enrich.ts          # Plan enrichment engine
│       ├── samples.ts         # Pre-computed sample loader
│       ├── speech.ts          # Web Speech API wrapper for kn-IN voice
│       └── i18n/
│           ├── en.json        # Complete English dictionary
│           ├── kn.json        # Complete Kannada dictionary
│           └── useLang.tsx    # useSyncExternalStore language hook
├── tests/                     # 9 Vitest test suites (37 tests)
├── docs/
│   ├── BUILD_SPEC.md          # Official hackathon specification
│   ├── PPT-CONTENT.md         # 8-slide presentation script & deck
│   ├── VIDEO-SCRIPT.md        # 4:30 minute timed demo video script
│   ├── TODO-VERIFY.md         # Data verification log
│   ├── DECISIONS.md           # Engineering architectural decision records
│   └── mockups/               # 8 UI mockup PNGs
├── .env.example               # Clean environment variable template
├── package.json
└── README.md
```

---

## 🔒 Security & Data Integrity

- **Zero Secrets in Git History:** Verified via `git log -p | grep -i key` — API keys live only in `.env.local` (git-ignored).
- **No Raw Provider Errors:** If an LLM throws rate limits, quota exhaustion, or invalid keys, the API route intercepts it and returns clean fallback data with status 200 or friendly error status 429.
- **Data Verification:** Place entry fees, timings, and Kannada descriptions are tracked in `docs/TODO-VERIFY.md` to ensure zero fabricated facts.

---

## ⚖️ Limitations & Future Scope

### Current Limitations:
- Fixed dataset of 36 curated Karnataka places (chosen for high quality and regional breadth).
- Browser Web Speech relies on device support for `kn-IN` voice (gracefully hides audio button when unavailable).
- Does not currently book tickets or hotel reservations directly.

### Future Roadmap:
1. **Live Booking Integration:** Direct deep-links to KSTDC, KSRTC, and Karnataka Forest Department safari bookings.
2. **Offline Progressive Web App (PWA):** Service workers and IndexedDB caching for zero-network use during travel in remote Western Ghats areas.
3. **Voice Input in Kannada:** Speech-to-text allowing rural and elderly travelers to plan trips by speaking in Kannada.
4. **Crowdsourced Place Submissions:** Community review portal for local guides and tourism officers across Karnataka's 31 districts.

---

## 📜 Deliverables & Hackathon Submission Pack

- **Deliverable 1 (Public Repo):** This repository with clean commit history, `.env.example`, and zero secrets.
- **Deliverable 2 (Presentation):** [`docs/PPT-CONTENT.md`](docs/PPT-CONTENT.md) (8-slide presentation with speaker notes).
- **Deliverable 3 (Live URL):** [https://dari-karnataka.vercel.app](https://dari-karnataka.vercel.app)
- **Deliverable 4 (Demo Video):** [`docs/VIDEO-SCRIPT.md`](docs/VIDEO-SCRIPT.md) (4:30 minute timed video script).

---

## 📄 License

MIT License. Built with pride for Karnataka and the Kannada language.
