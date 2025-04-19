import { v4 as uuidv4 } from "uuid";
import { StorageProvider } from "../storage/StorageProvider";

export interface BonusPointsMovement {
  id: string;
  transaction_id: string;
  payment_method_id: string;
  bonus_points: number;
  created_at: string;
}

/**
 * Service for managing bonus points movements
 * Encapsulates the logic for tracking bonus points across transactions
 */
export class BonusPointsService {
  private static instance: BonusPointsService;
  private readonly tableName = "bonus_points_movements";
  private readonly storageKey = "bonusPointsMovements";

  private constructor(private storageProvider: StorageProvider) {}

  public static getInstance(
    storageProvider: StorageProvider
  ): BonusPointsService {
    if (!BonusPointsService.instance) {
      BonusPointsService.instance = new BonusPointsService(storageProvider);
    }
    return BonusPointsService.instance;
  }

  /**
   * Records a bonus points movement for a transaction
   * @param transactionId The ID of the transaction
   * @param paymentMethodId The ID of the payment method
   * @param points The number of bonus points
   * @returns Promise resolving to success status
   */
  public async recordMovement(
    transactionId: string,
    paymentMethodId: string,
    points: number
  ): Promise<boolean> {
    if (!points || points <= 0) {
      return false;
    }

    try {
      const movement: BonusPointsMovement = {
        id: uuidv4(),
        transaction_id: transactionId,
        payment_method_id: paymentMethodId,
        bonus_points: points,
        created_at: new Date().toISOString(),
      };

      // Store in the appropriate location based on provider type
      const result = await this.storageProvider.insert<BonusPointsMovement>(
        this.tableName,
        movement
      );

      return !!result;
    } catch (error) {
      console.error("Error recording bonus points movement:", error);
      return false;
    }
  }

  /**
   * Deletes all bonus points movements for a transaction
   * @param transactionId The ID of the transaction
   * @returns Promise resolving to success status
   */
  public async deleteMovements(transactionId: string): Promise<boolean> {
    try {
      // In a table-based system, we'd use something like:
      // DELETE FROM bonus_points_movements WHERE transaction_id = ?

      // For localStorage, we filter out the movements for this transaction
      const movements =
        (await this.storageProvider.get<BonusPointsMovement[]>(
          this.storageKey
        )) || [];
      const filteredMovements = movements.filter(
        (m) => m.transaction_id !== transactionId
      );

      if (movements.length === filteredMovements.length) {
        // No movements found for this transaction
        return true;
      }

      return await this.storageProvider.set(this.storageKey, filteredMovements);
    } catch (error) {
      console.error("Error deleting bonus points movements:", error);
      return false;
    }
  }

  /**
   * Gets all bonus points movements for a payment method
   * @param paymentMethodId The ID of the payment method
   * @returns Promise resolving to array of movements
   */
  public async getMovementsByPaymentMethod(
    paymentMethodId: string
  ): Promise<BonusPointsMovement[]> {
    try {
      const movements = await this.storageProvider.query<BonusPointsMovement>(
        this.tableName,
        {
          filters: [
            { eq: { column: "payment_method_id", value: paymentMethodId } },
          ],
          orderBy: { column: "created_at", options: { ascending: false } },
        }
      );

      return movements;
    } catch (error) {
      console.error("Error getting bonus points movements:", error);
      return [];
    }
  }

  /**
   * Gets all bonus points movements for a transaction
   * @param transactionId The ID of the transaction
   * @returns Promise resolving to array of movements
   */
  public async getMovementsByTransaction(
    transactionId: string
  ): Promise<BonusPointsMovement[]> {
    try {
      const movements = await this.storageProvider.query<BonusPointsMovement>(
        this.tableName,
        {
          filters: [{ eq: { column: "transaction_id", value: transactionId } }],
          orderBy: { column: "created_at", options: { ascending: false } },
        }
      );

      return movements;
    } catch (error) {
      console.error("Error getting bonus points movements:", error);
      return [];
    }
  }

  /**
   * Gets the total bonus points for a payment method
   * @param paymentMethodId The ID of the payment method
   * @returns Promise resolving to total points
   */
  public async getTotalBonusPoints(paymentMethodId: string): Promise<number> {
    try {
      const movements = await this.getMovementsByPaymentMethod(paymentMethodId);
      return movements.reduce(
        (total, movement) => total + movement.bonus_points,
        0
      );
    } catch (error) {
      console.error("Error calculating total bonus points:", error);
      return 0;
    }
  }
}
