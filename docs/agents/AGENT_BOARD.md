# Agent Board

Status board for Cursor agents. Cap reads this to coordinate work.

---

## Shield (Dependency & Security Scanner)

**Status:** Rate limiting + RLS audit complete  
**Date:** 2025-03-24  
**Action needed:** Run migration `supabase db push` for edge_function_rate_limits

### Findings

- Rate limiting: voice-proxy (30/min), weather-intel (60/min), destination-photo (60/min), enrich-venues (30/min)
- Migration 20260324000001: edge_function_rate_limits table + increment_edge_rate_limit RPC
- RLS audit: docs/SECURITY_RLS_AUDIT_2025-03-24.md — remaining WITH CHECK (true) documented
