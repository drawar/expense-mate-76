
export interface Database {
  public: {
    Tables: {
      payment_methods: {
        Row: {
          id: string;
          name: string;
          type: string;
          issuer: string | null;
          last_four_digits: string | null;
          currency: string;
          icon: string | null;
          color: string | null;
          image_url: string | null;
          points_currency: string | null;
          active: boolean;
          reward_rules: any | null;
          selected_categories: any | null;
          statement_start_day: number | null;
          is_monthly_statement: boolean | null;
          conversion_rate: any | null;
          created_at: string | null;
          updated_at: string | null;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          issuer?: string | null;
          last_four_digits?: string | null;
          currency: string;
          icon?: string | null;
          color?: string | null;
          image_url?: string | null;
          points_currency?: string | null;
          active?: boolean;
          reward_rules?: any | null;
          selected_categories?: any | null;
          statement_start_day?: number | null;
          is_monthly_statement?: boolean | null;
          conversion_rate?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          issuer?: string | null;
          last_four_digits?: string | null;
          currency?: string;
          icon?: string | null;
          color?: string | null;
          image_url?: string | null;
          points_currency?: string | null;
          active?: boolean;
          reward_rules?: any | null;
          selected_categories?: any | null;
          statement_start_day?: number | null;
          is_monthly_statement?: boolean | null;
          conversion_rate?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_deleted?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          merchant_id: string;
          amount: string;
          currency: string;
          payment_method_id: string;
          payment_amount: string;
          payment_currency: string;
          total_points: number | null;
          base_points: number | null;
          bonus_points: number | null;
          is_contactless: boolean | null;
          notes: string | null;
          reimbursement_amount: string | null;
          category: string | null;
          is_deleted: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          date: string;
          merchant_id: string;
          amount: string;
          currency: string;
          payment_method_id: string;
          payment_amount: string;
          payment_currency: string;
          total_points?: number | null;
          base_points?: number | null;
          bonus_points?: number | null;
          is_contactless?: boolean | null;
          notes?: string | null;
          reimbursement_amount?: string | null;
          category?: string | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          merchant_id?: string;
          amount?: string;
          currency?: string;
          payment_method_id?: string;
          payment_amount?: string;
          payment_currency?: string;
          total_points?: number | null;
          base_points?: number | null;
          bonus_points?: number | null;
          is_contactless?: boolean | null;
          notes?: string | null;
          reimbursement_amount?: string | null;
          category?: string | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      merchants: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          mcc: any | null;
          is_online: boolean | null;
          coordinates: any | null;
          is_deleted: boolean | null;
          created_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          mcc?: any | null;
          is_online?: boolean | null;
          coordinates?: any | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          mcc?: any | null;
          is_online?: boolean | null;
          coordinates?: any | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
      };
      reward_rules: {
        Row: {
          id: string;
          card_type_id: string;
          name: string;
          description: string | null;
          enabled: boolean | null;
          priority: number | null;
          conditions: any | null;
          bonus_tiers: any | null;
          calculation_method: string;
          base_multiplier: string;
          bonus_multiplier: string;
          points_rounding_strategy: string;
          amount_rounding_strategy: string;
          block_size: string;
          monthly_cap: number | null;
          monthly_min_spend: number | null;
          monthly_spend_period_type: string | null;
          points_currency: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          card_type_id: string;
          name: string;
          description?: string | null;
          enabled?: boolean | null;
          priority?: number | null;
          conditions?: any | null;
          bonus_tiers?: any | null;
          calculation_method: string;
          base_multiplier: string;
          bonus_multiplier: string;
          points_rounding_strategy: string;
          amount_rounding_strategy: string;
          block_size: string;
          monthly_cap?: number | null;
          monthly_min_spend?: number | null;
          monthly_spend_period_type?: string | null;
          points_currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_type_id?: string;
          name?: string;
          description?: string | null;
          enabled?: boolean | null;
          priority?: number | null;
          conditions?: any | null;
          bonus_tiers?: any | null;
          calculation_method?: string;
          base_multiplier?: string;
          bonus_multiplier?: string;
          points_rounding_strategy?: string;
          amount_rounding_strategy?: string;
          block_size?: string;
          monthly_cap?: number | null;
          monthly_min_spend?: number | null;
          monthly_spend_period_type?: string | null;
          points_currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      merchant_category_mappings: {
        Row: {
          id: string;
          merchant_name: string;
          occurrence_count: number;
          most_common_mcc: any | null;
          is_deleted: boolean;
          created_at: string | null;
          updated_at: string | null;
          modified_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          merchant_name: string;
          occurrence_count?: number;
          most_common_mcc?: any | null;
          is_deleted?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
          modified_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          merchant_name?: string;
          occurrence_count?: number;
          most_common_mcc?: any | null;
          is_deleted?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
          modified_at?: string | null;
          deleted_at?: string | null;
        };
      };
      points_movements: {
        Row: {
          id: string;
          transaction_id: string | null;
          payment_method_id: string | null;
          base_points: number | null;
          bonus_points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id?: string | null;
          payment_method_id?: string | null;
          base_points?: number | null;
          bonus_points: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string | null;
          payment_method_id?: string | null;
          base_points?: number | null;
          bonus_points?: number;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
