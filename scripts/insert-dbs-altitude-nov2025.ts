/**
 * Insert DBS Altitude Amex November 2025 statement transactions
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
const PAYMENT_METHOD_ID = '4bc1b892-13ef-496e-b0d6-cae3e14f9728';

interface Transaction {
  date: string;
  merchant: string;
  address?: string;
  amountEUR: number;
  amountSGD: number;
  points: number;
  category: string;
  googleMapsUrl?: string;
}

const transactions: Transaction[] = [
  {
    date: '2025-11-08',
    merchant: 'Shin Izakaya',
    address: 'Paris, France',
    amountEUR: 112.00,
    amountSGD: 174.25,
    points: 191,
    category: 'Dining',
  },
  {
    date: '2025-11-08',
    merchant: 'Semilla',
    address: '54 Rue de Seine, 75006 Paris, France',
    amountEUR: 63.00,
    amountSGD: 98.02,
    points: 107,
    category: 'Dining',
    googleMapsUrl: 'https://www.google.com/maps/search/Semilla+54+Rue+de+Seine+75006+Paris+France',
  },
  {
    date: '2025-11-08',
    merchant: 'Pharmacie Avenue de l\'Opera',
    address: '20 Avenue de l\'Opéra, 75001 Paris, France',
    amountEUR: 49.14,
    amountSGD: 76.45,
    points: 84,
    category: 'Health',
    googleMapsUrl: 'https://www.google.com/maps/search/Pharmacie+Avenue+de+l\'Opera+20+Avenue+de+l\'Opera+75001+Paris+France',
  },
  {
    date: '2025-11-09',
    merchant: 'Paul',
    address: 'Paris, France',
    amountEUR: 1.75,
    amountSGD: 2.72,
    points: 2,
    category: 'Dining',
  },
  {
    date: '2025-11-09',
    merchant: 'Momentum Special',
    address: 'Paris, France',
    amountEUR: 10.52,
    amountSGD: 16.36,
    points: 17,
    category: 'Dining',
  },
  {
    date: '2025-11-09',
    merchant: 'Librairie Compagnie',
    address: '58 Rue des Écoles, 75005 Paris, France',
    amountEUR: 9.54,
    amountSGD: 14.83,
    points: 16,
    category: 'Shopping',
    googleMapsUrl: 'https://www.google.com/maps/search/Librairie+Compagnie+58+Rue+des+Ecoles+75005+Paris+France',
  },
  {
    date: '2025-11-09',
    merchant: 'Bar Nouveau',
    address: '5 Rue des Haudriettes, 75003 Paris, France',
    amountEUR: 43.07,
    amountSGD: 66.97,
    points: 73,
    category: 'Dining',
    googleMapsUrl: 'https://www.google.com/maps/search/Bar+Nouveau+5+Rue+des+Haudriettes+75003+Paris+France',
  },
  {
    date: '2025-11-09',
    merchant: 'Ralph Lauren',
    address: 'La Vallée Village, 3 Cours de la Garonne, 77700 Serris, France',
    amountEUR: 160.93,
    amountSGD: 250.25,
    points: 275,
    category: 'Shopping',
    googleMapsUrl: 'https://www.google.com/maps/search/Ralph+Lauren+La+Vallee+Village+Serris+France',
  },
  {
    date: '2025-11-09',
    merchant: 'Sandro',
    address: 'La Vallée Village, 3 Cours de la Garonne, 77700 Serris, France',
    amountEUR: 536.08,
    amountSGD: 833.63,
    points: 916,
    category: 'Shopping',
    googleMapsUrl: 'https://www.google.com/maps/search/Sandro+La+Vallee+Village+Serris+France',
  },
  {
    date: '2025-11-10',
    merchant: 'Monop\'',
    address: 'Gare RER Auber, 5 Rue Mathurins, 75009 Paris, France',
    amountEUR: 5.33,
    amountSGD: 8.29,
    points: 9,
    category: 'Groceries',
    googleMapsUrl: 'https://www.google.com/maps/search/Monop+Gare+RER+Auber+Paris+France',
  },
  {
    date: '2025-11-09',
    merchant: 'Fnac',
    address: 'Centre Commercial Val d\'Europe, 14 Cours du Danube, 77700 Serris, France',
    amountEUR: 60.37,
    amountSGD: 93.85,
    points: 103,
    category: 'Shopping',
    googleMapsUrl: 'https://www.google.com/maps/search/FNAC+Val+d\'Europe+Serris+France',
  },
  {
    date: '2025-11-10',
    merchant: 'Extime Duty Free Paris',
    address: 'Paris Charles de Gaulle Airport (CDG), France',
    amountEUR: 86.34,
    amountSGD: 134.22,
    points: 147,
    category: 'Shopping',
    googleMapsUrl: 'https://www.google.com/maps/search/Extime+Duty+Free+Paris+CDG+Airport',
  },
];

async function getOrCreateMerchant(name: string, address?: string): Promise<string> {
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
    .insert({ name, address })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create merchant ${name}: ${error.message}`);
  }

  return newMerchant.id;
}

async function main() {
  console.log('Inserting DBS Altitude Amex November 2025 transactions...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const tx of transactions) {
    try {
      // Get or create merchant
      const merchantId = await getOrCreateMerchant(tx.merchant, tx.address);

      // Insert transaction
      const { error } = await supabase.from('transactions').insert({
        user_id: USER_ID,
        date: tx.date,
        merchant_id: merchantId,
        amount: tx.amountEUR,
        currency: 'EUR',
        payment_method_id: PAYMENT_METHOD_ID,
        payment_amount: tx.amountSGD,
        payment_currency: 'SGD',
        total_points: tx.points,
        category: tx.category,
        notes: tx.googleMapsUrl ? `Location: ${tx.googleMapsUrl}` : null,
      });

      if (error) {
        console.error(`❌ ${tx.merchant}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${tx.date} | ${tx.merchant} | €${tx.amountEUR} → $${tx.amountSGD} SGD | ${tx.points} pts`);
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
  const totalPoints = transactions.reduce((sum, tx) => sum + tx.points, 0);
  console.log(`Total: $${totalSGD.toFixed(2)} SGD | ${totalPoints} DBS Points`);
}

main();
