import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind') || undefined
  const where: any = { projectId: id }
  if (kind) where.kind = kind
  const items = await prisma.artifact.findMany({ where, orderBy: { createdAt: 'asc' } })
  return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } })
}

