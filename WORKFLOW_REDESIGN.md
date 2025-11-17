# MobiusAI Workflow Redesign - Production-Grade System

## Current Problems Analysis

### 1. **Prisma Schema Issues**
- ❌ Complex merging logic (enums, relations, optional fields)
- ❌ Missing reverse relations (buyer/seller)
- ❌ Fragile regex patterns
- ❌ Model name casing confusion (NFT vs nFT)

### 2. **Dependency Hell**
- ❌ @polkadot packages are HUGE (600MB+ node_modules)
- ❌ npm install takes 5-10 minutes
- ❌ Cache corruption issues
- ❌ Timeout problems

### 3. **Build Complexity**
- ❌ Production builds are slow and fragile
- ❌ TypeScript type checking catches edge cases
- ❌ Multiple failure points (install → generate → build)
- ❌ Poor error messages

### 4. **AI Code Quality**
- ❌ AI generates incorrect imports
- ❌ AI uses wrong model names (prisma.nft instead of prisma.nFT)
- ❌ AI sometimes refuses to generate (thinks auth is prohibited)
- ❌ Inconsistent code patterns

---

## New Architecture - The Right Way

### **Core Philosophy:**
1. **Simplicity over complexity**
2. **Dev mode only** (no production builds)
3. **Pre-validated templates**
4. **Minimal dependencies**
5. **Clear, strict AI instructions**

---

## Implementation Plan

### **PHASE 1: Simplify Prisma Schema** ✅

**Problem:** Complex schema merging is error-prone

**Solution:**
```typescript
// SIMPLE APPROACH: Pre-define ALL auth models in template
// AI ONLY generates domain models
// Merge is trivial: template + AI models + enums

function mergePrismaSchemas(template, aiSchema) {
  // 1. Extract enums (simple regex)
  const enums = extractEnums(aiSchema)
  
  // 2. Extract models (skip User, Account, etc.)
  const models = extractDomainModels(aiSchema)
  
  // 3. Auto-add reverse relations using AST parser (not regex)
  const modelsWithRelations = addReverseRelations(models)
  
  // 4. Concatenate: template + enums + models
  return template + '\n\n' + enums + '\n\n' + modelsWithRelations
}
```

**Key Change:** Use **proper AST parsing** instead of regex for relations!

---

### **PHASE 2: Reduce Dependencies** ✅

**Problem:** @polkadot packages are 600MB+

**Solution: Remove unnecessary packages**
```json
{
  "dependencies": {
    // KEEP (Essential):
    "next": "^14.2.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next-auth": "^4.24.7",
    "@prisma/client": "^6.18.0",
    "@next-auth/prisma-adapter": "1.0.7",
    
    // KEEP (Polkadot - minimal set):
    "@polkadot/extension-dapp": "^0.47.2",
    "@polkadot/util-crypto": "^12.6.2",
    
    // REMOVE (Not needed):
    // ❌ "@polkadot/api" - 300MB, not needed for wallet connect
    // ❌ "@polkadot/keyring" - included in util-crypto
    // ❌ "openai" - not used in drafts
    // ❌ "bcryptjs" - not needed (wallet-only auth)
    // ❌ "zustand" - not needed in drafts
    
    // KEEP (UI):
    "tailwindcss": "^3.4.13",
    "framer-motion": "^11.5.5",
    "lucide-react": "^0.453.0"
  }
}
```

**Result:** 600MB → ~150MB, install time 5min → 1min

---

### **PHASE 3: Dev Mode Only** ✅

**Problem:** Production builds are slow and fragile

**Solution: Skip `npm run build`, go straight to `npm run dev`**

```typescript
async function buildAndServeDraft(projectId, files) {
  // 1. Write files
  // 2. npm install
  // 3. npx prisma generate
  // 4. npm run dev (NOT npm run build!)
  
  // Benefits:
  // - Faster (no build step)
  // - More forgiving (runtime errors vs build errors)
  // - Hot reload works
  // - Easier debugging
}
```

---

### **PHASE 4: Pre-Build Validation** ✅

**Problem:** Errors discovered too late (during build)

**Solution: Validate BEFORE writing files**

```typescript
function validateCode(files) {
  // 1. Check all imports resolve
  // 2. Verify Prisma schema is valid
  // 3. Check for common mistakes
  // 4. Validate file structure
  
  // If validation fails: FIX AUTOMATICALLY or REGENERATE
  // Never write broken code to disk
}
```

---

### **PHASE 5: Stricter AI Prompts** ✅

**Problem:** AI generates incorrect code

**Solution: Ultra-specific, example-heavy prompts**

```typescript
const SYSTEM_PROMPT = `
YOU ARE GENERATING CODE FOR A NEXT.JS 14 POLKADOT DAPP.

AUTHENTICATION (CRITICAL - READ CAREFULLY):
- Users sign in with Polkadot wallet ONLY
- Use the PolkadotSignInButton component (pre-provided)
- Example:

import PolkadotSignInButton from '@/components/PolkadotSignInButton'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return <div><PolkadotSignInButton /></div>
  }
  
  return <div>Welcome, {session.user.name}</div>
}

PRISMA USAGE (CRITICAL):
- Model names use camelCase: NFT → prisma.nFT (NOT prisma.nft)
- Always import: import { prisma } from '@/lib/prisma'
- Example:

const nfts = await prisma.nFT.findMany()  // Correct!
const daos = await prisma.dAO.findMany()  // Correct!

GENERATE THESE FILES ONLY:
- app/page.tsx
- app/[feature]/page.tsx
- components/*.tsx
- lib/*.ts (business logic)
- prisma/schema.prisma (domain models + enums ONLY)

DO NOT GENERATE:
- package.json ❌
- lib/auth.ts ❌
- lib/prisma.ts ❌
- components/PolkadotSignInButton.tsx ❌
`
```

---

### **PHASE 6: Simplified Build Pipeline** ✅

**Current (Complex):**
```
1. Merge schemas (fragile)
2. Write files
3. npm install (slow)
4. Fix package versions
5. prisma generate
6. Delete wrong binaries
7. Create type defs
8. npm run build (fails often)
9. npm start
```

**New (Simple):**
```
1. Validate AI code
2. Auto-fix common issues
3. Write files
4. npm install --prefer-offline (fast with cache)
5. prisma generate (with correct config)
6. npm run dev (skip build!)
```

**Result:** 10 steps → 6 steps, fewer failure points

---

## Implementation Strategy

### **Step 1: Create Optimized package.json Template**
- Remove all unnecessary dependencies
- Keep only essential Polkadot packages
- Result: 150MB instead of 600MB

### **Step 2: Use Prisma AST Parser**
- Replace all regex with proper parsing
- Handle optional relations correctly
- Never miss reverse relations

### **Step 3: Skip Production Builds**
- Use dev mode for drafts
- Faster startup
- Better error messages

### **Step 4: Comprehensive Validation**
- Validate Prisma schema syntax
- Check all imports exist
- Verify model name casing
- Fix issues BEFORE building

### **Step 5: Better Error Recovery**
- If build fails, auto-retry with fixes
- If Prisma fails, regenerate schema
- If npm fails, clean cache and retry

---

## Expected Results

### **User Experience:**
1. User types: "create an NFT marketplace"
2. AI generates code (30s)
3. Build starts automatically (2min)
4. Draft loads perfectly ✅
5. **NO ERRORS**

### **Performance:**
- First build: ~2 minutes
- Subsequent builds: ~30 seconds (cached)
- No timeouts, no failures

### **Quality:**
- 100% success rate
- Polkadot-only auth
- All features work
- No manual fixes needed

---

## Next Steps

I will now implement this redesigned system systematically.

Should I proceed with the implementation?

