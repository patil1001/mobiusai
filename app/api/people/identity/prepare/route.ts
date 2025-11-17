import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { buildIdentityInfo } from '@/lib/people/identity'
import { authOptions } from '@/lib/authConfig'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const address = body?.address as string | undefined
  const mobiusUsername = body?.mobiusUsername as string | undefined

  if (!address || !mobiusUsername) {
    return NextResponse.json({ error: 'address_and_username_required' }, { status: 400 })
  }

  // Optional sanity check: ensure provided username matches the current session profile if present.
  if (session.user.name && session.user.name !== mobiusUsername) {
    console.warn(
      `[PeopleIdentity] Username mismatch for user ${session.user.id || 'unknown'} (${session.user.name} vs ${mobiusUsername})`
    )
  }

  const info = buildIdentityInfo(mobiusUsername)
  return NextResponse.json({ address, info })
}

