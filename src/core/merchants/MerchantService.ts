import { v4 as uuidv4 } from "uuid";
import { StorageProvider } from "../storage/StorageProvider";
import { Merchant, MerchantCategoryCode } from "@/types";

export interface MerchantCategoryMapping {
  id: string;
  merchant_name: string;
  occurrence_count: number;
  most_common_mcc: MerchantCategoryCode | null;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing merchant data and category mappings
 * Handles operations related to merchants, including category suggestions and tracking
 */
export class MerchantService {
  private static instance: MerchantService;
  private readonly merchantsTableName = "merchants";
  private readonly mappingsTableName = "merchant_category_mappings";
  private readonly merchantsStorageKey = "merchants";
  private readonly mappingsStorageKey = "merchantCategoryMappings";

  private constructor(private storageProvider: StorageProvider) {}

  public static getInstance(storageProvider: StorageProvider): MerchantService {
    if (!MerchantService.instance) {
      MerchantService.instance = new MerchantService(storageProvider);
    }
    return MerchantService.instance;
  }

  /**
   * Gets a merchant by name
   * @param name The merchant name to search for
   * @returns Promise resolving to merchant or null if not found
   */
  public async getMerchantByName(name: string): Promise<Merchant | null> {
    if (!name || name.trim().length < 3) return null;

    const normalizedName = name.trim().toLowerCase();

    try {
      const merchants = await this.storageProvider.query<Merchant>(
        this.merchantsTableName,
        {
          filters: [
            { ilike: { column: "name", value: `%${normalizedName}%` } },
          ],
          orderBy: { column: "created_at", options: { ascending: false } },
          limit: 1,
        }
      );

      return merchants.length > 0 ? merchants[0] : null;
    } catch (error) {
      console.error("Error getting merchant by name:", error);
      return null;
    }
  }

  /**
   * Checks if there are category suggestions for a merchant name
   * @param name The merchant name to check
   * @returns Promise resolving to boolean
   */
  public async hasCategorySuggestions(name: string): Promise<boolean> {
    if (!name || name.trim().length < 3) return false;

    const normalizedName = name.trim().toLowerCase();

    try {
      const mappings =
        await this.storageProvider.query<MerchantCategoryMapping>(
          this.mappingsTableName,
          {
            filters: [
              {
                ilike: {
                  column: "merchant_name",
                  value: `%${normalizedName}%`,
                },
              },
              { neq: { column: "most_common_mcc", value: null } },
            ],
            limit: 1,
          }
        );

      return mappings.length > 0;
    } catch (error) {
      console.error("Error checking merchant category suggestions:", error);
      return false;
    }
  }

  /**
   * Gets suggested category for a merchant name
   * @param name The merchant name to get suggestions for
   * @returns Promise resolving to category code or null
   */
  public async getSuggestedCategory(
    name: string
  ): Promise<MerchantCategoryCode | null> {
    if (!name || name.trim().length < 3) return null;

    const normalizedName = name.trim().toLowerCase();

    try {
      const mappings =
        await this.storageProvider.query<MerchantCategoryMapping>(
          this.mappingsTableName,
          {
            filters: [
              {
                ilike: {
                  column: "merchant_name",
                  value: `%${normalizedName}%`,
                },
              },
            ],
            orderBy: {
              column: "occurrence_count",
              options: { ascending: false },
            },
            limit: 1,
          }
        );

      if (mappings.length === 0 || !mappings[0].most_common_mcc) {
        return null;
      }

      return mappings[0].most_common_mcc;
    } catch (error) {
      console.error("Error getting suggested merchant category:", error);
      return null;
    }
  }

  /**
   * Increments the occurrence count for a merchant and updates MCC if provided
   * @param merchantName The merchant name
   * @param mcc Optional MCC to update
   * @returns Promise resolving to success status
   */
  public async incrementOccurrence(
    merchantName: string,
    mcc?: MerchantCategoryCode
  ): Promise<boolean> {
    if (!merchantName || merchantName.trim().length === 0) {
      return false;
    }

    const normalizedName = merchantName.trim();

    try {
      // First check if mapping exists
      const mappings =
        await this.storageProvider.query<MerchantCategoryMapping>(
          this.mappingsTableName,
          {
            filters: [
              { eq: { column: "merchant_name", value: normalizedName } },
            ],
            limit: 1,
          }
        );

      if (mappings.length > 0) {
        // Update existing mapping
        const mapping = mappings[0];
        const updateData: Partial<MerchantCategoryMapping> = {
          occurrence_count: (mapping.occurrence_count || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        // Update MCC if provided
        if (mcc) {
          updateData.most_common_mcc = mcc;
        }

        return await this.storageProvider.update(
          this.mappingsTableName,
          mapping.id,
          updateData
        );
      } else {
        // Create new mapping
        const newMapping: MerchantCategoryMapping = {
          id: uuidv4(),
          merchant_name: normalizedName,
          occurrence_count: 1,
          most_common_mcc: mcc || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const result =
          await this.storageProvider.insert<MerchantCategoryMapping>(
            this.mappingsTableName,
            newMapping
          );

        return !!result;
      }
    } catch (error) {
      console.error("Error tracking merchant occurrence:", error);
      return false;
    }
  }

  /**
   * Saves or updates a merchant
   * @param merchant The merchant data to save
   * @returns Promise resolving to the saved merchant
   */
  public async saveMerchant(merchant: Merchant): Promise<Merchant | null> {
    try {
      // Check if merchant exists
      let existingId = merchant.id;

      if (!existingId || existingId === "") {
        // Try to find an existing merchant with the same name
        const existing = await this.getMerchantByName(merchant.name);
        if (existing) {
          existingId = existing.id;
        }
      }

      // If we have an ID, update existing merchant
      if (existingId && existingId !== "") {
        const success = await this.storageProvider.update(
          this.merchantsTableName,
          existingId,
          {
            ...merchant,
            id: existingId,
          }
        );

        if (success) {
          return {
            ...merchant,
            id: existingId,
          };
        }
        return null;
      }

      // Otherwise create new merchant
      const merchantWithId: Merchant = {
        ...merchant,
        id: merchant.id || uuidv4(),
      };

      const result = await this.storageProvider.insert<Merchant>(
        this.merchantsTableName,
        merchantWithId
      );

      return result;
    } catch (error) {
      console.error("Error saving merchant:", error);
      return null;
    }
  }
}
