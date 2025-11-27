# Testing Instructions for Task 1.6

This document provides instructions for testing reward rule CRUD operations both
manually and programmatically.

## Overview

Task 1.6 requires manual testing of reward rule CRUD operations through the UI
and verification of persistence in Supabase. We've created two testing
approaches:

1. **Manual Testing Guide** - Step-by-step UI testing
2. **Automated Test Script** - Programmatic verification

## Option 1: Manual Testing (Recommended for Task 1.6)

Follow the comprehensive guide in `manual-testing-guide.md`:

### Quick Start:

1. **Start the application**

   ```bash
   npm run dev
   ```

2. **Open the application** in your browser (typically http://localhost:5173)

3. **Ensure you're logged in** with a valid user account

4. **Follow the test cases** in `manual-testing-guide.md`:

   - Test Case 1: CREATE a new reward rule
   - Test Case 2: READ - Verify persistence after refresh
   - Test Case 3: UPDATE an existing rule
   - Test Case 4: DELETE a rule
   - Test Case 5: Multiple rules management

5. **Verify in Supabase** after each operation:
   - Open Supabase dashboard
   - Navigate to Table Editor → `reward_rules`
   - Confirm database state matches UI state

### Success Criteria:

✅ All CRUD operations work through the UI ✅ Changes persist in Supabase
database ✅ Changes persist after page refresh ✅ No console errors or failed
requests

## Option 2: Programmatic Testing (Supplementary)

The automated test script can help verify CRUD operations programmatically.

### Running the Test Script:

#### Method A: From Browser Console

1. Start the application and log in
2. Open browser DevTools (F12)
3. Go to Console tab
4. Import and run the test:

   ```javascript
   import { runRewardRuleCRUDTests } from "./src/scripts/testRewardRuleCRUD";
   await runRewardRuleCRUDTests();
   ```

   Or if exposed globally:

   ```javascript
   await window.runRewardRuleCRUDTests();
   ```

#### Method B: Create a Test Page

1. Create a test page component that imports and runs the tests
2. Add a button to trigger the tests
3. View results in console

### Test Script Coverage:

The automated script tests:

- ✅ Database connection
- ✅ User authentication
- ✅ CREATE operation
- ✅ READ operation
- ✅ UPDATE operation
- ✅ DELETE operation
- ✅ Multiple rules management

## Verification Checklist

Use this checklist to confirm task completion:

### CREATE Operation

- [ ] Can create a new reward rule through UI
- [ ] Rule appears immediately in UI after creation
- [ ] Rule exists in Supabase `reward_rules` table
- [ ] All fields are correctly saved (name, description, priority, conditions,
      etc.)
- [ ] `card_type_id` matches the payment method
- [ ] `created_at` and `updated_at` timestamps are set

### READ Operation

- [ ] Rules load correctly when opening the manager
- [ ] Rules persist after browser refresh
- [ ] All rule details are correctly displayed
- [ ] Multiple rules for the same card are all shown

### UPDATE Operation

- [ ] Can edit an existing rule through UI
- [ ] Changes appear immediately in UI
- [ ] Changes persist in Supabase database
- [ ] Changes persist after browser refresh
- [ ] `updated_at` timestamp is updated
- [ ] Rule ID remains the same (no duplicate created)

### DELETE Operation

- [ ] Can delete a rule through UI
- [ ] Rule disappears immediately from UI
- [ ] Rule is removed from Supabase database
- [ ] Deletion persists after browser refresh
- [ ] No orphaned data remains

### General

- [ ] No errors in browser console
- [ ] No failed network requests
- [ ] Logging shows successful operations
- [ ] RLS policies allow operations for authenticated user

## Common Issues and Solutions

### Issue: Rules don't persist after refresh

**Possible Causes:**

- Read-only mode is enabled
- Supabase client not properly initialized
- RLS policies blocking access
- Authentication issues

**Solutions:**

1. Check browser console for errors
2. Verify user is authenticated
3. Check Supabase RLS policies
4. Review RuleRepository logs

### Issue: Type mapping errors

**Possible Causes:**

- Field name mismatches between app and database
- Missing required fields
- Incorrect data types

**Solutions:**

1. Review RuleMapper implementation
2. Check database schema matches application types
3. Verify all required fields are provided

### Issue: Authentication errors

**Possible Causes:**

- User not logged in
- Session expired
- RLS policies too restrictive

**Solutions:**

1. Log in again
2. Check session validity
3. Review RLS policies in Supabase

## Reporting Results

After completing the tests, document your results using the template in
`manual-testing-guide.md`:

```
## Test Execution Results

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]

### Test Case 1: CREATE
- Status: [Pass/Fail]
- Notes: [Any observations]

### Test Case 2: READ
- Status: [Pass/Fail]
- Notes: [Any observations]

### Test Case 3: UPDATE
- Status: [Pass/Fail]
- Notes: [Any observations]

### Test Case 4: DELETE
- Status: [Pass/Fail]
- Notes: [Any observations]

### Overall Result
- [All tests passed / Some tests failed]

### Issues Found
[List any issues discovered]
```

## Next Steps

### If All Tests Pass:

1. Mark task 1.6 as complete
2. Document any observations
3. Proceed to Phase 2: Implement CardTypeIdService

### If Tests Fail:

1. Document the specific failures
2. Review error logs and console output
3. Check implementation against requirements
4. Fix identified issues
5. Re-run tests to verify fixes

## Additional Resources

- **Manual Testing Guide**: `manual-testing-guide.md` - Detailed step-by-step
  instructions
- **Test Script**: `src/scripts/testRewardRuleCRUD.ts` - Automated test
  implementation
- **Requirements**: `requirements.md` - Original requirements (1.2, 1.3, 1.4)
- **Design**: `design.md` - System design and architecture
- **RuleRepository**: `src/core/rewards/RuleRepository.ts` - Implementation to
  test

## Support

If you encounter issues during testing:

1. Check the browser console for error messages
2. Review the RuleRepository logs
3. Verify Supabase connection and authentication
4. Check the manual testing guide for troubleshooting tips
