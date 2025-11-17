import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { signatureVerify, cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function normalizeEmail(email?: string | null) {
  if (!email) return null
  const lower = email.toLowerCase()
  const [local, domain] = lower.split('@')
  if (!domain) return lower
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const noPlus = local.split('+')[0]
    const noDots = noPlus.replace(/\./g, '')
    return `${noDots}@gmail.com`
  }
  return lower
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
      profile(profile) {
        return {
          id: (profile as any).sub,
          name: profile.name || profile.email?.split('@')[0] || 'Google User',
          email: normalizeEmail(profile.email),
          image: (profile as any).picture || null
        }
      }
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(creds) {
        const email = normalizeEmail(creds?.email as string)
        const password = creds?.password as string
        if (!email || !password) return null
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const cred = await prisma.credential.findUnique({ where: { userId: user.id } })
        if (!cred) return null
        const ok = await bcrypt.compare(password, cred.passwordHash)
        if (!ok) return null
        return { id: user.id, name: user.name || email.split('@')[0], email: user.email || undefined, image: user.image || undefined }
      }
    }),
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
          const user = await prisma.user.create({ data: { name: `polkadot:${address.slice(0,6)}…`, email: null } })
          await prisma.wallet.create({ data: { userId: user.id, address, lastUsedAt: new Date() } })
          userId = user.id
        } else {
          await prisma.wallet.update({ where: { address }, data: { lastUsedAt: new Date() } })
        }
        await prisma.nonce.update({ where: { id: nonce.id }, data: { usedAt: new Date() } })
        return { id: userId, name: `polkadot:${address.slice(0,6)}…`, email: `${address}@substrate.local` }
      }
    })
  ],
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider !== 'google') return true
      const email = normalizeEmail(user?.email || (profile as any)?.email)
      if (!email) return false
      const existing = await prisma.user.findUnique({ where: { email } })
      const byAcct = await prisma.account.findFirst({ where: { provider: 'google', providerAccountId: account.providerAccountId } })
      if (existing) {
        if (byAcct && byAcct.userId !== existing.id) {
          await prisma.account.update({ where: { id: byAcct.id }, data: { userId: existing.id } })
        } else if (!byAcct) {
          await prisma.account.create({
            data: {
              userId: existing.id,
              type: account.type,
              provider: 'google',
              providerAccountId: account.providerAccountId
            }
          })
        }
        return true
      }
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

