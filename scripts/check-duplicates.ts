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

const amounts = [174.25, 98.02, 76.45, 2.72, 16.36, 14.83, 66.97, 250.25, 833.63, 8.29, 93.85, 134.22];

async function main() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, date, merchant_id, merchants(name), amount, currency, payment_amount, payment_currency')
    .eq('user_id', 'e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91')
    .eq('payment_currency', 'SGD')
    .gte('date', '2025-11-08')
    .lte('date', '2025-11-10')
    .in('payment_amount', amounts);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data.length === 0) {
    console.log('No duplicates found.');
  } else {
    console.log('Potential duplicates found:');
    data.forEach(t => console.log(`  ${t.date} | ${(t.merchants as any)?.name || 'Unknown'} | ${t.payment_amount} ${t.payment_currency}`));
  }
}

main();
