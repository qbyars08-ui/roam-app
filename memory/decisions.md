# Decisions Log

Track architectural, business, and product decisions with reasoning and outcomes.

## Format
| Date | Decision | Reasoning | Outcome | Status |
|------|----------|-----------|---------|--------|

## Decisions

| Date | Decision | Reasoning | Outcome | Status |
|------|----------|-----------|---------|--------|
| 2026-03-14 | Rebuild flights tab as Skyscanner affiliate flow | Original mock API data was fake and broken. Skyscanner affiliate links earn revenue with zero maintenance. | Clean search UX, real flight links, no broken states | Active |
| 2026-03-14 | All API calls through Supabase edge function proxy | Keeps API keys server-side, enables rate limiting and auth verification | Secure, auditable, single chokepoint | Active |
| 2026-03-14 | Free-tier APIs only for travel intelligence | No API key costs, no rate limit issues at scale, AsyncStorage caching | 10+ data sources (weather, AQI, holidays, currency, safety, timezone, crowd) all free | Active |
| 2026-03-14 | Destination dashboard as separate route, not modal | Full-screen scrollable dashboard needs its own route for deep linking and back navigation | /destination/[name] route with all live widgets | Active |
| 2026-03-14 | Dark-only UI, no light mode | Gen Z target audience prefers dark UI, simpler to maintain one theme | Consistent brand identity, reduced design surface | Active |
| 2026-03-15 | Body Intel as standalone screen, not 6th tab | Avoid crowding tab bar. Accessible from Prep health section, itinerary banner, and ExploreHub. | Deep-dive UX without navigation overhead | Active |
| 2026-03-15 | Emergency Medical Card stored on-device only | Medical data is sensitive. AsyncStorage-only, never sent to server. Privacy-first. | Users trust the feature, no HIPAA concerns | Active |
| 2026-03-15 | Flight Price Calendar uses estimated prices, not live API | No flight API needed. Historical price database + day-of-week/seasonality model gives useful relative guidance. | Beautiful 6-week calendar, zero API cost | Active |
| 2026-03-15 | Layover Optimizer — curated data for 8 major airports | Quality > quantity. Hand-curated tips for JFK, LAX, LHR, NRT, DXB, SIN, CDG, ICN beats generic AI suggestions. | High-quality, instantly useful, no API dependency | Active |
| 2026-03-15 | ROAM Score + Seasonal Intel + Route Intel on destination dashboard | Three intelligence layers that answer "should I go?", "when should I go?", and "how do I get there?" | Destination page becomes a complete travel intelligence hub | Active |
| 2026-03-16 | Intelligence & Strategy output files | Research, investor narrative, DACH materials written to roam/ for investor convos, creator outreach, EU grants | Single source of truth for competitors, APIs, TAM, scripts, Austrian founder angle | Active |
| 2026-03-16 | Stays + Food tabs rework to match Flights pattern | Hero + curated content + affiliate deep links. No broken APIs. Same UX as Flights. | Booking.com (stays), Google Maps (food). Both in ExploreHub. | Active |
| 2026-03-16 | ResilientImage component for destination photos | Gradient fallback on load fail, retry logic, tap-to-retry. Unsplash can be unreliable. | Discover cards resilient to image failures. | Active |
| 2026-03-16 | Ground-up visual redesign: Inter fonts, neutral palette, floating pill nav | Old Cormorant Garamond + green-tinted aesthetic read as "AI generated." New system: Inter Bold/Regular, #0A0A0A bg, #5B9E6F action, #E8F5E1 accent. Linear/Notion/Arc inspired. | Clean, spatial, Gen Z 2026 aesthetic. 4 tabs (Plan/Pulse/People/Prep). | Active |
| 2026-03-16 | Alias-not-rename strategy for 200+ color tokens | Changing 200+ token names would break 212 importing files. Keep names, change values. Trade-off: names like `creamDim` now refer to sage-white variants. | Zero TypeScript errors on token swap. Visual updates propagate automatically. | Active |
| 2026-03-16 | 4-tab floating pill nav (was 6-tab bar) | Flights merged into Plan tab as section. Pets hidden. Fewer tabs = less cognitive load, more modern nav pattern. | FloatingPillNav.tsx component with frosted glass, Lucide icons, spring animations. | Active |
