# Manual Testing Guide for Reward Rule CRUD Operations

This guide provides step-by-step instructions for manually testing reward rule
Create, Read, Update, and Delete operations through the UI and verifying
persistence in Supabase.

## Prerequisites

1. Application is running locally (typically `npm run dev` or similar)
2. User is authenticated and logged in
3. Access to Supabase dashboard or database client
4. At least one credit card payment method exists in the system

## Test Environment Setup

### 1. Start the Application

```bash
npm run dev
```

### 2. Access Supabase Dashboard

- Navigate to your Supabase project dashboard
- Go to Table Editor
- Select the `reward_rules` table
- Keep this tab open for verification throughout testing

## Test Case 1: CREATE - Add a New Reward Rule

### Steps:

1. **Navigate to Payment Methods Page**

   - Open the application in your browser
   - Click on "Payment Methods" in the navigation menu

2. **Select a Credit Card**

   - If no credit cards exist, create one first
   - Click on a credit card in the carousel to select it

3. **Open Reward Rules Manager**

   - In the payment method details, click "Manage Reward Rules"
   - A dialog should open showing the RewardRuleManager component

4. **Create a New Rule**

   - Click the "Create Rule" button
   - Fill in the form with test data:
     - **Name**: "Test Grocery Bonus"
     - **Description**: "5x points on grocery purchases"
     - **Enabled**: Toggle ON (checked)
     - **Priority**: 1
     - **Condition Type**: Select "MCC" (Merchant Category Code)
     - **Operation**: "Include"
     - **Values**: Add "5411" (Grocery Stores)
     - **Bonus Tiers**: (Optional) Add a tier if desired

5. **Save the Rule**
   - Click the "Save" button
   - The dialog should close and return to the rules list
   - The new rule should appear in the list

### Verification in Supabase:

1. Go to Supabase dashboard → Table Editor → `reward_rules`
2. Look for the newly created rule
3. Verify the following fields:
   - `name` = "Test Grocery Bonus"
   - `description` = "5x points on grocery purchases"
   - `enabled` = true
   - `priority` = 1
   - `card_type_id` matches the payment method's card type ID
   - `conditions` contains the MCC condition as JSON
   - `created_at` and `updated_at` timestamps are set

### Expected Result:

✅ Rule appears in UI immediately after creation ✅ Rule persists in Supabase
database with all correct fields ✅ No errors in browser console or application
logs

---

## Test Case 2: READ - Verify Rule Appears After Page Refresh

### Steps:

1. **With the rule created in Test Case 1**

   - Note the rule details currently visible in the UI

2. **Refresh the Browser**

   - Press F5 or Ctrl+R (Cmd+R on Mac)
   - Wait for the page to fully reload

3. **Navigate Back to Reward Rules**

   - Go to Payment Methods page
   - Select the same credit card
   - Click "Manage Reward Rules"

4. **Verify Rule is Still Present**
   - The "Test Grocery Bonus" rule should still be visible
   - All details should match what was entered

### Verification in Supabase:

1. Refresh the Supabase table view
2. Confirm the rule still exists with the same ID
3. Verify no duplicate entries were created

### Expected Result:

✅ Rule persists after page refresh ✅ All rule details are correctly loaded
from database ✅ Rule count matches between UI and database

---

## Test Case 3: UPDATE - Edit an Existing Reward Rule

### Steps:

1. **Open the Rule for Editing**

   - Navigate to the reward rules list for the credit card
   - Find the "Test Grocery Bonus" rule
   - Click the Edit icon (pencil icon) next to the rule

2. **Modify the Rule**

   - Change **Name** to: "Updated Grocery Bonus"
   - Change **Description** to: "10x points on grocery purchases - updated"
   - Change **Priority** to: 2
   - Keep other fields the same

3. **Save the Changes**
   - Click the "Save" button
   - The dialog should close
   - The updated rule should appear in the list with new values

### Verification in Supabase:

1. Go to Supabase dashboard → Table Editor → `reward_rules`
2. Find the rule by its ID (should be the same ID as before)
3. Verify the following fields were updated:

   - `name` = "Updated Grocery Bonus"
   - `description` = "10x points on grocery purchases - updated"
   - `priority` = 2
   - `updated_at` timestamp is newer than `created_at`
   - `id` remains the same (not a new record)

4. **Refresh the Browser and Verify Persistence**
   - Refresh the page (F5)
   - Navigate back to the reward rules
   - Confirm the updated values are still present

### Expected Result:

✅ Rule updates are saved immediately ✅ Changes persist in Supabase database ✅
Changes persist after page refresh ✅ No duplicate rules are created ✅ Rule ID
remains unchanged

---

## Test Case 4: DELETE - Remove a Reward Rule

### Steps:

1. **Locate the Rule to Delete**

   - Navigate to the reward rules list for the credit card
   - Find the "Updated Grocery Bonus" rule

2. **Delete the Rule**
   - Click the Delete icon (trash icon) next to the rule
   - If a confirmation dialog appears, confirm the deletion
   - The rule should disappear from the list immediately

### Verification in Supabase:

1. Go to Supabase dashboard → Table Editor → `reward_rules`
2. Search for the deleted rule by its ID
3. Verify the rule no longer exists in the database

4. **Refresh the Browser and Verify Deletion Persists**
   - Refresh the page (F5)
   - Navigate back to the reward rules
   - Confirm the rule is still not present

### Expected Result:

✅ Rule is removed from UI immediately ✅ Rule is deleted from Supabase database
✅ Deletion persists after page refresh ✅ No orphaned data remains in database

---

## Test Case 5: Multiple Rules - Create and Manage Multiple Rules

### Steps:

1. **Create Multiple Rules**

   - Create 3 different reward rules with different names:
     - "Dining Bonus" (MCC 5812 - Restaurants)
     - "Gas Bonus" (MCC 5541 - Gas Stations)
     - "Travel Bonus" (MCC 4511 - Airlines)

2. **Verify All Rules Appear**

   - All 3 rules should be visible in the rules list
   - Each should have distinct names and conditions

3. **Edit One Rule**

   - Edit the "Dining Bonus" rule
   - Change its priority to 3
   - Save the changes

4. **Delete One Rule**

   - Delete the "Gas Bonus" rule

5. **Verify Final State**
   - Only "Dining Bonus" and "Travel Bonus" should remain
   - "Dining Bonus" should have priority 3

### Verification in Supabase:

1. Query the `reward_rules` table
2. Verify exactly 2 rules exist for this card type
3. Verify the correct rules are present with correct data
4. Verify "Gas Bonus" is completely removed

### Expected Result:

✅ Multiple rules can be created and managed independently ✅ Each operation
(create, update, delete) works correctly with multiple rules ✅ Database state
matches UI state exactly

---

## Common Issues to Check

### Issue 1: Rules Don't Persist After Refresh

**Symptoms**: Rules appear in UI but disappear after page refresh **Check**:

- Browser console for errors
- Network tab for failed API calls
- Supabase logs for authentication errors
- RLS (Row Level Security) policies on reward_rules table

### Issue 2: Rules Appear in UI but Not in Database

**Symptoms**: Rules show in UI but don't exist in Supabase **Check**:

- Check if read-only mode is enabled
- Verify Supabase client is properly initialized
- Check for silent failures in RuleRepository methods
- Review application logs for error messages

### Issue 3: Type Mapping Errors

**Symptoms**: Rules save but with incorrect or missing data **Check**:

- Compare field names between UI, application types, and database schema
- Verify RuleMapper is correctly transforming data
- Check for null/undefined values in required fields

### Issue 4: Authentication Errors

**Symptoms**: "Not authenticated" errors when saving rules **Check**:

- User is logged in
- Session is valid
- RLS policies allow the current user to insert/update/delete

---

## Logging and Debugging

### Enable Detailed Logging

The RuleRepository includes comprehensive logging. Check the browser console
for:

- `[RuleRepository] createRule: Starting rule creation`
- `[RuleRepository] updateRule: Starting rule update`
- `[RuleRepository] deleteRule: Starting rule deletion`
- `[RuleRepository] getRulesForCardType: Fetching rules`

### Supabase Query Logs

In Supabase dashboard:

1. Go to Logs → Database
2. Filter by table: `reward_rules`
3. Look for INSERT, UPDATE, DELETE operations
4. Check for any error messages

---

## Success Criteria

All tests pass if:

✅ **CREATE**: New rules can be created and immediately appear in both UI and
database ✅ **READ**: Rules persist after page refresh and are correctly loaded
from database ✅ **UPDATE**: Rule modifications are saved and persist after
refresh ✅ **DELETE**: Rules are completely removed from both UI and database ✅
**PERSISTENCE**: All operations result in correct database state ✅ **NO
ERRORS**: No console errors or failed network requests

---

## Test Results Template

Use this template to document your test results:

```
## Test Execution Results

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]

### Test Case 1: CREATE
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 2: READ
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 3: UPDATE
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 4: DELETE
- Status: [ ] Pass [ ] Fail
- Notes:

### Test Case 5: Multiple Rules
- Status: [ ] Pass [ ] Fail
- Notes:

### Overall Result
- [ ] All tests passed
- [ ] Some tests failed (see notes above)

### Issues Found
1.
2.
3.

### Screenshots
[Attach screenshots of UI and Supabase database state]
```

---

## Next Steps After Testing

If all tests pass:

- Mark task 1.6 as complete
- Proceed to Phase 2: Implement CardTypeIdService

If tests fail:

- Document the specific failures
- Review the error logs
- Check the implementation against the requirements
- Fix identified issues before proceeding
