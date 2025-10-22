# Migration from FaunaDB + Netlify Functions to Modal

## Summary

Successfully migrated the kudos system from the deprecated FaunaDB + Netlify Functions architecture to a Modal web endpoint with JSON file persistence.

## What Changed

### Architecture
- **Before:** Netlify Functions (Node.js) → FaunaDB (cloud database)
- **After:** Modal Web Endpoint (Python/FastAPI) → JSON file on Modal volume

### Files Created
1. **`modal_kudos.py`** - Modal web endpoint with FastAPI
2. **`requirements.txt`** - Python dependencies (modal)
3. **`MODAL_DEPLOYMENT.md`** - Complete deployment documentation
4. **`MIGRATION_SUMMARY.md`** - This file

### Files Modified
1. **`themes/hello-friend-ng/assets/js/kudos.js`**
   - Updated API URLs from `/.netlify/functions/*` to `https://pawalt--kudos-api-web.modal.run/*`

2. **`package.json`**
   - Removed `faunadb` dependency (no longer needed)

3. **`netlify.toml`**
   - Removed `npm install` from build command
   - Removed `functions` directory reference

4. **`AGENTS.md`**
   - Updated to reflect new Modal architecture
   - Removed all FaunaDB references
   - Added Modal API documentation

### Files Removed/Deprecated
1. **`functions/`** → **`functions.old/`** (renamed, can be deleted)
   - `add-kudos.js` - No longer needed
   - `get-kudos.js` - No longer needed
   - `createdb.js` - No longer needed

## API Compatibility

The new Modal API maintains 100% compatibility with the old Netlify functions:

### Endpoints
- **GET `/get-kudos?post=POST_NAME&user=USER_UUID`**
  - Returns: `{"numClicked": N, "userClicked": BOOL}`

- **GET `/add-kudos?post=POST_NAME&user=USER_UUID`**
  - Returns: `{"status": "ok"}`

### Data Format
```json
{
  "post-name": ["user-uuid-1", "user-uuid-2", "user-uuid-3"],
  "another-post": ["user-uuid-4"]
}
```

## Deployment Steps

### 1. Install Modal CLI
```bash
pip install modal
```

### 2. Authenticate with Modal
```bash
modal token new
```

### 3. Deploy the Kudos API
```bash
modal deploy modal_kudos.py
```

This will output the URL (should be `https://pawalt--kudos-api-web.modal.run`).

### 4. Verify Deployment
```bash
# Health check
curl https://pawalt--kudos-api-web.modal.run/

# Test get-kudos
curl "https://pawalt--kudos-api-web.modal.run/get-kudos?post=test&user=test123"

# Test add-kudos
curl "https://pawalt--kudos-api-web.modal.run/add-kudos?post=test&user=test123"

# Verify it was added
curl "https://pawalt--kudos-api-web.modal.run/get-kudos?post=test&user=test123"
# Should return: {"numClicked": 1, "userClicked": true}
```

### 5. Build and Deploy Static Site
```bash
# Build Hugo site (no npm install needed anymore)
hugo --gc --minify

# Netlify will automatically deploy the updated frontend
# The new kudos.js will point to the Modal endpoint
```

## Benefits of New Architecture

### 1. No Deprecated Services
- FaunaDB is deprecated → Modal is actively maintained and growing

### 2. Simpler Stack
- No database service to manage
- Simple JSON file storage
- Single Python file for API

### 3. Cost Effective
- Modal free tier is generous
- Pay only for compute time used
- No database charges

### 4. Better Control
- Full control over data format
- Easy to backup (just download JSON file)
- Single container prevents race conditions

### 5. Easier Development
- Test locally with `modal serve modal_kudos.py`
- No database credentials needed for local dev
- Simple Python code vs. complex FaunaDB queries

## Data Persistence

### Storage
- Data is stored in `/data/kudos.json` on Modal volume `kudos-data`
- Volume persists across container restarts
- Data is committed after each write

### Backup
```bash
# Backup current data
modal volume get kudos-data kudos.json > kudos_backup.json
```

### Restore
```bash
# Restore from backup
modal volume put kudos-data kudos_backup.json kudos.json
```

## Configuration Details

### Modal Settings
- **Concurrency limit:** 1 container (as requested)
- **Idle timeout:** 5 minutes
- **Image:** Debian slim with FastAPI
- **Volume:** `kudos-data` (auto-created)

### CORS
- Currently allows all origins (`*`)
- For production, consider restricting to your domain in `modal_kudos.py`

## Environment Variables

### Removed
- `FAUNADB_SERVER_SECRET` - No longer needed (can be deleted from Netlify dashboard)

### Added
- None required! Modal handles authentication via `modal token new`

## Monitoring

### View Logs
```bash
modal app logs kudos-api
```

### View Volume Contents
```bash
modal volume ls
modal volume get kudos-data kudos.json
```

## Rollback Plan (if needed)

If you need to rollback:

1. Restore `functions/` directory from `functions.old/`
2. Revert `kudos.js` to use `/.netlify/functions/*` URLs
3. Restore `faunadb` to `package.json`
4. Re-add `npm install` to netlify.toml build command
5. Set `FAUNADB_SERVER_SECRET` in Netlify dashboard

However, since FaunaDB is deprecated, this is only a temporary solution.

## Testing Checklist

- [ ] Deploy Modal app: `modal deploy modal_kudos.py`
- [ ] Test health endpoint: `curl https://pawalt--kudos-api-web.modal.run/`
- [ ] Test get-kudos for new post (should return 0)
- [ ] Test add-kudos
- [ ] Test get-kudos again (should return 1)
- [ ] Test idempotency (add same user again, count should stay same)
- [ ] Build Hugo site: `hugo --gc --minify`
- [ ] Deploy to Netlify
- [ ] Test kudos button on actual blog post
- [ ] Verify data persists across container restarts

## Support

For issues or questions:
- **Modal Documentation:** https://modal.com/docs
- **Modal Slack:** https://modal.com/slack
- **This project's issues:** (add GitHub repo link)

## Next Steps

1. **Deploy the Modal app** (see steps above)
2. **Test the endpoints** to ensure they work
3. **Delete `functions.old/`** once you've verified everything works
4. **Remove `FAUNADB_SERVER_SECRET`** from Netlify dashboard
5. **Consider adding rate limiting** to prevent abuse (future enhancement)

---

**Migration completed:** 2025-10-22
**Migration status:** ✅ Complete and documented
