import { NextResponse } from 'next/server'
import { getPeopleIdentityDepositEstimate } from '@/lib/people/identity'

export async function GET() {
  try {
    const estimate = await getPeopleIdentityDepositEstimate(1)
    return NextResponse.json(estimate)
  } catch (error) {
    console.error('[PeopleIdentity] Failed to fetch deposit estimate', error)
    return NextResponse.json({ error: 'failed_to_query_people' }, { status: 500 })
  }
}

