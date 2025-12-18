# Adding Cash and Prepaid Card Payment Methods

This guide explains how to add the two new payment methods: **Cash (CAD)** and **Prepaid Card (CAD)**.

## Option 1: Using the UI (Recommended)

The easiest way is to add them manually through the app interface:

1. **Log in to your app** and navigate to the **Payment Methods** page
2. Click the **"Add Method"** button
3. **For Cash (CAD):**
   - Name: `Cash`
   - Type: `Cash`
   - Currency: `CAD`
   - Status: Active (toggle on)
   - Click **"Add"**

4. **For Prepaid Card (CAD):**
   - Name: `Prepaid Card`
   - Type: `Prepaid Card`
   - Currency: `CAD`
   - Issuer: `Generic` (or leave blank)
   - Status: Active (toggle on)
   - Click **"Add"**

## Option 2: Using the Browser Console Script

If you prefer to add them automatically:

1. **Log in to your app** in the browser
2. **Open the browser console:**
   - Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Safari: Enable Developer menu first, then press `Cmd+Option+C`

3. **Navigate to the Console tab**

4. **Copy and paste the following code** into the console and press Enter:

```javascript
// Import required functions
import { supabase } from './src/integrations/supabase/client.js';

async function addPaymentMethods() {
  console.log("=== Adding Payment Methods ===\n");
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated");
    return;
  }
  
  const userId = session.user.id;
  
  // Add Cash (CAD)
  await supabase.from("payment_methods").insert({
    user_id: userId,
    name: "Cash",
    type: "cash",
    issuer: "Cash",
    currency: "CAD",
    is_active: true,
  });
  console.log("✅ Cash (CAD) added");
  
  // Add Prepaid Card (CAD)
  await supabase.from("payment_methods").insert({
    user_id: userId,
    name: "Prepaid Card",
    type: "prepaid_card",
    issuer: "Generic",
    currency: "CAD",
    is_active: true,
  });
  console.log("✅ Prepaid Card (CAD) added");
  
  console.log("\n=== Complete! Refresh the page to see your new payment methods ===");
}

addPaymentMethods();
```

5. **Refresh the Payment Methods page** to see the new methods

## What's New

### Prepaid Card Type
A new payment method type has been added to the system:
- **Type:** `prepaid_card`
- **Available in:** Payment method form dropdown
- **Use case:** Track expenses made with prepaid cards (e.g., gift cards, prepaid Visa/Mastercard)
- **Behavior:** Treated like cash - no reward points, no statement cycles, no card-specific features

### Updated Types
The `PaymentMethodType` has been updated to include:
- `credit_card` - Full card features (rewards, statements, image upload)
- `debit_card`
- `prepaid_card` ← **NEW** - Treated like cash
- `cash` - Simple payment tracking
- `bank_account`
- `other`

## Verification

After adding the payment methods, verify they appear correctly:

1. Go to the **Payment Methods** page
2. You should see both new methods in the carousel:
   - **Cash** with CAD currency
   - **Prepaid Card** with CAD currency
3. Both should be marked as **Active**
4. You can now use these methods when logging expenses

## Notes

- Both payment methods are set to **CAD (Canadian Dollar)** by default
- You can edit them later to change the currency or name
- **Cash and Prepaid Card methods are treated the same:**
  - No reward points tracking
  - No statement cycles
  - No card image uploads
  - No last 4 digits field
  - Simple payment tracking only
- These methods will appear in the expense form when logging transactions
