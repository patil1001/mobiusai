import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Cleanup API endpoint for Vercel Cron
 * Runs every 6 hours to clean up old draft directories
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cleanup",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cleanup] Running scheduled cleanup...')

    // Run the cleanup script
    const { stdout, stderr } = await execAsync('npm run cleanup:drafts', {
      cwd: process.cwd(),
      timeout: 30000,
    })

    console.log('[Cleanup] Stdout:', stdout)
    if (stderr) console.warn('[Cleanup] Stderr:', stderr)

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      timestamp: new Date().toISOString(),
      output: stdout,
    })
  } catch (error: any) {
    console.error('[Cleanup] Failed:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request)
}

