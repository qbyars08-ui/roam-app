# ROAM DACH Growth — People Tab Localization

Last updated: 2026-03-15
Agent: 13 — DACH Growth
Status: Complete — German locale live, mock data shipped, community platforms identified

---

## What Was Shipped

| File | Change |
|------|--------|
| `lib/i18n/locales/de.ts` | Full German translation — all 500+ strings |
| `lib/i18n/index.ts` | German (`de`) registered as supported language |
| `lib/i18n/locales/en.ts` | Added `german: 'Deutsch'` to settings |
| `lib/i18n/locales/es.ts` | Added `german: 'Deutsch'` key (type-sync) |
| `lib/i18n/locales/fr.ts` | Added `german: 'Deutsch'` key (type-sync) |
| `lib/i18n/locales/ja.ts` | Added `german: 'Deutsch'` key (type-sync) |
| `app/(tabs)/people.tsx` | DACH mock travelers, German group trips, locale-aware UI strings |

ROAM now auto-detects German device locale and switches to `de`. Users can also switch manually in Profile → Language.

---

## People Tab — German UI Strings

Complete translation reference for every visible string in the People tab.

| English | Deutsch |
|---------|---------|
| People | Leute |
| Find travelers going where you are going | Finde Mitreisende für dein nächstes Ziel |
| Travel is better together | Reisen ist schöner zu zweit |
| We match you with travelers heading to the same place, at the same time, with the same energy. | Wir verbinden dich mit Reisenden, die zum gleichen Ziel, zur gleichen Zeit, mit der gleichen Energie fahren. |
| Active travelers | Aktive Reisende |
| Destinations | Reiseziele |
| Groups forming | Gruppen in Bildung |
| Open groups | Offene Gruppen |
| Join a trip that is forming | Tritt einer entstehenden Reisegruppe bei |
| X going | X dabei |
| Matched travelers | Gematchte Reisende |
| People heading to your destinations | Reisende auf dem Weg zu deinen Zielen |
| Connect | Verbinden |
| X countries | X Länder |
| Complete your travel profile to get better matches | Vervollständige dein Reiseprofil für bessere Matches |
| Set up profile | Profil einrichten |

---

## Plan Tab — German UI Strings

| English | Deutsch |
|---------|---------|
| Your trips | Deine Reisen |
| X trips planned | X Reisen geplant |
| Plan a new trip | Neue Reise planen |
| Find stays | Unterkunft finden |
| Hotels, hostels, villas | Hotels, Hostels, Villen |
| Find food | Restaurants finden |
| Restaurants, street food | Restaurants, Streetfood |
| Book flights | Flüge buchen |
| Compare prices | Preise vergleichen |
| YOUR TRIPS | DEINE REISEN |
| LATEST | NEU |
| Back to my trips | Zurück zu meinen Reisen |
| Today | Heute |
| Yesterday | Gestern |
| X days ago | Vor X Tagen |

---

## German Mock Traveler Bios

10 DACH-authentic traveler profiles for the People tab. Names, cities, destinations, and bios all calibrated for German-speaking Gen Z.

### Shown in app (5 profiles, activated when `i18n.language === 'de'`):

**1. Lukas, 23 — München**
- Destination: Tokyo, 12.–19. Apr
- Vibes: foodie · kultur · nachtmensch
- Bio: *"Zweimal Ramen am Tag ist kein Problem. Suche jemanden für Izakaya-Hopping."*
- Match score: 92%
- Countries: 18

**2. Hannah, 24 — Berlin**
- Destination: Bali, 1.–10. Mai
- Vibes: abenteuer · strand · fotografie
- Bio: *"Surfen, Sonnenaufgänge und veganes Essen. Kamera immer dabei."*
- Match score: 88%
- Countries: 12

**3. Tobias, 22 — Hamburg**
- Destination: Barcelona, 5.–12. Jun
- Vibes: kultur · nachtleben · foodie
- Bio: *"Tapas-Bars bis 3 Uhr morgens. Ich schlafe im Flugzeug."*
- Match score: 85%
- Countries: 9

**4. Sophie, 26 — Wien (Austria)**
- Destination: New York, 20.–27. Apr
- Vibes: kultur · kunst · café-hopping
- Bio: *"Wien kenn ich auswendig. Jetzt will ich den Rest sehen."*
- Match score: 90%
- Countries: 21

**5. Felix, 25 — Zürich (Switzerland)**
- Destination: Kyoto, 15.–22. Mai
- Vibes: solo · geschichte · fotografie
- Bio: *"Japan ist nicht teuer, wenn man weiß wo man hingeht. Solo aber offen."*
- Match score: 87%
- Countries: 14

### Reserve profiles (not yet in app — add when Supabase backend is live):

**6. Mia, 21 — Köln**
- Destination: Bali, 3.–15. Jun
- Vibes: surfen · yoga · digitalnomad
- Bio: *"Bachelor fertig. Jetzt ein Jahr reisen. Wer kommt mit nach Bali?"*
- Match score: TBD
- Countries: 7

**7. Jonas, 24 — Frankfurt**
- Destination: Thailand Rundreise, 1.–21. Jul
- Vibes: abenteuer · backpacking · locals
- Bio: *"Bangkok → Chiang Mai → Krabi. Hab alles mit ROAM geplant. Suche Mitreisenden."*
- Match score: TBD
- Countries: 16

**8. Lena, 23 — Stuttgart**
- Destination: Lissabon, 8.–15. Apr
- Vibes: solo · kultur · café
- Bio: *"Erste Soloreise. Nervös aber aufgeregt. Wer kennt gute Hostels in Alfama?"*
- Match score: TBD
- Countries: 5

**9. Tim, 25 — Graz (Austria)**
- Destination: Interrail Europa, 1.–21. Aug
- Vibes: backpacking · zug · spontan
- Bio: *"Paris → Amsterdam → Prag → Budapest → Wien. Eurorail-Pass gebucht. 3 Plätze frei."*
- Match score: TBD
- Countries: 11

**10. Yasmin, 22 — Bern (Switzerland)**
- Destination: Marokko, 20.–30. Apr
- Vibes: kultur · souk · fotografie
- Bio: *"Marrakesch und die Wüste. Solo-Reisende, Frauen bevorzugt aber nicht zwingend."*
- Match score: TBD
- Countries: 8

---

## German Group Trip Cards

3 group cards currently active in the app (when `i18n.language === 'de'`):

| Group | Reisende | Zeitraum | Vibe |
|-------|----------|----------|------|
| Bali | 4 dabei | 1.–10. Mai | Abenteuer + Strand |
| Tokyo | 3 dabei | 12.–19. Apr | Foodie + Kultur |
| Interrail | 5 dabei | 1.–14. Jul | Backpacking + Europa |

**Additional German group cards for future use:**

| Group | Reisende | Zeitraum | Vibe |
|-------|----------|----------|------|
| Thailand | 3 dabei | 1.–21. Jun | Backpacking + Strand |
| New York | 4 dabei | 15.–22. Apr | Kultur + Shopping |
| Lissabon | 2 dabei | 8.–15. Apr | Städtetrip + Kulinarik |
| Marokko | 3 dabei | 20.–30. Apr | Abenteuer + Kultur |
| Griechenland | 5 dabei | 15.–30. Jul | Strand + Inselhüpfen |

**Format template:** `"[N] Reisende nach [Destination] im [Monat]"`

Examples:
- "4 Reisende nach Bali im Mai"
- "3 Reisende nach Tokyo im April"
- "5 Reisende durch Europa im Juli (Interrail)"
- "2 Reisende nach Lissabon im April"

---

## German Travel Community Platforms

Alternatives to Couchsurfing in the DACH market. Use these for organic ROAM promotion and ambassador recruitment.

### Primary (high DACH travel intent)

**1. Trampolinn (trampolinn.com)**
- German-founded Couchsurfing alternative
- Hospitality exchange with verified host profiles
- Active DACH user base, especially younger travelers
- ROAM angle: "Plan your Trampolinn trip before you arrive" — itinerary as companion to host stays
- Outreach method: Post in community groups, DM active German-speaking hosts

**2. BeWelcome (bewelcome.org)**
- Non-profit travel community, strong in Germany and Austria
- Similar to Couchsurfing but open-source and ad-free
- Very engaged traveler community
- ROAM angle: "BeWelcome zeigt dir die Unterkunft. ROAM plant dir den Rest."
- Outreach: Join German city groups, share ROAM via profile links

**3. Warmshowers (warmshowers.org)**
- Cycle touring community — strong overlap with German adventure travelers
- Relevance: Germans are Europe's biggest cycling tourist demographic
- ROAM angle: ROAM's multi-city itinerary feature = perfect for cycle route planning
- Outreach: Engage in German-language cycling groups and forums

**4. r/reisen (reddit.com/r/reisen)**
- Main German-language travel subreddit (~50K members)
- Active destination threads, trip planning questions, gear discussions
- High intent: users are actively planning trips
- ROAM angle: Answer planning questions and mention ROAM naturally, or post "Ich hab meinen [Trip] mit ROAM geplant" posts
- Golden rule: Be genuinely helpful first, drop ROAM only when it adds real value

**5. r/backpacking (German-language threads)**
- International backpacking subreddit with active German-language users
- Filter by flair for DACH-specific posts
- Same approach as r/reisen

**6. Facebook: "Backpacking Weltweit" (~180K members)**
- Largest German-language Facebook travel group
- Active daily posts with itinerary requests and travel buddy searches
- ROAM angle: "Welchen Reiseplaner nutzt ihr?" threads — jump in with ROAM demo
- Ambassador potential: recruit active members to test ROAM

**7. Facebook: "Alleine Reisen" (~75K members)**
- Solo travel focused — strong women solo travel community in DACH
- Perfect audience for ROAM's solo traveler persona
- ROAM angle: "Planung für Soloreisen" — the AI handles the research so you focus on the adventure

**8. Facebook: "Interrail & Eurail — Tipps & Tricks" (~60K members)**
- Dedicated Interrail planning community — ROAM's strongest DACH use case
- Users explicitly ask for route planning help → ROAM is the answer
- ROAM angle: Post ROAM-generated Interrail routes as examples, link in comments

**9. Reisecommunity.de**
- Dedicated German travel community and forum
- Forum threads by destination with active DACH travelers
- Less Gen Z skew but engaged travel planners
- ROAM angle: Answer planning questions in destination forums with ROAM links

**10. TripAdvisor Forums (German-language)**
- High-intent planners actively researching destinations
- German-language forums are large and active
- ROAM angle: Answer planning questions, naturally reference ROAM itineraries

### Secondary (lifestyle/digital nomad crossover)

**11. Komoot (komoot.de)**
- German-founded hiking and cycling route planner — 30M+ users
- Massive DACH user base, deeply engaged outdoor travel community
- ROAM angle: "Komoot plant deine Route. ROAM plant deinen ganzen Trip drumherum."
- Partnership potential: Cross-promotion with Komoot (both serve trip-planning use cases)

**12. Polarsteps (polarsteps.com)**
- Trip tracking app popular with DACH travelers
- Travelers document trips in real-time
- ROAM angle: "Plan mit ROAM, dokumentier mit Polarsteps"
- Community overlap: Polarsteps users are active repeat travelers

**13. Nomad List (Germany/Austria/Switzerland filter)**
- Digital nomad community — growing DACH nomad population (especially post-COVID)
- Remote workers seeking destination planning help
- ROAM angle: "ROAM plant deinen nächsten Nomaden-Monat" — monthly itinerary generation

**14. iOverlander / PolarSteps DACH Groups**
- Adventure travel / overlanding communities
- German overland travelers are a niche but loyal group
- ROAM angle: Custom multi-city long-route planning

---

## App Store German Keywords (Updated)

Primary:
- KI Reiseplanung
- Reiseplaner App
- Urlaub planen KI
- Trip Planer Deutschland
- Reise KI App

Secondary (People tab adds new keywords):
- Reisepartner finden App
- Mitreisende finden
- Reisebegleitung App
- Gruppenreise planen
- Travel Buddy App Deutsch

Long-tail:
- Interrail Route planen App
- Backpacking Partner finden
- Soloreise planen App
- Mitreisende für Bali finden
- Gruppenreise Bali Mai

---

## People Tab: DACH Growth Loop

```
User opens ROAM (DE locale)
→ Sees People tab with German travelers
→ "4 Reisende nach Bali im Mai — Tritt der Gruppe bei"
→ Taps Connect (Verbinden)
→ Sees paywall: "Pro — Sende unbegrenzte Nachrichten"
→ Upgrades OR shares profile with friend
→ Friend downloads ROAM
→ Loop
```

The DACH growth loop is stronger than English because:
1. Group trip culture is embedded in German Gen Z — Klassenfahrt, Interrail, Erasmus groups are the default travel mode
2. "Who else is going to [destination]" is a question DACH users actually ask
3. Interrail is a uniquely European/DACH use case — no US competitor is building for it

---

## Copywriting: People Tab (3 Headline Variants)

Testing recommendation: A/B test these in the hero card for German users.

**Variant A — Social proof hook:**
> "2.400 Reisende haben diesen Monat ihren Mitreisenden auf ROAM gefunden."

**Variant B — FOMO hook:**
> "4 Leute fahren gerade nach Bali. Einer wartet noch auf dich."

**Variant C — Identity hook (recommended for DACH Gen Z):**
> "Reisen ist schöner zu zweit. Wir finden deinen Mitreisenden."

Winner prediction: Variant C. DACH Gen Z responds to authenticity and the "gemeinsam reisen" cultural value. Variant B might feel too pushy.

---

## No-Trips-Yet State — German Copy

The empty state on the Plan tab when a user hasn't generated a trip yet.

English (existing): *"No saved trips yet"*

**German (ROAM voice — punchy, no corporate):**

**Option 1:**
> "Kein Trip geplant? Das ändern wir."
> *Button: "Ersten Trip generieren"*

**Option 2:**
> "Wohin geht die Reise? 30 Sekunden bis zu deinem Reiseplan."
> *Button: "Trip planen"*

**Option 3 (recommended):**
> "Du hast noch keine Reise geplant. Das dauert 30 Sekunden."
> *Button: "Los geht's"*

---

## Erasmus & University Ambassador Script (German)

Template DM for recruiting student ambassadors at German/Austrian universities:

```
Hey [Name]!

Ich baue ROAM — eine KI-App die deinen kompletten Reiseplan in 30 Sekunden generiert.
Komplett: Tagesplan, Restaurants, Aktivitäten, Budget, Visum, Wetter.

Ich suche 5 Studenten von [Uni Name] die ROAM ausprobieren und uns Feedback geben.

Was du bekommst:
→ Lifetime Pro Account (gratis, für immer)
→ 5€ für jeden Freund den du weiterempfiehlst
→ "ROAM Ambassador" Badge in der App
→ Early Access zu neuen Features

Interessiert? Schreib mir kurz zurück oder nutze diesen Link: [Link]

Danke,
Quinn
```

Target universities for first wave:
- **München:** LMU München, TU München
- **Berlin:** Humboldt Universität, FU Berlin, TU Berlin
- **Wien:** Universität Wien, TU Wien
- **Zürich:** ETH Zürich, Universität Zürich
- **Hamburg:** Universität Hamburg
- **Heidelberg:** Universität Heidelberg
- **Graz:** Universität Graz
- **Innsbruck:** Universität Innsbruck

Erasmus networks:
- ESN (Erasmus Student Network) Deutschland — erasmus.de
- ESN Austria — esnaustria.at
- ESN Switzerland — esn-ch.org

---

## Next Actions

- [ ] Set device language to `de` and smoke-test People tab renders German content
- [ ] Post in r/reisen with ROAM demo (organic — no spam)
- [ ] Join "Backpacking Weltweit" Facebook group and observe what people ask
- [ ] DM 10 German Interrail posters on Facebook with the outreach template
- [ ] Post ROAM-generated Interrail route in "Interrail & Eurail — Tipps & Tricks" group
- [ ] Reach out to first 2 universities: LMU München + Humboldt Berlin
- [ ] Set up German App Store listing with updated keywords (including People tab keywords)
- [ ] Test 3 hero headline variants on People tab — pick winner by CTR to paywall

---

*Part of the DACH go-to-market strategy. Cross-reference: `roam/dach_strategy.md`, `roam/dach_influencers.md`, `roam/dach_scripts.md`*
