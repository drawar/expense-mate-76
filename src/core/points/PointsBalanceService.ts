/**
 * PointsBalanceService - Manages points balances, adjustments, redemptions, transfers, and goals
 *
 * Implements hybrid balance mode:
 * - User sets starting balance per currency
 * - System auto-calculates earned points from transactions
 * - Manual adjustments, redemptions, and transfers are tracked separately
 * - Current balance = starting + earned - redeemed - transferred_out + transferred_in + adjustments
 */

import { supabase } from "@/integrations/supabase/client";
import {
  PointsBalance,
  PointsAdjustment,
  PointsRedemption,
  PointsTransfer,
  PointsGoal,
  PointsBalanceInput,
  PointsAdjustmentInput,
  PointsRedemptionInput,
  PointsTransferInput,
  PointsGoalInput,
  ActivityItem,
  ActivityFeedFilters,
  BalanceBreakdown,
  DbPointsBalance,
  DbPointsAdjustment,
  DbPointsRedemption,
  DbPointsTransfer,
  DbPointsGoal,
  toPointsBalance,
  toPointsAdjustment,
  toPointsRedemption,
  toPointsTransfer,
  toPointsGoal,
} from "./types";

export class PointsBalanceService {
  private static instance: PointsBalanceService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PointsBalanceService {
    if (!PointsBalanceService.instance) {
      PointsBalanceService.instance = new PointsBalanceService();
    }
    return PointsBalanceService.instance;
  }

  // ============================================================================
  // BALANCE OPERATIONS
  // ============================================================================

  /**
   * Get all balances for a user
   */
  async getAllBalances(userId: string): Promise<PointsBalance[]> {
    try {
      const { data, error } = await supabase
        .from("points_balances")
        .select(
          `
          *,
          reward_currencies (
            id, code, display_name, issuer, is_transferrable
          )
        `
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching balances:", error);
        return [];
      }

      return (data as DbPointsBalance[]).map(toPointsBalance);
    } catch (error) {
      console.error("Error in getAllBalances:", error);
      return [];
    }
  }

  /**
   * Get balance for a specific currency
   */
  async getBalance(
    userId: string,
    rewardCurrencyId: string
  ): Promise<PointsBalance | null> {
    try {
      const { data, error } = await supabase
        .from("points_balances")
        .select(
          `
          *,
          reward_currencies (
            id, code, display_name, issuer, is_transferrable
          )
        `
        )
        .eq("user_id", userId)
        .eq("reward_currency_id", rewardCurrencyId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return null;
        }
        console.error("Error fetching balance:", error);
        return null;
      }

      return toPointsBalance(data as DbPointsBalance);
    } catch (error) {
      console.error("Error in getBalance:", error);
      return null;
    }
  }

  /**
   * Set starting balance for a currency (creates or updates)
   */
  async setStartingBalance(input: PointsBalanceInput): Promise<PointsBalance> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Calculate current balance components
    const breakdown = await this.calculateBalanceBreakdown(
      user.id,
      input.rewardCurrencyId
    );

    const currentBalance =
      input.startingBalance +
      breakdown.earnedFromTransactions +
      breakdown.adjustments -
      breakdown.redemptions -
      breakdown.transfersOut +
      breakdown.transfersIn;

    const { data, error } = await supabase
      .from("points_balances")
      .upsert(
        {
          user_id: user.id,
          reward_currency_id: input.rewardCurrencyId,
          starting_balance: input.startingBalance,
          current_balance: currentBalance,
          balance_date: input.balanceDate?.toISOString() ?? null,
          notes: input.notes,
          last_calculated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,reward_currency_id",
        }
      )
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error setting starting balance:", error);
      throw error;
    }

    return toPointsBalance(data as DbPointsBalance);
  }

  /**
   * Calculate balance breakdown for a currency
   */
  async calculateBalanceBreakdown(
    userId: string,
    rewardCurrencyId: string
  ): Promise<BalanceBreakdown> {
    // Get existing balance for starting balance
    const balance = await this.getBalance(userId, rewardCurrencyId);
    const startingBalance = balance?.startingBalance ?? 0;

    // Calculate earned from transactions
    const earnedFromTransactions = await this.getEarnedFromTransactions(
      userId,
      rewardCurrencyId
    );

    // Calculate adjustments sum (only include adjustments dated today or earlier)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today in local time
    const { data: adjustmentsData } = await supabase
      .from("points_adjustments")
      .select("amount")
      .eq("user_id", userId)
      .eq("reward_currency_id", rewardCurrencyId)
      .eq("is_deleted", false)
      .lte("adjustment_date", today.toISOString());

    const adjustments = (adjustmentsData ?? []).reduce(
      (sum, a) => sum + Number(a.amount),
      0
    );

    // Calculate redemptions sum
    const { data: redemptionsData } = await supabase
      .from("points_redemptions")
      .select("points_redeemed")
      .eq("user_id", userId)
      .eq("reward_currency_id", rewardCurrencyId)
      .eq("is_deleted", false);

    const redemptions = (redemptionsData ?? []).reduce(
      (sum, r) => sum + Number(r.points_redeemed),
      0
    );

    // Calculate transfers out
    const { data: transfersOutData } = await supabase
      .from("points_transfers")
      .select("source_amount")
      .eq("user_id", userId)
      .eq("source_currency_id", rewardCurrencyId)
      .eq("is_deleted", false);

    const transfersOut = (transfersOutData ?? []).reduce(
      (sum, t) => sum + Number(t.source_amount),
      0
    );

    // Calculate transfers in
    const { data: transfersInData } = await supabase
      .from("points_transfers")
      .select("destination_amount")
      .eq("user_id", userId)
      .eq("destination_currency_id", rewardCurrencyId)
      .eq("is_deleted", false);

    const transfersIn = (transfersInData ?? []).reduce(
      (sum, t) => sum + Number(t.destination_amount),
      0
    );

    const currentBalance =
      startingBalance +
      earnedFromTransactions +
      adjustments -
      redemptions -
      transfersOut +
      transfersIn;

    return {
      startingBalance,
      earnedFromTransactions,
      adjustments,
      redemptions,
      transfersOut,
      transfersIn,
      currentBalance,
    };
  }

  /**
   * Get earned points from transactions for a currency
   */
  private async getEarnedFromTransactions(
    userId: string,
    rewardCurrencyId: string
  ): Promise<number> {
    try {
      // Get payment methods that earn this currency
      const { data: paymentMethods } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("user_id", userId)
        .eq("reward_currency_id", rewardCurrencyId);

      if (!paymentMethods || paymentMethods.length === 0) {
        return 0;
      }

      const paymentMethodIds = paymentMethods.map((pm) => pm.id);

      // Sum total_points from transactions for these payment methods
      const { data: transactions } = await supabase
        .from("transactions")
        .select("total_points")
        .eq("user_id", userId)
        .in("payment_method_id", paymentMethodIds)
        .or("is_deleted.is.null,is_deleted.eq.false");

      return (transactions ?? []).reduce(
        (sum, t) => sum + (Number(t.total_points) || 0),
        0
      );
    } catch (error) {
      console.error("Error calculating earned from transactions:", error);
      return 0;
    }
  }

  /**
   * Recalculate and update current balance for a currency
   */
  async recalculateBalance(
    userId: string,
    rewardCurrencyId: string
  ): Promise<PointsBalance | null> {
    const breakdown = await this.calculateBalanceBreakdown(
      userId,
      rewardCurrencyId
    );

    const { data, error } = await supabase
      .from("points_balances")
      .update({
        current_balance: breakdown.currentBalance,
        last_calculated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("reward_currency_id", rewardCurrencyId)
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error recalculating balance:", error);
      return null;
    }

    return toPointsBalance(data as DbPointsBalance);
  }

  // ============================================================================
  // ADJUSTMENT OPERATIONS
  // ============================================================================

  /**
   * Get all adjustments for a user
   */
  async getAdjustments(
    userId: string,
    rewardCurrencyId?: string
  ): Promise<PointsAdjustment[]> {
    let query = supabase
      .from("points_adjustments")
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("adjustment_date", { ascending: false });

    if (rewardCurrencyId) {
      query = query.eq("reward_currency_id", rewardCurrencyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching adjustments:", error);
      return [];
    }

    return (data as DbPointsAdjustment[]).map(toPointsAdjustment);
  }

  /**
   * Get pending (future-dated) adjustments for a user
   */
  async getPendingAdjustments(
    userId: string,
    rewardCurrencyId?: string
  ): Promise<PointsAdjustment[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today in local time

    let query = supabase
      .from("points_adjustments")
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .gt("adjustment_date", today.toISOString())
      .order("adjustment_date", { ascending: true });

    if (rewardCurrencyId) {
      query = query.eq("reward_currency_id", rewardCurrencyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching pending adjustments:", error);
      return [];
    }

    return (data as DbPointsAdjustment[]).map(toPointsAdjustment);
  }

  /**
   * Add a new adjustment
   */
  async addAdjustment(input: PointsAdjustmentInput): Promise<PointsAdjustment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("points_adjustments")
      .insert({
        user_id: user.id,
        reward_currency_id: input.rewardCurrencyId,
        amount: input.amount,
        adjustment_type: input.adjustmentType,
        description: input.description,
        reference_number: input.referenceNumber,
        adjustment_date:
          input.adjustmentDate?.toISOString() ?? new Date().toISOString(),
      })
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error adding adjustment:", error);
      throw error;
    }

    // Recalculate balance
    await this.recalculateBalance(user.id, input.rewardCurrencyId);

    return toPointsAdjustment(data as DbPointsAdjustment);
  }

  /**
   * Update an adjustment
   */
  async updateAdjustment(
    id: string,
    input: Partial<PointsAdjustmentInput>
  ): Promise<PointsAdjustment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get existing adjustment for the currency ID
    const { data: existing } = await supabase
      .from("points_adjustments")
      .select("reward_currency_id")
      .eq("id", id)
      .single();

    const updateData: Record<string, unknown> = {};
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.adjustmentType !== undefined)
      updateData.adjustment_type = input.adjustmentType;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.referenceNumber !== undefined)
      updateData.reference_number = input.referenceNumber;
    if (input.adjustmentDate !== undefined)
      updateData.adjustment_date = input.adjustmentDate.toISOString();

    const { data, error } = await supabase
      .from("points_adjustments")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating adjustment:", error);
      throw error;
    }

    // Recalculate balance
    const currencyId = input.rewardCurrencyId ?? existing?.reward_currency_id;
    if (currencyId) {
      await this.recalculateBalance(user.id, currencyId);
    }

    return toPointsAdjustment(data as DbPointsAdjustment);
  }

  /**
   * Delete an adjustment (soft delete)
   */
  async deleteAdjustment(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get currency ID before deleting
    const { data: existing } = await supabase
      .from("points_adjustments")
      .select("reward_currency_id")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("points_adjustments")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting adjustment:", error);
      throw error;
    }

    // Recalculate balance
    if (existing?.reward_currency_id) {
      await this.recalculateBalance(user.id, existing.reward_currency_id);
    }
  }

  // ============================================================================
  // REDEMPTION OPERATIONS
  // ============================================================================

  /**
   * Get all redemptions for a user
   */
  async getRedemptions(
    userId: string,
    rewardCurrencyId?: string
  ): Promise<PointsRedemption[]> {
    let query = supabase
      .from("points_redemptions")
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("redemption_date", { ascending: false });

    if (rewardCurrencyId) {
      query = query.eq("reward_currency_id", rewardCurrencyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching redemptions:", error);
      return [];
    }

    return (data as DbPointsRedemption[]).map(toPointsRedemption);
  }

  /**
   * Add a new redemption
   */
  async addRedemption(input: PointsRedemptionInput): Promise<PointsRedemption> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("points_redemptions")
      .insert({
        user_id: user.id,
        reward_currency_id: input.rewardCurrencyId,
        points_redeemed: input.pointsRedeemed,
        redemption_type: input.redemptionType,
        description: input.description,
        flight_route: input.flightRoute,
        cabin_class: input.cabinClass,
        airline: input.airline,
        booking_reference: input.bookingReference,
        passengers: input.passengers,
        cash_value: input.cashValue,
        cash_value_currency: input.cashValueCurrency ?? "USD",
        redemption_date:
          input.redemptionDate?.toISOString() ?? new Date().toISOString(),
        travel_date: input.travelDate?.toISOString(),
      })
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error adding redemption:", error);
      throw error;
    }

    // Recalculate balance
    await this.recalculateBalance(user.id, input.rewardCurrencyId);

    return toPointsRedemption(data as DbPointsRedemption);
  }

  /**
   * Update a redemption
   */
  async updateRedemption(
    id: string,
    input: Partial<PointsRedemptionInput>
  ): Promise<PointsRedemption> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get existing for currency ID
    const { data: existing } = await supabase
      .from("points_redemptions")
      .select("reward_currency_id")
      .eq("id", id)
      .single();

    const updateData: Record<string, unknown> = {};
    if (input.pointsRedeemed !== undefined)
      updateData.points_redeemed = input.pointsRedeemed;
    if (input.redemptionType !== undefined)
      updateData.redemption_type = input.redemptionType;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.flightRoute !== undefined)
      updateData.flight_route = input.flightRoute;
    if (input.cabinClass !== undefined)
      updateData.cabin_class = input.cabinClass;
    if (input.airline !== undefined) updateData.airline = input.airline;
    if (input.bookingReference !== undefined)
      updateData.booking_reference = input.bookingReference;
    if (input.passengers !== undefined)
      updateData.passengers = input.passengers;
    if (input.cashValue !== undefined) updateData.cash_value = input.cashValue;
    if (input.cashValueCurrency !== undefined)
      updateData.cash_value_currency = input.cashValueCurrency;
    if (input.redemptionDate !== undefined)
      updateData.redemption_date = input.redemptionDate.toISOString();
    if (input.travelDate !== undefined)
      updateData.travel_date = input.travelDate.toISOString();

    const { data, error } = await supabase
      .from("points_redemptions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating redemption:", error);
      throw error;
    }

    // Recalculate balance
    const currencyId = input.rewardCurrencyId ?? existing?.reward_currency_id;
    if (currencyId) {
      await this.recalculateBalance(user.id, currencyId);
    }

    return toPointsRedemption(data as DbPointsRedemption);
  }

  /**
   * Delete a redemption (soft delete)
   */
  async deleteRedemption(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get currency ID before deleting
    const { data: existing } = await supabase
      .from("points_redemptions")
      .select("reward_currency_id")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("points_redemptions")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting redemption:", error);
      throw error;
    }

    // Recalculate balance
    if (existing?.reward_currency_id) {
      await this.recalculateBalance(user.id, existing.reward_currency_id);
    }
  }

  // ============================================================================
  // TRANSFER OPERATIONS
  // ============================================================================

  /**
   * Get all transfers for a user
   */
  async getTransfers(
    userId: string,
    rewardCurrencyId?: string
  ): Promise<PointsTransfer[]> {
    let query = supabase
      .from("points_transfers")
      .select(
        `
        *,
        source_currency:reward_currencies!points_transfers_source_currency_id_fkey (
          id, code, display_name, issuer, is_transferrable
        ),
        destination_currency:reward_currencies!points_transfers_destination_currency_id_fkey (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("transfer_date", { ascending: false });

    if (rewardCurrencyId) {
      query = query.or(
        `source_currency_id.eq.${rewardCurrencyId},destination_currency_id.eq.${rewardCurrencyId}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching transfers:", error);
      return [];
    }

    return (data as DbPointsTransfer[]).map(toPointsTransfer);
  }

  /**
   * Add a new transfer
   */
  async addTransfer(input: PointsTransferInput): Promise<PointsTransfer> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("points_transfers")
      .insert({
        user_id: user.id,
        source_currency_id: input.sourceCurrencyId,
        source_amount: input.sourceAmount,
        destination_currency_id: input.destinationCurrencyId,
        destination_amount: input.destinationAmount,
        conversion_rate: input.conversionRate,
        transfer_bonus_rate: input.transferBonusRate,
        transfer_fee: input.transferFee ?? 0,
        transfer_fee_currency: input.transferFeeCurrency,
        reference_number: input.referenceNumber,
        notes: input.notes,
        transfer_date:
          input.transferDate?.toISOString() ?? new Date().toISOString(),
      })
      .select(
        `
        *,
        source_currency:reward_currencies!points_transfers_source_currency_id_fkey (
          id, code, display_name, issuer, is_transferrable
        ),
        destination_currency:reward_currencies!points_transfers_destination_currency_id_fkey (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error adding transfer:", error);
      throw error;
    }

    // Recalculate both source and destination balances
    await this.recalculateBalance(user.id, input.sourceCurrencyId);
    await this.recalculateBalance(user.id, input.destinationCurrencyId);

    return toPointsTransfer(data as DbPointsTransfer);
  }

  /**
   * Delete a transfer (soft delete)
   */
  async deleteTransfer(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get currency IDs before deleting
    const { data: existing } = await supabase
      .from("points_transfers")
      .select("source_currency_id, destination_currency_id")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("points_transfers")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting transfer:", error);
      throw error;
    }

    // Recalculate both balances
    if (existing?.source_currency_id) {
      await this.recalculateBalance(user.id, existing.source_currency_id);
    }
    if (existing?.destination_currency_id) {
      await this.recalculateBalance(user.id, existing.destination_currency_id);
    }
  }

  // ============================================================================
  // GOAL OPERATIONS
  // ============================================================================

  /**
   * Get all goals for a user
   */
  async getGoals(
    userId: string,
    rewardCurrencyId?: string,
    status?: "active" | "completed" | "cancelled"
  ): Promise<PointsGoal[]> {
    let query = supabase
      .from("points_goals")
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (rewardCurrencyId) {
      query = query.eq("reward_currency_id", rewardCurrencyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching goals:", error);
      return [];
    }

    return (data as DbPointsGoal[]).map(toPointsGoal);
  }

  /**
   * Add a new goal
   */
  async addGoal(input: PointsGoalInput): Promise<PointsGoal> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("points_goals")
      .insert({
        user_id: user.id,
        reward_currency_id: input.rewardCurrencyId,
        goal_name: input.goalName,
        goal_description: input.goalDescription,
        target_points: input.targetPoints,
        goal_type: input.goalType,
        priority: input.priority ?? 0,
        target_date: input.targetDate?.toISOString(),
        target_route: input.targetRoute,
        target_cabin: input.targetCabin,
      })
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error adding goal:", error);
      throw error;
    }

    return toPointsGoal(data as DbPointsGoal);
  }

  /**
   * Update a goal
   */
  async updateGoal(
    id: string,
    input: Partial<PointsGoalInput> & {
      status?: "active" | "completed" | "cancelled";
    }
  ): Promise<PointsGoal> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: Record<string, unknown> = {};
    if (input.goalName !== undefined) updateData.goal_name = input.goalName;
    if (input.goalDescription !== undefined)
      updateData.goal_description = input.goalDescription;
    if (input.targetPoints !== undefined)
      updateData.target_points = input.targetPoints;
    if (input.goalType !== undefined) updateData.goal_type = input.goalType;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.targetDate !== undefined)
      updateData.target_date = input.targetDate.toISOString();
    if (input.targetRoute !== undefined)
      updateData.target_route = input.targetRoute;
    if (input.targetCabin !== undefined)
      updateData.target_cabin = input.targetCabin;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("points_goals")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        reward_currencies (
          id, code, display_name, issuer, is_transferrable
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating goal:", error);
      throw error;
    }

    return toPointsGoal(data as DbPointsGoal);
  }

  /**
   * Delete a goal (soft delete)
   */
  async deleteGoal(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("points_goals")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }

  // ============================================================================
  // ACTIVITY FEED
  // ============================================================================

  /**
   * Get combined activity feed
   */
  async getActivityFeed(
    userId: string,
    filters?: ActivityFeedFilters
  ): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = [];
    const types = filters?.types ?? ["adjustment", "redemption", "transfer"];

    // Fetch adjustments
    if (types.includes("adjustment")) {
      const adjustments = await this.getAdjustments(
        userId,
        filters?.rewardCurrencyId
      );
      for (const adj of adjustments) {
        if (filters?.startDate && adj.adjustmentDate < filters.startDate)
          continue;
        if (filters?.endDate && adj.adjustmentDate > filters.endDate) continue;
        activities.push({
          type: "adjustment",
          data: adj,
          date: adj.adjustmentDate,
        });
      }
    }

    // Fetch redemptions
    if (types.includes("redemption")) {
      const redemptions = await this.getRedemptions(
        userId,
        filters?.rewardCurrencyId
      );
      for (const red of redemptions) {
        if (filters?.startDate && red.redemptionDate < filters.startDate)
          continue;
        if (filters?.endDate && red.redemptionDate > filters.endDate) continue;
        activities.push({
          type: "redemption",
          data: red,
          date: red.redemptionDate,
        });
      }
    }

    // Fetch transfers
    if (types.includes("transfer")) {
      const transfers = await this.getTransfers(
        userId,
        filters?.rewardCurrencyId
      );
      for (const tr of transfers) {
        if (filters?.startDate && tr.transferDate < filters.startDate) continue;
        if (filters?.endDate && tr.transferDate > filters.endDate) continue;
        activities.push({
          type: "transfer",
          data: tr,
          date: tr.transferDate,
        });
      }
    }

    // Sort by date descending
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    return activities.slice(offset, offset + limit);
  }

  // ============================================================================
  // CPP UTILITIES
  // ============================================================================

  /**
   * Calculate cents per point
   */
  calculateCpp(pointsRedeemed: number, cashValue: number): number {
    if (pointsRedeemed <= 0 || cashValue <= 0) return 0;
    return Math.round((cashValue / pointsRedeemed) * 100 * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get average CPP for redemptions
   */
  async getAverageCpp(
    userId: string,
    rewardCurrencyId?: string
  ): Promise<number> {
    const redemptions = await this.getRedemptions(userId, rewardCurrencyId);
    const withCpp = redemptions.filter((r) => r.cpp && r.cpp > 0);

    if (withCpp.length === 0) return 0;

    const totalCpp = withCpp.reduce((sum, r) => sum + (r.cpp ?? 0), 0);
    return Math.round((totalCpp / withCpp.length) * 100) / 100;
  }
}

// Export singleton instance
export const pointsBalanceService = PointsBalanceService.getInstance();
