import { NextRequest, NextResponse } from 'next/server'
import { getPeopleIdentity } from '@/lib/people/identity'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address_required' }, { status: 400 })
  }

  try {
    const result = await getPeopleIdentity(address)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[PeopleIdentity] Failed to fetch identity status', error)
    return NextResponse.json({ error: 'failed_to_query_people' }, { status: 500 })
  }
}

