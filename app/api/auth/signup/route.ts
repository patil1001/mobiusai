import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
})

function normalizeEmail(email: string) {
  const lower = email.toLowerCase()
  const [local, domain] = lower.split('@')
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const noPlus = local.split('+')[0]
    const noDots = noPlus.replace(/\./g, '')
    return `${noDots}@gmail.com`
  }
  return lower
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.parse(body)
    const name = parsed.name
    const email = normalizeEmail(parsed.email)
    const password = parsed.password
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 400 })
    const user = await prisma.user.create({ data: { name, email } })
    const hash = await bcrypt.hash(password, 10)
    await prisma.credential.create({ data: { userId: user.id, passwordHash: hash } })
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Signup failed' }), { status: 400 })
  }
}


