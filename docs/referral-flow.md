# ROAM Referral Flow

End-to-end referral system: 3 refs = 1 month Pro, 10 refs = 1 year Pro.

## Flow

1. **User A** signs up in app, opens app (bootstrap runs) → `ensureReferralCode` creates `referral_codes` row with unique code
2. **User A** shares link: `https://roamappwait.netlify.app?ref=A_CODE`
3. **User B** visits link, joins waitlist → `waitlist_emails` stores `{ email, referral_source: A_CODE }`
4. **User B** signs up in app (same email) → `handle_new_user` trigger runs
5. Trigger calls `credit_referrer_on_signup(B.id, B.email)`:
   - Finds `waitlist_emails` row where `email = B.email` and `referral_source = A_CODE`
   - Looks up `referral_codes` where `code = A_CODE` → gets User A's `user_id`
   - Increments User A's `referral_count`
   - At 3 refs: grants 1 month Pro (`pro_referral_expires_at`)
   - At 10 refs: grants 12 months Pro
   - Marks `referral_credited_at` to avoid double-credit

## Apply migration

```bash
cd roam
npx supabase link   # if not already
npx supabase db push
```

Or run the SQL manually in Supabase Dashboard > SQL Editor:
`supabase/migrations/20260317_referral_flow.sql`

## Testing

1. Sign up User A, open app (Profile > Referral) to generate code
2. Copy referral URL from referral screen
3. Open URL in browser (waitlist page with `?ref=A_CODE`)
4. Join waitlist with User B's email
5. Sign up User B in app with same email
6. User A's referral count should increment; at 3 refs, User A gets Pro
