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
      bonus_points_tracking: {
        Row: {
          created_at: string | null;
          id: string;
          payment_method_id: string;
          period_month: number;
          period_type: string;
          period_year: number;
          rule_id: string;
          statement_day: number | null;
          updated_at: string | null;
          used_bonus_points: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          payment_method_id: string;
          period_month: number;
          period_type: string;
          period_year: number;
          rule_id: string;
          statement_day?: number | null;
          updated_at?: string | null;
          used_bonus_points?: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          payment_method_id?: string;
          period_month?: number;
          period_type?: string;
          period_year?: number;
          rule_id?: string;
          statement_day?: number | null;
          updated_at?: string | null;
          used_bonus_points?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bonus_points_tracking_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_streaks: {
        Row: {
          created_at: string | null;
          currency: string;
          current_streak: number;
          earned_badges: Json;
          id: string;
          last_checked_date: string | null;
          longest_streak: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          currency: string;
          current_streak?: number;
          earned_badges?: Json;
          id?: string;
          last_checked_date?: string | null;
          longest_streak?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          currency?: string;
          current_streak?: number;
          earned_badges?: Json;
          id?: string;
          last_checked_date?: string | null;
          longest_streak?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string;
          id: string;
          period_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency: string;
          id?: string;
          period_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          period_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      card_catalog: {
        Row: {
          available_categories: string[] | null;
          card_type_id: string;
          created_at: string | null;
          currency: string;
          default_color: string | null;
          default_icon: string | null;
          default_image_url: string | null;
          has_categories: boolean | null;
          id: string;
          is_active: boolean | null;
          issuer: string;
          max_categories_selectable: number | null;
          name: string;
          network: string | null;
          points_currency: string | null;
          region: string;
          reward_currency_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          available_categories?: string[] | null;
          card_type_id: string;
          created_at?: string | null;
          currency?: string;
          default_color?: string | null;
          default_icon?: string | null;
          default_image_url?: string | null;
          has_categories?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          issuer: string;
          max_categories_selectable?: number | null;
          name: string;
          network?: string | null;
          points_currency?: string | null;
          region?: string;
          reward_currency_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          available_categories?: string[] | null;
          card_type_id?: string;
          created_at?: string | null;
          currency?: string;
          default_color?: string | null;
          default_icon?: string | null;
          default_image_url?: string | null;
          has_categories?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          issuer?: string;
          max_categories_selectable?: number | null;
          name?: string;
          network?: string | null;
          points_currency?: string | null;
          region?: string;
          reward_currency_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "card_catalog_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      conversion_rates: {
        Row: {
          conversion_rate: number;
          created_at: string | null;
          id: string;
          reward_currency_id: string | null;
          source_block: number | null;
          target_block: number | null;
          target_currency_id: string | null;
          transfer_increment: number | null;
          updated_at: string | null;
        };
        Insert: {
          conversion_rate: number;
          created_at?: string | null;
          id?: string;
          reward_currency_id?: string | null;
          source_block?: number | null;
          target_block?: number | null;
          target_currency_id?: string | null;
          transfer_increment?: number | null;
          updated_at?: string | null;
        };
        Update: {
          conversion_rate?: number;
          created_at?: string | null;
          id?: string;
          reward_currency_id?: string | null;
          source_block?: number | null;
          target_block?: number | null;
          target_currency_id?: string | null;
          transfer_increment?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversion_rates_destination_currency_id_fkey";
            columns: ["target_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversion_rates_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      insights: {
        Row: {
          action_target: string | null;
          action_text: string | null;
          action_type: string | null;
          category: string;
          condition_params: Json;
          condition_type: string;
          cooldown_days: number | null;
          created_at: string;
          icon: string | null;
          id: string;
          is_active: boolean;
          is_dismissible: boolean;
          message_template: string;
          priority: number;
          severity: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          action_target?: string | null;
          action_text?: string | null;
          action_type?: string | null;
          category: string;
          condition_params?: Json;
          condition_type: string;
          cooldown_days?: number | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          is_dismissible?: boolean;
          message_template: string;
          priority?: number;
          severity?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          action_target?: string | null;
          action_text?: string | null;
          action_type?: string | null;
          category?: string;
          condition_params?: Json;
          condition_type?: string;
          cooldown_days?: number | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          is_dismissible?: boolean;
          message_template?: string;
          priority?: number;
          severity?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
      merchants: {
        Row: {
          address: string | null;
          coordinates: Json | null;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_online: boolean | null;
          mcc: string | null;
          mcc_code: string | null;
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
          mcc?: string | null;
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
          mcc?: string | null;
          mcc_code?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          billing_cycle_day: number | null;
          card_catalog_id: string | null;
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
          nickname: string | null;
          notes: string | null;
          points_currency: string | null;
          purchase_date: string | null;
          reward_currency_id: string | null;
          reward_rules: Json | null;
          selected_categories: Json | null;
          statement_start_day: number | null;
          total_loaded: number | null;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          billing_cycle_day?: number | null;
          card_catalog_id?: string | null;
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
          nickname?: string | null;
          notes?: string | null;
          points_currency?: string | null;
          purchase_date?: string | null;
          reward_currency_id?: string | null;
          reward_rules?: Json | null;
          selected_categories?: Json | null;
          statement_start_day?: number | null;
          total_loaded?: number | null;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          billing_cycle_day?: number | null;
          card_catalog_id?: string | null;
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
          nickname?: string | null;
          notes?: string | null;
          points_currency?: string | null;
          purchase_date?: string | null;
          reward_currency_id?: string | null;
          reward_rules?: Json | null;
          selected_categories?: Json | null;
          statement_start_day?: number | null;
          total_loaded?: number | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_methods_card_catalog_id_fkey";
            columns: ["card_catalog_id"];
            isOneToOne: false;
            referencedRelation: "card_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_methods_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      points_adjustments: {
        Row: {
          adjustment_date: string;
          adjustment_type: string;
          amount: number;
          created_at: string | null;
          deleted_at: string | null;
          description: string;
          id: string;
          is_deleted: boolean | null;
          reference_number: string | null;
          reward_currency_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          adjustment_date?: string;
          adjustment_type: string;
          amount: number;
          created_at?: string | null;
          deleted_at?: string | null;
          description: string;
          id?: string;
          is_deleted?: boolean | null;
          reference_number?: string | null;
          reward_currency_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          adjustment_date?: string;
          adjustment_type?: string;
          amount?: number;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string;
          id?: string;
          is_deleted?: boolean | null;
          reference_number?: string | null;
          reward_currency_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_adjustments_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      points_balances: {
        Row: {
          balance_date: string | null;
          card_type_id: string | null;
          created_at: string | null;
          current_balance: number;
          expiry_date: string | null;
          id: string;
          last_calculated_at: string | null;
          notes: string | null;
          payment_method_id: string | null;
          reward_currency_id: string;
          starting_balance: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          balance_date?: string | null;
          card_type_id?: string | null;
          created_at?: string | null;
          current_balance?: number;
          expiry_date?: string | null;
          id?: string;
          last_calculated_at?: string | null;
          notes?: string | null;
          payment_method_id?: string | null;
          reward_currency_id: string;
          starting_balance?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          balance_date?: string | null;
          card_type_id?: string | null;
          created_at?: string | null;
          current_balance?: number;
          expiry_date?: string | null;
          id?: string;
          last_calculated_at?: string | null;
          notes?: string | null;
          payment_method_id?: string | null;
          reward_currency_id?: string;
          starting_balance?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_balances_payment_method_id_fkey";
            columns: ["payment_method_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_balances_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      points_goals: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          deleted_at: string | null;
          goal_description: string | null;
          goal_name: string;
          goal_type: string | null;
          id: string;
          is_deleted: boolean | null;
          priority: number | null;
          reward_currency_id: string;
          status: string;
          target_cabin: string | null;
          target_date: string | null;
          target_points: number;
          target_route: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          goal_description?: string | null;
          goal_name: string;
          goal_type?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          priority?: number | null;
          reward_currency_id: string;
          status?: string;
          target_cabin?: string | null;
          target_date?: string | null;
          target_points: number;
          target_route?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          goal_description?: string | null;
          goal_name?: string;
          goal_type?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          priority?: number | null;
          reward_currency_id?: string;
          status?: string;
          target_cabin?: string | null;
          target_date?: string | null;
          target_points?: number;
          target_route?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_goals_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      points_redemptions: {
        Row: {
          airline: string | null;
          booking_reference: string | null;
          cabin_class: string | null;
          cash_value: number | null;
          cash_value_currency: string | null;
          cpp: number | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string;
          flight_route: string | null;
          id: string;
          is_deleted: boolean | null;
          passengers: number | null;
          points_redeemed: number;
          redemption_date: string;
          redemption_type: string;
          reward_currency_id: string;
          travel_date: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          airline?: string | null;
          booking_reference?: string | null;
          cabin_class?: string | null;
          cash_value?: number | null;
          cash_value_currency?: string | null;
          cpp?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description: string;
          flight_route?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          passengers?: number | null;
          points_redeemed: number;
          redemption_date?: string;
          redemption_type: string;
          reward_currency_id: string;
          travel_date?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          airline?: string | null;
          booking_reference?: string | null;
          cabin_class?: string | null;
          cash_value?: number | null;
          cash_value_currency?: string | null;
          cpp?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string;
          flight_route?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          passengers?: number | null;
          points_redeemed?: number;
          redemption_date?: string;
          redemption_type?: string;
          reward_currency_id?: string;
          travel_date?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_redemptions_reward_currency_id_fkey";
            columns: ["reward_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      points_transfers: {
        Row: {
          conversion_rate: number;
          created_at: string | null;
          deleted_at: string | null;
          destination_amount: number;
          destination_currency_id: string;
          id: string;
          is_deleted: boolean | null;
          notes: string | null;
          reference_number: string | null;
          source_amount: number;
          source_currency_id: string;
          transfer_bonus_rate: number | null;
          transfer_date: string;
          transfer_fee: number | null;
          transfer_fee_currency: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          conversion_rate: number;
          created_at?: string | null;
          deleted_at?: string | null;
          destination_amount: number;
          destination_currency_id: string;
          id?: string;
          is_deleted?: boolean | null;
          notes?: string | null;
          reference_number?: string | null;
          source_amount: number;
          source_currency_id: string;
          transfer_bonus_rate?: number | null;
          transfer_date?: string;
          transfer_fee?: number | null;
          transfer_fee_currency?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          conversion_rate?: number;
          created_at?: string | null;
          deleted_at?: string | null;
          destination_amount?: number;
          destination_currency_id?: string;
          id?: string;
          is_deleted?: boolean | null;
          notes?: string | null;
          reference_number?: string | null;
          source_amount?: number;
          source_currency_id?: string;
          transfer_bonus_rate?: number | null;
          transfer_date?: string;
          transfer_fee?: number | null;
          transfer_fee_currency?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_transfers_destination_currency_id_fkey";
            columns: ["destination_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_transfers_source_currency_id_fkey";
            columns: ["source_currency_id"];
            isOneToOne: false;
            referencedRelation: "reward_currencies";
            referencedColumns: ["id"];
          },
        ];
      };
      receipt_images: {
        Row: {
          created_at: string | null;
          expense_id: string | null;
          file_size_bytes: number | null;
          id: string;
          mime_type: string | null;
          original_filename: string | null;
          storage_path: string;
          thumbnail_path: string | null;
          updated_at: string | null;
          uploaded_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expense_id?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          mime_type?: string | null;
          original_filename?: string | null;
          storage_path: string;
          thumbnail_path?: string | null;
          updated_at?: string | null;
          uploaded_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expense_id?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          mime_type?: string | null;
          original_filename?: string | null;
          storage_path?: string;
          thumbnail_path?: string | null;
          updated_at?: string | null;
          uploaded_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipt_images_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      receipt_ocr_data: {
        Row: {
          created_at: string | null;
          currency_code: string | null;
          error_message: string | null;
          id: string;
          merchant_address: string | null;
          merchant_name: string | null;
          ocr_confidence_score: number | null;
          ocr_processed_at: string | null;
          ocr_provider: string;
          payment_method_hint: string | null;
          processing_status: string | null;
          raw_ocr_response: Json | null;
          receipt_image_id: string;
          receipt_number: string | null;
          subtotal_amount: number | null;
          tax_amount: number | null;
          total_amount: number | null;
          transaction_date: string | null;
          transaction_time: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          currency_code?: string | null;
          error_message?: string | null;
          id?: string;
          merchant_address?: string | null;
          merchant_name?: string | null;
          ocr_confidence_score?: number | null;
          ocr_processed_at?: string | null;
          ocr_provider: string;
          payment_method_hint?: string | null;
          processing_status?: string | null;
          raw_ocr_response?: Json | null;
          receipt_image_id: string;
          receipt_number?: string | null;
          subtotal_amount?: number | null;
          tax_amount?: number | null;
          total_amount?: number | null;
          transaction_date?: string | null;
          transaction_time?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          currency_code?: string | null;
          error_message?: string | null;
          id?: string;
          merchant_address?: string | null;
          merchant_name?: string | null;
          ocr_confidence_score?: number | null;
          ocr_processed_at?: string | null;
          ocr_provider?: string;
          payment_method_hint?: string | null;
          processing_status?: string | null;
          raw_ocr_response?: Json | null;
          receipt_image_id?: string;
          receipt_number?: string | null;
          subtotal_amount?: number | null;
          tax_amount?: number | null;
          total_amount?: number | null;
          transaction_date?: string | null;
          transaction_time?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipt_ocr_data_receipt_image_id_fkey";
            columns: ["receipt_image_id"];
            isOneToOne: false;
            referencedRelation: "receipt_images";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_income: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string;
          day_of_month: number | null;
          frequency: string;
          id: string;
          is_active: boolean | null;
          name: string;
          notes: string | null;
          start_date: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          currency: string;
          day_of_month?: number | null;
          frequency: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          notes?: string | null;
          start_date?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string;
          day_of_month?: number | null;
          frequency?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          notes?: string | null;
          start_date?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reward_currencies: {
        Row: {
          bg_color: string | null;
          code: string;
          created_at: string | null;
          display_name: string;
          id: string;
          is_transferrable: boolean;
          issuer: string | null;
          logo_scale: number | null;
          logo_url: string | null;
        };
        Insert: {
          bg_color?: string | null;
          code: string;
          created_at?: string | null;
          display_name: string;
          id?: string;
          is_transferrable?: boolean;
          issuer?: string | null;
          logo_scale?: number | null;
          logo_url?: string | null;
        };
        Update: {
          bg_color?: string | null;
          code?: string;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          is_transferrable?: boolean;
          issuer?: string | null;
          logo_scale?: number | null;
          logo_url?: string | null;
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
          card_catalog_id: string | null;
          card_type_id: string;
          compound_bonus_multipliers: Json | null;
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
          points_rounding_strategy: string | null;
          priority: number | null;
          promo_start_date: string | null;
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
          card_catalog_id?: string | null;
          card_type_id: string;
          compound_bonus_multipliers?: Json | null;
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
          points_rounding_strategy?: string | null;
          priority?: number | null;
          promo_start_date?: string | null;
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
          card_catalog_id?: string | null;
          card_type_id?: string;
          compound_bonus_multipliers?: Json | null;
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
          points_rounding_strategy?: string | null;
          priority?: number | null;
          promo_start_date?: string | null;
          qualifying_period_days?: number | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reward_rules_card_catalog_id_fkey";
            columns: ["card_catalog_id"];
            isOneToOne: false;
            referencedRelation: "card_catalog";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          auto_category_confidence: number | null;
          base_points: number | null;
          bonus_points: number | null;
          category: string | null;
          category_suggestion_reason: string | null;
          created_at: string | null;
          currency: string | null;
          date: string;
          deleted_at: string | null;
          id: string;
          is_contactless: boolean | null;
          is_deleted: boolean | null;
          is_recategorized: boolean | null;
          mcc_code: string | null;
          merchant_id: string | null;
          needs_review: boolean | null;
          notes: string | null;
          payment_amount: number | null;
          payment_currency: string | null;
          payment_method_id: string | null;
          promo_bonus_points: number | null;
          receipt_image_id: string | null;
          reimbursement_amount: number | null;
          total_points: number | null;
          updated_at: string | null;
          user_category: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          auto_category_confidence?: number | null;
          base_points?: number | null;
          bonus_points?: number | null;
          category?: string | null;
          category_suggestion_reason?: string | null;
          created_at?: string | null;
          currency?: string | null;
          date: string;
          deleted_at?: string | null;
          id?: string;
          is_contactless?: boolean | null;
          is_deleted?: boolean | null;
          is_recategorized?: boolean | null;
          mcc_code?: string | null;
          merchant_id?: string | null;
          needs_review?: boolean | null;
          notes?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_method_id?: string | null;
          promo_bonus_points?: number | null;
          receipt_image_id?: string | null;
          reimbursement_amount?: number | null;
          total_points?: number | null;
          updated_at?: string | null;
          user_category?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          auto_category_confidence?: number | null;
          base_points?: number | null;
          bonus_points?: number | null;
          category?: string | null;
          category_suggestion_reason?: string | null;
          created_at?: string | null;
          currency?: string | null;
          date?: string;
          deleted_at?: string | null;
          id?: string;
          is_contactless?: boolean | null;
          is_deleted?: boolean | null;
          is_recategorized?: boolean | null;
          mcc_code?: string | null;
          merchant_id?: string | null;
          needs_review?: boolean | null;
          notes?: string | null;
          payment_amount?: number | null;
          payment_currency?: string | null;
          payment_method_id?: string | null;
          promo_bonus_points?: number | null;
          receipt_image_id?: string | null;
          reimbursement_amount?: number | null;
          total_points?: number | null;
          updated_at?: string | null;
          user_category?: string | null;
          user_id?: string;
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
          {
            foreignKeyName: "transactions_receipt_image_id_fkey";
            columns: ["receipt_image_id"];
            isOneToOne: false;
            referencedRelation: "receipt_images";
            referencedColumns: ["id"];
          },
        ];
      };
      user_insight_dismissals: {
        Row: {
          dismissed_at: string;
          id: string;
          insight_id: string;
          user_id: string;
        };
        Insert: {
          dismissed_at?: string;
          id?: string;
          insight_id: string;
          user_id: string;
        };
        Update: {
          dismissed_at?: string;
          id?: string;
          insight_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_insight_dismissals_insight_id_fkey";
            columns: ["insight_id"];
            isOneToOne: false;
            referencedRelation: "insights";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          created_at: string | null;
          default_currency: string;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          default_currency?: string;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          default_currency?: string;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
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
      call_monthly_spending_summary: { Args: never; Returns: undefined };
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
