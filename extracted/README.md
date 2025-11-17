# MobiusAI

AI platform to build Polkadot dApps from a prompt.

## Dev

1. Create env file:

```bash
cp .env.example .env.local
```

Add:
- GROQ_API_KEY from Groq Cloud (`https://api.groq.com/openai/v1`).
- Optional Azure: AZURE_BLOB_CONNECTION_STRING.

2. Install and run:

```bash
npm i
npm run dev
```

Open http://localhost:3000

## Notes
- Chat endpoint: `app/api/chat/route.ts` uses OpenAI-compatible client to call Groq.
- Dashboard tabs can be toggled; multiple panels resize automatically.
