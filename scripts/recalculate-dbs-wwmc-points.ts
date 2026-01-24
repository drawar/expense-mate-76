/**
 * Recalculate DBS Woman's World Mastercard points based on reward rules in DB
 *
 * Rules (in priority order):
 * 1. Online Shopping 10X (non-SGD) - Priority 3: is_online + currency != SGD → 10x per $5
 * 2. Online Shopping 10X (SGD) - Priority 2: is_online → 10x per $5
 * 3. Base rate - Priority 1: all other → 1x per $5
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
  console.log('Recalculating points based on DB reward rules...\n');

  // Get reward rules for this card
  const { data: pm } = await supabase
    .from('payment_methods')
    .select('card_catalog_id')
    .eq('id', WWMC_ID)
    .single();

  const { data: rules } = await supabase
    .from('reward_rules')
    .select('*')
    .eq('card_catalog_id', pm?.card_catalog_id)
    .order('priority', { ascending: false });

  console.log('Reward Rules loaded:');
  rules?.forEach(r => {
    const total = r.base_multiplier + r.bonus_multiplier;
    console.log(`  [P${r.priority}] ${r.name}: ${total}x per $${r.block_size}`);
  });
  console.log('');

  // Get all Nov 2025 transactions with merchant info
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, date, amount, currency, payment_amount, payment_currency, category, merchants(name, is_online)')
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
    const currency = tx.currency;
    const merchantName = (tx.merchants as any)?.name || 'Unknown';
    const isOnline = (tx.merchants as any)?.is_online || false;

    // Skip rebates
    if (tx.category === 'Rebate' || amount < 0) {
      await supabase.from('transactions').update({ total_points: 0 }).eq('id', tx.id);
      console.log(`⏭️  ${merchantName}: $${amount} SGD → 0 pts (rebate)`);
      continue;
    }

    // Find matching rule (highest priority first)
    let matchedRule = null;
    for (const rule of rules || []) {
      let conditions = rule.conditions;
      if (typeof conditions === 'string') {
        conditions = JSON.parse(conditions);
      }

      // Check if all conditions match
      let allConditionsMatch = true;

      if (conditions && conditions.length > 0) {
        for (const cond of conditions) {
          if (cond.type === 'transaction_type' && cond.operation === 'include') {
            if (cond.values.includes('online') && !isOnline) {
              allConditionsMatch = false;
              break;
            }
          }
          if (cond.type === 'currency' && cond.operation === 'notEquals') {
            if (cond.values.includes(currency)) {
              allConditionsMatch = false;
              break;
            }
          }
        }
      }

      if (allConditionsMatch) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      // Fallback to base rule (priority 1)
      matchedRule = rules?.find(r => r.priority === 1);
    }

    // Calculate points: floor(amount / block_size) * (base + bonus)
    const blockSize = matchedRule?.block_size || 5;
    const multiplier = (matchedRule?.base_multiplier || 0) + (matchedRule?.bonus_multiplier || 0);
    const points = Math.floor(amount / blockSize) * multiplier;

    await supabase.from('transactions').update({ total_points: points }).eq('id', tx.id);

    const ruleName = matchedRule?.name || 'Unknown';
    console.log(`✅ ${merchantName}: $${amount.toFixed(2)} SGD → ${points} pts (${ruleName})`);

    totalSpend += amount;
    totalPoints += points;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total Spend: $${totalSpend.toFixed(2)} SGD`);
  console.log(`Total Points: ${totalPoints} DBS Points`);
}

main();
