export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      merchants: {
        Row: {
          address: string | null
          coordinates: Json | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_online: boolean | null
          mcc: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_online?: boolean | null
          mcc?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_online?: boolean | null
          mcc?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          annual_fee: number | null
          billing_cycle_day: number | null
          color: string | null
          conversion_rate: Json | null
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          icon: string | null
          id: string
          image_url: string | null
          interest_rate: number | null
          is_active: boolean | null
          is_monthly_statement: boolean | null
          issuer: string | null
          last_four_digits: string | null
          name: string
          network: string | null
          notes: string | null
          points_currency: string | null
          reward_rules: Json | null
          selected_categories: Json | null
          statement_start_day: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_fee?: number | null
          billing_cycle_day?: number | null
          color?: string | null
          conversion_rate?: Json | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          interest_rate?: number | null
          is_active?: boolean | null
          is_monthly_statement?: boolean | null
          issuer?: string | null
          last_four_digits?: string | null
          name: string
          network?: string | null
          notes?: string | null
          points_currency?: string | null
          reward_rules?: Json | null
          selected_categories?: Json | null
          statement_start_day?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_fee?: number | null
          billing_cycle_day?: number | null
          color?: string | null
          conversion_rate?: Json | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          interest_rate?: number | null
          is_active?: boolean | null
          is_monthly_statement?: boolean | null
          issuer?: string | null
          last_four_digits?: string | null
          name?: string
          network?: string | null
          notes?: string | null
          points_currency?: string | null
          reward_rules?: Json | null
          selected_categories?: Json | null
          statement_start_day?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
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
          currency: string | null
          date: string
          id: string
          is_contactless: boolean | null
          is_deleted: boolean | null
          merchant_id: string | null
          notes: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_method_id: string | null
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
          currency?: string | null
          date: string
          id?: string
          is_contactless?: boolean | null
          is_deleted?: boolean | null
          merchant_id?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_method_id?: string | null
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
          currency?: string | null
          date?: string
          id?: string
          is_contactless?: boolean | null
          is_deleted?: boolean | null
          merchant_id?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_method_id?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
