import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const items = await prisma.chatMessage.findMany({ where: { projectId: id }, orderBy: { createdAt: 'asc' }, select: { id: true, role: true, content: true, createdAt: true } })
  return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } })
}
