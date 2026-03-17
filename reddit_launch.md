# ROAM — Reddit Launch Posts

---

## POST 1 — r/solotravel

**Title:** I built an AI travel planner after getting overwhelmed planning my first solo trip

**Body:**

Three weeks. Somewhere around 80 browser tabs. I read every blog post, every Reddit thread, every "ultimate Tokyo guide" I could find. And I still had no idea what to actually do each day.

Every itinerary I found was either generic (Senso-ji, Shibuya crossing, done) or so hyper-curated to someone else's trip that none of it applied to me. I wanted to know: which subway line, which exit, how much cash, what to order, when to get there so I wasn't fighting tour buses.

So I built ROAM.

You type where you want to go, how long, your budget, and your vibe. It builds a complete day-by-day itinerary in about 30 seconds. Real neighborhoods, not just city names. Real restaurants with what to order. Exact transit directions — which line, which platform, which exit, the fare. Costs in USD and local currency because you need to know whether to hit an ATM.

Not tourist trap recommendations. The kind of stuff a friend who lived there for a year would tell you.

It's free to try: roamapp.app

I built this for myself, honestly. Would love honest feedback from people who actually travel solo — what's missing, what's wrong, what you'd actually use.

---

## POST 2 — r/travel

**Title:** Built an AI trip planner — it tells you the ramen spot costs 980 yen and to arrive before 11AM or wait 45 minutes. Is this useful?

**Body:**

I've been working on an AI travel planner called ROAM. Instead of describing it, I'll just show you what it actually outputs.

Here's a real example of what Day 1 of a Tokyo trip looks like:

---

**Day 1 — Your First Tokyo Evening**

**Morning — Asakusa, 6:00 AM**
Senso-ji before the crowds. You want to be inside the main gate by 6:15. The vendors on Nakamise-dori don't open until 9 but the street is worth walking empty — completely different energy. The incense smoke near the main hall is heavier in the morning when the air is still.
Cost: Free
Tip: There's a small photography spot on the left side of the main hall where you can frame the five-story pagoda through the lantern. Most people miss it because they go straight through the gate.
Transit: Walk 3 min to Asakusa Station, Ginza Line toward Shibuya, get off Ueno, exit 7. You'll be facing the park entrance. 170 yen, 5 minutes.

**Afternoon — Yanaka, 2:00 PM**
Walk Yanaka Ginza shopping street — the yakitori at Suzuki is 100 yen per stick, worth the 5-minute wait. Continue to Yanaka Cemetery, which sounds strange but it's one of the most peaceful walks in Tokyo and the cats that live there will follow you. This neighborhood didn't get bombed in WWII so it's one of the only places in Tokyo that still looks like old Japan.
Cost: ~$8 (1,200 yen) for food
Tip: The shotengai (shopping street) dead-ends into stairs that lead down into a quieter residential block. Go down and loop back — you'll walk through the part of Yanaka that almost no tourists see.
Transit: Yamanote Line from Nippori toward Shibuya, get off at Shimokitazawa (change at Shinjuku to Odakyu Line), exit 2. 250 yen, 25 minutes.

**Evening — Shimokitazawa, 7:00 PM**
Dinner at Shirube, a standing izakaya on the main strip. Order the grilled eggplant with miso, the chicken hearts, and whatever the daily special is on the chalkboard. Arrive at 7PM — it fills up by 7:30 and they don't take reservations.
Cost: ~$20 (3,000 yen) with drinks
Tip: The bar next door, Que, has live jazz starting at 9PM. Cover is 500 yen and includes one drink. It's cramped and loud and one of the best things you'll do in Tokyo.

---

That's the level of specificity across every time slot, every day.

My question is honest: is this actually useful, or is it overwhelming? I want to know if the cost-in-local-currency thing matters to you, whether the transit directions are the right level of detail, or if you'd prefer a looser plan you can riff on.

roamapp.app — free to try, takes about 30 seconds to generate a full trip.

---

## POST 3 — r/digitalnomad

**Title:** Made something that plans your trip like a friend who actually lives there

**Body:**

Every travel app I've used gives you the same recommendations. They're not wrong — they're just the Wikipedia version of the city. Technically accurate, completely devoid of the actual knowledge that makes a trip.

I built ROAM because I wanted something that sounds like a person, not a listicle.

Here's the difference in practice, using Tokyo as an example:

**Getting to Senso-ji:**
Generic app: "Visit Senso-ji Temple in Asakusa, one of Tokyo's most famous landmarks."
ROAM: "Get there before 6:30AM — you'll have it to yourself. The incense smoke does something to the light that photos can't capture. Enter from the Kaminarimon gate side, not the river side, so you walk the full length of Nakamise-dori while it's still empty."

**Taking the subway:**
Generic app: "Tokyo has an excellent public transportation system."
ROAM: "Take the Ginza Line from Asakusa (platform 1, toward Shibuya), get off at Ueno, exit 7. You'll be facing the park entrance. 170 yen, 5 minutes. Buy a Suica card at any station — tap in, tap out, never think about fares again."

**Finding ramen:**
Generic app: "Try authentic ramen at one of Tokyo's many ramen shops."
ROAM: "Ichiran in Shibuya — go to the basement floor, it's less crowded than the street-level entrance. Order extra firm noodles, extra garlic, medium broth. The solo booth setup is genuinely one of the more interesting dining experiences in the city. 980 yen."

The pattern is: less category, more instruction. Less "the neighborhood is known for" and more "go here, at this time, order this."

I built it as a solo dev over the last few months. It runs on Claude under the hood with a prompt I spent a long time tuning specifically for the kind of insider-knowledge output that actually changes how you travel.

It's free to try: roamapp.app

Would love feedback from people who actually live nomadically — you'll be the first to tell me what's wrong with it.
