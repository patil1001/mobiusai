import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authConfig'
import { prisma } from '@/lib/prisma'
import { getPeopleIdentity } from '@/lib/people/identity'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = await req.json().catch(() => null)
  const address = body?.address as string | undefined

  if (!address) {
    return NextResponse.json({ error: 'address_required' }, { status: 400 })
  }

  const wallet = await prisma.wallet.findUnique({ where: { address } })
  if (!wallet) {
    return NextResponse.json({ error: 'wallet_not_found' }, { status: 404 })
  }

  if (session?.user?.id && wallet.userId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const identity = await getPeopleIdentity(address)
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        peopleIdentityStatus: identity.hasIdentity ? 'set' : 'unknown',
        peopleDisplay: identity.display ?? null,
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.json(identity)
  } catch (error) {
    console.error('[PeopleIdentity] Failed to refresh identity', error)
    return NextResponse.json({ error: 'failed_to_query_people' }, { status: 500 })
  }
}

