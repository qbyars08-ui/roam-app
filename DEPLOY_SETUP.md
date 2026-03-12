# ROAM deploy pipeline setup

Complete these steps in order. Steps 2 and 5 must be done in your terminal/browser (gh and Netlify are not available in the agent environment).

## Step 2 — Create GitHub repo and push

In your terminal (from this repo root):

```bash
cd "/Users/quinnbyars/Claude trip app/roam"

# If gh is not installed:
brew install gh
gh auth login

# Create private repo and push
gh repo create roam-app --private --source=. --remote=origin --push
```

Or create the repo manually: https://github.com/new → name `roam-app`, Private → Create. Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/roam-app.git
git push -u origin main
```

## Step 3 — Verify push

```bash
git log --oneline -5
git remote -v
```

Confirm `origin` points to `github.com` and your latest commits are on GitHub.

## Step 5 — Connect to Netlify (do in browser)

1. Open https://app.netlify.com/start
2. Click **Import from Git**
3. Connect your GitHub account
4. Select the **roam-app** repository
5. Set:
   - **Build command:** `npx expo export --platform web`
   - **Publish directory:** `dist`
6. Click **Deploy**

After the first deploy, in Netlify: **Site configuration** → **Site information** → copy **Site ID** (e.g. `xxxx-xxxx-xxxx`). You will need it for GitHub Actions.

Create a **Personal access token**: Netlify → **User settings** → **Applications** → **Personal access tokens** → **New access token**. Copy the token; you will add it as a GitHub secret.

## Step 6 — GitHub Actions secrets

After Netlify is connected, in GitHub:

1. **roam-app** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** for each:
   - Name: `NETLIFY_AUTH_TOKEN` → Value: your Netlify personal access token
   - Name: `NETLIFY_SITE_ID` → Value: your Netlify site ID

The workflow in `.github/workflows/deploy.yml` is already in the repo. Once these secrets are set, every push to `main` will build and deploy to Netlify.

## Summary

- **GitHub repo:** https://github.com/YOUR_USERNAME/roam-app (after Step 2)
- **Netlify site:** https://YOUR_SITE_NAME.netlify.app (after Step 5)
- **Auto-deploy:** Pushing to `main` triggers the workflow and deploys to Netlify (after secrets are set).
