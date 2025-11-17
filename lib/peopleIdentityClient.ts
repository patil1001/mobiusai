"use client"

export interface PeopleIdentityStatus {
  hasIdentity: boolean
  display?: string | null
  raw?: unknown
}

export async function fetchPeopleIdentityStatus(address: string): Promise<PeopleIdentityStatus> {
  const res = await fetch(`/api/people/identity/status?address=${encodeURIComponent(address)}`)
  if (!res.ok) {
    throw new Error('failed_to_fetch_identity_status')
  }
  return res.json()
}

export async function fetchPeopleDepositEstimate() {
  const res = await fetch('/api/people/identity/deposit')
  if (!res.ok) {
    throw new Error('failed_to_fetch_identity_deposit')
  }
  return res.json()
}

export async function prepareIdentityPayload(address: string, mobiusUsername: string) {
  const res = await fetch('/api/people/identity/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, mobiusUsername }),
  })
  if (!res.ok) {
    throw new Error('failed_to_prepare_identity')
  }
  return res.json()
}

export async function refreshPeopleIdentity(address: string) {
  const res = await fetch('/api/people/identity/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  if (!res.ok) {
    throw new Error('failed_to_refresh_identity')
  }
  return res.json()
}

