# ROAM Agent System Bible

Last updated: 2026-03-13

---

## The Architecture

13 autonomous AI agents running simultaneously in Cursor Cloud, each connected to the `roam-app` GitHub repo. They all work off `main`, create their own feature branches, and submit PRs.

```
                         ┌─────────────┐
                         │    QUINN    │
                         │  (You)      │
                         └──────┬──────┘
                                │
                          "what's the status?"
                                │
                         ┌──────▼──────┐
                         │   CAPTAIN   │
                         │  Reads ALL  │
                         │  output .md │
                         │  files      │
                         └──────┬──────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼─────┐ ┌──▼──┐ ┌──────▼──────┐
              │ Code Agents│ │Audit│ │Strategy     │
              │ 01,03,04,  │ │05,08│ │02,06,07,09, │
              │ (write code)│ │(fix)│ │10,11,12     │
              └─────┬─────┘ └──┬──┘ │(write docs)  │
                    │          │    └──────┬───────┘
                    ▼          ▼           ▼
               GitHub PRs   GitHub PRs   roam/*.md
                    │          │           │
                    └──────────┴───────────┘
                               │
                    Captain reads everything
                    Compiles captain_status.md
```

## What Each Agent Actually Does

### Code agents (touch files, open PRs):

| Agent | What It Does | Output |
|-------|-------------|--------|
| 01 Tester (Medic) | Writes unit tests, finds bugs | PRs + `test_results.md` |
| 03 Design Enforcer (UI) | Fixes hardcoded colors, fonts, spacing to use constants | PRs + `design_audit.md` |
| 04 Builder (Ideas) | Builds new features (currently: PostHog analytics) | PRs + code |
| 05 Debugger | Fixes TypeScript errors, audits edge functions, CI | PRs + `system_health.md` |
| 08 Security (Scanguard) | Rate limiting, RLS policies, JWT auth, .gitignore | PRs + `security_audit.md` |

### Strategy agents (research + write reports, rarely touch code):

| Agent | What It Does | Output |
|-------|-------------|--------|
| 02 Researcher | Finds free APIs, audits competitors, finds npm packages | `research_report.md` |
| 06 Growth | ASO keywords, viral loops, onboarding optimization | `growth_dashboard.md` |
| 07 Monetization | Affiliate link audit, RevenueCat review, revenue model | `monetization_model.md` |
| 09 Localization | Emergency data, language phrases, currency coverage | `localization_audit.md` |
| 10 Analytics | Event taxonomy, funnel definitions, user properties | `analytics_spec.md` |
| 11 Content | App copy, error messages, App Store listing, destination hooks | `copy_library.md` |
| 12 Investor | Weekly memo, pitch doc, milestone tracking, technical moat | `investor_narrative.md` + `weekly_memo.md` |

### Captain (reads everything, writes nothing except status):

| Agent | What It Does | Output |
|-------|-------------|--------|
| Captain | Reads every agent's output file, compiles briefing | `captain_status.md` |

## The Flow -- Step by Step

**1. Agents run autonomously**
Each agent checks out `main`, reads its `.cursor/rules/agent-XX-*.mdc` file for instructions, then executes its task. They don't talk to each other. They work in parallel.

**2. Agents produce output**
- Code agents: create a branch, make changes, open a GitHub PR
- Strategy agents: write findings to their `roam/*.md` file
- Some do both

**3. Captain compiles the picture**
When you ask Captain "what's the status?", it:
- Reads every `.md` file in `roam/`
- Reads `AGENT_BOARD.md` for sprint context
- Checks open PRs
- Writes a concise briefing to `captain_status.md`
- Tells you: what's green, what's blocked, what needs you

**4. You merge PRs in priority order**
```
Security (08) > Tests (01) > Debugger (05) > Design (03) > Builder (04) > everything else
```
Each agent that gets merged next should rebase on `main` first so it has the previous agent's changes.

**5. Conflicts get flagged**
If two agents touch the same file, Captain detects it and tells you. You tell the lower-priority agent to rebase and avoid that file.

## Your Daily Workflow

```
Morning:
1. Open Captain in Cursor sidebar
2. Type: "status"
3. Captain reads all output files, gives you the briefing
4. See which PRs are ready to merge
5. Merge them in priority order

When you want to assign new work:
1. Open the agent's sidebar
2. Type the new task
3. Agent runs autonomously

When something breaks:
1. Ask Captain: "what's broken?"
2. Captain reads system_health.md + incidents.md
3. Tells you exactly what and which agent owns the fix

When you want the investor update:
1. Ask Captain: "give me the investor update"
2. Captain reads investor_narrative.md + weekly_memo.md
3. Gives you the 30-second version
```

## The File System

```
roam/
├── AGENT_BOARD.md          <- Sprint board, file ownership, coordination
├── system_health.md        <- Live system status (GREEN/YELLOW/RED)
├── captain_status.md       <- Captain's compiled briefing
├── SYSTEM_BIBLE.md         <- This file (architecture reference)
├── test_results.md         <- Agent 01 output
├── bugs_found.md           <- Agent 01 output
├── research_report.md      <- Agent 02 output
├── design_audit.md         <- Agent 03 output
├── security_audit.md       <- Agent 08 output
├── growth_dashboard.md     <- Agent 06 output
├── monetization_model.md   <- Agent 07 output
├── localization_audit.md   <- Agent 09 output
├── analytics_spec.md       <- Agent 10 output
├── copy_library.md         <- Agent 11 output
├── investor_narrative.md   <- Agent 12 output
├── weekly_memo.md          <- Agent 12 output
└── archive/                <- Weekly archives (see Weekly Reset Protocol)

.cursor/rules/
├── roam.mdc                <- Base rules every agent inherits
├── orchestrator.mdc        <- Master coordinator rules
├── captain.mdc             <- Captain's role definition
├── agent-01-tester.mdc     <- through
└── agent-12-investor.mdc   <- 12 specialized role files
```

## The Merge Priority System

Non-negotiable order:
1. **Security patches** (Agent 08) -- always first, everything depends on auth being right
2. **Tests** (Agent 01) -- second, because tests catch if anything below breaks
3. **Infrastructure/Debug** (Agent 05) -- TypeScript fixes, CI, edge functions
4. **Design** (Agent 03) -- UI consistency fixes
5. **Features** (Agent 04) -- new functionality
6. **Everything else** -- strategy reports don't conflict since they write to separate .md files

## Cross-Agent Intelligence Protocol

Code agents MUST read strategy agent output before building:

- **Agent 04 (Builder)**: Before starting any feature, read `research_report.md` and `analytics_spec.md`. If a relevant free API or user insight exists, use it. Do not build what research already solved.
- **Agent 07 (Monetization)**: Before touching affiliate links, read `growth_dashboard.md`. Align revenue decisions with growth strategy.
- **Agent 03 (Design Enforcer)**: Before rewriting copy, read `copy_library.md`. Agent 11 (Content) may have already drafted better text.
- **Agent 06 (Growth)**: Before modifying onboarding, read `analytics_spec.md`. Agent 10 has funnel definitions.

## What Makes This Work

- **No agent talks to another agent.** They all talk through files. Agent writes -> Captain reads -> You decide.
- **File ownership is enforced.** `AGENT_BOARD.md` says who owns what. If Agent 03 and Agent 11 both want to change `lib/constants.ts`, Agent 03 (Design) wins because it's in the ownership table.
- **Captain is the single pane of glass.** Instead of checking 13 sidebars, you check one.
- **Agents are stateless between runs.** Each time you give an agent a new task, it checks out `main`, reads its rule file, and starts fresh. No stale context.

## Conflict Resolution

When two agents touch the same file:

```
Conflict on [filename].
[Higher priority agent] owns that file.
Rebase on main and avoid that file.
Rewrite your change to achieve the same outcome
without touching [filename].
```

Priority: security > infra > features > polish

## Weekly Reset Protocol

Every Monday, one message to Captain:

```
Weekly reset. Do the following:
1. Read all 12 agent output files
2. Archive last week: move content to roam/archive/week-[date]/
3. Reset each output file to blank with just the header
4. Update weekly_memo.md with last week's summary
5. Update AGENT_BOARD.md with new sprint priorities
6. Give me the Monday briefing: what shipped, what's pending, what's next
```

This keeps output files clean so agents aren't reading 3 weeks of stale data every time they run. Stale context = agents repeating work already done.

## Cursor Cloud Agent Mapping

| # | Role | Cursor Sidebar Name | Model |
|---|------|-------------------|-------|
| 01 | Tester | Medic | Sonnet 4.6 |
| 02 | Researcher | Agent 02 API research | Opus 4.6 |
| 03 | Design Enforcer | UI | Sonnet 4.6 |
| 04 | Builder | Ideas | Opus 4.6 |
| 05 | Debugger | Agent 05 debugger | Opus 4.6 |
| 06 | Growth Hacker | Growth hacker curs data | Opus 4.6 |
| 07 | Monetization | Agent 07 monetization current | Opus 4.6 |
| 08 | Security | Scanguard | Sonnet 4.6 |
| 09 | Localization | Agent 09 localization | Opus 4.6 |
| 10 | Analytics | Agent 10 analytics CUDA | Opus 4.6 |
| 11 | Content | Agent 11 rules content | Opus 4.6 |
| 12 | Investor | Investor agent curso data | Opus 4.6 |
| CP | Captain | New agent captain | Opus 4.6 |

## What This System Is Not

- Not a replacement for Quinn making product decisions
- Not a substitute for actually using the app
- Not self-healing -- agents can write bad code, Captain can misread context, PRs can conflict

## The Three Things Only Quinn Does

1. **Merge decisions** -- you review, you approve, you merge
2. **Credentials** -- Booking.com AID, any new API keys, any Supabase secrets
3. **Product direction** -- what to build next, what to cut, what the app actually feels like to use

Everything else is delegated. These three never are.

---

Setup complete. The system runs itself from here.
Next time you open Cursor, the only question is: what did Captain find while you were gone?
