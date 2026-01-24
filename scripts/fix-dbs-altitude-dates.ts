/**
 * Fix DBS Altitude transaction dates
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

const PAYMENT_METHOD_ID = '4bc1b892-13ef-496e-b0d6-cae3e14f9728';

// Correct dates based on statement
const corrections = [
  { payment_amount: 174.25, correct_date: '2025-11-11' }, // Shin Izakaya
  { payment_amount: 98.02, correct_date: '2025-11-11' },  // Semilla
  { payment_amount: 76.45, correct_date: '2025-11-11' },  // Pharmacie
  { payment_amount: 2.72, correct_date: '2025-11-12' },   // Paul
  { payment_amount: 16.36, correct_date: '2025-11-12' },  // Momentum Special
  { payment_amount: 14.83, correct_date: '2025-11-14' },  // Librairie Compagnie
  { payment_amount: 66.97, correct_date: '2025-11-14' },  // Bar Nouveau
  { payment_amount: 250.25, correct_date: '2025-11-15' }, // Ralph Lauren
  { payment_amount: 833.63, correct_date: '2025-11-15' }, // Sandro
  { payment_amount: 8.29, correct_date: '2025-11-15' },   // Monop'
  { payment_amount: 93.85, correct_date: '2025-11-15' },  // Fnac
  { payment_amount: 134.22, correct_date: '2025-11-16' }, // Extime Duty Free
];

async function main() {
  console.log('Fixing DBS Altitude transaction dates...\n');

  for (const correction of corrections) {
    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select('id, date, payment_amount, merchants(name)')
      .eq('payment_method_id', PAYMENT_METHOD_ID)
      .eq('payment_amount', correction.payment_amount)
      .single();

    if (fetchError || !data) {
      console.error(`❌ Could not find transaction with amount ${correction.payment_amount}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ date: correction.correct_date })
      .eq('id', data.id);

    if (updateError) {
      console.error(`❌ Error updating ${(data.merchants as any)?.name}: ${updateError.message}`);
    } else {
      console.log(`✅ ${(data.merchants as any)?.name}: ${data.date} → ${correction.correct_date}`);
    }
  }

  console.log('\nDone!');
}

main();
