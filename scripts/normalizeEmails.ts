import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizeEmail(email: string | null): string | null {
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

async function main() {
  const users = await prisma.user.findMany({ include: { accounts: true, sessions: true, wallets: true, credentials: true } })
  const targetByEmail = new Map<string, string>()
  for (const u of users) {
    const n = normalizeEmail(u.email)
    if (!n) continue
    if (!targetByEmail.has(n)) targetByEmail.set(n, u.id)
  }

  for (const u of users) {
    const n = normalizeEmail(u.email)
    if (!n) continue
    const targetId = targetByEmail.get(n)!
    // Update user email to normalized
    if (u.email !== n) {
      try { await prisma.user.update({ where: { id: u.id }, data: { email: n } }) } catch {}
    }
    if (u.id === targetId) continue
    // merge into targetId
    await prisma.$transaction([
      prisma.account.updateMany({ where: { userId: u.id }, data: { userId: targetId } }),
      prisma.session.updateMany({ where: { userId: u.id }, data: { userId: targetId } }),
      prisma.wallet.updateMany({ where: { userId: u.id }, data: { userId: targetId } }),
      prisma.credential.updateMany({ where: { userId: u.id }, data: { userId: targetId } }),
    ])
    await prisma.user.delete({ where: { id: u.id } })
    console.log(`Merged user ${u.id} into ${targetId} for email ${n}`)
  }
}

main().then(() => prisma.$disconnect())
  .catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })


