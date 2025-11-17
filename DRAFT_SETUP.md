# Draft Build Setup Guide

## What's Fixed in Generated Code

The draft builder automatically injects these fixed credentials into generated code:

### Environment Variables (`.env.local`):
- `NEXTAUTH_URL=http://localhost:{PORT}` - Dynamic per draft
- `NEXTAUTH_SECRET=mobiusai-draft-secret-key-change-in-production` - Fixed for all drafts
- `DATABASE_URL=postgresql://mobius:mobius@db:5432/mobius` - Shared database
- `GOOGLE_CLIENT_ID=851887180420-9j9gmnasvkc2jcr6j7bkj6q28qn4peqc.apps.googleusercontent.com` - Fixed
- `GOOGLE_CLIENT_SECRET=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` - Fixed
- `GROQ_API_KEY={from main app env}` - Passed from parent
- `GROQ_BASE_URL=https://api.groq.com/openai/v1` - Fixed
- `GROQ_MODEL=openai/gpt-oss-120b` - Fixed
- `PORT={3001+}` - Unique port per draft

### Code Fixes Applied:
1. **package.json**: Ensures required scripts (`dev`, `build`, `start`) with correct ports
2. **.env files**: Creates `.env.local` with all required variables
3. **next.config.mjs**: Ensures `output: 'standalone'` for easier deployment
4. **API routes**: All API calls use `process.env.*` instead of hardcoded values

## Files That Need Credentials:

Generated code must reference these via `process.env`:
- `NEXTAUTH_SECRET` - in `app/api/auth/[...nextauth]/route.ts`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - in NextAuth config
- `DATABASE_URL` - in Prisma client
- `GROQ_API_KEY` - in Groq client
- `NEXTAUTH_URL` - in NextAuth callbacks

## Current Implementation:

1. **Draft Builder** (`lib/draftService.ts`):
   - Writes all code files to `.drafts/{projectId}/`
   - Injects credentials into `.env.local` and `.env.example`
   - Fixes `package.json` to ensure correct ports
   - Runs `npm install` and `npm run build`
   - Starts server on unique port (3001, 3002, etc.)
   - Each draft runs on its own port

2. **Draft Proxy** (`app/api/draft/[id]/route.ts`):
   - Proxies requests to the draft server on its assigned port
   - Falls back to static HTML if server not ready

3. **Port Management**:
   - Each project gets a unique port (3001, 3002, 3003...)
   - Ports are mapped per projectId
   - Draft servers run in background

## How to Make It Production-Ready:

### Option 1: Separate Docker Service (Recommended)
```yaml
# docker-compose.yml
services:
  draft-builder:
    image: node:20-alpine
    volumes:
      - ./.drafts:/drafts
    command: tail -f /dev/null
    # Use this to build/serve drafts
```

### Option 2: Reverse Proxy (nginx/traefik)
- Route `/api/draft/{id}` → `localhost:{port}`
- Each draft gets subdomain or path routing

### Option 3: Static Export + CDN
- Build drafts as static exports
- Serve via CDN/static hosting
- Simpler but loses server-side features

## Current Limitations:

1. **Same Network**: Drafts run on same host (localhost ports)
2. **Port Conflicts**: Limited by available ports
3. **Resource Limits**: Multiple Next.js servers consume memory
4. **Build Time**: Each build takes 1-3 minutes

## Future Improvements:

1. **Separate Build Service**: Dedicated container/VM for builds
2. **Queue System**: Queue builds to avoid resource conflicts
3. **Docker-in-Docker**: Build each draft in isolated container
4. **Kubernetes Jobs**: Use K8s jobs for ephemeral builds
5. **Cloud Build**: Offload to AWS CodeBuild / GitHub Actions

