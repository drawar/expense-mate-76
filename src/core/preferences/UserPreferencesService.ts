/**
 * UserPreferencesService - Handles user preferences persistence to database
 */

import { supabase } from "@/integrations/supabase/client";
import { Currency } from "@/types";

export interface UserPreferences {
  id: string;
  userId: string;
  defaultCurrency: Currency;
  createdAt: string;
  updatedAt: string;
}

class UserPreferencesServiceClass {
  private static instance: UserPreferencesServiceClass;

  private constructor() {}

  public static getInstance(): UserPreferencesServiceClass {
    if (!UserPreferencesServiceClass.instance) {
      UserPreferencesServiceClass.instance = new UserPreferencesServiceClass();
    }
    return UserPreferencesServiceClass.instance;
  }

  /**
   * Get current user ID from session
   */
  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  }

  /**
   * Get user preferences from database
   */
  async getPreferences(): Promise<UserPreferences | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // No row found - user has no preferences yet
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        defaultCurrency: data.default_currency as Currency,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      return null;
    }
  }

  /**
   * Save default currency preference to database
   */
  async setDefaultCurrency(currency: Currency): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.warn("No user logged in, cannot save preference to database");
      return false;
    }

    try {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          default_currency: currency,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        throw error;
      }

      console.log(`Saved default currency ${currency} for user ${userId}`);
      return true;
    } catch (error) {
      console.error("Failed to save user preference:", error);
      return false;
    }
  }

  /**
   * Get default currency for current user
   * Returns null if no user or no preference set
   */
  async getDefaultCurrency(): Promise<Currency | null> {
    const prefs = await this.getPreferences();
    return prefs?.defaultCurrency || null;
  }
}

export const UserPreferencesService = UserPreferencesServiceClass.getInstance();
