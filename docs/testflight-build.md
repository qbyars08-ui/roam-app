# ROAM — TestFlight Build Instructions

## Prerequisites
- Apple Developer account (Enrolled in Apple Developer Program)
- Xcode installed (for iOS builds)
- EAS CLI: `npm install -g eas-cli`
- Logged in: `eas login`

---

## 1. Configure EAS (if not done)
```bash
cd roam
eas build:configure
```
Ensure `eas.json` has a `preview` or `production` profile for iOS.

---

## 2. Increment Version (before each build)
Update `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",        // User-facing (e.g. 1.0.1 for patches)
    "ios": {
      "buildNumber": "1"       // Add this — increment for each App Store submission (1, 2, 3...)
    }
  }
}
```
Or use `appVersion` and `ios.buildNumber` in `eas.json` if using remote versioning.

---

## 3. Build for TestFlight (iOS)
```bash
cd roam
eas build --platform ios --profile production
```
- Select credentials (let EAS manage or use existing)
- Wait for build to complete (~15–25 min)

---

## 4. Submit to TestFlight
**Option A — Auto-submit after build:**
```bash
eas build --platform ios --profile production --auto-submit
```

**Option B — Submit existing build:**
```bash
eas submit --platform ios --latest
```
Or by build ID:
```bash
eas submit --platform ios --id <build-id>
```

---

## 5. App Store Connect Setup (one-time)
1. App Store Connect → My Apps → Create app (if new)
2. Bundle ID: `com.roam.app` (must match app.json)
3. Add TestFlight testers (Internal or External group)
4. For External testing: Complete "Export Compliance" and "Content Rights" in App Store Connect

---

## 6. Post-Submit Checklist
- [ ] Build appears in TestFlight within ~30 min
- [ ] Processing completes (may take up to 1 hour)
- [ ] Add build to TestFlight group
- [ ] Internal testers receive invite immediately
- [ ] External testers: Submit for Beta App Review first (24–48 hours)

---

## Troubleshooting
- **Credentials error:** Run `eas credentials` to manage
- **Provisioning profile:** EAS auto-generates; ensure Apple Developer account has correct certs
- **Missing capabilities:** Check `app.json` → `ios.entitlements` for Sign in with Apple, etc.
- **Build fails on native modules:** Run `npx expo prebuild` locally to verify
