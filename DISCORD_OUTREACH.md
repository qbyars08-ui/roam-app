# ROAM — Discord Outreach Messages

## 1. Indie Hackers Discord

**Channel:** #show-and-tell or #launches

```
Built an AI travel planner in 8 days using Claude API + Supabase + Expo. Would love feedback from builders.

What it does: You say where you want to go, how long, your budget. It generates a complete day-by-day itinerary in ~30 seconds. Not generic "visit the Eiffel Tower" stuff — specific neighborhoods, exact restaurants with what to order, transit directions with costs in local currency.

Stack: React Native (Expo Router), Supabase (auth + edge functions + DB), Claude Sonnet for generation, RevenueCat for subscriptions.

Architecture decision I'm most proud of: All AI calls go through a Supabase Edge Function proxy so the API key never touches the client. Free tier gets 1 trip/month, Pro gets unlimited.

Free to try, no account needed for the first trip: roamapp.app

17 years old, building solo. Brutal feedback welcome.
```

## 2. Solo Travel Discord Servers

**Servers:** r/solotravel Discord, Solo Female Travelers, Nomad List community

**Channel:** #tools-and-resources or #trip-planning

```
Built something that plans trips like a local friend would. Free to try.

I kept running into the same problem planning solo trips — every blog recommends the same 10 tourist spots. Nobody tells you which exit to take at the metro station or that the ramen shop has a 45-minute wait after 11AM.

So I built ROAM. You tell it your destination, duration, budget, and travel style. It builds a full day-by-day plan in about 30 seconds:

• Specific neighborhoods (not just "visit Shibuya")
• Real restaurants with what to order and cost in local currency
• Exact transit directions (which line, which exit, how much)
• Time-of-day recommendations ("get there before 6:30AM")
• Prep tab with emergency numbers, visa info, safety scores, currency

Also has a People tab to find other travelers heading to the same destination the same week — because solo doesn't have to mean alone.

roamapp.app — completely free for your first trip. No signup required.

Would love to hear what destinations you'd test it with.
```

## 3. Digital Nomad Discord

**Servers:** Nomad List Discord, Remote Workers Discord, DN Community

**Channel:** #tools or #travel-planning

```
Built ROAM — plans any trip in 30 seconds. Specific enough to actually use.

If you've ever spent 4 hours on Google Maps + Reddit + travel blogs trying to plan a week somewhere new, this is for you.

You type: "Lisbon, 7 days, mid-range budget, solo, food + culture"

ROAM gives you:
→ Day-by-day schedule with specific times
→ Neighborhood-level recommendations (Alfama morning, Bairro Alto evening)
→ Restaurant names + what to order + prices in EUR
→ Transit (Tram 28 gets packed after 10AM, take the 15E instead)
→ Live prep data: timezone offset, safety score, visa requirements, daily budget ranges

It's like texting a friend who's lived there for 5 years.

roamapp.app — free to try, no account needed.
```

## 4. Gen Z Founder Discords

**Servers:** Gen Z VCs, Young Founders, Z Fellows community, Buildspace

**Channel:** #launches or #show-your-work

```
17, built two apps in 8 days. ROAM just launched at roamapp.app.

Quick context: I tried to plan my first solo trip to Tokyo. Spent 3 weeks drowning in travel blogs that all said the same thing. Built ROAM to fix it.

What it does: AI generates complete day-by-day travel itineraries in ~30 seconds. Specific neighborhoods, real restaurants, exact transit with costs in local currency.

Tech: Expo + React Native, Supabase (auth + edge functions), Claude Sonnet API, RevenueCat.

What I learned building it:
• Edge function proxies > exposing API keys in client code
• Prompt engineering is 80% of the product quality
• Anonymous auth for guest users = huge for conversion
• The share card matters more than the feature set for growth

Free tier: 1 trip/month. Pro: unlimited.

roamapp.app — would love feedback, especially from people who've built consumer apps.
```

## Posting Schedule

| Time | Platform | Action |
|------|----------|--------|
| T-1 day | All Discords | Join servers, engage in existing conversations |
| Launch day 6AM | Indie Hackers | Post builder message |
| Launch day 8AM | Twitter | Post thread |
| Launch day 9AM | Solo Travel | Post traveler message |
| Launch day 10AM | Digital Nomad | Post productivity message |
| Launch day 12PM | Gen Z Founders | Post founder message |
| Launch day 2PM | All | Reply to all comments |
| Launch day 6PM | Twitter | Post follow-up tweet |
| Launch +1 day | All | Thank everyone, share stats |

## Rules
- Never spam. One message per server per day max.
- Engage with other people's posts before self-promoting.
- Always be honest about being the maker.
- Reply to every single comment or question.
- If someone gives negative feedback, thank them and fix it publicly.
