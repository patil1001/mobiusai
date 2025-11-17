import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authConfig'
import type { Session } from 'next-auth'

export async function GET(_req: NextRequest) {
  try {
    // CRITICAL: Filter projects by authenticated user
    const session = (await getServerSession(authOptions)) as Session | null
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', items: [] }), { status: 401, headers: { 'content-type': 'application/json' } })
    }

    const userId = (session.user as any)?.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID not found', items: [] }), { status: 401, headers: { 'content-type': 'application/json' } })
    }

    // Fetch ONLY projects owned by this user
    const items = await prisma.project.findMany({ 
      where: { ownerId: userId }, 
      orderBy: { updatedAt: 'desc' }, 
      select: { id: true, title: true, createdAt: true, updatedAt: true } 
    })
    return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'failed', items: [] }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}

