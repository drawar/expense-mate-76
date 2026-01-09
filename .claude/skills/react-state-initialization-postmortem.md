# Post-Mortem: MCC Data Loss Incident

## Date: January 9, 2026

## Summary

While attempting to fix an MCC synchronization issue in the expense form, I
introduced a bug that caused MCC (Merchant Category Code) data to be wiped from
all merchants when users edited transactions.

## What Happened

1. User reported that MCC was "disappearing" when editing transactions
2. I incorrectly diagnosed this as a synchronization issue between `selectedMCC`
   state and `defaultValues.mcc`
3. I added a `useEffect` to "sync" the state:
   ```typescript
   useEffect(() => {
     setSelectedMCC(defaultValues?.mcc || null);
   }, [defaultValues?.mcc]);
   ```
4. This useEffect was DESTRUCTIVE - it ran on every render cycle and set
   `selectedMCC` to `null` when `defaultValues?.mcc` was undefined (which
   happens during initial mount before data loads)
5. When users opened the edit form, the MCC was immediately set to null, and
   upon saving, this null value was persisted to the database

## Root Cause

**Misunderstanding of React state initialization patterns.**

The existing code already handled initialization correctly:

```typescript
const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | null>(
  defaultValues?.mcc || null
);
```

This `useState` initializer runs ONCE on mount with the initial value. Adding a
`useEffect` that watches `defaultValues?.mcc` caused:

- The effect to fire when `defaultValues` was still undefined
- Setting state to `null` prematurely
- Overwriting any user selections

## Impact

- **137 merchants** had their MCC JSON data set to null
- **38 transactions** for PriceSmart were affected (merchant had no `mcc_code`
  backup)
- Users saw "Select category" instead of the actual merchant category when
  editing

## Recovery

1. Created `recoverMCC.ts` script to analyze affected merchants
2. Discovered that `mcc_code` column (string) was still intact for most
   merchants
3. Created `executeMCCRecovery.ts` to restore `mcc` JSON from `mcc_code`
4. Manually set PriceSmart's MCC to 5411 (Grocery Stores)
5. Reverted the problematic useEffect

## Lessons Learned

### 1. useState vs useEffect for Initial Values

**WRONG Pattern:**

```typescript
const [state, setState] = useState(null);
useEffect(() => {
  setState(props.initialValue);
}, [props.initialValue]);
```

**CORRECT Pattern:**

```typescript
const [state, setState] = useState(props.initialValue ?? null);
```

Use `useState` initializer for setting initial values from props. Only use
`useEffect` when you need to respond to prop changes AFTER the initial render
AND you explicitly want to override user interactions.

### 2. Test State Changes with Real Data

Before adding state management code:

- Test with actual data in the edit form
- Verify the existing behavior first
- Check what happens during the component lifecycle (mount, data load, user
  interaction)

### 3. Data Redundancy Saved Us

The `mcc_code` (string) column existing alongside `mcc` (JSON) column allowed
recovery. This redundancy pattern is valuable for critical data.

### 4. Never Add useEffect for "Sync" Without Understanding the Timing

useEffect runs AFTER render. If you're trying to "sync" state from props:

- The initial render will use stale/null state
- The effect fires and causes a re-render
- This creates race conditions and flicker

### 5. When Editing Existing Data, Verify Database Impact

Before claiming a fix works:

- Open the edit form
- Save without changes
- Verify the database record wasn't modified unexpectedly

## Prevention Checklist

Before modifying React state initialization:

- [ ] Understand when `useState` initializer runs (once on mount)
- [ ] Understand when `useEffect` runs (after every render matching deps)
- [ ] Check if the existing pattern already handles initialization
- [ ] Test the edit flow with real data before and after changes
- [ ] Verify no data is being set to null/undefined unexpectedly
- [ ] Check database records after save operations

## Related Files

- `src/hooks/useExpenseForm.ts` - The file where the bug was introduced
- `src/scripts/recoverMCC.ts` - Analysis script
- `src/scripts/executeMCCRecovery.ts` - Recovery script
