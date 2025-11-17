const DEFAULT_MAINNET_WS = 'wss://people-polkadot.api.onfinality.io/public-ws'
const DEFAULT_TESTNET_WS = 'wss://people-westend.api.onfinality.io/public-ws'

export type PeopleEnv = 'mainnet' | 'testnet'

/**
 * Resolve user-provided People chain environment configuration.
 */
export function getPeopleConfig() {
  const env = (process.env.PEOPLE_ENV ?? 'mainnet').toLowerCase() as PeopleEnv
  return {
    env: env === 'testnet' ? 'testnet' : 'mainnet',
    endpoints: {
      mainnet: process.env.PEOPLE_WS_MAINNET || DEFAULT_MAINNET_WS,
      testnet: process.env.PEOPLE_WS_TESTNET || DEFAULT_TESTNET_WS,
    },
  }
}

/**
 * Return the websocket endpoint that should be used for People chain calls.
 */
export function getPeopleWsEndpoint(): string {
  const config = getPeopleConfig()
  return config.env === 'testnet' ? config.endpoints.testnet : config.endpoints.mainnet
}

