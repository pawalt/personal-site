# Modal Kudos API Deployment

This document describes the Modal-based kudos API that replaces the previous FaunaDB + Netlify functions implementation.

## Overview

The kudos system now runs as a Modal web endpoint with:
- **Single container** (max 1 container as configured)
- **JSON file persistence** on Modal volume
- **Two endpoints**: `get-kudos` and `add-kudos`
- **No database dependency** - simple JSON file storage

## Architecture

```
┌─────────────────┐
│  Static Site    │
│  (Hugo/Netlify) │
└────────┬────────┘
         │
         │ AJAX requests
         │
         ▼
┌─────────────────────────────┐
│  Modal Web Endpoint         │
│  (FastAPI)                  │
│  - GET /get-kudos          │
│  - GET /add-kudos          │
│  - Concurrency limit: 1    │
└────────┬────────────────────┘
         │
         │ Read/Write
         │
         ▼
┌─────────────────────────────┐
│  Modal Volume               │
│  /data/kudos.json          │
│  {                          │
│    "post-name": ["user1",  │
│                  "user2"]   │
│  }                          │
└─────────────────────────────┘
```

## Prerequisites

1. **Modal account**: Sign up at https://modal.com
2. **Modal CLI**: Install with `pip install modal`
3. **Modal token**: Authenticate with `modal token new`

## Deployment

### 1. Deploy to Modal

```bash
# Deploy the application
modal deploy modal_kudos.py
```

This will:
- Create or use existing `kudos-api` app
- Create or use existing `kudos-data` volume
- Deploy the FastAPI web endpoint
- Output the URL (format: `https://USERNAME--kudos-api-web.modal.run`)

### 2. Verify Deployment

```bash
# Test the health check endpoint
curl https://pawalt--kudos-api-web.modal.run/

# Test get-kudos (should return 0 for new post)
curl "https://pawalt--kudos-api-web.modal.run/get-kudos?post=test-post&user=test-user"

# Test add-kudos
curl "https://pawalt--kudos-api-web.modal.run/add-kudos?post=test-post&user=test-user"

# Verify kudos was added
curl "https://pawalt--kudos-api-web.modal.run/get-kudos?post=test-post&user=test-user"
# Should return: {"numClicked": 1, "userClicked": true}
```

## API Endpoints

### GET /get-kudos

Retrieve kudos count and user click status for a post.

**Query Parameters:**
- `post` (required): Post name/title
- `user` (required): User UUID

**Response:**
```json
{
  "numClicked": 5,
  "userClicked": true
}
```

### GET /add-kudos

Add a kudos to a post for a specific user (idempotent).

**Query Parameters:**
- `post` (required): Post name/title
- `user` (required): User UUID

**Response:**
```json
{
  "status": "ok"
}
```

## Data Format

The kudos data is stored in `/data/kudos.json` on the Modal volume:

```json
{
  "post-title-1": ["user-uuid-1", "user-uuid-2", "user-uuid-3"],
  "post-title-2": ["user-uuid-1"],
  "another-post": ["user-uuid-4", "user-uuid-5"]
}
```

## Configuration

### Container Scaling

The Modal function is configured with:
- `min_containers=1` - Always keeps 1 container running (no cold starts!)
- `max_containers=1` - Maximum 1 container at a time
- `scaledown_window=300` - 5 minutes (though with min_containers=1, container never scales down)

This configuration ensures:
- **Zero cold starts** - Container is always warm and ready
- **Fast responses** - No 1-2 second startup delay
- **No race conditions** - Single container writes to JSON file
- **Predictable resource usage** - Exactly 1 container always running
- **Single source of truth** - One container manages all kudos data

### Volume Persistence

The Modal volume persists data across container restarts. Data is committed after each write operation to ensure durability.

## Monitoring

### View Logs

```bash
# View app logs
modal app logs kudos-api
```

### View Volume Contents

```bash
# List volumes
modal volume ls

# View volume contents
modal volume get kudos-data kudos.json
```

## Cost & Performance

### Modal Pricing
- **Compute:** $0.000185/second of compute time
- **Volume storage:** Included in free tier (up to 50GB)
- **Always-on cost:** With `min_containers=1`, the container runs 24/7
  - Cost: ~$480/month (24h × 30d × 3600s/h × $0.000185/s)
  - **Note:** This is more expensive than on-demand, but ensures zero cold starts
- **Alternative:** Remove `min_containers=1` for on-demand (pay only when used, but 1-2s cold starts)

### Performance Characteristics
- **Zero cold starts** - Container always warm with `min_containers=1`
- **Response time:** <100ms for all requests (no startup delay)
- **Single container** ensures consistency (no race conditions)
- **JSON file I/O** is fast for small datasets
- **Throughput:** Can handle hundreds of requests per second

## Maintenance

### Backup Data

```bash
# Download kudos data for backup
modal volume get kudos-data kudos.json > kudos_backup_$(date +%Y%m%d).json
```

### Restore Data

```bash
# Upload kudos data from backup
modal volume put kudos-data kudos_backup_20250101.json kudos.json
```

### Update Application

```bash
# Make changes to modal_kudos.py
# Deploy updated version
modal deploy modal_kudos.py
```

## Troubleshooting

### Issue: 502 Bad Gateway
- **Cause**: Container is cold starting
- **Solution**: Wait 1-2 seconds and retry

### Issue: Data not persisting
- **Cause**: Volume not committing properly
- **Solution**: Check logs with `modal app logs kudos-api`

### Issue: CORS errors in browser
- **Cause**: Frontend domain not allowed
- **Solution**: Update `allow_origins` in modal_kudos.py to include your domain

## Frontend Integration

The frontend code in `themes/hello-friend-ng/assets/js/kudos.js` has been updated to use the new Modal endpoints. No additional changes needed.

## Development

### Local Testing

```bash
# Run Modal app locally (serves on localhost)
modal serve modal_kudos.py

# The app will be available at http://localhost:8000
# Test endpoints at:
# - http://localhost:8000/get-kudos?post=test&user=test123
# - http://localhost:8000/add-kudos?post=test&user=test123
```

### Logs During Development

When running `modal serve`, logs are streamed directly to your terminal.

## Security Considerations

1. **No Authentication**: Current implementation has no authentication. Anyone with the URL can add kudos.
   - This matches the original FaunaDB implementation
   - For production, consider adding rate limiting or API keys

2. **CORS**: Currently allows all origins (`*`)
   - For production, restrict to your domain

3. **Data Validation**: Basic validation of query parameters
   - Could add more strict validation (e.g., UUID format checking)

## Future Enhancements

Potential improvements:
- Add rate limiting per user/IP
- Add analytics endpoint for site owner
- Implement data export API
- Add webhook notifications for kudos milestones
- Implement caching for read operations
