# Quick Start: Deploy Kudos API to Modal

This is a quick reference for deploying and managing the kudos API.

## First Time Setup

```bash
# 1. Install Modal
pip install modal

# 2. Authenticate (opens browser for login)
modal token new

# 3. Deploy the API
modal deploy modal_kudos.py

# Output will show URL:
# ✓ Deployed web function! URL: https://pawalt--kudos-api-web.modal.run
```

## Verify It's Working

```bash
# Health check
curl https://pawalt--kudos-api-web.modal.run/

# Test the API
curl "https://pawalt--kudos-api-web.modal.run/get-kudos?post=test&user=abc123"
# Expected: {"numClicked":0,"userClicked":false}

curl "https://pawalt--kudos-api-web.modal.run/add-kudos?post=test&user=abc123"
# Expected: {"status":"ok"}

curl "https://pawalt--kudos-api-web.modal.run/get-kudos?post=test&user=abc123"
# Expected: {"numClicked":1,"userClicked":true}
```

## Common Commands

```bash
# View app logs
modal app logs kudos-api

# Test locally (runs on http://localhost:8000)
modal serve modal_kudos.py

# View volumes
modal volume ls

# Backup data
modal volume get kudos-data kudos.json > backup.json

# Restore data
modal volume put kudos-data backup.json kudos.json

# Redeploy after changes
modal deploy modal_kudos.py
```

## Hugo Build & Deploy

```bash
# Build static site
hugo --gc --minify

# Netlify auto-deploys from 'public/' directory
# Or manually deploy
netlify deploy --prod
```

## Troubleshooting

### Issue: "No module named 'modal'"
**Solution:** `pip install modal`

### Issue: "Not authenticated"
**Solution:** `modal token new`

### Issue: "Connection refused" or "502 Bad Gateway"
**Solution:** Container is cold starting, wait 1-2 seconds and retry

### Issue: Frontend not connecting to API
**Solution:** Check URL in `themes/hello-friend-ng/assets/js/kudos.js` matches your Modal URL

## Architecture

```
Browser → Static Site (Netlify) → Modal API → JSON File (Modal Volume)
```

## Files You Care About

- **`modal_kudos.py`** - The API code
- **`themes/hello-friend-ng/assets/js/kudos.js`** - Frontend code
- **`MODAL_DEPLOYMENT.md`** - Full documentation
- **`MIGRATION_SUMMARY.md`** - What changed from FaunaDB

## That's It!

For detailed documentation, see [MODAL_DEPLOYMENT.md](MODAL_DEPLOYMENT.md).
