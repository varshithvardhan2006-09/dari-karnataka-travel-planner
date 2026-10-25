# Dari (ದಾರಿ) - 4:30 Timed Video Demonstration Script
## Voice-Over Recording & Screen Action Guide

**Project:** Dari (ದಾರಿ) — AI Travel Planner for Karnataka  
**Problem Statement:** 06 (Kannada Digital Innovation Hackathon 2026)  
**Total Target Duration:** 4 minutes 30 seconds (within the 3:00 to 5:00 limit)  
**Visual Style:** Screen capture with voice-over (no face cam required)  

---

### Segment 1: Introduction & Hackathon Problem (0:00 - 0:45)

**[Screen Action: 0:00]**  
*Show browser on landing page `https://dari-karnataka-travel-planner.vercel.app` at full screen. Scroll down smoothly past the headline "Plan Karnataka your way." to show the bento destination cards (Mysuru, Hampi, Gokarna) and the three feature cards.*

**[Voice-over Narration]**  
"Namaskara! This is Dari (ದಾರಿ), an AI-powered travel planner built for the Kannada Digital Innovation Hackathon 2026, addressing Problem Statement 06.

The hackathon asked for an AI solution that generates personalized Karnataka travel itineraries based on user interests, available days, budget, and preferred experience.

Karnataka is a land of incredible diversity — from royal palaces in Mysuru and UNESCO Hoysala temples in Belur, to coffee plantations in Chikkamagaluru, waterfalls in the Western Ghats, and beaches along the Karavali coast. But for travelers, stitching these into a realistic, culturally authentic plan is surprisingly difficult."

---

### Segment 2: Gaps in Existing Planners (0:45 - 1:30)

**[Screen Action: 0:45]**  
*Click the 'Plan my trip' button. The app transitions smoothly to the `/plan` form page. Show the clean segmented controls, stepper, and the live 'Your trip brief' panel on the right.*

**[Voice-over Narration]**  
"When travelers try using generic AI tools like ChatGPT or standard travel apps, three major problems occur:

First, **hallucinations**. Generic LLMs frequently invent non-existent monuments or suggest visiting Badami in North Karnataka and Mysuru in South Karnataka on the very same morning — an impossible 500-kilometer drive!

Second, **they treat the Kannada language as an afterthought**. Most planners are English-only, and if you ask for Kannada, you get broken, comical machine translations that no local auto driver or temple priest would understand.

Third, **they break when APIs fail**. If the AI service is busy or rate-limited, users are greeted with raw error screens.

Dari was designed from scratch to solve all three issues."

---

### Segment 3: Live Application Walkthrough (1:30 - 3:30)

**[Screen Action: 1:30 - 1:55]**  
*On the `/plan` form:*
1. *Select interests: Click "Heritage", "Food", and "Nature".*
2. *Show the "Places that match" counter on the right panel dynamically update from 4 to 12 to 19 matching places.*
3. *Set Days to "3".*
4. *Choose Starting from: "Bengaluru".*
5. *Select Budget: "Mid-range".*
6. *Select Pace: "Relaxed" (2 to 3 stops a day).*
7. *Select Travellers: "Couple".*
8. *Click the crimson button "Generate my itinerary".*

**[Voice-over Narration: 1:30 - 1:55]**  
"Let's build a trip. I'll select Heritage, Food, and Nature. Notice how the 'Your trip brief' side panel immediately calculates and shows the 19 matching places in real time. We'll set a 3-day trip starting from Bengaluru, mid-range budget, relaxed pace, travelling as a couple. I'll click 'Generate my itinerary'."

---

**[Screen Action: 1:55 - 2:10]**  
*The Generating Screen appears with animated progress steps:*
- Step 1: Retrieving Karnataka places
- Step 2: Scoring by interests and distance
- Step 3: Crafting route
- Step 4: Estimating travel times & costs
- Step 5: Attaching Kannada phrases

**[Voice-over Narration: 1:55 - 2:10]**  
"Notice the transparent progress screen. Dari retrieves verified candidate places, scores them for geographic proximity and season, calls our constrained AI cascade, computes real travel times, and attaches native Kannada phrases."

---

**[Screen Action: 2:10 - 2:40]**  
*The Itinerary & Map page loads:*
1. *Show the top badges: '3 days', 'Heritage, Food and Nature', 'Mid-range', 'Relaxed'.*
2. *Click between 'Day 1', 'Day 2', and 'Day 3' tabs. Notice the Leaflet map automatically re-centers and adjusts its camera bounds smoothly to the day's stops.*
3. *Point to the travel chips between stop cards: '10 min by auto', '15 min by auto'.*
4. *Scroll down to show the dark ink Cost Summary bar: Stay ₹4,500 + Food ₹2,400 + Transport ₹900 + Entry ₹350 = Total ₹8,150 for 2 people.*

**[Voice-over Narration: 2:10 - 2:40]**  
"And here is our personalized itinerary! On Day 1 in Mysuru: we start at Mysore Palace at 09:00, stop for lunch at Mylari for authentic butter dosas, and explore Devaraja Market. 

Look at the connectors between stops: Dari calculates road distances and travel times using realistic road factors and speeds. The Leaflet map on the right displays numbered pins color-coded by day with dashed routes. 

At the bottom, our cost summary guarantees that Stay, Food, Transport, and Entry fees mathematically equal the total estimated rupee budget."

---

**[Screen Action: 2:40 - 3:05]**  
*Show the Kannada toggle and Audio:*
1. *Click the 'ಕನ್ನಡ' toggle in the top-right navbar.*
2. *Observe the entire UI seamlessly switch: Day tabs become 'ದಿನ ೧', 'ದಿನ ೨'; place names become 'ಮೈಸೂರು ಅರಮನೆ', 'ದೇವರಾಜ ಮಾರ್ಕೆಟ್'.*
3. *Zoom in on the gold PhraseCard under Mysore Palace.*
4. *Click the red speaker button next to 'ಟಿಕೇಟ್ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?' (Tikeṭ elli siguttade?).*
5. *Let the computer audio play the clear Kannada speech synthesized via Web Speech API.*
6. *Click the second phrase 'ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ!' (Tumbā chennāgide!).*

**[Voice-over Narration: 2:40 - 3:05]**  
"Now, watch the magic of Dari's Kannada mode. With one click on the 'ಕನ್ನಡ' toggle, the entire interface transforms into authentic Kannada. The place names, descriptions, and day summaries are all in clean, verified Kannada.

Under every stop, Dari provides practical Kannada phrases for the traveler. At Mysore Palace, you get 'ಟಿಕೇಟ್ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?' — 'Where do I get tickets?' with English transliteration. 

Let's click the red speaker button... [Audio plays: *Tikeṭ elli siguttade?*]. 

It uses the device's native Kannada speech synthesis without expensive external voice APIs."

---

**[Screen Action: 3:05 - 3:30]**  
*Show URL Sharing, Mobile View, and Sample Fallback:*
1. *Click 'Share link'. A badge flashes '✓ Copied to clipboard!'.*
2. *Open developer tools / responsive preview to show the 360px mobile view:*
   - Show the bottom tabs: 'Plan', 'Map', 'Phrases'.
   - Tap 'Map': Show the map with the interactive bottom sheet for the stop.
   - Tap 'Phrases': Show the dedicated Kannada phrasebook for the day.
3. *Click 'Sample itineraries' in the navbar or switch to `?sample=food` to show the coastal Karavali itinerary.*

**[Voice-over Narration: 3:05 - 3:30]**  
"Sharing is instant. Clicking 'Share link' uses LZ-String algorithm to compress the entire JSON itinerary right into the URL, requiring no database storage.

On mobile devices, Dari adapts with a bottom navigation bar: Plan, Map, and Phrases. The Map tab features a native bottom sheet for each stop with phrase audio ready at your fingertips.

And if you want pre-verified trips, Dari ships with 4 curated sample itineraries: Royal Heritage, Western Ghats Nature, Karavali Coast Food, and a 4-day Grand Panorama."

---

### Segment 4: Architecture & Zero Hallucination Guarantee (3:30 - 4:15)

**[Screen Action: 3:30]**  
*Briefly display the architecture diagram `docs/mockups/00-architecture.png` or `README.md`.*

**[Voice-over Narration: 3:30 - 4:15]**  
"How does Dari achieve zero hallucinations?

First, **constrained generation**. The LLM is given only candidate IDs from our curated `places.json` dataset and can only output an ordered array of valid IDs. If the model hallucinates an unknown ID, our Zod schema rejects it immediately and prompts a single retry.

Second, **a resilient cascade**. We call Groq's Llama 3.3 70B model first for sub-second speed. If Groq rate limits, we seamlessly fall back to Google Gemini 2.5 Flash.

And third, **an offline deterministic engine**. If all AI providers are down or if no API keys are provided, our deterministic greedy clustering planner generates a high-quality itinerary locally. A raw provider error never reaches the user."

---

### Segment 5: Conclusion & Future Scope (4:15 - 4:30)

**[Screen Action: 4:15]**  
*Return to the main Dari itinerary screen in Kannada mode, showing the beautiful Karnataka map and pins.*

**[Voice-over Narration: 4:15 - 4:30]**  
"In the future, we plan to integrate direct booking links with KSTDC and KSRTC, full offline PWA support, and Kannada voice input for senior citizens.

Dari bridges cutting-edge AI with proud Kannada heritage, making travel across Karnataka accessible, authentic, and unforgettable. 

Thank you, and Siri Kannada Gelge, Siri Kannada Baazhge!"

---

### Recording Checklist for Presenter
- [ ] Record at 1080p (1920x1080) 60fps.
- [ ] Ensure browser zoom is set to 100% or 110% for crisp text.
- [ ] Test system audio capture so the Kannada phrase audio is clearly audible in the video recording.
- [ ] Keep speech paced evenly to finish between 4:15 and 4:30.
- [ ] Save output as MP4 or upload to YouTube/Google Drive as an unlisted link for Unstop submission.
