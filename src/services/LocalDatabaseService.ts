
import Dexie, { Table } from 'dexie';
import { Transaction, PaymentMethod, Merchant } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Define our database class extending Dexie
export class ExpenseDatabase extends Dexie {
  transactions!: Table<Transaction>;
  paymentMethods!: Table<PaymentMethod>;
  merchants!: Table<Merchant>;
  syncInfo!: Table<{id: string, lastSync: Date, inProgress: boolean}>;
  
  constructor() {
    super('expenseMateDB');
    
    // Define tables and indices
    this.version(1).stores({
      transactions: 'id, date, merchant.id, paymentMethod.id, category, is_deleted',
      paymentMethods: 'id, name, issuer',
      merchants: 'id, name',
      syncInfo: 'id'
    });
  }
}

// Create a single database instance
const db = new ExpenseDatabase();

// Initialize sync info if not exists
async function initSyncInfo() {
  const syncInfo = await db.syncInfo.get('lastSync');
  if (!syncInfo) {
    await db.syncInfo.put({
      id: 'lastSync',
      lastSync: new Date(0), // Start with epoch time
      inProgress: false
    });
  }
}

// Initialize database
export async function initDatabase() {
  try {
    console.log('Initializing local database...');
    await initSyncInfo();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Get last sync time
export async function getLastSyncTime(): Promise<Date> {
  const syncInfo = await db.syncInfo.get('lastSync');
  return syncInfo?.lastSync || new Date(0);
}

// Set sync in progress flag
async function setSyncInProgress(inProgress: boolean) {
  const syncInfo = await db.syncInfo.get('lastSync');
  if (syncInfo) {
    await db.syncInfo.update('lastSync', { inProgress });
  }
}

// Update last sync time
async function updateLastSyncTime() {
  const syncInfo = await db.syncInfo.get('lastSync');
  if (syncInfo) {
    await db.syncInfo.update('lastSync', { lastSync: new Date(), inProgress: false });
  }
}

// Sync transactions with Supabase
export async function syncTransactionsWithSupabase(forceFullSync = false): Promise<boolean> {
  try {
    // Check if sync is already in progress
    const syncInfo = await db.syncInfo.get('lastSync');
    if (syncInfo?.inProgress) {
      console.log('Sync already in progress, skipping');
      return false;
    }
    
    // Set sync in progress
    await setSyncInProgress(true);
    
    // Get last sync time
    const lastSync = forceFullSync ? new Date(0) : await getLastSyncTime();
    console.log(`Starting sync from ${lastSync.toISOString()}`);
    
    // 1. Pull transactions from Supabase
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        merchant:merchant_id(*),
        payment_method:payment_method_id(*)
      `)
      .gt('created_at', lastSync.toISOString());
    
    if (txError) {
      throw new Error(`Failed to fetch transactions: ${txError.message}`);
    }
    
    // 2. Pull payment methods from Supabase
    const { data: paymentMethods, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .gt('created_at', lastSync.toISOString());
      
    if (pmError) {
      throw new Error(`Failed to fetch payment methods: ${pmError.message}`);
    }
    
    // 3. Pull merchants from Supabase
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .gt('created_at', lastSync.toISOString());
      
    if (merchantError) {
      throw new Error(`Failed to fetch merchants: ${merchantError.message}`);
    }
    
    // Start transaction for database consistency
    await db.transaction('rw', [db.transactions, db.paymentMethods, db.merchants], async () => {
      // Update payment methods
      if (paymentMethods.length > 0) {
        console.log(`Syncing ${paymentMethods.length} payment methods`);
        for (const pm of paymentMethods) {
          await db.paymentMethods.put({
            ...pm,
            currency: pm.currency as Currency
          });
        }
      }
      
      // Update merchants
      if (merchants.length > 0) {
        console.log(`Syncing ${merchants.length} merchants`);
        for (const merchant of merchants) {
          await db.merchants.put(merchant);
        }
      }
      
      // Update transactions
      if (transactions.length > 0) {
        console.log(`Syncing ${transactions.length} transactions`);
        
        const transformedTxs = transactions.map(tx => {
          const merchant = tx.merchant as any;
          const paymentMethod = tx.payment_method as any;
          
          // Transform to our Transaction type
          return {
            id: tx.id,
            date: tx.date,
            merchant: {
              id: merchant.id,
              name: merchant.name,
              address: merchant.address,
              mcc: merchant.mcc,
              coordinates: merchant.coordinates,
              isOnline: merchant.is_online,
            },
            amount: Number(tx.amount),
            currency: tx.currency as Currency,
            paymentMethod: {
              id: paymentMethod.id,
              name: paymentMethod.name,
              type: paymentMethod.type,
              currency: paymentMethod.currency as Currency,
              rewardRules: paymentMethod.reward_rules || [],
              active: paymentMethod.active,
              lastFourDigits: paymentMethod.last_four_digits,
              issuer: paymentMethod.issuer,
              statementStartDay: paymentMethod.statement_start_day,
              isMonthlyStatement: paymentMethod.is_monthly_statement,
              icon: paymentMethod.icon,
              color: paymentMethod.color,
            },
            paymentAmount: Number(tx.payment_amount),
            paymentCurrency: tx.payment_currency as Currency,
            rewardPoints: tx.reward_points,
            notes: tx.notes,
            category: tx.category,
            isContactless: tx.is_contactless,
          };
        });
        
        // Bulk add transformed transactions
        await db.transactions.bulkPut(transformedTxs);
      }
    });
    
    // 4. Push pending local transactions to Supabase
    // TODO: Implement in future enhancement to handle offline transaction creation
    
    // Update last sync time
    await updateLastSyncTime();
    console.log('Sync completed successfully');
    
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    await setSyncInProgress(false);
    
    toast({
      title: 'Sync Failed',
      description: error instanceof Error ? error.message : 'Unknown error during sync',
      variant: 'destructive'
    });
    
    return false;
  }
}

// Get transactions from local database
export async function getLocalTransactions(): Promise<Transaction[]> {
  try {
    // Only return transactions that aren't deleted
    const transactions = await db.transactions
      .filter(tx => !tx.is_deleted)
      .toArray();
    
    console.log(`Retrieved ${transactions.length} transactions from local database`);
    return transactions;
  } catch (error) {
    console.error('Error getting local transactions:', error);
    return [];
  }
}

// Get payment methods from local database
export async function getLocalPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const paymentMethods = await db.paymentMethods.toArray();
    console.log(`Retrieved ${paymentMethods.length} payment methods from local database`);
    return paymentMethods;
  } catch (error) {
    console.error('Error getting local payment methods:', error);
    return [];
  }
}

// Save a transaction locally
export async function saveLocalTransaction(transaction: Transaction): Promise<boolean> {
  try {
    await db.transactions.put(transaction);
    return true;
  } catch (error) {
    console.error('Error saving local transaction:', error);
    return false;
  }
}

// Delete a transaction locally
export async function deleteLocalTransaction(id: string): Promise<boolean> {
  try {
    // Soft delete by setting is_deleted flag
    await db.transactions.update(id, { is_deleted: true });
    return true;
  } catch (error) {
    console.error('Error deleting local transaction:', error);
    return false;
  }
}

// Schedule sync at midnight
export function scheduleSync() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Next midnight
  
  const timeToMidnight = midnight.getTime() - now.getTime();
  
  console.log(`Scheduling sync in ${timeToMidnight}ms`);
  
  // Schedule sync
  setTimeout(() => {
    syncTransactionsWithSupabase()
      .then(() => scheduleSync()) // Reschedule for next day
      .catch(err => console.error('Error in scheduled sync:', err));
  }, timeToMidnight);
}

export default db;
