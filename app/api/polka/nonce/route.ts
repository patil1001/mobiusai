import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address') || ''
  if (!address) return new Response('address required', { status: 400 })
  const raw = crypto.randomBytes(32).toString('base64url')
  const challenge = `MobiusAI sign-in\nAddress:${address}\nNonce:${raw}\nIssuedAt:${Date.now()}`
  // store hashed value to avoid leaking nonce contents
  const value = crypto.createHash('sha256').update(challenge).digest('base64')
  await prisma.nonce.create({ data: { value, subject: address, purpose: 'signin', expiresAt: new Date(Date.now() + 5 * 60 * 1000) } })
  return new Response(JSON.stringify({ challenge }), { headers: { 'content-type': 'application/json' } })
}

