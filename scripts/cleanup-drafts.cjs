#!/usr/bin/env node
/**
 * Cleanup script for draft directories
 * Removes old drafts and frees up disk space
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { rm, readdir, stat } = require('fs/promises');
const { join } = require('path');
const { existsSync } = require('fs');

const execAsync = promisify(exec);

const DRAFT_BASE = join(process.cwd(), '.drafts');
const DRAFT_MAX_AGE_HOURS = 24; // Remove drafts older than 24 hours
const DRAFT_MAX_COUNT = 5; // Keep only 5 most recent drafts

/**
 * Calculate directory size
 */
async function getDirectorySize(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let size = 0;

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules for faster calculation
        if (entry.name === 'node_modules') {
          size += 100 * 1024 * 1024; // Estimate 100MB
        } else {
          size += await getDirectorySize(fullPath);
        }
      } else {
        try {
          const stats = await stat(fullPath);
          size += stats.size;
        } catch {
          // Ignore
        }
      }
    }
    return size;
  } catch {
    return 0;
  }
}

/**
 * Kill processes on draft ports
 */
async function killDraftProcesses() {
  console.log('[Cleanup] Stopping running draft processes...');
  
  for (let port = 3001; port <= 3020; port++) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(Boolean);
      
      for (const pid of pids) {
        try {
          console.log(`[Cleanup] Killing process ${pid} on port ${port}`);
          await execAsync(`kill -9 ${pid}`);
        } catch (err) {
          // Ignore
        }
      }
    } catch {
      // No process on this port
    }
  }
}

/**
 * Clean up old drafts
 */
async function cleanupOldDrafts() {
  if (!existsSync(DRAFT_BASE)) {
    console.log('[Cleanup] No .drafts directory found');
    return;
  }

  console.log('[Cleanup] Scanning draft directories...');
  const entries = await readdir(DRAFT_BASE, { withFileTypes: true });
  const drafts = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const draftPath = join(DRAFT_BASE, entry.name);
      try {
        const stats = await stat(draftPath);
        const size = await getDirectorySize(draftPath);
        drafts.push({
          path: draftPath,
          name: entry.name,
          mtime: stats.mtime,
          size
        });
      } catch (err) {
        console.warn(`[Cleanup] Failed to stat ${draftPath}`);
      }
    }
  }

  console.log(`[Cleanup] Found ${drafts.length} draft directories`);

  // Sort by modification time (newest first)
  drafts.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  const totalSize = drafts.reduce((sum, d) => sum + d.size, 0);
  const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`[Cleanup] Total draft size: ${totalSizeGB} GB`);

  const now = new Date();
  const maxAge = DRAFT_MAX_AGE_HOURS * 60 * 60 * 1000;
  let removedCount = 0;
  let freedSpace = 0;

  // Remove old drafts
  for (const draft of drafts) {
    const age = now.getTime() - draft.mtime.getTime();
    if (age > maxAge) {
      const ageHours = Math.round(age / (60 * 60 * 1000));
      const sizeMB = Math.round(draft.size / (1024 * 1024));
      console.log(`[Cleanup] Removing old draft: ${draft.name} (age: ${ageHours}h, size: ${sizeMB}MB)`);
      
      try {
        await rm(draft.path, { recursive: true, force: true });
        console.log(`[Cleanup] ✅ Removed: ${draft.name}`);
        removedCount++;
        freedSpace += draft.size;
      } catch (err) {
        console.warn(`[Cleanup] Failed to remove ${draft.path}`);
      }
    }
  }

  // Keep only most recent drafts
  const remainingDrafts = drafts.filter(d => {
    const age = now.getTime() - d.mtime.getTime();
    return age <= maxAge;
  });

  const draftsToRemove = remainingDrafts.slice(DRAFT_MAX_COUNT);
  for (const draft of draftsToRemove) {
    const age = now.getTime() - draft.mtime.getTime();
    if (age > 60 * 60 * 1000) {
      const sizeMB = Math.round(draft.size / (1024 * 1024));
      console.log(`[Cleanup] Removing excess draft: ${draft.name} (size: ${sizeMB}MB)`);
      
      try {
        await rm(draft.path, { recursive: true, force: true });
        console.log(`[Cleanup] ✅ Removed: ${draft.name}`);
        removedCount++;
        freedSpace += draft.size;
      } catch (err) {
        console.warn(`[Cleanup] Failed to remove ${draft.path}`);
      }
    }
  }

  const freedSpaceGB = (freedSpace / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`\n[Cleanup] ✅ Cleanup complete!`);
  console.log(`[Cleanup] Removed ${removedCount} drafts`);
  console.log(`[Cleanup] Freed ${freedSpaceGB} GB of disk space`);
  
  const remainingCount = drafts.length - removedCount;
  const remainingSize = totalSize - freedSpace;
  const remainingSizeGB = (remainingSize / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`[Cleanup] Remaining: ${remainingCount} drafts (${remainingSizeGB} GB)`);
}

/**
 * Main
 */
async function main() {
  console.log('========================================');
  console.log('🧹 Draft Cleanup Script');
  console.log('========================================\n');

  await killDraftProcesses();
  await cleanupOldDrafts();

  console.log('\n========================================');
  console.log('✅ Cleanup finished!');
  console.log('========================================');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});

