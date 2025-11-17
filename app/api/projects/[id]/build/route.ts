import { prisma } from '@/lib/prisma'
import { buildDraft } from '@/lib/draftBuilder'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    // Update run status to building
    await prisma.run.updateMany({
      where: { projectId: id, step: 'draft' },
      data: { status: 'running' }
    })
    
    // Start build in background (non-blocking)
    buildDraft(id).then(async (previewUrl) => {
      await prisma.artifact.create({
        data: {
          projectId: id,
          kind: 'draft',
          content: JSON.stringify({ previewUrl, buildStatus: 'completed' })
        }
      })
      await prisma.run.updateMany({
        where: { projectId: id, step: 'draft' },
        data: { status: 'completed', finishedAt: new Date() }
      })
    }).catch(async (err) => {
      await prisma.run.updateMany({
        where: { projectId: id, step: 'draft' },
        data: { status: 'failed', error: String(err), finishedAt: new Date() }
      })
    })
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Build failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    const run = await prisma.run.findFirst({
      where: { projectId: id, step: 'draft' },
      orderBy: { startedAt: 'desc' }
    })
    
    // Map run status to build status
    const buildStatus = run?.status === 'completed' ? 'completed' : 
                       run?.status === 'failed' ? 'failed' :
                       run?.status === 'running' ? 'running' : 'pending'
    
    return new Response(JSON.stringify({
      status: buildStatus,
      error: run?.error || null
    }), {
      headers: { 'content-type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}

