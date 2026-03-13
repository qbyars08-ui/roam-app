# Push Notification Implementation Status

All 8 types from [push-notification-spec.md](./push-notification-spec.md).

| # | Type | Status | Trigger |
|---|------|--------|---------|
| 1 | Flight Price Drops | Ready | `lib/push-notifications.ts` scheduleFlightPriceDrop; call from flight-monitoring cron |
| 2 | Trip Countdown | Implemented | `lib/notifications.ts` scheduleTripCountdown (3 days, 1 day, day-of); called from Hype screen |
| 3 | Weather Alerts | Ready | `lib/push-notifications.ts` scheduleWeatherAlert; call from weather cron |
| 4 | Social: Meetup Request | Ready | `send-push` edge function; call when another user sends meetup request |
| 5 | Streak / Explorer | Implemented | `lib/streaks.ts` scheduleStreakReminder; `lib/reengagement.ts` |
| 6 | Re-engagement | Implemented | `lib/reengagement.ts` scheduleReengagementNotifications (Day 1/3/7/14) |
| 7 | Seasonal Alerts | Ready | `send-push`; call from seasonal cron |
| 8 | Safety Circle | Ready | `send-push`; call when circle member misses check-in |

## Infrastructure

- **lib/notifications.ts** — Main module: permission, registerPushToken, scheduleTripCountdown, scheduleDailyDiscovery, pet check-in
- **lib/push-notifications.ts** — Full 8-type implementations (flight, weather, seasonal, etc.)
- **supabase/functions/send-push** — Sends push to user_ids via Expo Push API
- **push_tokens** table — Stores device tokens per user

## Deployment

1. Run migration: `supabase db push` (includes push_tokens)
2. Deploy send-push: `supabase functions deploy send-push`
3. Set `SEND_PUSH_INTERNAL_SECRET` in Supabase Edge Function secrets
4. Callers (crons, edge functions) invoke send-push with:
   - Header: `Authorization: Bearer ${SEND_PUSH_INTERNAL_SECRET}`
   - Body: `{ user_ids, title, body, data }`
