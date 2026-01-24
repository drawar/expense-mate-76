/**
 * Recalculate DBS Woman's World Mastercard points
 * Based on statement: 61 points earned on $123.65 spend = ~0.5 pts per $1
 *
 * For online transactions (which all these are), the 10x rate applies:
 * 10 DBS Points per $5 block = 2 points per $1
 * But there's a $1,000 monthly cap on online spend
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

const WWMC_ID = '5a93e989-8996-4c08-8bdd-5ff6ab6ecd28';

async function main() {
  console.log('Recalculating DBS Woman\'s World Mastercard points...\n');

  // Get all Nov 2025 transactions for WWMC
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, date, payment_amount, category, merchants(name)')
    .eq('payment_method_id', WWMC_ID)
    .gte('date', '2025-11-01')
    .lte('date', '2025-11-30')
    .order('date');

  if (error) {
    console.error('Error:', error);
    return;
  }

  let totalSpend = 0;
  let totalPoints = 0;

  for (const tx of transactions || []) {
    const amount = parseFloat(tx.payment_amount);
    const merchantName = (tx.merchants as any)?.name || 'Unknown';

    // Rebates don't earn points
    if (tx.category === 'Rebate' || amount < 0) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ total_points: 0 })
        .eq('id', tx.id);

      console.log(`✅ ${merchantName}: $${amount} SGD → 0 pts (rebate)`);
      continue;
    }

    // Online 10x rate: floor(amount / 5) * 10
    // This gives 2 points per $1 for amounts divisible by $5
    const points = Math.floor(amount / 5) * 10;

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ total_points: points })
      .eq('id', tx.id);

    if (updateError) {
      console.error(`❌ ${merchantName}: ${updateError.message}`);
    } else {
      console.log(`✅ ${merchantName}: $${amount} SGD → ${points} pts`);
      totalSpend += amount;
      totalPoints += points;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Total Spend: $${totalSpend.toFixed(2)} SGD`);
  console.log(`Total Points: ${totalPoints} DBS Points`);
  console.log(`\nNote: Statement shows 61 pts - difference may be due to`);
  console.log(`balance transfer or different calculation method.`);
}

main();
