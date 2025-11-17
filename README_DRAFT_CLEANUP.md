# Draft Cleanup System

## Overview

The MobiusAI draft system creates preview builds for each project. Each draft consumes significant disk space (typically 150-300MB) due to `node_modules` and Next.js build outputs.

## Problem

Without cleanup, old drafts can accumulate and consume significant disk space:
- Each draft: ~150-300MB
- 50 drafts: ~10-15GB
- 100 drafts: ~20-30GB

## Solution

We've implemented an automatic cleanup system:

### 1. Automatic Cleanup (Built-in)

The draft service (`lib/draftService.ts`) automatically cleans up old drafts:
- **Age limit**: Removes drafts older than 12 hours
- **Count limit**: Keeps only 5 most recent drafts
- **Minimum age for removal**: 30 minutes (prevents removing active builds)

This runs automatically every time a new draft is built.

### 2. Manual Cleanup Script

Run the cleanup script manually:

```bash
npm run cleanup:drafts
```

This script:
- Stops all running draft processes (ports 3001-3020)
- Removes drafts older than 24 hours
- Keeps only the 5 most recent drafts
- Shows detailed cleanup statistics

### 3. Scheduled Cleanup (Optional)

For production deployments, you can set up a cron job:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/mobius && npm run cleanup:drafts >> /var/log/draft-cleanup.log 2>&1
```

Or use the GitHub Action (`.github/workflows/cleanup-drafts.yml`) if you're using GitHub.

## Configuration

Edit these constants in `lib/draftService.ts` to adjust cleanup behavior:

```typescript
const DRAFT_MAX_AGE_HOURS = 12  // Max age before removal
const DRAFT_MAX_COUNT = 5       // Max number to keep
```

And in `scripts/cleanup-drafts.cjs`:

```javascript
const DRAFT_MAX_AGE_HOURS = 24
const DRAFT_MAX_COUNT = 5
```

## Monitoring

Check current draft disk usage:

```bash
du -sh .drafts
```

List all drafts:

```bash
ls -lah .drafts
```

Check running draft processes:

```bash
lsof -i :3001-3020
```

## Best Practices

1. **Development**: Run cleanup weekly
   ```bash
   npm run cleanup:drafts
   ```

2. **Production**: Set up automatic daily cleanup via cron or GitHub Actions

3. **Emergency**: If disk space is critically low, manually delete all drafts:
   ```bash
   rm -rf .drafts/*
   ```

## Cleanup Results

After implementing this system, we reduced draft disk usage from **17GB to 2.3GB** (freed ~14.7GB).

## Troubleshooting

### Cleanup fails with permission errors

Run with sudo:
```bash
sudo npm run cleanup:drafts
```

### Processes won't stop

Manually kill processes:
```bash
# Find processes on draft ports
lsof -ti:3001-3020

# Kill them
lsof -ti:3001-3020 | xargs kill -9
```

### Disk still full

1. Check if node_modules are being cleaned:
   ```bash
   du -sh .drafts/*/node_modules
   ```

2. Reduce DRAFT_MAX_COUNT to 3 or even 1

3. Consider adding `.drafts` to `.dockerignore` and `.gitignore` (already done)

