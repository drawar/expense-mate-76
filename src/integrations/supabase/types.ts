export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      merchant_category_mappings: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean
          merchant_name: string
          modified_at: string | null
          most_common_mcc: Json | null
          occurrence_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          merchant_name: string
          modified_at?: string | null
          most_common_mcc?: Json | null
          occurrence_count?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          merchant_name?: string
          modified_at?: string | null
          most_common_mcc?: Json | null
          occurrence_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          address: string | null
          coordinates: Json | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_online: boolean | null
          mcc: Json | null
          name: string
        }
        Insert: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_online?: boolean | null
          mcc?: Json | null
          name: string
        }
        Update: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_online?: boolean | null
          mcc?: Json | null
          name?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          active: boolean
          color: string | null
          conversion_rate: Json | null
          created_at: string | null
          currency: string
          icon: string | null
          id: string
          image_url: string | null
          is_monthly_statement: boolean | null
          issuer: string | null
          last_four_digits: string | null
          name: string
          reward_rules: Json | null
          selected_categories: Json | null
          statement_start_day: number | null
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          conversion_rate?: Json | null
          created_at?: string | null
          currency: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_monthly_statement?: boolean | null
          issuer?: string | null
          last_four_digits?: string | null
          name: string
          reward_rules?: Json | null
          selected_categories?: Json | null
          statement_start_day?: number | null
          type: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string | null
          conversion_rate?: Json | null
          created_at?: string | null
          currency?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_monthly_statement?: boolean | null
          issuer?: string | null
          last_four_digits?: string | null
          name?: string
          reward_rules?: Json | null
          selected_categories?: Json | null
          statement_start_day?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      points_movements: {
        Row: {
          base_points: number | null
          bonus_points: number
          created_at: string
          id: string
          payment_method_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          base_points?: number | null
          bonus_points: number
          created_at?: string
          id?: string
          payment_method_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          base_points?: number | null
          bonus_points?: number
          created_at?: string
          id?: string
          payment_method_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_points_movements_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_points_movements_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reward_rules: {
        Row: {
          amount_rounding_strategy: string
          base_multiplier: number
          block_size: number
          bonus_multiplier: number
          bonus_tiers: Json | null
          calculation_method: string
          card_type_id: string
          conditions: Json | null
          created_at: string
          description: string | null
          enabled: boolean | null
          id: string
          monthly_cap: number | null
          monthly_min_spend: number | null
          monthly_spend_period_type: string | null
          name: string
          points_currency: string | null
          points_rounding_strategy: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          amount_rounding_strategy: string
          base_multiplier: number
          block_size: number
          bonus_multiplier: number
          bonus_tiers?: Json | null
          calculation_method: string
          card_type_id: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id: string
          monthly_cap?: number | null
          monthly_min_spend?: number | null
          monthly_spend_period_type?: string | null
          name: string
          points_currency?: string | null
          points_rounding_strategy: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          amount_rounding_strategy?: string
          base_multiplier?: number
          block_size?: number
          bonus_multiplier?: number
          bonus_tiers?: Json | null
          calculation_method?: string
          card_type_id?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          monthly_cap?: number | null
          monthly_min_spend?: number | null
          monthly_spend_period_type?: string | null
          name?: string
          points_currency?: string | null
          points_rounding_strategy?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          base_points: number | null
          bonus_points: number | null
          category: string | null
          created_at: string | null
          currency: string
          date: string
          deleted_at: string | null
          id: string
          is_contactless: boolean | null
          is_deleted: boolean | null
          merchant_id: string
          notes: string | null
          payment_amount: number
          payment_currency: string
          payment_method_id: string
          reimbursement_amount: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          base_points?: number | null
          bonus_points?: number | null
          category?: string | null
          created_at?: string | null
          currency: string
          date: string
          deleted_at?: string | null
          id?: string
          is_contactless?: boolean | null
          is_deleted?: boolean | null
          merchant_id: string
          notes?: string | null
          payment_amount: number
          payment_currency: string
          payment_method_id: string
          reimbursement_amount?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          base_points?: number | null
          bonus_points?: number | null
          category?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          id?: string
          is_contactless?: boolean | null
          is_deleted?: boolean | null
          merchant_id?: string
          notes?: string | null
          payment_amount?: number
          payment_currency?: string
          payment_method_id?: string
          reimbursement_amount?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
