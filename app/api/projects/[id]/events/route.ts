import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      let interval: NodeJS.Timeout | null = null
      
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (err) {
          closed = true
          try { controller.close() } catch {}
        }
      }

      const cleanup = () => {
        if (closed) return
        closed = true
        if (interval) {
          clearInterval(interval)
          interval = null
        }
        try { controller.close() } catch {}
      }

      send('connected', { ok: true })

      // initial snapshot
      const [runs, artifacts, messages] = await Promise.all([
        prisma.run.findMany({ where: { projectId: id }, orderBy: { startedAt: 'asc' } }),
        prisma.artifact.findMany({ where: { projectId: id }, orderBy: { createdAt: 'asc' } }),
        prisma.chatMessage.findMany({ where: { projectId: id }, orderBy: { createdAt: 'asc' } })
      ])
      send('snapshot', { runs, artifacts, messages })

      // Track last known state to only emit on changes
      let lastRunState = new Map(runs.map((r: any) => [r.id, { status: r.status, step: r.step }]))
      let lastArtifactIds = new Set(artifacts.map((a: any) => a.id))
      let lastMessageCount = messages.length

      // Poll for changes (only emit when state actually changes)
      interval = setInterval(async () => {
        if (closed) {
          cleanup()
          return
        }
        
        try {
          const [currentRuns, currentArtifacts, currentMessages] = await Promise.all([
            prisma.run.findMany({ where: { projectId: id }, orderBy: { startedAt: 'asc' } }),
            prisma.artifact.findMany({ where: { projectId: id }, orderBy: { createdAt: 'asc' } }),
            prisma.chatMessage.findMany({ where: { projectId: id }, orderBy: { createdAt: 'asc' } })
          ])

          // Check if runs changed (new run or status/step change)
          const currentRunIds = new Set(currentRuns.map((r: any) => r.id))
          const runsChanged = currentRuns.some((r: any) => {
            const last: any = lastRunState.get(r.id)
            return !last || last.status !== r.status || last.step !== r.step
          }) || currentRunIds.size !== lastRunState.size

          // Check if artifacts changed
          const currentArtifactIds = new Set(currentArtifacts.map((a: any) => a.id))
          const artifactsChanged = currentArtifactIds.size !== lastArtifactIds.size || 
            [...currentArtifactIds].some(id => !lastArtifactIds.has(id))

          // Check if messages changed
          const messagesChanged = currentMessages.length !== lastMessageCount

          // Only emit if something actually changed
          if (runsChanged || artifactsChanged || messagesChanged) {
            send('update', { runs: currentRuns, artifacts: currentArtifacts, messages: currentMessages })
            lastRunState = new Map(currentRuns.map((r: any) => [r.id, { status: r.status, step: r.step }]))
            lastArtifactIds = currentArtifactIds
            lastMessageCount = currentMessages.length
          }
        } catch (err) {
          console.error('SSE polling error:', err)
          cleanup()
        }
      }, 1000) // Poll every second

      // Handle abort signal (client disconnect)
      _req.signal.addEventListener('abort', cleanup)
    },
    cancel(reason?: any) {
      // Stream cancellation is handled by abort signal listener in start()
    }
  })
  return new Response(stream, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' } })
}


