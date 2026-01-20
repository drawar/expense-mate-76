import { supabase } from "@/integrations/supabase/client";
import {
  Transaction,
  PaymentMethod,
  Merchant,
  DbPaymentMethod,
  DbMerchant,
  Currency,
  MerchantCategoryCode,
} from "@/types";
import { initializeRewardSystem, calculateRewardPoints } from "@/core/rewards";
import { getMCCFromMerchantName } from "@/utils/constants/merchantMccMapping";
import { categorizationService } from "@/core/categorization";

export class StorageService {
  private useLocalStorage: boolean = false;
  // Default user ID for operations when auth is disabled
  private readonly DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

  constructor() {
    // Initialize reward system when storage service is created
    this.initializeRewards();
  }

  private async initializeRewards() {
    try {
      await initializeRewardSystem();
    } catch (error) {
      console.warn("Failed to initialize reward system:", error);
    }
  }

  setLocalStorageMode(useLocal: boolean) {
    this.useLocalStorage = useLocal;
    // Re-initialize reward system with new mode
    this.initializeRewards();
  }

  async getPaymentMethods(options?: {
    includeInactive?: boolean;
  }): Promise<PaymentMethod[]> {
    const includeInactive = options?.includeInactive ?? false;
    console.log("StorageService.getPaymentMethods: Starting...", {
      includeInactive,
    });
    console.log(
      "StorageService.getPaymentMethods: useLocalStorage =",
      this.useLocalStorage
    );

    if (this.useLocalStorage) {
      const local = this.getPaymentMethodsFromLocalStorage();
      console.log(
        "StorageService.getPaymentMethods: Using localStorage, found",
        local.length,
        "methods"
      );
      // Filter inactive if not requested
      return includeInactive
        ? local
        : local.filter((pm) => pm.active !== false);
    }

    // If not authenticated, fall back to local storage
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;
    console.log(
      "StorageService.getPaymentMethods: Auth check - authenticated:",
      !!session?.user
    );

    if (!session?.user) {
      const local = this.getPaymentMethodsFromLocalStorage();
      console.log(
        "StorageService.getPaymentMethods: Not authenticated, using localStorage, found",
        local.length,
        "methods"
      );
      return includeInactive
        ? local
        : local.filter((pm) => pm.active !== false);
    }

    try {
      console.log(
        "StorageService.getPaymentMethods: Querying Supabase for payment methods...",
        { includeInactive }
      );
      // Join with card_catalog for default_image_url and reward_currencies for display_name, logo_url, bg_color, and logo_scale
      let query = supabase
        .from("payment_methods")
        .select(
          "*, card_catalog(default_image_url), reward_currencies(display_name, logo_url, bg_color, logo_scale)"
        );

      // Only filter by active status if not including inactive
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.order("name");

      console.log("StorageService.getPaymentMethods: Supabase query result:", {
        dataCount: data?.length || 0,
        error: error?.message || null,
      });

      if (error) {
        console.error(
          "StorageService.getPaymentMethods: Supabase error:",
          error
        );
        const local = this.getPaymentMethodsFromLocalStorage();
        console.log(
          "StorageService.getPaymentMethods: Falling back to localStorage, found",
          local.length,
          "methods"
        );
        return local;
      }

      if (!data || data.length === 0) {
        console.log(
          "StorageService.getPaymentMethods: No data from Supabase, checking localStorage..."
        );
        const local = this.getPaymentMethodsFromLocalStorage();
        console.log(
          "StorageService.getPaymentMethods: Found",
          local.length,
          "methods in localStorage"
        );
        return local;
      }

      const mappedData = data.map((row) => {
        // Get catalog image as fallback (row.card_catalog is the joined data)
        const catalogImageUrl = (
          row.card_catalog as { default_image_url?: string } | null
        )?.default_image_url;

        // Get display_name, logo_url, bg_color, and logo_scale from reward_currencies as single source of truth
        // Fall back to points_currency for backwards compatibility
        const rewardCurrency = row.reward_currencies as {
          display_name?: string;
          logo_url?: string;
          bg_color?: string;
          logo_scale?: number;
        } | null;

        return {
          id: row.id,
          name: row.name,
          type: row.type as PaymentMethod["type"],
          issuer: row.issuer || "",
          lastFourDigits: row.last_four_digits || undefined,
          currency: row.currency as Currency,
          icon: row.icon || undefined,
          color: row.color || undefined,
          // Use catalog's default_image_url first (canonical), fall back to payment method's custom image_url
          imageUrl: catalogImageUrl || row.image_url || undefined,
          // Use reward_currencies.display_name as source of truth, fall back to stored points_currency
          pointsCurrency:
            rewardCurrency?.display_name || row.points_currency || undefined,
          rewardCurrencyId: row.reward_currency_id || undefined,
          rewardCurrencyLogoUrl: rewardCurrency?.logo_url || undefined,
          rewardCurrencyBgColor: rewardCurrency?.bg_color || undefined,
          rewardCurrencyLogoScale: rewardCurrency?.logo_scale || undefined,
          active: row.is_active ?? true,
          rewardRules: (row.reward_rules as unknown[]) || [],
          selectedCategories: Array.isArray(row.selected_categories)
            ? (row.selected_categories as string[])
            : [],
          statementStartDay: row.statement_start_day ?? undefined,
          isMonthlyStatement: row.is_monthly_statement ?? undefined,
          conversionRate:
            (row.conversion_rate as Record<string, number>) || undefined,
          totalLoaded: row.total_loaded ?? undefined,
          purchaseDate: row.purchase_date ?? undefined,
          // Card catalog linkage
          cardCatalogId: row.card_catalog_id || undefined,
          nickname: row.nickname || undefined,
        };
      });

      console.log(
        "StorageService.getPaymentMethods: Returning",
        mappedData.length,
        "payment methods from Supabase"
      );
      return mappedData;
    } catch (error) {
      console.error("StorageService.getPaymentMethods: Caught error:", error);
      const local = this.getPaymentMethodsFromLocalStorage();
      console.log(
        "StorageService.getPaymentMethods: Falling back to localStorage, found",
        local.length,
        "methods"
      );
      return local;
    }
  }

  private getPaymentMethodsFromLocalStorage(): PaymentMethod[] {
    try {
      // Check both possible keys for backward compatibility
      let stored = localStorage.getItem("expense-tracker-payment-methods");
      if (!stored) {
        stored = localStorage.getItem("paymentMethods");
      }
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error parsing payment methods from localStorage:", error);
      return [];
    }
  }

  private savePaymentMethodsToLocalStorage(paymentMethods: PaymentMethod[]) {
    try {
      localStorage.setItem(
        "expense-tracker-payment-methods",
        JSON.stringify(paymentMethods)
      );
      // Remove old key if it exists
      localStorage.removeItem("paymentMethods");
    } catch (error) {
      console.error("Error saving payment methods to localStorage:", error);
    }
  }

  async savePaymentMethods(paymentMethods: PaymentMethod[]): Promise<void> {
    // If using local mode or not authenticated, persist locally
    if (this.useLocalStorage) {
      this.savePaymentMethodsToLocalStorage(paymentMethods);
      return;
    }

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;
    if (!session?.user) {
      this.savePaymentMethodsToLocalStorage(paymentMethods);
      return;
    }

    try {
      // Filter out invalid payment methods (missing required fields)
      const validPaymentMethods = paymentMethods.filter((pm) => {
        if (!pm.id || !pm.name) {
          console.warn(
            "Skipping invalid payment method (missing id or name):",
            pm.id
          );
          return false;
        }
        return true;
      });

      // Transform PaymentMethod objects to database format
      // Use nullish coalescing (??) to preserve falsy values like false or 0
      // Only convert to null when the value is undefined or null
      const dbPaymentMethods = validPaymentMethods.map((pm) => ({
        id: pm.id,
        name: pm.name,
        type: pm.type,
        issuer: pm.issuer,
        last_four_digits: pm.lastFourDigits,
        currency: pm.currency,
        icon: pm.icon,
        color: pm.color,
        image_url: pm.imageUrl,
        // points_currency is deprecated - display name comes from reward_currencies join
        // Only keep for backwards compatibility with old data
        points_currency: pm.rewardCurrencyId
          ? null
          : (pm.pointsCurrency ?? null),
        reward_currency_id: pm.rewardCurrencyId ?? null,
        is_active: pm.active,
        reward_rules: pm.rewardRules as unknown,
        selected_categories: pm.selectedCategories as unknown,
        statement_start_day: pm.statementStartDay ?? null,
        is_monthly_statement: pm.isMonthlyStatement ?? null,
        conversion_rate: pm.conversionRate as unknown,
        total_loaded: pm.totalLoaded ?? null,
        purchase_date: pm.purchaseDate ?? null,
        // Card catalog linkage
        card_catalog_id: pm.cardCatalogId ?? null,
        nickname: pm.nickname ?? null,
        user_id: session.user.id,
      }));

      // Upsert instead of delete-all to respect RLS
      const { error } = await supabase
        .from("payment_methods")
        .upsert(dbPaymentMethods, { onConflict: "id" });

      if (error) {
        console.error(
          "Error saving payment methods, falling back to local:",
          error
        );
        this.savePaymentMethodsToLocalStorage(paymentMethods);
      }
    } catch (error) {
      console.error(
        "Error in savePaymentMethods, falling back to local:",
        error
      );
      this.savePaymentMethodsToLocalStorage(paymentMethods);
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      // First, ensure all merchants exist
      const merchantData = transactions.map((t) => ({
        id: t.merchant.id || crypto.randomUUID(),
        name: t.merchant.name,
        address: t.merchant.address,
        mcc: t.merchant.mcc ? JSON.parse(JSON.stringify(t.merchant.mcc)) : null,
        is_online: t.merchant.isOnline,
        coordinates: t.merchant.coordinates
          ? JSON.parse(JSON.stringify(t.merchant.coordinates))
          : null,
      }));

      if (merchantData.length > 0) {
        await supabase
          .from("merchants")
          .upsert(merchantData, { onConflict: "id" });
      }

      // Transform Transaction objects to database format
      const dbTransactions = transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        merchant_id: transaction.merchant.id || crypto.randomUUID(),
        amount: transaction.amount,
        currency: transaction.currency,
        payment_method_id: transaction.paymentMethod.id,
        payment_amount: transaction.paymentAmount,
        payment_currency: transaction.paymentCurrency,
        total_points: transaction.rewardPoints,
        base_points: transaction.basePoints,
        bonus_points: transaction.bonusPoints,
        promo_bonus_points: transaction.promoBonusPoints || 0,
        is_contactless: transaction.isContactless,
        notes: transaction.notes,
        reimbursement_amount: transaction.reimbursementAmount,
        category: transaction.category,
        user_id: this.DEFAULT_USER_ID,
      }));

      // Clear existing transactions and insert new ones
      await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (dbTransactions.length > 0) {
        const { error } = await supabase
          .from("transactions")
          .insert(dbTransactions);

        if (error) {
          console.error("Error saving transactions:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in saveTransactions:", error);
      throw error;
    }
  }

  async getMerchants(): Promise<Merchant[]> {
    try {
      const { data: merchants, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("is_deleted", false);

      if (error) throw error;

      return merchants.map((m) => ({
        id: m.id,
        name: m.name,
        address: m.address || "",
        mcc: m.mcc ? this.parseMCC(m.mcc) : undefined,
        isOnline: m.is_online || false,
        coordinates: m.coordinates
          ? this.parseCoordinates(m.coordinates)
          : undefined,
      }));
    } catch (error) {
      console.error("Error fetching merchants:", error);
      throw error;
    }
  }

  private parseMCC(mccData: unknown): MerchantCategoryCode | undefined {
    if (!mccData) return undefined;

    // Handle JSON string format from database
    if (typeof mccData === "string") {
      try {
        const parsed = JSON.parse(mccData);
        if (parsed && parsed.code && parsed.description) {
          return {
            code: String(parsed.code),
            description: String(parsed.description),
          };
        }
      } catch {
        // Not valid JSON, return undefined
        return undefined;
      }
    }

    // Handle JSONB object format from database
    if (typeof mccData === "object" && mccData !== null) {
      const obj = mccData as Record<string, unknown>;
      if (obj.code && obj.description) {
        return {
          code: String(obj.code),
          description: String(obj.description),
        };
      }
    }

    return undefined;
  }

  private parseCoordinates(
    coordinatesData: unknown
  ): { lat: number; lng: number } | undefined {
    if (!coordinatesData) return undefined;

    // Handle different possible formats of coordinates data
    if (typeof coordinatesData === "object" && coordinatesData !== null) {
      const coords = coordinatesData as { lat?: unknown; lng?: unknown };
      if (coords.lat !== undefined && coords.lng !== undefined) {
        return {
          lat: Number(coords.lat),
          lng: Number(coords.lng),
        };
      }
    }

    return undefined;
  }

  async saveMerchants(merchants: Merchant[]): Promise<void> {
    try {
      const dbMerchants = merchants.map((m) => ({
        id: m.id,
        name: m.name,
        address: m.address,
        mcc: m.mcc ? JSON.parse(JSON.stringify(m.mcc)) : null,
        is_online: m.isOnline,
        coordinates: m.coordinates
          ? JSON.parse(JSON.stringify(m.coordinates))
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("merchants").upsert(dbMerchants);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving merchants:", error);
      throw error;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    if (this.useLocalStorage) {
      return this.getTransactionsFromLocalStorage();
    }

    // Check if user is authenticated
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (!session?.user) {
      console.log("Not authenticated, returning empty transactions");
      return this.getTransactionsFromLocalStorage();
    }

    try {
      console.log(
        "Fetching transactions from Supabase for user:",
        session.user.id
      );

      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          payment_methods:payment_method_id(
            id, name, type, issuer, last_four_digits, currency,
            icon, color, image_url, points_currency, is_active,
            reward_rules, selected_categories, statement_start_day,
            is_monthly_statement, conversion_rate, reward_currency_id,
            card_catalog_id,
            card_catalog(default_image_url),
            reward_currencies(display_name, logo_url, bg_color, logo_scale)
          ),
          merchants:merchant_id(
            id, name, address, mcc, mcc_code, is_online, coordinates, is_deleted
          )
        `
        )
        .eq("user_id", session.user.id)
        .or(`is_deleted.is.false,is_deleted.is.null`)
        .order("date", { ascending: false });

      console.log("Supabase query result:", {
        data,
        error,
        count: data?.length,
      });

      if (error) {
        console.error("Supabase error:", error);
        return this.getTransactionsFromLocalStorage();
      }

      if (!data || data.length === 0) {
        console.log("No transactions found in database");
        return [];
      }

      console.log("Processing transactions:", data.length);

      return data.map((row) => ({
        id: row.id,
        date: row.date,
        merchant: {
          id: row.merchants?.id || "",
          name: row.merchants?.name || "Unknown Merchant",
          address: row.merchants?.address || undefined,
          mcc: row.merchants?.mcc
            ? this.parseMCC(row.merchants.mcc)
            : undefined,
          isOnline: row.merchants?.is_online || false,
          coordinates: row.merchants?.coordinates
            ? this.parseCoordinates(row.merchants.coordinates)
            : undefined,
          is_deleted: row.merchants?.is_deleted || false,
        } as Merchant,
        amount: parseFloat(row.amount?.toString() || "0"),
        currency: row.currency as Currency,
        paymentMethod: (() => {
          const rewardCurrency = row.payment_methods?.reward_currencies as {
            display_name?: string;
            logo_url?: string;
            bg_color?: string;
            logo_scale?: number;
          } | null;
          const catalogImageUrl = (
            row.payment_methods?.card_catalog as {
              default_image_url?: string;
            } | null
          )?.default_image_url;
          return {
            id: row.payment_methods?.id || "",
            name: row.payment_methods?.name || "Unknown Payment Method",
            type: row.payment_methods?.type || "credit",
            issuer: row.payment_methods?.issuer || "",
            lastFourDigits: row.payment_methods?.last_four_digits || undefined,
            currency: (row.payment_methods?.currency || "USD") as Currency,
            icon: row.payment_methods?.icon || undefined,
            color: row.payment_methods?.color || undefined,
            // Use catalog's default_image_url first (canonical), fall back to payment method's custom image_url
            imageUrl:
              catalogImageUrl || row.payment_methods?.image_url || undefined,
            // Use reward_currencies as source of truth, fall back to stored values
            pointsCurrency:
              rewardCurrency?.display_name ||
              row.payment_methods?.points_currency ||
              undefined,
            rewardCurrencyId:
              row.payment_methods?.reward_currency_id || undefined,
            rewardCurrencyLogoUrl: rewardCurrency?.logo_url || undefined,
            rewardCurrencyBgColor: rewardCurrency?.bg_color || undefined,
            rewardCurrencyLogoScale: rewardCurrency?.logo_scale || undefined,
            active: row.payment_methods?.is_active || true,
            rewardRules: row.payment_methods?.reward_rules || [],
            selectedCategories: row.payment_methods?.selected_categories || [],
            statementStartDay:
              row.payment_methods?.statement_start_day ?? undefined,
            isMonthlyStatement:
              row.payment_methods?.is_monthly_statement ?? undefined,
            conversionRate: row.payment_methods?.conversion_rate || undefined,
          };
        })() as PaymentMethod,
        paymentAmount: parseFloat(
          row.payment_amount?.toString() || row.amount?.toString() || "0"
        ),
        paymentCurrency: (row.payment_currency || row.currency) as Currency,
        rewardPoints: row.total_points || 0,
        basePoints: row.base_points || 0,
        bonusPoints: row.bonus_points || 0,
        promoBonusPoints: row.promo_bonus_points || 0,
        isContactless: row.is_contactless || false,
        notes: row.notes || undefined,
        reimbursementAmount:
          row.reimbursement_amount != null
            ? parseFloat(row.reimbursement_amount.toString())
            : undefined,
        // Category fields
        mccCode: row.mcc_code || row.merchants?.mcc_code || undefined,
        userCategory: row.user_category || undefined,
        isRecategorized: row.is_recategorized || false,
        category: row.category || undefined, // Legacy field
        // Auto-categorization metadata
        autoCategoryConfidence: row.auto_category_confidence ?? undefined,
        needsReview: row.needs_review ?? false,
        categorySuggestionReason: row.category_suggestion_reason || undefined,
      }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return this.getTransactionsFromLocalStorage();
    }
  }

  private getTransactionsFromLocalStorage(): Transaction[] {
    try {
      const stored = localStorage.getItem("transactions");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error parsing transactions from localStorage:", error);
      return [];
    }
  }

  private saveTransactionsToLocalStorage(transactions: Transaction[]) {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving transactions to localStorage:", error);
    }
  }

  async addTransaction(
    transactionData: Omit<Transaction, "id">
  ): Promise<Transaction> {
    console.log("StorageService.addTransaction called with:", transactionData);

    if (this.useLocalStorage) {
      console.log("Using localStorage mode for transaction");
      return this.addTransactionToLocalStorage(transactionData);
    }

    // Check if user is authenticated
    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;
    console.log(
      "🔐 Auth check - Session exists:",
      !!session,
      "User ID:",
      session?.user?.id
    );

    if (!session?.user) {
      console.error(
        "❌ NO AUTHENTICATED USER - This is the problem! User must be logged in."
      );
      console.log("Falling back to localStorage due to no auth");
      return this.addTransactionToLocalStorage(transactionData);
    }

    console.log(
      "✅ User authenticated with ID:",
      session.user.id,
      "- Proceeding with Supabase insert"
    );

    try {
      // Generate a proper merchant ID if it's empty
      const merchantId = transactionData.merchant.id || crypto.randomUUID();
      console.log("Generated merchant ID:", merchantId);

      // Use the reward points from transactionData (which may be user-edited)
      // Don't recalculate as that would override manual edits
      const rewardPoints = transactionData.rewardPoints || 0;
      const basePoints = transactionData.basePoints || 0;
      const bonusPoints = transactionData.bonusPoints || 0;
      const promoBonusPoints = transactionData.promoBonusPoints || 0;
      console.log("Using reward points from transaction data:", {
        rewardPoints,
        basePoints,
        bonusPoints,
        promoBonusPoints,
      });

      // First, ensure merchant exists
      const mccCode = transactionData.merchant.mcc?.code || null;
      const merchantData = {
        id: merchantId,
        name: transactionData.merchant.name,
        address: transactionData.merchant.address,
        mcc: transactionData.merchant.mcc
          ? JSON.parse(JSON.stringify(transactionData.merchant.mcc))
          : null,
        mcc_code: mccCode, // New normalized column
        is_online: transactionData.merchant.isOnline,
        coordinates: transactionData.merchant.coordinates
          ? JSON.parse(JSON.stringify(transactionData.merchant.coordinates))
          : null,
      };

      console.log("Upserting merchant:", merchantData);
      const merchantResult = await supabase
        .from("merchants")
        .upsert([merchantData], { onConflict: "id" })
        .select()
        .single();

      if (merchantResult.error) {
        console.error("Error upserting merchant:", merchantResult.error);
        console.log("Falling back to localStorage due to merchant error");
        return this.addTransactionToLocalStorage(transactionData);
      }

      console.log("Merchant upserted successfully:", merchantResult.data);

      // Auto-categorize if not already categorized
      let autoCategoryResult: {
        category: string;
        confidence: number;
        requiresReview: boolean;
        reason: string;
      } | null = null;

      if (!transactionData.userCategory && !transactionData.category) {
        try {
          const result =
            await categorizationService.categorizeTransaction(transactionData);
          autoCategoryResult = {
            category: result.category,
            confidence: result.confidence,
            requiresReview: result.requiresReview,
            reason: result.reason,
          };
          console.log("Auto-categorization result:", autoCategoryResult);
        } catch (error) {
          console.error("Error auto-categorizing transaction:", error);
        }
      }

      // Determine user category (use provided, auto-categorized, or derive from MCC)
      const userCategory =
        transactionData.userCategory ||
        transactionData.category ||
        autoCategoryResult?.category ||
        transactionData.merchant.mcc?.description ||
        "Uncategorized";

      // Insert transaction with authenticated user ID
      const transactionInsertData = {
        date: transactionData.date,
        merchant_id: merchantId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        payment_method_id: transactionData.paymentMethod.id,
        payment_amount: transactionData.paymentAmount,
        payment_currency: transactionData.paymentCurrency,
        total_points: rewardPoints,
        base_points: basePoints,
        bonus_points: bonusPoints,
        promo_bonus_points: promoBonusPoints,
        is_contactless: transactionData.isContactless,
        notes: transactionData.notes,
        reimbursement_amount: transactionData.reimbursementAmount,
        // Category fields
        mcc_code: mccCode, // Snapshot MCC code for rewards
        user_category: userCategory, // User-editable category for budgets
        is_recategorized: transactionData.isRecategorized || false,
        category: userCategory, // Sync legacy field
        // Auto-categorization metadata (prefer auto-categorization results if available)
        auto_category_confidence:
          transactionData.autoCategoryConfidence ??
          autoCategoryResult?.confidence ??
          null,
        needs_review:
          transactionData.needsReview ??
          autoCategoryResult?.requiresReview ??
          false,
        category_suggestion_reason:
          transactionData.categorySuggestionReason ??
          autoCategoryResult?.reason ??
          null,
        user_id: session.user.id,
      };

      console.log("Inserting transaction:", transactionInsertData);
      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionInsertData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error adding transaction:", error);
        console.log("Falling back to localStorage due to transaction error");
        return this.addTransactionToLocalStorage(transactionData);
      }

      console.log("Transaction inserted successfully:", data);

      // Note: Cap usage is now computed on-demand from transactions
      // No separate tracking table needed - see CapUsageService.ts

      // Return the complete transaction object
      const newTransaction: Transaction = {
        id: data.id,
        date: data.date,
        merchant: {
          ...transactionData.merchant,
          id: merchantId,
        },
        amount: parseFloat(data.amount.toString()),
        currency: data.currency as Currency,
        paymentMethod: transactionData.paymentMethod,
        paymentAmount: parseFloat(data.payment_amount.toString()),
        paymentCurrency: data.payment_currency as Currency,
        rewardPoints: data.total_points || 0,
        basePoints: data.base_points || 0,
        bonusPoints: data.bonus_points || 0,
        promoBonusPoints: data.promo_bonus_points || 0,
        isContactless: data.is_contactless || false,
        notes: data.notes || undefined,
        reimbursementAmount: data.reimbursement_amount
          ? parseFloat(data.reimbursement_amount.toString())
          : undefined,
        // Category fields
        mccCode: data.mcc_code || undefined,
        userCategory: data.user_category || undefined,
        isRecategorized: data.is_recategorized || false,
        category: data.category || undefined, // Legacy field
        // Auto-categorization metadata
        autoCategoryConfidence: data.auto_category_confidence ?? undefined,
        needsReview: data.needs_review ?? false,
        categorySuggestionReason: data.category_suggestion_reason || undefined,
      };

      // Check prepaid card balance and send notification
      await this.checkPrepaidBalanceAndNotify(
        transactionData.paymentMethod.id,
        {
          merchantName: transactionData.merchant.name,
          amount: transactionData.paymentAmount || transactionData.amount,
          currency: (transactionData.paymentCurrency ||
            transactionData.currency) as Currency,
        }
      );

      console.log("Returning completed transaction:", newTransaction);
      return newTransaction;
    } catch (error) {
      console.error("Error adding transaction to Supabase:", error);
      console.log("Falling back to localStorage due to caught error");
      return this.addTransactionToLocalStorage(transactionData);
    }
  }

  private async addTransactionToLocalStorage(
    transactionData: Omit<Transaction, "id">
  ): Promise<Transaction> {
    console.log("Adding transaction to localStorage:", transactionData);
    const transactions = this.getTransactionsFromLocalStorage();
    const newTransaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      merchant: {
        ...transactionData.merchant,
        id: transactionData.merchant.id || crypto.randomUUID(),
      },
    };

    transactions.unshift(newTransaction);
    this.saveTransactionsToLocalStorage(transactions);

    // Check prepaid card balance and send notification
    await this.checkPrepaidBalanceAndNotify(transactionData.paymentMethod.id, {
      merchantName: transactionData.merchant.name,
      amount: transactionData.paymentAmount || transactionData.amount,
      currency: (transactionData.paymentCurrency ||
        transactionData.currency) as Currency,
    });

    console.log("Transaction added to localStorage:", newTransaction);
    return newTransaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    if (this.useLocalStorage) {
      return this.updateTransactionInLocalStorage(id, updates);
    }

    try {
      // Compute merchantId and mccCode outside the if block so they can be used in the update
      let merchantId: string | null = null;
      let mccCode: string | null = null;

      // If merchant data is being updated, upsert the merchant first
      if (updates.merchant) {
        merchantId =
          updates.merchant.id && updates.merchant.id.trim() !== ""
            ? updates.merchant.id
            : crypto.randomUUID();
        mccCode = updates.merchant.mcc?.code || null;
        const merchantData = {
          id: merchantId,
          name: updates.merchant.name,
          address: updates.merchant.address,
          mcc: updates.merchant.mcc
            ? JSON.parse(JSON.stringify(updates.merchant.mcc))
            : null,
          mcc_code: mccCode, // New normalized column
          is_online: updates.merchant.isOnline,
          coordinates: updates.merchant.coordinates
            ? JSON.parse(JSON.stringify(updates.merchant.coordinates))
            : null,
          is_deleted: false,
        };

        const merchantResult = await supabase
          .from("merchants")
          .upsert([merchantData], { onConflict: "id" })
          .select()
          .single();

        if (merchantResult.error) {
          console.error(
            "Error upserting merchant during update:",
            merchantResult.error
          );
          return this.updateTransactionInLocalStorage(id, updates);
        }
      }

      // Build update object with only provided fields
      // This prevents overwriting existing data when doing partial updates (e.g., category change only)
      const userCategory = updates.userCategory ?? updates.category;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are explicitly provided in updates
      if (updates.date !== undefined) updateData.date = updates.date;
      if (merchantId !== null) updateData.merchant_id = merchantId;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.currency !== undefined)
        updateData.currency = updates.currency;
      if (updates.paymentMethod?.id !== undefined)
        updateData.payment_method_id = updates.paymentMethod.id;
      if (updates.paymentAmount !== undefined)
        updateData.payment_amount = updates.paymentAmount;
      if (updates.paymentCurrency !== undefined)
        updateData.payment_currency = updates.paymentCurrency;
      if (updates.rewardPoints !== undefined)
        updateData.total_points = updates.rewardPoints;
      if (updates.basePoints !== undefined)
        updateData.base_points = updates.basePoints;
      if (updates.bonusPoints !== undefined)
        updateData.bonus_points = updates.bonusPoints;
      if (updates.promoBonusPoints !== undefined)
        updateData.promo_bonus_points = updates.promoBonusPoints;
      if (updates.isContactless !== undefined)
        updateData.is_contactless = updates.isContactless;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.reimbursementAmount !== undefined)
        updateData.reimbursement_amount = updates.reimbursementAmount;

      // Category fields
      if (updates.mccCode !== undefined || mccCode !== null)
        updateData.mcc_code = updates.mccCode ?? mccCode;
      if (userCategory !== undefined) {
        updateData.user_category = userCategory;
        updateData.category = userCategory; // Sync legacy field
      }
      if (updates.isRecategorized !== undefined)
        updateData.is_recategorized = updates.isRecategorized;

      // Auto-categorization metadata
      if (updates.autoCategoryConfidence !== undefined)
        updateData.auto_category_confidence = updates.autoCategoryConfidence;
      if (updates.needsReview !== undefined)
        updateData.needs_review = updates.needsReview;
      if (updates.categorySuggestionReason !== undefined)
        updateData.category_suggestion_reason =
          updates.categorySuggestionReason;

      const { data, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error updating transaction:", error);
        return this.updateTransactionInLocalStorage(id, updates);
      }

      // Get full transaction data
      const transactions = await this.getTransactions();
      return transactions.find((t) => t.id === id) || null;
    } catch (error) {
      console.error("Error updating transaction:", error);
      return this.updateTransactionInLocalStorage(id, updates);
    }
  }

  private updateTransactionInLocalStorage(
    id: string,
    updates: Partial<Transaction>
  ): Transaction | null {
    const transactions = this.getTransactionsFromLocalStorage();
    const index = transactions.findIndex((t) => t.id === id);

    if (index === -1) return null;

    transactions[index] = { ...transactions[index], ...updates };
    this.saveTransactionsToLocalStorage(transactions);
    return transactions[index];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    if (this.useLocalStorage) {
      return this.deleteTransactionFromLocalStorage(id);
    }

    try {
      // First, fetch the transaction to get its details for cap tracking adjustment
      const { data: txData, error: fetchError } = await supabase
        .from("transactions")
        .select("*, payment_methods(*, reward_rules)")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching transaction for delete:", fetchError);
      }

      // Soft delete the transaction
      const { error } = await supabase
        .from("transactions")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase error deleting transaction:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          full: error,
        });
        return false;
      }

      // Note: Cap usage is computed on-demand from transactions
      // Deleting a transaction automatically reduces cap usage

      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  }

  private deleteTransactionFromLocalStorage(id: string): boolean {
    const transactions = this.getTransactionsFromLocalStorage();
    const filteredTransactions = transactions.filter((t) => t.id !== id);
    this.saveTransactionsToLocalStorage(filteredTransactions);
    return true;
  }

  async exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
    const headers = [
      "Date",
      "Merchant",
      "Amount",
      "Currency",
      "Payment Method",
      "Payment Amount",
      "Payment Currency",
      "Reward Points",
      "Base Points",
      "Bonus Points",
      "Is Contactless",
      "Notes",
      "Category",
      "Reimbursement Amount",
    ];

    const csvRows = [
      headers.join(","),
      ...transactions.map((transaction) =>
        [
          transaction.date,
          `"${transaction.merchant.name}"`,
          transaction.amount,
          transaction.currency,
          `"${transaction.paymentMethod.name}"`,
          transaction.paymentAmount,
          transaction.paymentCurrency,
          transaction.rewardPoints,
          transaction.basePoints,
          transaction.bonusPoints,
          transaction.isContactless,
          `"${transaction.notes || ""}"`,
          `"${transaction.category || ""}"`,
          transaction.reimbursementAmount || "",
        ].join(",")
      ),
    ];

    return csvRows.join("\n");
  }

  async hasMerchantCategorySuggestions(merchantName: string): Promise<boolean> {
    // Check if the merchant name matches a known airline, hotel, or travel agency
    const mcc = getMCCFromMerchantName(merchantName);
    return mcc !== null;
  }

  async getSuggestedMerchantCategory(
    merchantName: string
  ): Promise<MerchantCategoryCode | null> {
    // Return the MCC for known airlines, hotels, and travel agencies
    return getMCCFromMerchantName(merchantName);
  }

  private static CARD_IMAGES_BUCKET = "card-images";

  /**
   * Convert issuer and card name to kebab-case card type ID
   * e.g., "Brim Financial" + "Air France-KLM World Elite" => "brim-financial-air-france-klm-world-elite"
   */
  private static toCardTypeId(issuer: string, name: string): string {
    const combined = `${issuer}-${name}`;
    return combined
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric with dashes
      .replace(/-+/g, "-") // Collapse multiple dashes
      .replace(/^-|-$/g, ""); // Trim leading/trailing dashes
  }

  /**
   * Upload a card image to Supabase Storage
   * Returns the public URL of the uploaded image
   * @param file - The image file to upload
   * @param issuer - Card issuer name
   * @param cardName - Card name
   */
  async uploadCardImage(
    file: File,
    issuer?: string,
    cardName?: string
  ): Promise<string> {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
    // Generate filename from issuer + card name in kebab-case, or fall back to timestamp
    const fileName =
      issuer && cardName
        ? `${StorageService.toCardTypeId(issuer, cardName)}.${fileExt}`
        : `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Upload to Supabase Storage
    // Use upsert when issuer/cardName provided to allow replacing existing images
    const { data, error } = await supabase.storage
      .from(StorageService.CARD_IMAGES_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: !!(issuer && cardName),
      });

    if (error) {
      console.error("Error uploading card image:", error);
      // Provide helpful error message for bucket not found
      if (error.message.includes("Bucket not found")) {
        throw new Error(
          "Card images storage bucket not configured. Please create 'card-images' bucket in Supabase Dashboard > Storage."
        );
      }
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(StorageService.CARD_IMAGES_BUCKET)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  /**
   * Delete a card image from Supabase Storage
   * Extracts the file path from the public URL and removes the file
   */
  async deleteCardImage(imageUrl: string): Promise<void> {
    // Only delete if it's a Supabase storage URL (not external URLs like princeoftravel.com)
    if (!imageUrl.includes("supabase.co/storage")) {
      console.log("Skipping deletion - not a Supabase storage URL:", imageUrl);
      return;
    }

    // Extract the file name from the URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/card-images/<filename>
    const match = imageUrl.match(/\/card-images\/(.+)$/);
    if (!match) {
      console.warn("Could not extract file path from image URL:", imageUrl);
      return;
    }

    const filePath = match[1];

    const { error } = await supabase.storage
      .from(StorageService.CARD_IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting card image:", error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Send email notification for prepaid card balance update
   */
  async sendPrepaidBalanceNotification(
    paymentMethod: PaymentMethod,
    transaction: { merchantName: string; amount: number; currency: Currency },
    previousBalance: number,
    newBalance: number
  ): Promise<void> {
    try {
      console.log(
        `[PrepaidNotification] Starting notification for ${paymentMethod.name}`
      );

      // Get the user's email from the session
      const { data: authData } = await supabase.auth.getSession();
      const userEmail = authData?.session?.user?.email;

      if (!userEmail) {
        console.log(
          "[PrepaidNotification] No user email found, skipping notification"
        );
        return;
      }

      console.log(
        `[PrepaidNotification] Sending to ${userEmail} for ${paymentMethod.name}: ${previousBalance} -> ${newBalance}`
      );

      // Call the Edge Function to send the email
      const { data, error } = await supabase.functions.invoke(
        "prepaid-balance-notification",
        {
          body: {
            userEmail,
            cardName: paymentMethod.name,
            merchantName: transaction.merchantName,
            transactionAmount: transaction.amount,
            transactionCurrency: transaction.currency,
            previousBalance,
            newBalance,
            cardCurrency: paymentMethod.currency,
          },
        }
      );

      if (error) {
        console.error("[PrepaidNotification] Error:", error);
      } else {
        console.log(
          `[PrepaidNotification] Success for ${paymentMethod.name}:`,
          data
        );
      }
    } catch (error) {
      console.error("[PrepaidNotification] Exception:", error);
      // Don't fail the transaction if notification fails
    }
  }

  /**
   * Check prepaid card balance and send notification
   * Returns the new balance for use in deactivation check
   */
  async checkPrepaidBalanceAndNotify(
    paymentMethodId: string,
    transaction: { merchantName: string; amount: number; currency: Currency }
  ): Promise<void> {
    try {
      console.log(
        `[PrepaidBalance] Checking balance for payment method ${paymentMethodId}`
      );

      // Get the payment method
      const paymentMethods = await this.getPaymentMethods();
      const paymentMethod = paymentMethods.find(
        (pm) => pm.id === paymentMethodId
      );

      // Only process prepaid cards that are active and have a total loaded value
      if (!paymentMethod) {
        console.log("[PrepaidBalance] Payment method not found");
        return;
      }

      if (paymentMethod.type !== "gift_card") {
        console.log(
          `[GiftCardBalance] Not a gift card (type: ${paymentMethod.type})`
        );
        return;
      }

      if (!paymentMethod.active) {
        console.log("[PrepaidBalance] Card is not active, skipping");
        return;
      }

      if (paymentMethod.totalLoaded === undefined) {
        console.log("[PrepaidBalance] No totalLoaded set, skipping");
        return;
      }

      console.log(
        `[GiftCardBalance] Processing ${paymentMethod.name}: totalLoaded=${paymentMethod.totalLoaded}`
      );

      // Get all transactions for this payment method
      const transactions = await this.getTransactions();
      const cardTransactions = transactions.filter(
        (t) => t.paymentMethod.id === paymentMethodId && !t.is_deleted
      );

      // Calculate total spent from transactions in database
      const totalSpentFromDb = cardTransactions.reduce((sum, t) => {
        return sum + (t.paymentAmount || t.amount);
      }, 0);

      // Balance as shown in DB (may or may not include current transaction)
      const balanceFromDb = paymentMethod.totalLoaded - totalSpentFromDb;

      // For deactivation: use the lower of the two possible balances
      // This handles the race condition where DB might not have the transaction yet
      const newBalance = Math.min(
        balanceFromDb,
        balanceFromDb - transaction.amount
      );
      const previousBalance = newBalance + transaction.amount;

      console.log(
        `[GiftCardBalance] balanceFromDb=${balanceFromDb}, txAmount=${transaction.amount}, newBalance=${newBalance}`
      );

      // Send notification
      await this.sendPrepaidBalanceNotification(
        paymentMethod,
        transaction,
        previousBalance,
        newBalance
      );

      // Check if balance is depleted and deactivate
      // Deactivate if either balance scenario results in 0 or less
      const shouldDeactivate =
        balanceFromDb <= 0 || balanceFromDb - transaction.amount <= 0;
      if (shouldDeactivate) {
        console.log(
          `[GiftCardBalance] Deactivating ${paymentMethod.name} - balance depleted (balanceFromDb=${balanceFromDb})`
        );

        const updatedMethods = paymentMethods.map((pm) =>
          pm.id === paymentMethodId ? { ...pm, active: false } : pm
        );

        await this.savePaymentMethods(updatedMethods);
      }
    } catch (error) {
      console.error("Error checking prepaid card balance:", error);
      // Don't fail the transaction if this check fails
    }
  }

  /**
   * Check if a prepaid card should be deactivated based on balance
   * If totalLoaded - totalSpent <= 0, the card will be set to inactive
   */
  async checkAndDeactivatePrepaidCard(paymentMethodId: string): Promise<void> {
    try {
      // Get the payment method
      const paymentMethods = await this.getPaymentMethods();
      const paymentMethod = paymentMethods.find(
        (pm) => pm.id === paymentMethodId
      );

      // Only check prepaid cards that are active and have a total loaded value
      if (
        !paymentMethod ||
        paymentMethod.type !== "gift_card" ||
        !paymentMethod.active ||
        paymentMethod.totalLoaded === undefined
      ) {
        return;
      }

      // Get all transactions for this payment method
      const transactions = await this.getTransactions();
      const cardTransactions = transactions.filter(
        (t) => t.paymentMethod.id === paymentMethodId && !t.is_deleted
      );

      // Calculate total spent (sum of paymentAmount for transactions in card's currency)
      const totalSpent = cardTransactions.reduce((sum, t) => {
        // Use paymentAmount which is in the payment method's currency
        return sum + (t.paymentAmount || t.amount);
      }, 0);

      // Check if balance is depleted
      const balance = paymentMethod.totalLoaded - totalSpent;
      console.log(
        `Prepaid card ${paymentMethod.name}: totalLoaded=${paymentMethod.totalLoaded}, totalSpent=${totalSpent}, balance=${balance}`
      );

      if (balance <= 0) {
        console.log(
          `Deactivating prepaid card ${paymentMethod.name} - balance depleted`
        );

        // Update the payment method to inactive
        const updatedMethods = paymentMethods.map((pm) =>
          pm.id === paymentMethodId ? { ...pm, active: false } : pm
        );

        await this.savePaymentMethods(updatedMethods);
      }
    } catch (error) {
      console.error("Error checking prepaid card balance:", error);
      // Don't fail the transaction if this check fails
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
