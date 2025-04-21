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
      points_movements: {
        Row: {
          bonus_points: number
          created_at: string
          id: string
          payment_method_id: string | null
          transaction_id: string | null
        }
        Insert: {
          bonus_points: number
          created_at?: string
          id?: string
          payment_method_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          bonus_points?: number
          created_at?: string
          id?: string
          payment_method_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_movements_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_movements_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_rules: {
        Row: {
          base_point_rate: number
          bonus_point_rate: number
          card_type: string
          created_at: string | null
          currency_restrictions: string[] | null
          custom_params: Json | null
          description: string | null
          enabled: boolean
          excluded_mccs: string[] | null
          id: string
          included_mccs: string[] | null
          is_contactless_only: boolean
          is_online_only: boolean
          max_spend: number | null
          min_spend: number | null
          monthly_cap: number
          name: string
          rounding: string
          updated_at: string | null
        }
        Insert: {
          base_point_rate?: number
          bonus_point_rate?: number
          card_type: string
          created_at?: string | null
          currency_restrictions?: string[] | null
          custom_params?: Json | null
          description?: string | null
          enabled?: boolean
          excluded_mccs?: string[] | null
          id?: string
          included_mccs?: string[] | null
          is_contactless_only?: boolean
          is_online_only?: boolean
          max_spend?: number | null
          min_spend?: number | null
          monthly_cap?: number
          name: string
          rounding: string
          updated_at?: string | null
        }
        Update: {
          base_point_rate?: number
          bonus_point_rate?: number
          card_type?: string
          created_at?: string | null
          currency_restrictions?: string[] | null
          custom_params?: Json | null
          description?: string | null
          enabled?: boolean
          excluded_mccs?: string[] | null
          id?: string
          included_mccs?: string[] | null
          is_contactless_only?: boolean
          is_online_only?: boolean
          max_spend?: number | null
          min_spend?: number | null
          monthly_cap?: number
          name?: string
          rounding?: string
          updated_at?: string | null
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
        }
        Relationships: []
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
          reward_points: number | null
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
          reward_points?: number | null
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
          reward_points?: number | null
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
      reward_rules: {
        Row: {
          id: string
          card_type_id: string
          name: string
          description: string | null
          enabled: boolean
          priority: number
          conditions: Json | null
          calculation_method: string
          base_multiplier: number
          bonus_multiplier: number
          points_rounding_strategy: string
          amount_rounding_strategy: string
          block_size: number
          bonus_tiers: Json | null
          monthly_cap: number | null
          monthly_min_spend: number | null
          monthly_spend_period_type: string | null
          points_currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          card_type_id: string
          name: string
          description?: string | null
          enabled?: boolean
          priority?: number
          conditions?: Json | null
          calculation_method?: string
          base_multiplier?: number
          bonus_multiplier?: number
          points_rounding_strategy?: string
          amount_rounding_strategy?: string
          block_size?: number
          bonus_tiers?: Json | null
          monthly_cap?: number | null
          monthly_min_spend?: number | null
          monthly_spend_period_type?: string | null
          points_currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          card_type_id?: string
          name?: string
          description?: string | null
          enabled?: boolean
          priority?: number
          conditions?: Json | null
          calculation_method?: string
          base_multiplier?: number
          bonus_multiplier?: number
          points_rounding_strategy?: string
          amount_rounding_strategy?: string
          block_size?: number
          bonus_tiers?: Json | null
          monthly_cap?: number | null
          monthly_min_spend?: number | null
          monthly_spend_period_type?: string | null
          points_currency?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_rules_card_type_id_fkey"
            columns: ["card_type_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
