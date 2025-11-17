# Draft App Architecture Plan

_Last updated: 2025-11-09_

## Goals

- Generate multi-page, production-quality Polkadot dApps directly from the MobiusAI drafting workflow.
- Offer a richer “app shell” with global navigation, theming, and common sections (home, dashboard, activity, settings).
- Deeply integrate Polkadot UI MCP components for wallet UX, token selection, transaction flows, and notifications.
- Keep the generated apps **static-export friendly**, decentralized-storage ready, and easy to customize.

## High-Level Structure

```
app/
  layout.tsx             // wraps in Providers + AppShell
  (marketing)/
    page.tsx             // Home / landing page
  (app)/
    layout.tsx           // Shares AppShell navigation & breadcrumbs
    page.tsx             // Dashboard (balances, quick actions)
    activity/page.tsx    // Recent transactions, extrinsic history
    marketplace/page.tsx // Example vertical: NFT mint/list
    settings/page.tsx    // Network + wallet preferences
components/
  layout/
    AppShell.tsx         // Navigation frame, responsive sidebar/topbar
    NavItems.ts          // Source of navigation config
  polkadot-ui/           // Vendored MCP components (see below)
  wallet/
    WalletPanel.tsx      // Composes AccountInfo, BalanceDisplay, TxNotification
    TxHistoryTable.tsx   // Local state backed via Zustand
  forms/
    MintNftForm.tsx      // Example feature flow using Address/Amount/TxButton
  charts/
    NetworkHealth.tsx    // Placeholder using api/react-query
providers/
  PolkadotUIProvider.tsx // expanded to expose tx queue + network metrics
  PreferenceStore.ts     // zustand store for theme/network selections
lib/
  chains.ts              // Endpoint + asset metadata (default + fallbacks)
  tx/submit.ts           // Helpers wrapping signAndSend + notifications
```

## Polkadot UI MCP Components

Ship the following vendored components inside templates to avoid runtime CLI usage:

| Component             | Purpose                                                                 |
|-----------------------|-------------------------------------------------------------------------|
| `connect-wallet`      | Wallet connection & account selector                                    |
| `network-indicator`   | Network pill with status + block height                                 |
| `require-connection`  | Guard for API connectivity                                              |
| `require-account`     | Guard for selected account                                              |
| `account-info`        | Identity + balances                                                     |
| `balance-display`     | Inline balances                                                         |
| `address-input`       | Validated address entry                                                 |
| `amount-input`        | Token-aware amount entry                                                |
| `select-token`        | Token dropdown                                                          |
| `select-token-dialog` | Full-screen selector                                                    |
| `tx-button`           | Transaction execution with callbacks                                    |
| `tx-notification`     | Persistent toast / status reporter                                      |

## Global Providers

1. **`PolkadotUIProvider`**
   - Lazy loads `@polkadot/extension-dapp` (already implemented).
   - Extend context with:
     - `txQueue` array (`{ id, status, summary }`) + `pushTx/updateTx` helpers.
     - `favoriteAccounts`, persisted via `localStorage`.
     - `endpointPreferences`, respecting `lib/chains.ts` metadata.
   - Emits events consumed by `TxNotification` component.

2. **`PreferenceStore` (Zustand)**
   - Theme (light/dark), open panels, saved filters.
   - Selected portfolio view (NFTs, staking, crowdloans).

3. **`ReactQuery`**
   - Already a dependency; wire default `QueryClientProvider` in layout for async data (staking APRs, prices, etc.).

## Navigation & Layout

- Responsive sidebar with icons, using App Shell pattern.
- Top bar hosts `NetworkIndicator`, `ConnectWallet`, and quick action buttons (`Mint NFT`, `Send Funds`).
- `Breadcrumbs` derived from route segments for clarity.
- Sticky footer with attribution and IPFS deployment hint.

## Branding & Content

- `lib/projectConfig.ts` centralises product name, hero copy, CTA targets, and feature highlights.
- Update `projectConfig.hero` to drive the landing hero headline, subhead, and CTA labels.
- `projectConfig.features` populates the “What you asked MobiusAI to build” cards.
- `projectConfig.app.entryPath` determines the destination for the primary CTA and wallet workflow.
- `projectConfig.keywords`, `themeColor`, and `openGraphImage` power SEO and social previews.

## Core Routes

- **`app/page.tsx`** – landing page shown in the draft preview. It renders hero content from `projectConfig`, the live
  network status, and the wallet connect/CTA buttons. Move “MobiusAI + Polkadot UI” to the footer while keeping it
  visible for attribution.
- **`app/experience/page.tsx`** – intentionally minimal canvas guarded by `RequireConnection` / `RequireAccount`. Replace
  this page (or add new routes) with the flows the user described.

## Reusable Building Blocks

- `components/polkadot-ui/*` continue to expose wallet primitives (connect button, network indicator, tx notifications).
- `components/forms/MintNftForm`, `components/wallet/*`, and `components/charts/NetworkHealth` remain available for AI
  outputs that need richer Polkadot functionality without forcing a console layout.

## Prompt & Workflow Updates

- **System prompt**: emphasize multi-page, AppShell usage, React Query for data, and Polkadot UI components for every wallet touchpoint.
- **User prompt**: Provide skeleton examples for each page and instructions to extend/replace sections based on user spec.
- Encourage AI to:
  - Create additional sections (e.g., staking, governance) as requested by end-user brief.
  - Use `TxButton` + `TxNotification` for every chain interaction.
  - Update Zustand stores + localStorage for persistence.

## Future Enhancements

- Templates for staking dashboards (with `@polkadot/api` staking queries).
- IPFS upload helpers (Pinata integration) once decentralized storage templates are finalized.
- Optional Substrate MCP integration for backend-like flows via MCP calls.

---

This document drives the implementation tasks in `lib/templates.ts`, `lib/aiPrompts.ts`, and `lib/draftService.ts`. Update alongside any template or workflow change.

