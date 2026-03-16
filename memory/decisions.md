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
