# Supabase Setup & Migrations

For Google Places (real restaurant data in itineraries), see `docs/ENV_SETUP.md`.

Run these commands in order (requires Homebrew and Supabase CLI):

```bash
# 1. Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# 2. Login to Supabase
supabase login

# 3. Link to project
cd "/Users/quinnbyars/Claude trip app/roam"
supabase link --project-ref byetqukwnanrmupovzev

# 4. Push migrations
supabase db push
```

If brew is not installed, install Homebrew first: https://brew.sh
