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
      merchant_category_mappings: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean
          merchant_name: string
          most_common_mcc: Json | null
          occurrence_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          merchant_name: string
          most_common_mcc?: Json | null
          occurrence_count?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          merchant_name?: string
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
          id: string
          is_online: boolean | null
          mcc: Json | null
          name: string
        }
        Insert: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          mcc?: Json | null
          name: string
        }
        Update: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
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
          is_monthly_statement: boolean | null
          issuer: string | null
          last_four_digits: string | null
          name: string
          reward_rules: Json | null
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
          is_monthly_statement?: boolean | null
          issuer?: string | null
          last_four_digits?: string | null
          name: string
          reward_rules?: Json | null
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
          is_monthly_statement?: boolean | null
          issuer?: string | null
          last_four_digits?: string | null
          name?: string
          reward_rules?: Json | null
          statement_start_day?: number | null
          type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          currency: string
          date: string
          id: string
          is_contactless: boolean | null
          merchant_id: string
          notes: string | null
          payment_amount: number
          payment_currency: string
          payment_method_id: string
          reward_points: number | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          currency: string
          date: string
          id?: string
          is_contactless?: boolean | null
          merchant_id: string
          notes?: string | null
          payment_amount: number
          payment_currency: string
          payment_method_id: string
          reward_points?: number | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          id?: string
          is_contactless?: boolean | null
          merchant_id?: string
          notes?: string | null
          payment_amount?: number
          payment_currency?: string
          payment_method_id?: string
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
