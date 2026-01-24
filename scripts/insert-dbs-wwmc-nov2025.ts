/**
 * Insert DBS Woman's World Mastercard November 2025 statement transactions
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

const USER_ID = 'e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91';
const PAYMENT_METHOD_ID = '5a93e989-8996-4c08-8bdd-5ff6ab6ecd28';

interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  amountSGD: number;
  category: string;
  isOnline: boolean;
  isRebate?: boolean;
}

const transactions: Transaction[] = [
  // Service Navigo transactions
  { date: '2025-11-11', merchant: 'Service Navigo', amount: 6.00, currency: 'EUR', amountSGD: 9.35, category: 'Transportation', isOnline: true },
  { date: '2025-11-14', merchant: 'Service Navigo', amount: 2.00, currency: 'EUR', amountSGD: 3.14, category: 'Transportation', isOnline: true },
  { date: '2025-11-14', merchant: 'Service Navigo', amount: 2.00, currency: 'EUR', amountSGD: 3.14, category: 'Transportation', isOnline: true },
  { date: '2025-11-14', merchant: 'Service Navigo', amount: 2.00, currency: 'EUR', amountSGD: 3.14, category: 'Transportation', isOnline: true },
  { date: '2025-11-14', merchant: 'Service Navigo', amount: 6.00, currency: 'EUR', amountSGD: 9.41, category: 'Transportation', isOnline: true },
  { date: '2025-11-15', merchant: 'Service Navigo', amount: 2.50, currency: 'EUR', amountSGD: 3.93, category: 'Transportation', isOnline: true },
  { date: '2025-11-15', merchant: 'Service Navigo', amount: 2.50, currency: 'EUR', amountSGD: 3.93, category: 'Transportation', isOnline: true },
  { date: '2025-11-15', merchant: 'Service Navigo', amount: 2.50, currency: 'EUR', amountSGD: 3.93, category: 'Transportation', isOnline: true },
  // Bolt
  { date: '2025-11-16', merchant: 'Bolt', amount: 19.40, currency: 'EUR', amountSGD: 30.42, category: 'Transportation', isOnline: true },
  // Uber
  { date: '2025-11-16', merchant: 'Uber', amount: 24.60, currency: 'EUR', amountSGD: 38.58, category: 'Transportation', isOnline: true },
  // Airalo
  { date: '2025-11-21', merchant: 'Airalo', amount: 9.37, currency: 'USD', amountSGD: 12.66, category: 'Travel', isOnline: true },
  // DBS Rebate (negative amount)
  { date: '2025-11-18', merchant: 'DBS Overseas Shop & Dine Promotion', amount: -100.00, currency: 'SGD', amountSGD: -100.00, category: 'Rebate', isOnline: true, isRebate: true },
];

async function getOrCreateMerchant(name: string, isOnline: boolean): Promise<string> {
  // Check if merchant exists
  const { data: existing } = await supabase
    .from('merchants')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create new merchant
  const { data: newMerchant, error } = await supabase
    .from('merchants')
    .insert({ name, is_online: isOnline })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create merchant ${name}: ${error.message}`);
  }

  return newMerchant.id;
}

async function main() {
  console.log('Inserting DBS Woman\'s World Mastercard November 2025 transactions...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const tx of transactions) {
    try {
      // Get or create merchant
      const merchantId = await getOrCreateMerchant(tx.merchant, tx.isOnline);

      // For rebates, don't calculate points
      const points = tx.isRebate ? 0 : 0; // Points will be calculated by the app based on reward rules

      // Insert transaction
      const { error } = await supabase.from('transactions').insert({
        user_id: USER_ID,
        date: tx.date,
        merchant_id: merchantId,
        amount: tx.amount,
        currency: tx.currency,
        payment_method_id: PAYMENT_METHOD_ID,
        payment_amount: tx.amountSGD,
        payment_currency: 'SGD',
        total_points: points,
        category: tx.category,
      });

      if (error) {
        console.error(`❌ ${tx.merchant}: ${error.message}`);
        errorCount++;
      } else {
        const amountDisplay = tx.currency === 'SGD'
          ? `$${tx.amountSGD} SGD`
          : `${tx.currency === 'EUR' ? '€' : '$'}${tx.amount} ${tx.currency} → $${tx.amountSGD} SGD`;
        console.log(`✅ ${tx.date} | ${tx.merchant} | ${amountDisplay}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ ${tx.merchant}: ${err}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Inserted: ${successCount} | Errors: ${errorCount}`);

  // Calculate totals
  const totalSGD = transactions.reduce((sum, tx) => sum + tx.amountSGD, 0);
  console.log(`Total: $${totalSGD.toFixed(2)} SGD`);
}

main();
