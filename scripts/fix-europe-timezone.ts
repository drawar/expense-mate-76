/**
 * Fix transaction dates to use Europe/Paris timezone
 * November in Paris is CET (UTC+1)
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

const ALTITUDE_ID = '4bc1b892-13ef-496e-b0d6-cae3e14f9728';
const WWMC_ID = '5a93e989-8996-4c08-8bdd-5ff6ab6ecd28';

async function main() {
  console.log('Fixing transaction dates to Europe/Paris timezone...\n');

  // Get all transactions from Nov 2025 for both cards
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, date, payment_amount, merchants(name)')
    .in('payment_method_id', [ALTITUDE_ID, WWMC_ID])
    .gte('date', '2025-11-01')
    .lte('date', '2025-11-30')
    .order('date');

  if (error) {
    console.error('Error fetching transactions:', error);
    return;
  }

  let updated = 0;
  for (const tx of transactions || []) {
    // Extract the date part (YYYY-MM-DD)
    const dateStr = tx.date.split('T')[0];

    // Create timestamp with Europe/Paris timezone (UTC+1 in November)
    // Store as noon Europe time to avoid date boundary issues
    const europeTime = `${dateStr}T12:00:00+01:00`;

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ date: europeTime })
      .eq('id', tx.id);

    if (updateError) {
      console.error(`❌ ${(tx.merchants as any)?.name}: ${updateError.message}`);
    } else {
      console.log(`✅ ${(tx.merchants as any)?.name}: ${tx.date} → ${europeTime}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} transactions to Europe/Paris timezone.`);
}

main();
