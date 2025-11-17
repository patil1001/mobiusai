/**
 * Template for lib/auth.ts - NextAuth configuration
 * This file is used by generated drafts to provide authOptions
 */

export const AUTH_TEMPLATE = `import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { signatureVerify, cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      id: 'polkadot',
      name: 'Polkadot',
      credentials: {
        address: { label: 'address', type: 'text' },
        challenge: { label: 'challenge', type: 'text' },
        signature: { label: 'signature', type: 'text' }
      },
      async authorize(creds) {
        const address = creds?.address as string
        const signature = creds?.signature as string
        const challenge = creds?.challenge as string
        if (!address || !signature || !challenge) return null
        const value = crypto.createHash('sha256').update(challenge).digest('base64')
        const nonce = await prisma.nonce.findUnique({ where: { value } })
        if (!nonce || nonce.usedAt || nonce.expiresAt < new Date() || nonce.subject !== address) return null
        try { decodeAddress(address) } catch { return null }
        await cryptoWaitReady()
        const res = signatureVerify(challenge, signature, address)
        if (!res.isValid) return null
        const existingWallet = await prisma.wallet.findUnique({ where: { address } })
        let userId = existingWallet?.userId
        if (!userId) {
          const user = await prisma.user.create({ data: { name: \`polkadot:\${address.slice(0,6)}…\`, email: null } })
          await prisma.wallet.create({ data: { userId: user.id, address } })
          userId = user.id
        }
        await prisma.nonce.update({ where: { id: nonce.id }, data: { usedAt: new Date() } })
        return { id: userId, name: \`polkadot:\${address.slice(0,6)}…\`, email: \`\${address}@substrate.local\` }
      }
    })
  ],
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      return true
    },
    async jwt({ token, user }: any) {
      if (user?.id) (token as any).uid = user.id
      return token
    },
    async session({ session, token }: any) {
      if ((token as any)?.uid) (session.user as any).id = (token as any).uid
      return session
    }
  }
}
`

