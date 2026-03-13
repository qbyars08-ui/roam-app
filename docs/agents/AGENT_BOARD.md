# Agent Board

Status updates from ROAM agents. Cap reads this to coordinate work.

---

## Launch (Deployment & Release)

**Status:** Diagnosis complete  
**Last updated:** 2025-03-13  
**Action needed:** Yes (Captain decision required before resuming)

### Build health
- **Web build:** PASSES locally (`npx expo export --platform web` → `dist/` in ~30s)

### Why Netlify is paused
- **docs/NETLIFY_PAUSED.md:** Site hit Netlify usage limits; "Site paused as it reached its usage limits" is a **billing** issue, not build/code
- Fix: Netlify Dashboard → Usage & billing → Enable auto recharge, buy add-on credits, or upgrade plan

### Deploy config (from docs)
- **DEPLOY_SETUP.md:** GitHub repo + Netlify import + secrets `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`; push to `main` triggers deploy
- **DEPLOY_VERIFY.md:** Base dir blank (package.json at root), build cmd creates `_redirects`, publish `dist`, Node 20; env vars `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **netlify.toml:** Build cmd, publish `dist`, SPA redirects, headers, Node 20 — config is correct

### Blockers found
- **.github/workflows/deploy.yml:** Runs `npx expo export --platform web` but does NOT create `dist/_redirects`; `npm run build:web` and netlify.toml do. GitHub Actions deploys would have broken SPA routing (404 on refresh/direct URLs)
- **DEPLOY_SETUP.md** references `roam/` subfolder — repo has package.json at root; docs may be stale

### What's needed to resume
1. Resolve Netlify billing (Usage & billing in dashboard)
2. Fix deploy workflow: add `_redirects` step before Netlify deploy (or use `npm run build:web` instead of raw expo export)
3. Confirm GitHub secrets `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` are set
4. After billing fix, push to `main` or run workflow_dispatch to verify full pipeline

---
