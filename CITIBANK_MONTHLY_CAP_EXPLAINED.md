# Citibank Rewards Visa Signature - Monthly Cap Explained

## The 9,000 Bonus Points Cap

The Citibank Rewards Visa Signature has a **9,000 bonus points monthly cap** that applies to both 10x categories (fashion and online).

### Key Facts

1. **Cap Amount:** 9,000 bonus points per statement month
2. **Shared Cap:** Both fashion and online purchases count toward the same 9,000 point cap
3. **Bonus Points Only:** The cap applies to bonus points (9x), not base points (1x)
4. **Statement Month:** Resets at the start of each statement month (not calendar month)
5. **After Cap:** You still earn 1x base points on all purchases

### What This Means in SGD

```
9,000 bonus points ÷ 9 (bonus multiplier) = SGD 1,000 qualifying spend
```

Once you spend **SGD 1,000** across fashion and online categories in a statement month, you've hit the cap.

### How It Works

#### Before Hitting Cap (10x Earn Rate)
- **Fashion purchase:** SGD 100 → 1,000 points (100 base + 900 bonus)
- **Online purchase:** SGD 100 → 1,000 points (100 base + 900 bonus)

#### After Hitting Cap (1x Earn Rate)
- **Fashion purchase:** SGD 100 → 100 points (100 base + 0 bonus)
- **Online purchase:** SGD 100 → 100 points (100 base + 0 bonus)

### Example Scenario

Let's say your statement month runs from the 1st to the 30th:

| Date | Transaction | Amount | Points Earned | Bonus Points Used | Remaining Cap |
|------|-------------|--------|---------------|-------------------|---------------|
| 1st | Zara (fashion) | SGD 300 | 3,000 | 2,700 | 6,300 |
| 5th | Lazada (online) | SGD 400 | 4,000 | 3,600 | 2,700 |
| 10th | Uniqlo (fashion) | SGD 200 | 2,000 | 1,800 | 900 |
| 15th | Shopee (online) | SGD 100 | 1,000 | 900 | **0 (CAP REACHED)** |
| 20th | Nike (fashion) | SGD 200 | 200 | 0 | 0 |
| 25th | Amazon (online) | SGD 150 | 150 | 0 | 0 |

**Total for month:**
- Qualifying spend: SGD 1,350
- Total points earned: 10,350 points
- Bonus points: 9,000 (capped)
- Base points: 1,350 (always earned)

### Tracking Your Cap

The app should track your bonus points earned per statement month to help you know when you're approaching the cap.

**Recommended tracking:**
1. Set your statement start day in the payment method settings
2. The app will calculate your statement month period
3. View your bonus points progress in the rewards dashboard
4. Get notified when you're close to the cap (e.g., at 8,000 bonus points)

### Strategy Tips

1. **Prioritize High-Value Purchases:** Use the card for larger fashion/online purchases first
2. **Track Your Spending:** Monitor your bonus points to avoid wasting 10x opportunities
3. **After Cap:** Switch to other cards for fashion/online purchases
4. **Base Earn:** After cap, the card still earns 1x on everything (same as non-bonus categories)

### Comparison with Other Cards

| Card | Fashion/Online Earn | Monthly Cap | Cap in SGD |
|------|---------------------|-------------|------------|
| Citi Rewards | 10x (4 mpd) | 9,000 bonus pts | ~SGD 1,000 |
| UOB One | Up to 10x | No cap | Unlimited |
| OCBC 365 | 6x | No cap | Unlimited |

### Important Notes

1. **Statement Month vs Calendar Month:**
   - If your statement starts on the 15th, your "month" runs from 15th to 14th
   - The cap resets on the 15th, not on the 1st of the calendar month

2. **Shared Cap:**
   - You can't earn 9,000 points from fashion AND 9,000 from online
   - It's 9,000 total across both categories

3. **Base Points Always Earned:**
   - Even after hitting the cap, you earn 1x base points
   - This means the card never earns "0 points"

4. **Travel Excluded:**
   - Travel purchases don't earn 10x, so they don't count toward the cap
   - They earn 1x base rate regardless of cap status

### FAQ

**Q: What happens if I return a purchase that counted toward my cap?**
A: The bonus points will be deducted, and your cap usage will be adjusted accordingly.

**Q: Do refunds reset my cap?**
A: Refunds reduce your bonus points earned for that month, potentially giving you more cap room.

**Q: Can I see my cap usage in the app?**
A: Yes, the app should show your bonus points earned this statement month and remaining cap.

**Q: What if I spend exactly SGD 1,000?**
A: You'll earn exactly 9,000 bonus points and hit the cap. Any further 10x purchases earn only 1x.

**Q: Does the cap apply to the base 1x points?**
A: No, the cap only applies to bonus points (the extra 9x). You always earn the 1x base points.

### How the App Handles the Cap

The reward calculation system should:

1. **Track by Statement Month:** Group transactions by statement month (not calendar month)
2. **Calculate Bonus Points:** For each 10x transaction, calculate bonus points (amount × 9)
3. **Check Cap:** Compare total bonus points earned this month against 9,000
4. **Apply Cap:** If cap reached, award only base points (1x) for remaining 10x transactions
5. **Display Status:** Show user their cap usage and remaining bonus points available

### Technical Implementation

In the reward rules:
- `monthlyCap: 9000` - Maximum bonus points per month
- `monthlySpendPeriodType: "statement_month"` - Use statement month, not calendar month
- Both Rule 1 (fashion) and Rule 2 (online) have the same cap
- The system should track total bonus points across both rules

The app needs to:
1. Sum bonus points from both rules for the current statement month
2. If sum ≥ 9,000, apply only base multiplier (1x) for new transactions
3. Reset tracking at the start of each new statement month
