import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, PaymentMethod, Merchant } from "@/types";
import { StorageProvider, StorageProviderFactory } from "./StorageProvider";
import { BonusPointsService } from "../rewards/BonusPointsService";
import { MerchantService } from "../merchants/MerchantService";

/**
 * Refactored StorageService that uses specialized services and abstractions
 * Handles storage operations with a cleaner separation of concerns
 */
export class StorageService {
  private static instance: StorageService;
  private storageProvider: StorageProvider;
  private bonusPointsService: BonusPointsService;
  private merchantService: MerchantService;
  private useLocalStorage: boolean = false;

  private constructor() {
    this.storageProvider = StorageProviderFactory.getProvider(
      this.useLocalStorage,
      supabase
    );
    this.bonusPointsService = BonusPointsService.getInstance(
      this.storageProvider
    );
    this.merchantService = MerchantService.getInstance(this.storageProvider);
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public setLocalStorageMode(useLocalStorage: boolean): void {
    this.useLocalStorage = useLocalStorage;
    // Recreate providers with new storage mode
    this.storageProvider = StorageProviderFactory.getProvider(
      useLocalStorage,
      supabase
    );
    this.bonusPointsService = BonusPointsService.getInstance(
      this.storageProvider
    );
    this.merchantService = MerchantService.getInstance(this.storageProvider);
    console.log(
      `Storage mode set to ${useLocalStorage ? "local storage" : "Supabase"}`
    );
  }

  public isLocalStorageMode(): boolean {
    return this.useLocalStorage;
  }

  // =========== Transaction Methods ===========

  public async getTransactions(): Promise<Transaction[]> {
    console.log(
      `Getting transactions with localStorage mode: ${this.useLocalStorage}`
    );

    try {
      if (this.useLocalStorage) {
        return (
          (await this.storageProvider.get<Transaction[]>("transactions")) || []
        );
      } else {
        // Get transactions from Supabase with appropriate options
        interface DbTransaction {
          id: string;
          date: string;
          amount: number;
          currency: string;
          payment_amount: number;
          payment_currency: string;
          reward_points: number;
          base_points: number;
          bonus_points: number;
          is_contactless: boolean;
          is_deleted: boolean;
          notes: string;
          reimbursement_amount: number;
          category: string;
          merchant_id: string;
          payment_method_id: string;
        }

        interface DbPaymentMethod {
          id: string;
          name: string;
          type: string;
          currency: string;
          active: boolean;
          issuer?: string;
          last_four_digits?: string;
          reward_rules?: unknown[];
        }

        interface DbMerchant {
          id: string;
          name: string;
          address?: string;
          is_online?: boolean;
          coordinates?: Record<string, unknown>;
          mcc?: Record<string, unknown>;
        }

        const transactions = await this.storageProvider.query<DbTransaction>(
          "transactions",
          {
            select: `
            id,
            date,
            amount,
            currency,
            payment_amount,
            payment_currency,
            reward_points,
            base_points,
            bonus_points,
            is_contactless,
            is_deleted,
            notes,
            reimbursement_amount,
            category,
            merchant_id,
            payment_method_id
          `,
            filters: [{ column: "is_deleted", value: false, eq: true }],
          }
        );

        // Get payment methods and merchants to enrich transaction data
        const paymentMethods =
          await this.storageProvider.query<DbPaymentMethod>("payment_methods");
        const merchants =
          await this.storageProvider.query<DbMerchant>("merchants");

        // Map data to Transaction type
        const processedTransactions = transactions.map((item) => {
          // Find the associated payment method
          const paymentMethod = paymentMethods?.find(
            (pm) => pm.id === item.payment_method_id
          );

          // Create a default payment method if none is found
          const processedPaymentMethod = {
            id: paymentMethod?.id || item.payment_method_id,
            name: paymentMethod?.name || "Unknown",
            type:
              (paymentMethod?.type as "credit_card" | "cash") || "credit_card",
            currency: paymentMethod?.currency || item.payment_currency || "SGD",
            active: paymentMethod?.active !== false,
            issuer: paymentMethod?.issuer,
            lastFourDigits: paymentMethod?.last_four_digits,
            rewardRules: (paymentMethod?.reward_rules || []) as unknown[],
          };

          // Find the associated merchant
          const merchant = merchants?.find((m) => m.id === item.merchant_id);

          // Process merchant data safely
          const processedMerchant = {
            id: merchant?.id || item.merchant_id,
            name: merchant?.name || "Unknown Merchant",
            address: merchant?.address || undefined,
            isOnline: merchant?.is_online || false,
            coordinates: merchant?.coordinates
              ? typeof merchant.coordinates === "object"
                ? (merchant.coordinates as Record<string, unknown>)
                : undefined
              : undefined,
            mcc: merchant?.mcc
              ? typeof merchant.mcc === "object"
                ? (merchant.mcc as Record<string, unknown>)
                : undefined
              : undefined,
          };

          return {
            id: item.id,
            date: item.date,
            merchant: processedMerchant,
            amount: Number(item.amount),
            currency: item.currency,
            paymentMethod: processedPaymentMethod,
            paymentAmount: Number(item.payment_amount || item.amount),
            paymentCurrency: item.payment_currency || item.currency,
            rewardPoints: item.reward_points || 0,
            basePoints: item.base_points || 0,
            bonusPoints: item.bonus_points || 0,
            isContactless: item.is_contactless || false,
            notes: item.notes || "",
            reimbursementAmount: item.reimbursement_amount
              ? Number(item.reimbursement_amount)
              : 0,
            category: item.category,
          } as Transaction;
        });

        console.log(
          `Retrieved ${processedTransactions.length} transactions from Supabase`
        );
        return processedTransactions;
      }
    } catch (error) {
      console.error("Error getting transactions:", error);
      return [];
    }
  }

  public async addTransaction(
    transactionData: Omit<Transaction, "id">
  ): Promise<Transaction> {
    try {
      if (this.useLocalStorage) {
        // Create a new transaction with a UUID
        const id = uuidv4();
        const newTransaction: Transaction = {
          id,
          ...transactionData,
        };

        // Store the transaction
        const transactions = await this.getTransactions();
        const updatedTransactions = [...transactions, newTransaction];
        await this.storageProvider.set("transactions", updatedTransactions);

        // Record bonus points if any
        if (newTransaction.bonusPoints && newTransaction.bonusPoints > 0) {
          await this.bonusPointsService.recordMovement(
            newTransaction.id,
            newTransaction.paymentMethod.id,
            newTransaction.bonusPoints
          );
        }

        return newTransaction;
      } else {
        // First, handle the merchant
        const merchant = transactionData.merchant;
        let merchantId = merchant.id;

        if (!merchantId || merchantId === "") {
          // Try to find or create merchant using merchantService
          const savedMerchant =
            await this.merchantService.saveMerchant(merchant);
          if (!savedMerchant) {
            throw new Error("Failed to save merchant");
          }
          merchantId = savedMerchant.id;
        }

        // Convert Transaction to DB format
        const dbTransaction = {
          date: transactionData.date,
          amount: transactionData.amount,
          currency: transactionData.currency,
          payment_amount: transactionData.paymentAmount,
          payment_currency: transactionData.paymentCurrency,
          reward_points: transactionData.rewardPoints,
          base_points: transactionData.basePoints,
          bonus_points: transactionData.bonusPoints,
          is_contactless: transactionData.isContactless,
          notes: transactionData.notes,
          reimbursement_amount: transactionData.reimbursementAmount,
          merchant_id: merchantId,
          payment_method_id: transactionData.paymentMethod.id,
        };

        // Insert into database
        const insertedTransaction = await this.storageProvider.insert<
          Record<string, unknown>
        >("transactions", dbTransaction);

        if (!insertedTransaction) {
          throw new Error("Failed to save transaction");
        }

        // Create the full transaction object
        const newTransaction: Transaction = {
          id: insertedTransaction.id,
          date: transactionData.date,
          merchant: {
            ...transactionData.merchant,
            id: merchantId, // Use the correct merchant ID
          },
          amount: transactionData.amount,
          currency: transactionData.currency,
          paymentMethod: transactionData.paymentMethod,
          paymentAmount: transactionData.paymentAmount,
          paymentCurrency: transactionData.paymentCurrency,
          rewardPoints: transactionData.rewardPoints,
          basePoints: transactionData.basePoints,
          bonusPoints: transactionData.bonusPoints,
          isContactless: transactionData.isContactless,
          notes: transactionData.notes,
          reimbursementAmount: transactionData.reimbursementAmount,
        };

        // Update merchant occurrence tracking
        if (transactionData.merchant.mcc) {
          await this.merchantService.incrementOccurrence(
            transactionData.merchant.name,
            transactionData.merchant.mcc
          );
        }

        // Record bonus points if any
        if (newTransaction.bonusPoints && newTransaction.bonusPoints > 0) {
          await this.bonusPointsService.recordMovement(
            newTransaction.id,
            newTransaction.paymentMethod.id,
            newTransaction.bonusPoints
          );
        }

        return newTransaction;
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }
  }

  public async deleteTransaction(id: string): Promise<boolean> {
    try {
      if (this.useLocalStorage) {
        // Delete from local storage
        const transactions = await this.getTransactions();
        const filteredTransactions = transactions.filter((t) => t.id !== id);

        if (filteredTransactions.length === transactions.length) {
          // Transaction not found
          return false;
        }

        // Update transactions list
        await this.storageProvider.set("transactions", filteredTransactions);

        // Delete bonus points movements
        await this.bonusPointsService.deleteMovements(id);

        return true;
      } else {
        // Soft delete in Supabase
        const success = await this.storageProvider.update("transactions", id, {
          is_deleted: true,
        });

        if (!success) {
          console.error("Error deleting transaction:", id);
          return false;
        }

        // Delete bonus points movements
        await this.bonusPointsService.deleteMovements(id);

        return true;
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  }

  public async editTransaction(
    id: string,
    data: Partial<Transaction>
  ): Promise<Transaction> {
    if (this.useLocalStorage) {
      // Update in local storage
      const transactions = await this.getTransactions();
      const transactionIndex = transactions.findIndex((t) => t.id === id);

      if (transactionIndex === -1) {
        throw new Error(`Transaction with ID ${id} not found`);
      }

      const updatedTransaction = {
        ...transactions[transactionIndex],
        ...data,
      };

      transactions[transactionIndex] = updatedTransaction;
      await this.storageProvider.set("transactions", transactions);

      return updatedTransaction;
    } else {
      // Update in Supabase
      try {
        // Prepare data for update
        const updateData: Record<string, unknown> = {};

        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.paymentAmount !== undefined)
          updateData.payment_amount = data.paymentAmount;
        if (data.paymentCurrency !== undefined)
          updateData.payment_currency = data.paymentCurrency;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.isContactless !== undefined)
          updateData.is_contactless = data.isContactless;
        if (data.rewardPoints !== undefined)
          updateData.reward_points = data.rewardPoints;
        if (data.basePoints !== undefined)
          updateData.base_points = data.basePoints;
        if (data.bonusPoints !== undefined)
          updateData.bonus_points = data.bonusPoints;
        if (data.reimbursementAmount !== undefined)
          updateData.reimbursement_amount = data.reimbursementAmount;
        if (data.category !== undefined) updateData.category = data.category;

        // Handle payment method update
        if (data.paymentMethod) {
          updateData.payment_method_id = data.paymentMethod.id;
        }

        // Handle merchant update
        if (data.merchant) {
          // Use merchantService to save/update merchant
          const savedMerchant = await this.merchantService.saveMerchant(
            data.merchant
          );
          if (savedMerchant) {
            updateData.merchant_id = savedMerchant.id;
          }
        }

        // Update the transaction
        const success = await this.storageProvider.update(
          "transactions",
          id,
          updateData
        );

        if (!success) {
          throw new Error(`Failed to update transaction: ${id}`);
        }

        // Get the updated transaction
        const transactions = await this.getTransactions();
        const fullTransaction = transactions.find((t) => t.id === id);

        if (!fullTransaction) {
          throw new Error(`Transaction with ID ${id} not found after update`);
        }

        return fullTransaction;
      } catch (error) {
        console.error("Error updating transaction:", error);
        throw error;
      }
    }
  }

  // =========== Payment Method Methods ===========

  public async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      console.log(
        `Getting payment methods with localStorage mode: ${this.useLocalStorage}`
      );

      if (this.useLocalStorage) {
        // Try to get from local storage
        const paymentMethods =
          await this.storageProvider.get<PaymentMethod[]>("paymentMethods");
        if (paymentMethods && paymentMethods.length > 0) {
          return paymentMethods;
        }

        // Return default methods if none found
        return this.getDefaultPaymentMethods();
      } else {
        // Get from Supabase
        interface DbPaymentMethod {
          id: string;
          name: string;
          type: string;
          currency: string;
          active: boolean;
          issuer?: string;
          last_four_digits?: string;
          image_url?: string;
          color?: string;
          is_monthly_statement?: boolean;
          statement_start_day?: number;
          reward_rules?: unknown[];
        }

        const dbPaymentMethods =
          await this.storageProvider.query<DbPaymentMethod>("payment_methods", {
            orderBy: { column: "name", options: { ascending: true } },
          });

        if (!dbPaymentMethods || dbPaymentMethods.length === 0) {
          console.log("No payment methods found, returning defaults");
          return this.getDefaultPaymentMethods();
        }

        // Transform to our PaymentMethod type
        const paymentMethods = dbPaymentMethods.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type as "credit_card" | "cash",
          currency: item.currency,
          active: item.active !== false,
          issuer: item.issuer,
          lastFourDigits: item.last_four_digits,
          imageUrl: item.image_url,
          color: item.color,
          isMonthlyStatement: item.is_monthly_statement,
          statementStartDay: item.statement_start_day,
          rewardRules: (item.reward_rules || []) as unknown[],
        })) as PaymentMethod[];

        console.log(
          `Retrieved ${paymentMethods.length} payment methods from Supabase`
        );
        return paymentMethods;
      }
    } catch (error) {
      console.error("Error getting payment methods:", error);
      return this.getDefaultPaymentMethods();
    }
  }

  private getDefaultPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: uuidv4(),
        name: "Cash (SGD)",
        type: "cash",
        currency: "SGD",
        active: true,
        rewardRules: [],
      },
      {
        id: uuidv4(),
        name: "Cash (USD)",
        type: "cash",
        currency: "USD",
        active: true,
        rewardRules: [],
      },
      {
        id: uuidv4(),
        name: "Visa Card",
        type: "credit_card",
        currency: "SGD",
        issuer: "Visa",
        lastFourDigits: "1234",
        active: true,
        rewardRules: [],
      },
    ];
  }

  public async savePaymentMethods(
    paymentMethods: PaymentMethod[]
  ): Promise<boolean> {
    try {
      if (this.useLocalStorage) {
        return await this.storageProvider.set("paymentMethods", paymentMethods);
      } else {
        // For Supabase, handle each method individually
        for (const method of paymentMethods) {
          const dbData = {
            id: method.id,
            name: method.name,
            type: method.type,
            currency: method.currency,
            active: method.active,
            issuer: method.issuer,
            last_four_digits: method.lastFourDigits,
            image_url: method.imageUrl,
            color: method.color,
            is_monthly_statement: method.isMonthlyStatement,
            statement_start_day: method.statementStartDay,
            reward_rules: method.rewardRules as unknown[],
          };

          await this.storageProvider.upsert("payment_methods", dbData);
        }
        return true;
      }
    } catch (error) {
      console.error("Error saving payment methods:", error);
      return false;
    }
  }

  // =========== Merchant Methods ===========

  public async getMerchantByName(name: string): Promise<Merchant | null> {
    return this.merchantService.getMerchantByName(name);
  }

  public async hasMerchantCategorySuggestions(name: string): Promise<boolean> {
    return this.merchantService.hasCategorySuggestions(name);
  }

  public async getSuggestedMerchantCategory(
    name: string
  ): Promise<MerchantCategoryCode | null> {
    return this.merchantService.getSuggestedCategory(name);
  }

  // =========== Export Methods ===========

  public async exportTransactionsToCSV(
    transactions: Transaction[]
  ): Promise<string> {
    // Create headers
    const headers = [
      "Date",
      "Merchant",
      "Amount",
      "Currency",
      "Payment Method",
      "Category",
      "Points",
    ].join(",");

    // Create rows
    const rows = transactions.map((transaction) => {
      return [
        transaction.date,
        `"${transaction.merchant.name.replace(/"/g, '""')}"`, // Escape quotes in merchant name
        transaction.amount,
        transaction.currency,
        `"${transaction.paymentMethod.name.replace(/"/g, '""')}"`,
        transaction.category || "Uncategorized",
        transaction.rewardPoints || 0,
      ].join(",");
    });

    // Combine headers and rows
    return [headers, ...rows].join("\n");
  }

  // =========== Bonus Points Methods ===========

  public async getBonusPointsForPaymentMethod(
    paymentMethodId: string
  ): Promise<number> {
    return this.bonusPointsService.getTotalBonusPoints(paymentMethodId);
  }
}

// Export a singleton instance
export const storageService = StorageService.getInstance();
