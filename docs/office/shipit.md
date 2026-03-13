# ShipIt Process

Daily automated verification process run by the ShipIt agent. Run all 3 phases in order.

## Phase 1: CHECK

Run TypeScript compilation and look for errors:

```bash
npx tsc --noEmit
```

- Zero errors required to pass
- Fix all errors before proceeding

## Phase 2: TEST

Run the full TypeScript check again (canonical test):

```bash
npx tsc --noEmit
```

- Must exit with code 0
- Record output in AGENT_BOARD.md

## Phase 3: DEPLOY

Verify the web build is clean:

```bash
npx expo export --platform web
```

- Must complete without errors
- Check that `dist/` output is generated

## Reporting

After all 3 phases, update `docs/agents/AGENT_BOARD.md` with:

- Date of run
- Results of each phase (PASS / FAIL)
- Any errors found and fixed
- Build status

## On Failure

If any phase fails:
1. Fix the errors
2. Re-run the phase
3. Open a PR with the fixes
4. Record the fix in AGENT_BOARD.md
