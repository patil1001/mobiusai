# How to Test the Root Cause Fix

## Quick Test - Create a New Project

The best way to verify the fix is to create a brand new project that uses React Query:

### Test 1: Simple Data Fetching App
```
Prompt: "Create a weather dashboard that fetches data from an API using React Query"
```

**Expected Result**:
- ✅ Draft builds successfully
- ✅ File `lib/examples/useReactQueryExample.ts` exists
- ✅ AI-generated hooks use `useMutation({ mutationFn: ... })` syntax
- ✅ AI-generated hooks use `isPending` (NOT `isLoading`)
- ✅ No React Query errors in browser console

### Test 2: User Management App
```
Prompt: "Create a user management app with create, read, update, delete operations using React Query"
```

**Expected Result**:
- ✅ All CRUD operations use correct React Query v5 syntax
- ✅ Mutations use `mutationFn` option
- ✅ Components use `isPending` for loading states
- ✅ No TypeScript errors
- ✅ App runs without crashes

### Test 3: NFT App (Like REUS)
```
Prompt: "Create an NFT minting app with Polkadot integration"
```

**Expected Result**:
- ✅ Same as previous tests
- ✅ Polkadot integration works alongside React Query
- ✅ Transaction hooks use correct v5 syntax

## Manual Verification Steps

### Step 1: Check Template System
```bash
# From project root
cd /Users/rushikeshdeelippatil/Downloads/mobius

# Verify example template exists
grep -A 10 "exampleReactQueryHook" lib/templates.ts

# Should show the React Query v5 example hook code
```

### Step 2: Check Draft Builder
```bash
# Verify the example will be injected
grep "useReactQueryExample" lib/draftService.ts

# Should show it in the infrastructureFiles array
```

### Step 3: Check AI Prompts
```bash
# Verify AI will see the guidelines
grep -A 5 "REACT QUERY v5" lib/aiPrompts.ts

# Should show explicit v5 syntax examples
```

### Step 4: Create Test Draft
```bash
# 1. Go to MobiusAI dashboard in browser
# 2. Click "New Project"
# 3. Enter prompt: "create a simple todo app with React Query for data fetching"
# 4. Wait for build to complete
# 5. Click "Launch" to open the draft
```

### Step 5: Verify Generated Files
```bash
# After draft is created, check the .drafts directory
# Replace PROJECT_ID with actual ID

cd .drafts/PROJECT_ID

# Verify example file exists
ls -la lib/examples/useReactQueryExample.ts

# Check AI-generated hooks
find . -name "*.ts" -o -name "*.tsx" | xargs grep "useMutation"

# Should see: useMutation({ mutationFn: ... })
# Should NOT see: useMutation(async () => { ... }, { ... })
```

### Step 6: Run the Draft
```bash
# From draft directory
npm run dev

# Open browser to http://localhost:XXXX (check terminal for port)
# Open DevTools Console (F12)
# Look for errors - should be NONE related to React Query
```

## What to Look For

### ✅ Good Signs (Fix Working):
- File `lib/examples/useReactQueryExample.ts` present in draft
- AI-generated code uses `{ mutationFn: ... }` syntax
- AI-generated code uses `isPending` not `isLoading`
- No `defaultMutationOptions is not a function` errors
- No TypeScript compilation errors
- App runs smoothly

### ❌ Bad Signs (Fix Not Working):
- Missing example file
- AI uses `useMutation(fn, options)` instead of `useMutation({ mutationFn: fn })`
- AI uses `isLoading` instead of `isPending`
- React Query runtime errors
- TypeScript errors about mutation options

## Debugging If Test Fails

### If Example File is Missing:
```bash
# Check templates.ts
grep "useReactQueryExample" lib/templates.ts

# Should appear in:
# 1. TEMPLATES.exampleReactQueryHook = `...`
# 2. IMMUTABLE_FILES array
# 3. getTemplate() function

# Check draftService.ts
grep "useReactQueryExample" lib/draftService.ts

# Should appear in infrastructureFiles array
```

### If AI Still Generates Wrong Syntax:
```bash
# Check AI prompts are updated
grep -C 10 "REACT QUERY v5" lib/aiPrompts.ts

# Verify it mentions:
# - Reference lib/examples/useReactQueryExample.ts
# - Shows correct v5 syntax
# - Shows wrong v4 syntax with ❌
```

### If Draft Build Fails:
```bash
# Check the draft build logs
cd .drafts/PROJECT_ID
cat build.log  # or check terminal output

# Common issues:
# - npm install failed → Check internet connection
# - TypeScript errors → Check AI-generated code
# - Missing files → Check template injection
```

## Quick Verification Commands

Run these to verify the fix without creating a new project:

```bash
cd /Users/rushikeshdeelippatil/Downloads/mobius

# 1. Check example template exists and is complete
wc -l lib/templates.ts  # Should be ~3780 lines

# 2. Check IMMUTABLE_FILES includes example
grep -n "lib/examples/useReactQueryExample" lib/templates.ts
# Should show: ~line 3712

# 3. Check draftService includes example
grep -n "lib/examples/useReactQueryExample" lib/draftService.ts
# Should show: ~line 1017

# 4. Check AI prompts reference it
grep -n "useReactQueryExample" lib/aiPrompts.ts
# Should show: ~line 36 and ~line 87

# 5. All checks pass? Fix is applied! ✅
```

## Expected Timeline

- **Immediate**: System files updated (templates, draftService, prompts)
- **Next Draft**: All new projects will use correct syntax
- **Existing Drafts**: Need manual rebuild or fixes applied

## Rollback (If Needed)

If something breaks:

```bash
# Revert changes
git diff lib/templates.ts
git diff lib/draftService.ts
git diff lib/aiPrompts.ts

# If needed
git checkout lib/templates.ts
git checkout lib/draftService.ts
git checkout lib/aiPrompts.ts
```

---

## Success Criteria

The fix is working correctly when:

1. ✅ New projects contain `lib/examples/useReactQueryExample.ts`
2. ✅ AI-generated hooks use `useMutation({ mutationFn: ... })`
3. ✅ AI-generated components use `isPending`
4. ✅ No React Query runtime errors
5. ✅ All drafts build and run successfully

---

**Ready to Test!** Create a new project and verify the fix works.

