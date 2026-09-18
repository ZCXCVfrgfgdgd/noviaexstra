# NOVIA

React/Vite messenger with Supabase Auth, profiles, @username search, 1:1 conversations and realtime messages.

## Local

```bash
npm install
npm run dev
```

## Supabase

1. Open Supabase SQL Editor.
2. Paste and run `supabase/schema.sql`.
3. In Vercel add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Redeploy.

Use the `sb_publishable_...` key in the browser. Never put an `sb_secret_...` key in Vite, GitHub, or the browser.

For phone login, enable a Supabase SMS provider under Authentication settings.
