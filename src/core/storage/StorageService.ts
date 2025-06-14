import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Transaction, PaymentMethod, Merchant } from '@/types';
import { DbPaymentMethod, DbMerchant } from '@/types';
import { RewardRule } from '../rewards/types';
import { RuleMapper } from '../rewards/RuleMapper';

export class StorageService {
  private supabase: SupabaseClient<Database>;
  private localStorageMode: boolean = false;
  private ruleMapper: RuleMapper = new RuleMapper();
  
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  setLocalStorageMode(enabled: boolean): void {
    this.localStorageMode = enabled;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: paymentMethods, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;

      return paymentMethods.map(pm => ({
        id: pm.id,
        name: pm.name,
        type: pm.type,
        issuer: pm.issuer || '',
        lastFourDigits: pm.last_four_digits,
        currency: pm.currency,
        icon: pm.icon,
        color: pm.color,
        imageUrl: pm.image_url,
        pointsCurrency: pm.points_currency,
        active: pm.active,
        rewardRules: pm.reward_rules,
        selectedCategories: pm.selected_categories,
        statementStartDay: pm.statement_start_day,
        isMonthlyStatement: pm.is_monthly_statement,
        conversionRate: pm.conversion_rate
      }));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  async savePaymentMethods(paymentMethods: PaymentMethod[]): Promise<void> {
    try {
      const dbPaymentMethods: DbPaymentMethod[] = paymentMethods.map(pm => ({
        id: pm.id,
        name: pm.name,
        type: pm.type,
        issuer: pm.issuer,
        last_four_digits: pm.lastFourDigits,
        currency: pm.currency,
        icon: pm.icon,
        color: pm.color,
        image_url: pm.imageUrl,
        points_currency: pm.pointsCurrency,
        active: pm.active,
        reward_rules: pm.rewardRules,
        selected_categories: pm.selectedCategories,
        statement_start_day: pm.statementStartDay,
        is_monthly_statement: pm.isMonthlyStatement,
        conversion_rate: pm.conversionRate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('payment_methods')
        .upsert(dbPaymentMethods);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving payment methods:', error);
      throw error;
    }
  }

  async getMerchants(): Promise<Merchant[]> {
    try {
      const { data: merchants, error } = await this.supabase
        .from('merchants')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;

      return merchants.map(m => ({
        id: m.id,
        name: m.name,
        address: m.address || '',
        mcc: m.mcc ? {
          code: m.mcc.code,
          description: m.mcc.description
        } : undefined,
        isOnline: m.is_online || false,
        coordinates: m.coordinates
      }));
    } catch (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }
  }

  async saveMerchants(merchants: Merchant[]): Promise<void> {
    try {
      const dbMerchants: DbMerchant[] = merchants.map(m => ({
        id: m.id,
        name: m.name,
        address: m.address,
        mcc: m.mcc,
        is_online: m.isOnline,
        coordinates: m.coordinates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('merchants')
        .upsert(dbMerchants);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving merchants:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          payment_methods!inner(
            id,
            name,
            type,
            issuer,
            currency,
            icon,
            color,
            image_url,
            last_four_digits,
            active,
            reward_rules,
            selected_categories,
            statement_start_day,
            is_monthly_statement,
            conversion_rate
          ),
          merchants!inner(
            id,
            name,
            address,
            mcc,
            is_online,
            coordinates,
            is_deleted,
            created_at,
            deleted_at
          )
        `)
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      return transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        merchant: {
          id: tx.merchants.id,
          name: tx.merchants.name,
          address: tx.merchants.address || '',
          mcc: tx.merchants.mcc ? {
            code: tx.merchants.mcc.code,
            description: tx.merchants.mcc.description
          } : undefined,
          isOnline: tx.merchants.is_online || false,
          coordinates: tx.merchants.coordinates
        },
        amount: parseFloat(tx.amount),
        currency: tx.currency,
        paymentMethod: {
          id: tx.payment_methods.id,
          name: tx.payment_methods.name,
          type: tx.payment_methods.type,
          issuer: tx.payment_methods.issuer || '',
          lastFourDigits: tx.payment_methods.last_four_digits,
          currency: tx.payment_methods.currency,
          icon: tx.payment_methods.icon,
          color: tx.payment_methods.color,
          imageUrl: tx.payment_methods.image_url,
          pointsCurrency: tx.payment_methods.points_currency, // Default to currency if not set
          active: tx.payment_methods.active,
          rewardRules: tx.payment_methods.reward_rules,
          selectedCategories: tx.payment_methods.selected_categories,
          statementStartDay: tx.payment_methods.statement_start_day,
          isMonthlyStatement: tx.payment_methods.is_monthly_statement,
          conversionRate: tx.payment_methods.conversion_rate
        },
        paymentAmount: parseFloat(tx.payment_amount || tx.amount),
        paymentCurrency: tx.payment_currency || tx.currency,
        rewardPoints: tx.total_points || 0,
        basePoints: tx.base_points || 0,
        bonusPoints: tx.bonus_points || 0,
        isContactless: tx.is_contactless || false,
        notes: tx.notes,
        reimbursementAmount: tx.reimbursement_amount ? parseFloat(tx.reimbursement_amount) : undefined,
        category: tx.category
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const dbTransactions = transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        merchant_id: tx.merchant.id,
        amount: tx.amount,
        currency: tx.currency,
        payment_method_id: tx.paymentMethod.id,
        payment_amount: tx.paymentAmount,
        payment_currency: tx.paymentCurrency,
        total_points: tx.rewardPoints,
        base_points: tx.basePoints,
        bonus_points: tx.bonusPoints,
        is_contactless: tx.isContactless,
        notes: tx.notes,
        reimbursement_amount: tx.reimbursementAmount,
        category: tx.category,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('transactions')
        .upsert(dbTransactions);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw error;
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        ...transaction,
      };

      const dbTransaction = {
        id: newTransaction.id,
        date: newTransaction.date,
        merchant_id: newTransaction.merchant.id,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        payment_method_id: newTransaction.paymentMethod.id,
        payment_amount: newTransaction.paymentAmount,
        payment_currency: newTransaction.paymentCurrency,
        total_points: newTransaction.rewardPoints,
        base_points: newTransaction.basePoints,
        bonus_points: newTransaction.bonusPoints,
        is_contactless: newTransaction.isContactless,
        notes: newTransaction.notes,
        reimbursement_amount: newTransaction.reimbursementAmount,
        category: newTransaction.category,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('transactions')
        .insert([dbTransaction]);

      if (error) throw error;

      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async editTransaction(id: string, transactionData: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    try {
      const dbTransaction = {
        merchant_id: transactionData.merchant?.id,
        amount: transactionData.amount,
        currency: transactionData.currency,
        payment_method_id: transactionData.paymentMethod?.id,
        payment_amount: transactionData.paymentAmount,
        payment_currency: transactionData.paymentCurrency,
        total_points: transactionData.rewardPoints,
        base_points: transactionData.basePoints,
        bonus_points: transactionData.bonusPoints,
        is_contactless: transactionData.isContactless,
        notes: transactionData.notes,
        reimbursement_amount: transactionData.reimbursementAmount,
        category: transactionData.category,
        updated_at: new Date().toISOString()
      };

      // Remove undefined properties from the update object
      Object.keys(dbTransaction).forEach(key => dbTransaction[key] === undefined ? delete dbTransaction[key] : {});

      const { error } = await this.supabase
        .from('transactions')
        .update(dbTransaction)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error editing transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  async updateMerchantTracking(merchantName: string): Promise<void> {
    try {
      // Fetch all transactions for the given merchant name
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select('*')
        .like('merchant_name', merchantName);

      if (error) {
        console.error('Error fetching transactions for merchant:', merchantName, error);
        return;
      }

      // Update each transaction with the correct merchant ID
      for (const transaction of transactions) {
        const { data: merchant, error: merchantError } = await this.supabase
          .from('merchants')
          .select('id')
          .eq('name', merchantName)
          .single();

        if (merchantError) {
          console.error('Error fetching merchant ID for name:', merchantName, merchantError);
          continue; // Skip this transaction and move to the next
        }

        if (merchant) {
          const { error: updateError } = await this.supabase
            .from('transactions')
            .update({ merchant_id: merchant.id })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('Error updating transaction with new merchant ID:', transaction.id, merchant.id, updateError);
          } else {
            console.log(`Transaction ${transaction.id} updated with merchant ID ${merchant.id}`);
          }
        } else {
          console.warn(`No merchant found with name: ${merchantName}`);
        }
      }
    } catch (error) {
      console.error('Error updating merchant tracking:', error);
    }
  }
}
