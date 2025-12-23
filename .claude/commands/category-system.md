# Clairo Category System Implementation Guide

You are implementing a comprehensive category system for Clairo. This command
provides the complete specification for user-friendly behavioral categories, MCC
mapping, and auto-categorization.

## Overview

### Goals

- Replace technical MCC categories with user-friendly behavioral categories
- Maintain MCC data for rewards calculation
- Provide accurate, actionable spending insights
- Reduce manual categorization burden through smart defaults

### Principles

1. **Dual Category System**: Store both MCC (for rewards) and user category (for
   budgeting)
2. **Smart Defaults**: Auto-categorize based on MCC with confidence scoring
3. **User Override**: Allow easy recategorization with learning
4. **Behavioral Focus**: Categories reflect spending behavior, not merchant
   types

---

## New Category Structure (6 Main Groups)

### 1. Essentials (High Priority)

**Color:** Green (#10b981) | **Budget:** 50-60% of income | **Savings
Potential:** LOW

| Subcategory    | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| Groceries      | Food, beverages, produce, meat, dairy (excludes prepared food)    |
| Housing        | Rent, mortgage, property taxes, home insurance, HOA fees          |
| Utilities      | Electricity, gas, water, internet, phone, trash                   |
| Transportation | Gas, public transit, parking, car insurance, vehicle registration |
| Healthcare     | Prescriptions, medical supplies, doctor visits, dental, vision    |

### 2. Lifestyle (Medium Priority)

**Color:** Purple (#8b5cf6) | **Budget:** 20-30% of income | **Savings
Potential:** HIGH

| Subcategory          | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| Dining Out           | Sit-down restaurants, cafes, bars, food courts                 |
| Fast Food & Takeout  | Quick service, fast food chains, food trucks, picked-up orders |
| Food Delivery        | Uber Eats, DoorDash, SkipTheDishes, delivery fees              |
| Entertainment        | Movies, concerts, sports events, museums, amusement parks      |
| Hobbies & Recreation | Craft supplies, sports equipment, gaming, books                |
| Travel & Vacation    | Flights, hotels, vacation expenses, rental cars                |

### 3. Home & Living (Medium Priority)

**Color:** Amber (#f59e0b) | **Budget:** 5-15% of income | **Savings
Potential:** MEDIUM

| Subcategory       | Description                                               |
| ----------------- | --------------------------------------------------------- |
| Home Essentials   | Cleaning supplies, paper products, laundry, kitchen tools |
| Furniture & Decor | Furniture, bedding, curtains, decorative items            |
| Home Improvement  | Tools, hardware, paint, garden care, appliances           |
| Pet Care          | Pet food, veterinary care, pet supplies, grooming         |

### 4. Personal Care (Medium Priority)

**Color:** Pink (#ec4899) | **Budget:** 3-8% of income | **Savings Potential:**
MEDIUM

| Subcategory            | Description                                        |
| ---------------------- | -------------------------------------------------- |
| Clothing & Shoes       | Everyday clothing, work attire, shoes, accessories |
| Beauty & Personal Care | Hair salon, cosmetics, skincare, spa services      |
| Gym & Fitness          | Gym memberships, fitness classes, athletic wear    |

### 5. Work & Education (High Priority)

**Color:** Blue (#3b82f6) | **Budget:** Varies | **Savings Potential:** LOW

| Subcategory              | Description                                        |
| ------------------------ | -------------------------------------------------- |
| Professional Development | Courses, certifications, conference fees           |
| Work Expenses            | Work supplies, professional attire, business meals |
| Education                | Tuition, textbooks, school supplies                |

### 6. Financial & Other (Priority Varies)

**Color:** Gray (#6b7280) | **Budget:** Varies | **Savings Potential:** MEDIUM

| Subcategory                 | Description                                     |
| --------------------------- | ----------------------------------------------- |
| Subscriptions & Memberships | Streaming, software, cloud storage, memberships |
| Financial Services          | Bank fees, ATM fees, investment fees, tax prep  |
| Insurance                   | Life, disability, other non-health/auto/home    |
| Gifts & Donations           | Birthday/holiday gifts, charitable donations    |
| Cash & ATM                  | Cash withdrawals, money transfers               |
| Fees & Charges              | Late fees, overdraft fees, penalties            |

---

## MCC Mapping Reference

### Groceries (Essentials)

| MCC  | Description                          | Confidence |
| ---- | ------------------------------------ | ---------- |
| 5411 | Grocery Stores, Supermarkets         | 0.85       |
| 5422 | Freezer and Locker Meat Provisioners | 0.95       |
| 5441 | Candy, Nut, Confectionery            | 0.90       |
| 5451 | Dairy Products Stores                | 0.95       |
| 5462 | Bakeries                             | 0.90       |
| 5499 | Misc Food Stores                     | 0.80       |

### Utilities (Essentials)

| MCC  | Description                    | Confidence |
| ---- | ------------------------------ | ---------- |
| 4814 | Telecommunication Services     | 0.95       |
| 4816 | Computer Network Services      | 0.85       |
| 4899 | Cable, Satellite TV            | 0.95       |
| 4900 | Electric, Gas, Water Utilities | 0.98       |

### Transportation (Essentials)

| MCC  | Description                   | Confidence |
| ---- | ----------------------------- | ---------- |
| 4111 | Local Commuter Transportation | 0.95       |
| 4121 | Taxicabs and Limousines       | 0.85       |
| 4131 | Bus Lines                     | 0.95       |
| 4784 | Tolls and Bridge Fees         | 0.98       |
| 5541 | Service Stations              | 0.75       |
| 5542 | Automated Fuel Dispensers     | 0.98       |
| 7512 | Car Rental                    | 0.90       |
| 7523 | Parking                       | 0.95       |
| 7538 | Auto Service Shops            | 0.90       |

### Healthcare (Essentials)

| MCC  | Description                | Confidence |
| ---- | -------------------------- | ---------- |
| 5912 | Drug Stores, Pharmacies    | 0.70       |
| 8011 | Doctors and Physicians     | 0.98       |
| 8021 | Dentists and Orthodontists | 0.98       |
| 8042 | Optometrists               | 0.98       |
| 8062 | Hospitals                  | 0.98       |

### Dining (Lifestyle)

| MCC  | Description               | Confidence | Category            |
| ---- | ------------------------- | ---------- | ------------------- |
| 5812 | Restaurants               | 0.90       | Dining Out          |
| 5813 | Bars, Taverns, Nightclubs | 0.95       | Dining Out          |
| 5814 | Fast Food                 | 0.85       | Fast Food & Takeout |

### Travel (Lifestyle)

| MCC  | Description             | Confidence |
| ---- | ----------------------- | ---------- |
| 4411 | Cruise Lines            | 0.98       |
| 4511 | Airlines                | 0.95       |
| 4722 | Travel Agencies         | 0.95       |
| 7011 | Hotels, Motels, Resorts | 0.95       |

### Home & Living

| MCC  | Description                | Confidence | Category          |
| ---- | -------------------------- | ---------- | ----------------- |
| 5200 | Home Supply Warehouse      | 0.75       | Home Improvement  |
| 5211 | Lumber, Building Materials | 0.90       | Home Improvement  |
| 5251 | Hardware Stores            | 0.85       | Home Improvement  |
| 5712 | Furniture Stores           | 0.80       | Furniture & Decor |
| 5722 | Household Appliances       | 0.80       | Home Essentials   |
| 0742 | Veterinary Services        | 0.98       | Pet Care          |
| 5995 | Pet Shops                  | 0.95       | Pet Care          |

### Personal Care

| MCC  | Description             | Confidence | Category               |
| ---- | ----------------------- | ---------- | ---------------------- |
| 5611 | Men's Clothing          | 0.90       | Clothing & Shoes       |
| 5621 | Women's Clothing        | 0.90       | Clothing & Shoes       |
| 5651 | Family Clothing         | 0.90       | Clothing & Shoes       |
| 5661 | Shoe Stores             | 0.95       | Clothing & Shoes       |
| 5977 | Cosmetic Stores         | 0.90       | Beauty & Personal Care |
| 7230 | Beauty and Barber Shops | 0.95       | Beauty & Personal Care |
| 7997 | Athletic Clubs          | 0.80       | Gym & Fitness          |

### Education & Work

| MCC  | Description                  | Confidence | Category                 |
| ---- | ---------------------------- | ---------- | ------------------------ |
| 5943 | Office/School Supplies       | 0.70       | Work Expenses            |
| 8211 | Elementary/Secondary Schools | 0.95       | Education                |
| 8220 | Colleges, Universities       | 0.95       | Education                |
| 8244 | Business Schools             | 0.90       | Professional Development |

### Financial

| MCC  | Description              | Confidence | Category           |
| ---- | ------------------------ | ---------- | ------------------ |
| 6011 | ATM Cash Disbursements   | 0.98       | Cash & ATM         |
| 6300 | Insurance Premiums       | 0.95       | Insurance          |
| 7276 | Tax Preparation          | 0.95       | Financial Services |
| 8398 | Charitable Organizations | 0.95       | Gifts & Donations  |
| 5947 | Gift Shops               | 0.80       | Gifts & Donations  |
| 5992 | Florists                 | 0.85       | Gifts & Donations  |

---

## Multi-Category Merchants (Always Prompt)

| Merchant           | Default          | Suggested Categories                             |
| ------------------ | ---------------- | ------------------------------------------------ |
| Costco             | Shopping         | Groceries, Gas, Home, Electronics, Pharmacy      |
| Amazon             | Shopping         | Electronics, Home, Clothing, Books, Groceries    |
| Walmart            | Shopping         | Groceries, Clothing, Electronics, Home, Pharmacy |
| Target             | Shopping         | Groceries, Clothing, Home, Beauty                |
| Shoppers Drug Mart | Healthcare       | Healthcare, Beauty, Groceries, Home              |
| Canadian Tire      | Home Improvement | Home Improvement, Automotive, Sports             |

---

## Confidence Thresholds

| Confidence  | Action                        |
| ----------- | ----------------------------- |
| 0.90 - 1.00 | Auto-assign, no review needed |
| 0.75 - 0.89 | Auto-assign, flag for review  |
| 0.60 - 0.74 | Auto-assign, prompt user      |
| 0.00 - 0.59 | Force user selection          |

---

## Amount-Based Heuristics

### Gas Stations (MCC 5541)

- Amount < $30 → Likely convenience store (Fast Food & Takeout)
- Amount > $30 → Likely fuel (Transportation)

### Pharmacies

- Amount < $25 → Could be beauty/personal care
- Amount $50-$150 → Likely prescription (Healthcare)

### Uber Eats

- Amount > $100 → Prompt: "Groceries or restaurant food?"

### Costco

- Amount < $40 → Likely gas
- Amount > $250 → Likely multiple categories

---

## Database Schema

```typescript
interface Transaction {
  // Existing fields
  id: string;
  merchant_name: string;
  amount: number;
  date: string;

  // MCC data (immutable - for rewards)
  merchant_category_code: string;
  merchant_category_name: string;

  // User category (editable - for budgeting)
  user_category: string | null;
  user_subcategory?: string;

  // Categorization metadata
  auto_category_confidence: number;
  is_manually_categorized: boolean;
  needs_review: boolean;
  category_suggestion_reason?: string;
}

interface CategoryConfig {
  id: string;
  parent_category: string;
  subcategory: string;
  emoji: string;
  color: string;
  budget_priority: "high" | "medium" | "low";
  savings_potential: "high" | "medium" | "low";
  display_order: number;
}

interface MCCMapping {
  mcc_code: string;
  mcc_description: string;
  default_user_category: string;
  default_confidence: number;
  requires_review: boolean;
  multi_category: boolean;
}
```

---

## Implementation Phases

### Phase 1: Foundation

- Database schema updates (add user_category fields)
- Populate MCC mapping table
- Add edit icon to transaction cards
- Create category picker bottom sheet
- Show "needs review" badges

### Phase 2: Smart Categorization

- Implement MCC-based categorization
- Implement merchant pattern matching
- Implement amount heuristics
- Implement historical pattern learning
- Create confidence scoring system
- Migrate existing transactions

### Phase 3: New Dashboard UI

- Redesign Expense Categories with new hierarchy
- Show parent categories with subcategories
- Add percentage bars and color coding
- Update transactions to show user categories
- Create category drill-down view

### Phase 4: Insights & Actions

- Build insights generation engine
- Detect spending patterns
- Find savings opportunities
- Create actionable recommendations
- Add spending health score

### Phase 5: Onboarding & Migration

- New user onboarding flow
- Existing user migration banner
- Transaction review screens

---

## UI Changes

### Before (MCC Categories)

```
Expense Categories
- Equipment, Furniture and Home... $378.45
- Fast Food Restaurants           $190.39
- Grocery Stores & Supermarkets   $180.64
```

### After (Behavioral Categories)

```
Spending Breakdown

Essentials              $456.64 (42%)
├─ Groceries           $180.64
└─ Gas & Transport     $276.00

Lifestyle              $204.77 (19%)
├─ Dining Out          $190.39
└─ Entertainment        $14.38

Home & Living          $378.45 (34%)
└─ Home Essentials     $378.45
```

### Transaction Card

```
Before: Uber Eats $174.77 | Fast Food Rest...
After:  Uber Eats $174.77 | Fast Food [edit icon] | +870 pts
```

---

## Edge Cases

1. **Refunds**: Match to original purchase category
2. **Split Transactions**: Allow splitting one transaction across multiple
   categories
3. **Foreign Currency**: Same rules, note the currency
4. **Cash Withdrawals**: Category "Cash & ATM", prompt if user knows destination
5. **Unknown Merchants**: Force user review
6. **Subscriptions**: Detect recurring patterns, use historical category

---

## Success Metrics

- **Categorization Accuracy**: 85% correct without user intervention
- **User Correction Rate**: < 15% of transactions need manual recategorization
- **Time Savings**: 70% reduction in categorization time
- **User Satisfaction**: 4.5/5 star rating
