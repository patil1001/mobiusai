"use server"

import { ApiPromise, WsProvider } from '@polkadot/api'
import { getPeopleWsEndpoint } from './config'

let apiPromise: Promise<ApiPromise> | null = null

/**
 * Lazily create and cache a People chain ApiPromise instance.
 */
export async function getPeopleApi(): Promise<ApiPromise> {
  if (!apiPromise) {
    const endpoint = getPeopleWsEndpoint()
    const provider = new WsProvider(endpoint)
    apiPromise = ApiPromise.create({ provider })
  }
  return apiPromise
}

