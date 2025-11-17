import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { signatureVerify } from '@polkadot/util-crypto'

export async function POST(req: Request) {
  try {
    const { address, challenge, signature } = await req.json()
    if (!address || !challenge || !signature) return new Response('bad request', { status: 400 })
    const value = crypto.createHash('sha256').update(challenge).digest('base64')
    const nonce = await prisma.nonce.findUnique({ where: { value } })
    if (!nonce || nonce.usedAt || nonce.expiresAt < new Date()) return new Response('nonce invalid', { status: 400 })
    const res = signatureVerify(challenge, signature, address)
    if (!res.isValid) return new Response('invalid signature', { status: 400 })
    await prisma.nonce.update({ where: { id: nonce.id }, data: { usedAt: new Date() } })
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'verify failed' }), { status: 400 })
  }
}


