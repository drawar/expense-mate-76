export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      mcc: {
        Row: {
          code: string;
          description: string;
        };
        Insert: {
          code: string;
          description: string;
        };
        Update: {
          code?: string;
          description?: string;
        };
        Relationships: [];
      };
      conversion_rates: {
        Row: {
          conversion_rate: number;
          created_at: string | null;
          id: string;
          miles_currency: string;
          reward_currency: string;
          updated_at: string | null;
        };
        Insert: {
          conversion_rate: number;
          created_at?: string | null;
          id?: string;
          miles_currency: string;
          reward_currency: string;
          updated_at?: string | null;
        };
        Update: {
          conversion_rate?: number;
          created_at?: string | null;
          id?: string;
          miles_currency?: string;
          reward_currency?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      merchants: {
        Row: {
          address: string | null;
          coordinates: Json | null;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_online: boolean | null;
          mcc: Json | null; // Legacy JSONB column
          mcc_code: string | null; // New normalized column
          name: string;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          coordinates?: Json | null;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_online?: boolean | null;
          mcc?: Json | null;
          mcc_code?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          coordinates?: Json | null;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_online?: boolean | null;
          mcc?: Json | null;
          mcc_code?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          billing_cycle_day: number | null;
          color: string | null;
          conversion_rate: Json | null;
          created_at: string | null;
          currency: string | null;
          icon: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_monthly_statement: boolean | null;
          issuer: string | null;
          last_four_digits: string | null;
          name: string;
          network: string | null;
          notes: string | null;
          points_currency: string | null;
          reward_rules: Json | null;
          selected_categories: Json | null;
          statement_start_day: number | null;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          billing_cycle_day?: number | null;
          color?: string | null;
          conversion_rate?: Json | null;
          created_at?: string | null;
          currency?: string | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_monthly_statement?: boolean | null;
          issuer?: string | null;
          last_four_digits?: string | null;
          name: string;
          network?: string | null;
          notes?: string | null;
          points_currency?: string | null;
          reward_rules?: Json | null;
          selected_categories?: Json | null;
          statement_start_day?: number | null;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          billing_cycle_day?: number | null;
          color?: string | null;
          conversion_rate?: Json | null;
          created_at?: string | null;
          currency?: string | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_monthly_statement?: boolean | null;
          issuer?: string | null;
          last_four_digits?: string | null;
          name?: string;
          network?: string | null;
          notes?: string | null;
          points_currency?: string | null;
          reward_rules?: Json | null;
          selected_categories?: Json | null;
          statement_start_day?: number | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reward_rules: {
        Row: {
          amount_rounding_strategy: string | null;
          base_multiplier: number | null;
          block_size: number | null;
          bonus_multiplier: number | null;
          bonus_tiers: Json | null;
          calculation_method: string | null;
          cap_group_id: string | null;
          card_type_id: string;
          conditions: Json | null;
          created_at: string | null;
          description: string | null;
          enabled: boolean | null;
          excluded_categories: string[] | null;
          excluded_merchants: string[] | null;
          id: string;
          included_categories: string[] | null;
          included_merchants: string[] | null;
          max_bonus_per_transaction: number | null;
          min_spend: number | null;
          monthly_bonus_cap: number | null;
          monthly_cap: number | null;
          monthly_cap_type: string | null;
          monthly_min_spend: number | null;
          monthly_spend_period_type: string | null;
          name: string;
          points_currency: string | null;
          points_rounding_strategy: string | null;
          priority: number | null;
          qualifying_period_days: number | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          amount_rounding_strategy?: string | null;
          base_multiplier?: number | null;
          block_size?: number | null;
          bonus_multiplier?: number | null;
          bonus_tiers?: Json | null;
          calculation_method?: string | null;
          cap_group_id?: string | null;
          card_type_id: string;
          conditions?: Json | null;
          created_at?: string | null;
          description?: string | null;
          enabled?: boolean | null;
          excluded_categories?: string[] | null;
          excluded_merchants?: string[] | null;
          id?: string;
          included_categories?: string[] | null;
          included_merchants?: string[] | null;
          max_bonus_per_transaction?: number | null;
          min_spend?: number | null;
          monthly_bonus_cap?: number | null;
          monthly_cap?: number | null;
          monthly_cap_type?: string | null;
          monthly_min_spend?: number | null;
          monthly_spend_period_type?: string | null;
          name: string;
          points_currency?: string | null;
          points_rounding_strategy?: string | null;
          priority?: number | null;
          qualifying_period_days?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          amount_rounding_strategy?: string | null;
          base_multiplier?: number | null;
          block_size?: number | null;
          bonus_multiplier?: number | null;
          bonus_tiers?: Json | null;
          calculation_method?: string | null;
          cap_group_id?: string | null;
          card_type_id?: string;
          conditions?: Json | null;
          created_at?: string | null;
          description?: string | null;
          enabled?: boolean | null;
          excluded_categories?: string[] | null;
          excluded_merchants?: string[] | null;
          id?: string;
          included_categories?: string[] | null;
          included_merchants?: string[] | null;
          max_bonus_per_transaction?: number | null;
          min_spend?: number | null;
          monthly_bonus_cap?: number | null;
          monthly_cap?: number | null;
          monthly_cap_type?: string | null;
          monthly_min_spend?: number | null;
          monthly_spend_period_type?: string | null;
          name?: string;
          points_currency?: string | null;
          points_rounding_strategy?: string | null;
          priority?: number | null;
          qualifying_period_days?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          base_points: number | null;
          bonus_points: number | null;
          promo_bonus_points: number | null; // One-time promotional bonus points
          category: string | null; // Legacy field (synced with user_category)
          created_at: string | null;
          currency: string | null;
          date: string;
          id: string;
          is_contactless: boolean | null;
          is_deleted: boolean | null;
          is_recategorized: boolean | null; // Track if user changed category
          mcc_code: string | null; // Snapshot of MCC code for rewards
          merchant_id: string | null;
          notes: string | null;
          payment_amount: number | null;
          payment_currency: string | null;
          payment_method_id: string | null;
          reimbursement_amount: number | null;
          total_points: number | null;
          updated_at: string | null;
          user_category: string | null; // User-editable category for budgets
          user_id: string;
          // Auto-categorization metadata
          auto_category_confidence: number | null; // 0.0 to 1.0 confidence score
          needs_review: boolean | null; // Flag for transactions needing user review
          category_suggestion_reason: string | null; // Why this category was suggested
        };
        Insert: {
          amount: number;
          base_points?: number | null;
          bonus_points?: number | null;
          promo_bonus_points?: number | null;
          category?: string | null;
          created_at?: string | null;
          currency?: string | null;
          date: string;
          id?: string;
          is_contactless?: boolean | null;
          is_deleted?: boolean | null;
          is_recategorized?: boolean | null;
          mcc_code?: string | null;
          merchant_id?: string | null;
          notes?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_method_id?: string | null;
          reimbursement_amount?: number | null;
          total_points?: number | null;
          updated_at?: string | null;
          user_category?: string | null;
          user_id: string;
          // Auto-categorization metadata
          auto_category_confidence?: number | null;
          needs_review?: boolean | null;
          category_suggestion_reason?: string | null;
        };
        Update: {
          amount?: number;
          base_points?: number | null;
          bonus_points?: number | null;
          promo_bonus_points?: number | null;
          category?: string | null;
          created_at?: string | null;
          currency?: string | null;
          date?: string;
          id?: string;
          is_contactless?: boolean | null;
          is_deleted?: boolean | null;
          is_recategorized?: boolean | null;
          mcc_code?: string | null;
          merchant_id?: string | null;
          notes?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_method_id?: string | null;
          reimbursement_amount?: number | null;
          total_points?: number | null;
          updated_at?: string | null;
          user_category?: string | null;
          user_id?: string;
          // Auto-categorization metadata
          auto_category_confidence?: number | null;
          needs_review?: boolean | null;
          category_suggestion_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const;
