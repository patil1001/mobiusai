# ✅ Draft Cleanup Complete!

## Summary

Successfully cleaned up old Docker drafts and implemented an automatic cleanup system to prevent future disk space issues.

## What Was Done

### 1. 🧹 Immediate Cleanup
- **Removed**: 34 old draft directories
- **Freed**: ~14.7 GB of disk space
- **Before**: 17 GB (39 drafts)
- **After**: 2.3 GB (5 drafts)
- **Space Saved**: 86% reduction

### 2. 🔧 Enhanced Auto-Cleanup System
Updated `lib/draftService.ts` with more aggressive cleanup:
- Max age: 24h → **12 hours**
- Max count: 10 → **5 drafts**
- Min age for removal: 1h → **30 minutes**

This runs automatically when building new drafts.

### 3. 📜 Manual Cleanup Script
Created `scripts/cleanup-drafts.cjs` with comprehensive cleanup:

**Run it anytime:**
```bash
npm run cleanup:drafts
```

**What it does:**
- Stops all running draft processes
- Removes drafts older than 24 hours
- Keeps only 5 most recent drafts
- Shows detailed statistics

### 4. 🤖 Optional Scheduled Cleanup
Created GitHub Action (`.github/workflows/cleanup-drafts.yml`):
- Runs daily at 2 AM UTC
- Can be triggered manually
- Perfect for production environments

### 5. 📝 Documentation
Created comprehensive documentation:
- `README_DRAFT_CLEANUP.md` - Full cleanup guide
- `DRAFT_CLEANUP_SUMMARY.md` - Detailed report
- This file - Quick reference

### 6. 🚫 Git/Docker Ignore
- Added `.drafts/` to `.gitignore`
- Already in `.dockerignore`

## How to Use

### Automatic (No Action Needed)
The system now automatically cleans up old drafts when building new previews.

### Manual Cleanup (Run Weekly)
```bash
npm run cleanup:drafts
```

### Monitor Disk Usage
```bash
# Check total draft size
du -sh .drafts

# Count drafts
ls .drafts | wc -l

# List all drafts
ls -lh .drafts
```

### Emergency Cleanup
If disk is critically low:
```bash
# Remove ALL drafts
rm -rf .drafts/*
```

## Configuration

Want to adjust cleanup behavior? Edit `lib/draftService.ts`:

```typescript
const DRAFT_MAX_AGE_HOURS = 12  // Max age before removal
const DRAFT_MAX_COUNT = 5       // Max number to keep
```

Or edit `scripts/cleanup-drafts.cjs` for manual cleanup settings.

## Results

| Metric | Value |
|--------|-------|
| ✅ Drafts Removed | 34 |
| ✅ Space Freed | 14.7 GB |
| ✅ Current Usage | 2.3 GB |
| ✅ Drafts Remaining | 5 |
| ✅ Reduction | 86% |

## Why This Matters

Each draft preview contains:
- Full `node_modules` directory (~150-200 MB)
- Next.js build output (`.next/` ~50-100 MB)
- Source code and dependencies

Without cleanup, drafts can quickly consume:
- 50 drafts = ~10-15 GB
- 100 drafts = ~20-30 GB
- 200 drafts = ~40-60 GB

The new system ensures **maximum 5 drafts** are kept, preventing disk space issues.

## Next Steps

### For Development
Just continue working - cleanup is automatic!

### For Production
Consider setting up a cron job:
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/mobius && npm run cleanup:drafts >> /var/log/draft-cleanup.log 2>&1
```

Or use the GitHub Action if using GitHub.

### For Monitoring
Run weekly manual cleanup:
```bash
npm run cleanup:drafts
```

## Troubleshooting

### "Permission denied" errors
Run with appropriate permissions:
```bash
sudo npm run cleanup:drafts
```

### Processes won't stop
Manually kill processes:
```bash
lsof -ti:3001-3020 | xargs kill -9
```

### Still running out of space
1. Reduce `DRAFT_MAX_COUNT` to 3 or even 1
2. Reduce `DRAFT_MAX_AGE_HOURS` to 6 or even 1
3. Run manual cleanup more frequently

---

**Status**: ✅ **COMPLETE**

The draft cleanup system is now fully operational. Your app previews should work without disk space issues!

**Files Created/Modified:**
- ✅ `scripts/cleanup-drafts.cjs` - Cleanup script
- ✅ `lib/draftService.ts` - Enhanced auto-cleanup
- ✅ `package.json` - Added cleanup script
- ✅ `.gitignore` - Added .drafts/
- ✅ `.github/workflows/cleanup-drafts.yml` - Scheduled cleanup
- ✅ `README_DRAFT_CLEANUP.md` - Full documentation
- ✅ `DRAFT_CLEANUP_SUMMARY.md` - Detailed report
- ✅ This file - Quick reference

