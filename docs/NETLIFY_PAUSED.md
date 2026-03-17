# roamapp.app Not Loading

If roamapp.app shows "Site paused as it reached its usage limits", this is a **Netlify billing** issue, not a build or code problem.

## Fix in Netlify Dashboard

1. Go to **Usage & billing** in your Netlify team dashboard
2. Choose one:
   - **Enable auto recharge** (charges when credits run low)
   - **Buy add-on credits**
   - **Upgrade your plan**
3. Projects resume as soon as billing is updated

## Build Verification

The web build and deploy are configured correctly:

- `npm run build:web` exports to `dist/` and creates `_redirects` for SPA routing
- `netlify.toml` has `[[redirects]]` and `[[headers]]` for SPA fallback and caching
- Push to `main` triggers GitHub Actions deploy (requires `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets)

## Manual Deploy

```bash
cd roam
npm run build:web
netlify deploy --prod --dir=dist --no-build
```
