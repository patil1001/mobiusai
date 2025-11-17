# REUS NFT Minting App - Fixes Applied

## Issues Fixed

### 1. React Query v5 Compatibility Error ✅
**Problem**: The generated code was using React Query v4 syntax with v5 library, causing the error:
```
TypeError: this[#client].defaultMutationOptions is not a function
```

**Root Cause**: 
- The draft's `package.json` included `@tanstack/react-query@^5.59.1`
- However, the generated code used v4 API syntax (passing mutation function as first argument)
- In React Query v5, the API changed to accept an options object instead

**Fixed Files**:
- `/Users/rushikeshdeelippatil/Downloads/mobius/.drafts/cmi3h506t00014p73i5na5lke/lib/reus/useReusMint.ts`
  - Changed from: `useMutation<TData, TError, TVariables>(mutationFn, { onSuccess: ... })`
  - Changed to: `useMutation<TData, TError, TVariables>({ mutationFn: ..., onSuccess: ... })`
  - Changed `invalidateQueries(['reus', ...])` to `invalidateQueries({ queryKey: ['reus', ...] })`

- `/Users/rushikeshdeelippatil/Downloads/mobius/.drafts/cmi3h506t00014p73i5na5lke/components/reus/ReusMintForm.tsx`
  - Changed `isLoading` to `isPending` (v5 API change)
  - Updated all references in the component

### 2. Project Name Parsing Error ✅
**Problem**: The project was displayed as "d REUS" instead of "REUS"

**Root Cause**: 
- The AI incorrectly extracted "d REUS" from the prompt "create an nft minting app named REUS"
- The "d" was parsed from the word "named"

**Fixed Files**:
- `/Users/rushikeshdeelippatil/Downloads/mobius/.drafts/cmi3h506t00014p73i5na5lke/lib/projectConfig.ts`
  - Changed all instances of "d REUS" to "REUS"
  - Cleaned up feature descriptions to be more concise
  - Improved project summary and metadata

### 3. AI Prompts Updated for Future Generations ✅
**Problem**: Future AI-generated drafts would have the same React Query v5 compatibility issue

**Fixed Files**:
- `/Users/rushikeshdeelippatil/Downloads/mobius/lib/aiPrompts.ts`
  - Added comprehensive React Query v5 usage guidelines
  - Added examples for `useMutation`, `useQuery`, and `invalidateQueries`
  - Added warning to never use v4 syntax or `isLoading` property

## How to Apply the Fixes

### Option 1: Restart the Draft Server (Recommended)
The draft server should automatically pick up the changes. If you're currently viewing the draft:

1. Stop the current draft server if it's running
2. In MobiusAI dashboard, click the "Build" or "Launch" button again
3. The fixed version will be served

### Option 2: Check the Build Status
The fixes are in the draft directory at:
```
/Users/rushikeshdeelippatil/Downloads/mobius/.drafts/cmi3h506t00014p73i5na5lke/
```

All changes are already written to disk and should be active on the next server start.

## What Was Fixed

### React Query v5 Syntax (All Fixed)
```typescript
// ❌ OLD (v4 syntax)
const mutation = useMutation<TData, TError, TVariables>(
  async (params) => { ... },
  { onSuccess: () => { ... } }
)
const { isLoading } = mutation
queryClient.invalidateQueries(['key'])

// ✅ NEW (v5 syntax)
const mutation = useMutation<TData, TError, TVariables>({
  mutationFn: async (params) => { ... },
  onSuccess: () => { ... }
})
const { isPending } = mutation
queryClient.invalidateQueries({ queryKey: ['key'] })
```

### Project Config (All Fixed)
```typescript
// ❌ OLD
name: 'd REUS',
shortName: 'd REUS',
title: 'd REUS',
label: 'Launch d REUS'

// ✅ NEW
name: 'REUS',
shortName: 'REUS',
title: 'REUS',
label: 'Launch REUS'
```

## Testing the Fix

1. Navigate to the REUS draft (port 3099 or the assigned port)
2. Connect your Polkadot wallet
3. Try clicking the "Launch REUS" button
4. The app should now load without the React Query error
5. The title should display as "REUS" (not "d REUS")

## Files Modified

### Draft Files (Project-Specific)
1. `lib/reus/useReusMint.ts` - React Query v5 compatibility
2. `components/reus/ReusMintForm.tsx` - isPending instead of isLoading
3. `lib/projectConfig.ts` - Correct project name and metadata

### System Files (All Future Drafts)
1. `lib/aiPrompts.ts` - Added React Query v5 guidelines

## Status
✅ All fixes applied and ready to test
✅ Future drafts will use correct React Query v5 syntax
✅ Project name correctly displays as "REUS"

## Next Steps
1. Restart the draft server to see the fixes in action
2. Test the NFT minting flow with your Polkadot wallet
3. If you encounter any other issues, check the browser console for detailed error messages

