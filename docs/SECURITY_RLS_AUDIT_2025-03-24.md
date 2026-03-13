# RLS Audit — 2025-03-24

## Summary

Audit of remaining `WITH CHECK (true)` and `USING (true)` policies.

## Acceptable (no change needed)

| Table | Policy | Reason |
|-------|--------|--------|
| All | `service_role USING (true) WITH CHECK (true)` | Edge functions need full access |
| shared_trips | `SELECT USING (true)` | Public share links by design |
| prompt_versions | `SELECT USING (true)` | Read-only reference data |
| chaos_dares | `SELECT USING (true)` | Public read for shared dares |
| waitlist_emails | `INSERT anon WITH CHECK (true)` | Guest signup flow; no auth |
| referral_codes | `SELECT USING (true)` | Lookup by code |
| hostel_channels | `INSERT WITH CHECK (true)` | No owner column; auth-only guard |

## Monitor (low risk)

| Table | Policy | Note |
|-------|--------|------|
| analytics_events | `INSERT WITH CHECK (true)` | Events include user_id from session; consider `auth.uid() = user_id` |
| error_logs | `INSERT WITH CHECK (true)` | Client error reporting; user_id from session |
| chaos_dares | `INSERT WITH CHECK (true)` | Creator tracked in row; consider ownership check |
| onboarding_ab_assignments | `INSERT WITH CHECK (true)` | Session-based A/B; low sensitivity |

## Rate limiting added

- voice-proxy: 30 req/min
- weather-intel: 60 req/min
- destination-photo: 60 req/min
- enrich-venues: 30 req/min

All 4 use JWT auth + CORS allowlist (same pattern as claude-proxy).
