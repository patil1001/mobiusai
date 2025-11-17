# People Chain Identity Integration

MobiusAI now integrates with the Polkadot People parachain so that generated dApps can understand whether a connected wallet has already set an on-chain identity and guide the user through the deposit + setIdentity flow.

## Environment

Set the following variables for the backend (Next.js / Node.js):

- `PEOPLE_ENV` – `"mainnet"` (default) or `"testnet"`.
- `PEOPLE_WS_MAINNET` – optional override for the People Polkadot endpoint (defaults to OnFinality public RPC).
- `PEOPLE_WS_TESTNET` – optional override for the People Westend endpoint.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/people/identity/status?address=<address>` | Returns `{ hasIdentity: boolean, display?: string }`. |
| `GET` | `/api/people/identity/deposit` | Returns the estimated bond required to set identity (basic + field deposit). |
| `POST` | `/api/people/identity/prepare` | Body: `{ address, mobiusUsername }`. Requires an authenticated session and returns a minimal `identity.setIdentity` payload based on the username. |
| `POST` | `/api/people/identity/refresh` | Body: `{ address }`. Re-queries People chain, stores the latest status on the wallet record, and returns the latest info. Requires that the wallet belongs to the current user. |

## Recommended Flow for dApps

1. User connects a wallet.
2. Frontend calls `/api/people/identity/status` to see if the wallet already has identity data.
3. If `hasIdentity` is `false` or the display name is outdated:
   - Call `/api/people/identity/deposit` to show the required bond.
   - Call `/api/people/identity/prepare` to get the `identity.setIdentity(info)` payload.
   - Use the Polkadot extension to submit the extrinsic on People chain.
   - Call `/api/people/identity/refresh` so the backend stores the updated status in the `Wallet` table (`peopleIdentityStatus`, `peopleDisplay`).

See `lib/peopleIdentityClient.ts` for a lightweight client helper that Mobius-generated React apps can import.

