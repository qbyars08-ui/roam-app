# Deploy Verification — tryroam.netlify.app

## Required Netlify Settings

In **Site configuration → Build & deploy**:

| Setting | Value |
|---------|-------|
| **Base directory** | `roam` (if repo root has `roam/` subfolder) or leave blank (if `package.json` is at repo root) |
| **Build command** | `npx expo export --platform web && echo '/*  /index.html  200' > dist/_redirects` |
| **Publish directory** | `dist` |
| **Node version** | 20 |

## Required Environment Variables (Netlify)

Add in **Site configuration → Environment variables** for the web app:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Optional (for full features): Google Places, RevenueCat, etc. — see `.env.example` if present.

## GitHub Actions (auto-deploy)

1. **Secrets** (repo → Settings → Secrets): `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
2. **Repo structure**: Workflow expects `package.json` at repo root. If your repo has `roam/` as subfolder, set Netlify **Base directory** = `roam` (the UI build will use it; the workflow may need `working-directory: roam`).
3. Push to `main` triggers deploy.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Site shows "Page Not Found" or 404 | Ensure `_redirects` exists in `dist/` with `/*  /index.html  200` |
| Blank white screen | Check browser console for JS errors; verify Supabase env vars |
| Build fails on Netlify | Check Base directory; ensure Node 20; run `npm run build:web` locally |
| Build fails on GitHub Actions | Verify `package.json` at root or add `working-directory: roam` |

## Local Verify

```bash
cd roam
npm run build:web
npx serve dist -l 3456
# Open http://localhost:3456 — app should load
```
