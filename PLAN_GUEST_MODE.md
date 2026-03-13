# Guest Mode: Implementation Plan

**Goal:** Let unauthenticated users browse limited content; capture email at paywall/conversion and add to waitlist.

---

## Overview

| Area | Current | Change |
|------|---------|--------|
| Auth guard | No session → signup/splash; only join-group unauthenticated | Add guest-mode exception |
| Entry | Web: onboard → WaitlistCaptureModal; native: none | Add "Browse first" on signup/splash |
| Conversion | Paywall = upgrade CTA; WaitlistCaptureModal = onboard only | Add email capture at paywall for guests |
| DB | `waitlist_emails` allows anon insert | No schema change |

---

## Phases

### Phase 1: Auth & Routing

1. **Guest mode state**
   - Add `isGuestMode` in store (or `@roam/guest_mode` in AsyncStorage)
   - `setGuestMode(true)` on "Browse first"; clear on sign-in

2. **Extend `useProtectedRoute`** (`app/_layout.tsx`)
   - If `!session && isGuestMode` → allow guest routes (limited tabs)
   - If `!session && !isGuestMode` → existing signup/splash behavior
   - Exclude join-group, splash, signup from redirect

3. **Guest entry in signup/splash**
   - Add "Browse first" / "Continue as guest" secondary CTA
   - Call `setGuestMode(true)`, route to `/(tabs)`
   - Set onboarding-complete so they don't get pushed back

### Phase 2: Limited Content

4. **Gate content**
   - Home: allow (destination discovery, featured)
   - Plan: allow 1 trip generation (in-memory)
   - Saved: local trips only + "Sign up to sync" CTA
   - Profile: minimal + "Create account to unlock"

5. **Trip limit for guests**
   - Use local state/AsyncStorage; cap at 1 trip
   - Second attempt → paywall with email capture

### Phase 3: Conversion & Email Capture

6. **Paywall for guests**
   - Detect guest (`!session && isGuestMode`)
   - Show `WaitlistCaptureModal` or inline email capture
   - Call `joinWaitlist(email)`, show position + sign-up CTA

7. **Reuse `joinWaitlist` + `WaitlistCaptureModal`**
   - Pass `source` (paywall, onboard, save_trip) for analytics

8. **Other conversion points**
   - Plan: trip limit → paywall → email
   - Save trip: "Sign up to save" → email capture
   - Pro features: existing gate → paywall

### Phase 4: Edge Cases

9. **Guest → signed-in:** Clear guest mode on sign-in; load real profile
10. **Deep links:** Keep join-group, shared-trip; for auth-required links → CTA
11. **Rate limiting:** Consider IP/device limits for anon trip generation

---

## Flows

```
[First-time]
  Splash → Hook → Onboard (or skip) → Signup
    ├── Sign in → (tabs)
    └── Browse first → (tabs), isGuestMode=true

[Guest in app]
  Home / Plan (1 trip) / Saved (limited) / Profile (limited)
    └── Limit hit / Pro / Save → Paywall → Email capture → joinWaitlist → CTA
```

---

## UI Changes

| Screen | Change |
|--------|--------|
| Signup / Splash | Add "Browse first" secondary CTA |
| Plan | Same; limit → paywall + email for guests |
| Saved | Guests: local trips + "Sign up to sync" banner |
| Profile | Guests: minimal + "Create account" CTA |
| Paywall | Guest variant: email capture (WaitlistCaptureModal/inline) |

---

## API / DB

- **DB:** Use `waitlist_emails` as-is. No schema change.
- **Optional:** Add `source` column for paywall vs onboard vs save attribution.

---

## Success Criteria

- [ ] Guest can enter via "Browse first" without sign-in
- [ ] Guest generates 1 trip and views itinerary
- [ ] Paywall/limit triggers email capture → waitlist
- [ ] Emails in `waitlist_emails` with attribution
- [ ] Sign-up clears guest mode and loads full state
