import { ApiPromise } from '@polkadot/api'
import { getPeopleApi } from './client'

export interface PeopleIdentityInfo {
  hasIdentity: boolean
  display?: string | null
  raw?: unknown
}

export interface PeopleDepositEstimate {
  total?: string
  basic?: string
  perField?: string
}

/**
 * Extract a human-readable display value from the identity registration object.
 */
function extractDisplay(human: any): string | null {
  if (!human) return null
  const info = Array.isArray(human) ? human[0] : human
  const displayValue =
    info?.info?.display?.Raw ??
    info?.info?.display?.raw ??
    info?.info?.display ??
    (Array.isArray(human) ? human[1]?.Raw ?? human[1]?.raw : undefined)
  if (typeof displayValue === 'string') return displayValue
  return null
}

/**
 * Query People chain to determine if an address already has an on-chain identity.
 */
export async function getPeopleIdentity(address: string): Promise<PeopleIdentityInfo> {
  const api = await getPeopleApi()
  const opt = await api.query.identity.identityOf(address)
  if (opt.isNone) {
    return { hasIdentity: false }
  }

  const human = opt.toHuman()
  const display = extractDisplay(human)

  return {
    hasIdentity: true,
    display: display ?? null,
    raw: human,
  }
}

/**
 * Estimate the total deposit required for setting identity.
 */
export async function getPeopleIdentityDepositEstimate(fieldsCount = 1): Promise<PeopleDepositEstimate> {
  const api = await getPeopleApi()
  const basic = api.consts.identity?.basicDeposit
  const perField = api.consts.identity?.fieldDeposit

  if (!basic || !perField) {
    console.warn('[PeopleIdentity] Missing deposit constants from People chain')
    return {}
  }

  const total = basic.add(perField.muln(fieldsCount))
  return {
    basic: basic.toString(),
    perField: perField.toString(),
    total: total.toString(),
  }
}

/**
 * Build a minimal identity info payload suitable for identity.setIdentity(info).
 */
export function buildIdentityInfo(display: string) {
  const trimmed = display.trim()
  return {
    display: { Raw: trimmed },
  }
}

/**
 * Utility for scenarios where an ApiPromise instance is already available.
 */
export async function refreshPeopleIdentity(api: ApiPromise, address: string) {
  const opt = await api.query.identity.identityOf(address)
  if (opt.isNone) return { hasIdentity: false }
  const human = opt.toHuman()
  const display = extractDisplay(human)
  return {
    hasIdentity: true,
    display: display ?? null,
    raw: human,
  }
}

