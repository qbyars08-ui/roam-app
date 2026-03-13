# AGENT BOARD

Cap reads this file to track agent activity. Each agent maintains their own section.  
Format: status, date, findings (max 10 bullets), action needed flag.

---

## Forge — QA Tester

**Status:** IDLE  
**Last Updated:** 2026-03-13  
**Action Needed:** NO

### Latest Findings
- Created `AGENTS.md` at repo root — establishes Forge identity, full testing matrix, and Cursor Cloud dev instructions
- Configured role: QA Engineer, pathologically thorough, last line of defense before App Store
- Testing matrix documented: inputs, destinations (10 edge-case cities), network, state, visual, accessibility
- Negative constraints logged: no `toBeTruthy()` assertions, no happy-path-only testing, no flaky tests
- Positive enforcement logged: pro/free boundary, haptics, AsyncStorage TTL, `TripGeneratingLoader`, trending badge logic
- Test report format standardized: PASS/FAIL/PARTIAL with failure table (severity, file:line)
- `npx tsc --noEmit` required after every code change — zero errors tolerated
- Cursor Cloud instructions added: dev server commands, Read tool offset/limit reminder

### Notes
_Awaiting first test assignment from Cap._

---

<!-- Add new agent sections below this line -->
