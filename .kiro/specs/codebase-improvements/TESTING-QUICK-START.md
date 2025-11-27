# Quick Start: Testing Reward Rule CRUD Operations

## 🚀 Quick Start (5 minutes)

### Step 1: Start the App

```bash
npm run dev
```

### Step 2: Open in Browser

Navigate to http://localhost:5173 and log in

### Step 3: Test CREATE

1. Go to **Payment Methods** page
2. Select a credit card
3. Click **"Manage Reward Rules"**
4. Click **"Create Rule"**
5. Fill in:
   - Name: "Test Grocery Bonus"
   - Description: "5x points on groceries"
   - Priority: 1
   - Enabled: ON
6. Click **"Save"**

### Step 4: Verify in Supabase

1. Open Supabase Dashboard
2. Go to **Table Editor** → **reward_rules**
3. ✅ Confirm the rule exists with correct data

### Step 5: Test READ (Persistence)

1. Refresh the browser (F5)
2. Navigate back to **Manage Reward Rules**
3. ✅ Confirm the rule is still there

### Step 6: Test UPDATE

1. Click **Edit** (pencil icon) on the rule
2. Change name to: "Updated Grocery Bonus"
3. Change priority to: 2
4. Click **"Save"**
5. Refresh browser
6. ✅ Confirm changes persisted

### Step 7: Test DELETE

1. Click **Delete** (trash icon) on the rule
2. Confirm deletion
3. Refresh browser
4. ✅ Confirm rule is gone

## ✅ Success Criteria

All operations should:

- Work immediately in the UI
- Persist in Supabase database
- Persist after page refresh
- Show no console errors

## 📚 Full Documentation

- **Detailed Guide**: `manual-testing-guide.md`
- **Instructions**: `testing-instructions.md`
- **Summary**: `task-1.6-summary.md`

## 🐛 Troubleshooting

**Rules don't persist?**

- Check browser console for errors
- Verify you're logged in
- Check Supabase RLS policies

**Can't see rules?**

- Verify card type ID matches
- Check Supabase for the rule
- Review RuleRepository logs

**Type errors?**

- Check RuleMapper implementation
- Verify field names match database schema

## 🎯 Next Steps

After all tests pass:

1. ✅ Mark task 1.6 complete
2. 📝 Document results
3. ➡️ Proceed to Task 1.5 (Property tests)
