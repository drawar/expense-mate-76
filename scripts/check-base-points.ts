/**
 * Check if base points match statement (61 pts)
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

async function main() {
  // Get reward rules
  const { data: pm } = await supabase
    .from('payment_methods')
    .select('card_catalog_id')
    .eq('id', '5a93e989-8996-4c08-8bdd-5ff6ab6ecd28')
    .single();

  const { data: rules } = await supabase
    .from('reward_rules')
    .select('*')
    .eq('card_catalog_id', pm?.card_catalog_id)
    .order('priority', { ascending: false });

  console.log('Base multipliers from DB rules:');
  rules?.forEach(r => {
    console.log(`  [P${r.priority}] ${r.name}`);
    console.log(`         base=${r.base_multiplier}, bonus=${r.bonus_multiplier}, block=$${r.block_size}`);
  });

  // Get transactions
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, amount, currency, payment_amount, category, merchants(name, is_online)')
    .eq('payment_method_id', '5a93e989-8996-4c08-8bdd-5ff6ab6ecd28')
    .gte('date', '2025-11-01')
    .lte('date', '2025-11-30')
    .order('payment_amount', { ascending: false });

  console.log('\n' + '='.repeat(70));
  console.log('Calculating BASE points only (excluding bonus):');
  console.log('='.repeat(70));

  let totalBase = 0;
  let totalSpend = 0;

  for (const tx of txs || []) {
    const amt = parseFloat(tx.payment_amount);
    const merchantName = (tx.merchants as any)?.name || 'Unknown';

    if (tx.category === 'Rebate' || amt < 0) {
      console.log(`⏭️  ${merchantName}: $${amt} → 0 (rebate)`);
      continue;
    }

    // Non-SGD online: base_multiplier = 3 per $5 block
    const basePoints = Math.floor(amt / 5) * 3;
    totalBase += basePoints;
    totalSpend += amt;

    console.log(`${merchantName.padEnd(35)}: $${amt.toFixed(2).padStart(7)} → ${String(basePoints).padStart(3)} base pts`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Total Spend:       $${totalSpend.toFixed(2)}`);
  console.log(`Calculated Base:   ${totalBase} pts`);
  console.log(`Statement shows:   61 pts`);
  console.log(`Difference:        ${totalBase - 61} pts`);

  // Try alternative calculation
  console.log('\n' + '='.repeat(70));
  console.log('Alternative: base=1 per $5 (if SGD online rule applies):');
  let altBase = 0;
  for (const tx of txs || []) {
    const amt = parseFloat(tx.payment_amount);
    if (tx.category === 'Rebate' || amt < 0) continue;
    altBase += Math.floor(amt / 5) * 1;
  }
  console.log(`Calculated:        ${altBase} pts`);

  // Try 0.5 pts per $1
  console.log('\nAlternative: 0.5 pts per $1 (aggregate):');
  console.log(`Calculated:        ${Math.floor(totalSpend * 0.5)} pts`);
}

main();
