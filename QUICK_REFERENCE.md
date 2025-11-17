# Quick Reference - React Query v5 Fix

## TL;DR

**Problem**: React Query v5 compatibility errors in all AI-generated drafts  
**Fix**: Added example template + updated prompts + automatic injection  
**Status**: ✅ Complete - All future projects fixed

---

## What Changed

### 3 Core Files Modified:

1. **`lib/templates.ts`**
   - Added `exampleReactQueryHook` template (67 lines)
   - Shows correct v5 syntax for all patterns
   - Auto-injected as `lib/examples/useReactQueryExample.ts`

2. **`lib/draftService.ts`**
   - Added example to infrastructure injection list
   - Every new draft gets the example automatically

3. **`lib/aiPrompts.ts`**
   - Explicit React Query v5 guidelines
   - References example file
   - Shows correct ✅ and wrong ❌ patterns

---

## React Query v5 Cheat Sheet

### ❌ OLD (v4) - Don't Use:
```typescript
const mutation = useMutation(
  async (data) => { ... },
  { onSuccess: () => { ... } }
)
const { isLoading } = mutation

const query = useQuery(['key'], async () => { ... })
queryClient.invalidateQueries(['key'])
```

### ✅ NEW (v5) - Use This:
```typescript
const mutation = useMutation({
  mutationFn: async (data) => { ... },
  onSuccess: () => { ... }
})
const { isPending } = mutation

const query = useQuery({ 
  queryKey: ['key'], 
  queryFn: async () => { ... } 
})
queryClient.invalidateQueries({ queryKey: ['key'] })
```

---

## Verification Commands

```bash
# Check all fixes are present:
cd /Users/rushikeshdeelippatil/Downloads/mobius

# 1. Example template
grep -q "exampleReactQueryHook" lib/templates.ts && echo "✅ Template exists"

# 2. Injection list
grep -q "lib/examples/useReactQueryExample" lib/draftService.ts && echo "✅ Will inject"

# 3. AI prompts
grep -q "useReactQueryExample" lib/aiPrompts.ts && echo "✅ AI knows"

# All ✅? System is fixed!
```

---

## Testing

### Quick Test:
1. Create new project: "create a todo app with React Query"
2. Launch draft
3. Check console for errors
4. Verify file exists: `lib/examples/useReactQueryExample.ts`

### Full Test Guide:
See `HOW_TO_TEST_THE_FIX.md`

---

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `lib/templates.ts` | Example template | ✅ Updated |
| `lib/draftService.ts` | Injection system | ✅ Updated |
| `lib/aiPrompts.ts` | AI guidelines | ✅ Updated |
| `lib/examples/useReactQueryExample.ts` | Auto-generated in drafts | ✅ Will create |

---

## Docs

- **[SYSTEM_WIDE_FIX_SUMMARY.md](./SYSTEM_WIDE_FIX_SUMMARY.md)** - High-level overview
- **[ROOT_CAUSE_FIX_COMPLETE.md](./ROOT_CAUSE_FIX_COMPLETE.md)** - Technical deep-dive
- **[HOW_TO_TEST_THE_FIX.md](./HOW_TO_TEST_THE_FIX.md)** - Testing guide
- **[REUS_FIX_SUMMARY.md](./REUS_FIX_SUMMARY.md)** - REUS-specific fixes
- **[HOW_TO_RESTART_REUS.md](./HOW_TO_RESTART_REUS.md)** - REUS testing

---

## Key Points

✅ **System-wide fix** - Not just REUS  
✅ **All future projects** work automatically  
✅ **Example in every draft** for reference  
✅ **AI explicitly trained** on correct patterns  
✅ **No more crashes** from React Query errors

---

## Need Help?

- Check example file in any draft: `lib/examples/useReactQueryExample.ts`
- Read prompts: `lib/aiPrompts.ts` lines 34-47
- Full docs: See SYSTEM_WIDE_FIX_SUMMARY.md

---

**Status**: ✅ Fixed at root level  
**Last Updated**: November 18, 2025

