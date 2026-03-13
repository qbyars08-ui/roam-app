#!/usr/bin/env node
/**
 * Injects Supabase URL and anon key into outputs/*.html at build time.
 * Run: SUPABASE_URL=... SUPABASE_ANON=... node scripts/inject-outputs.js
 * Or uses EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON if set.
 */
const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.SUPABASE_ANON || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn(
    'inject-outputs: SUPABASE_URL and SUPABASE_ANON (or EXPO_PUBLIC_*) must be set. ' +
    'Placeholders will remain; outputs pages will not work until configured.'
  );
  process.exit(0); // Don't fail build; allow deploy of main app
}

const outputsDir = path.join(__dirname, '../outputs');

/** Escape for use inside JS string literal (prevents break-out / XSS) */
function escapeForJs(val) {
  return String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/<\/script>/gi, '<\\/script>');
}

function injectInFile(filePath) {
  const fullPath = path.join(outputsDir, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/__SUPABASE_URL__/g, escapeForJs(url));
  content = content.replace(/__SUPABASE_ANON__/g, escapeForJs(anon));
  fs.writeFileSync(fullPath, content);
  console.log('Injected config into', filePath);
}

injectInFile('waitlist.html');
injectInFile('index.html');
injectInFile('trip/index.html');
