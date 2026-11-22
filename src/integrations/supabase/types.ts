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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          auto_cashout: number | null
          cashed_multiplier: number | null
          created_at: string
          id: string
          round_id: number
          slot: number
          status: string
          user_id: string
          win: number | null
        }
        Insert: {
          amount: number
          auto_cashout?: number | null
          cashed_multiplier?: number | null
          created_at?: string
          id?: string
          round_id: number
          slot?: number
          status?: string
          user_id: string
          win?: number | null
        }
        Update: {
          amount?: number
          auto_cashout?: number | null
          cashed_multiplier?: number | null
          created_at?: string
          id?: string
          round_id?: number
          slot?: number
          status?: string
          user_id?: string
          win?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_parts: Json | null
          body: string
          created_at: string
          id: string
          read_by_admin: boolean
          reply_to: string | null
          sender: string
          user_id: string
        }
        Insert: {
          ai_parts?: Json | null
          body: string
          created_at?: string
          id?: string
          read_by_admin?: boolean
          reply_to?: string | null
          sender: string
          user_id: string
        }
        Update: {
          ai_parts?: Json | null
          body?: string
          created_at?: string
          id?: string
          read_by_admin?: boolean
          reply_to?: string | null
          sender?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_translation_service: {
        Row: {
          error: string | null
          http_status: number | null
          id: boolean
          paused: boolean
        }
        Insert: {
          error?: string | null
          http_status?: number | null
          id?: boolean
          paused?: boolean
        }
        Update: {
          error?: string | null
          http_status?: number | null
          id?: boolean
          paused?: boolean
        }
        Relationships: []
      }
      chat_translations: {
        Row: {
          created_at: string
          error: string | null
          message_id: string
          status: string
          target_language: string
          translated_body: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          message_id: string
          status?: string
          target_language: string
          translated_body?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          message_id?: string
          status?: string
          target_language?: string
          translated_body?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_deposits: {
        Row: {
          amount: number
          created_at: string
          credited: boolean
          id: string
          pay_address: string | null
          pay_amount: number | null
          pay_currency: string
          payin_extra_id: string | null
          payment_id: string | null
          request_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credited?: boolean
          id?: string
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency: string
          payin_extra_id?: string | null
          payment_id?: string | null
          request_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credited?: boolean
          id?: string
          pay_address?: string | null
          pay_amount?: number | null
          pay_currency?: string
          payin_extra_id?: string | null
          payment_id?: string | null
          request_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          confirmation_link: string | null
          created_at: string
          credited: boolean
          id: string
          ld_id: string | null
          local_id: string
          mpesa_ref: string | null
          phone: string
          result_code: string | null
          result_desc: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          confirmation_link?: string | null
          created_at?: string
          credited?: boolean
          id?: string
          ld_id?: string | null
          local_id: string
          mpesa_ref?: string | null
          phone: string
          result_code?: string | null
          result_desc?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          confirmation_link?: string | null
          created_at?: string
          credited?: boolean
          id?: string
          ld_id?: string | null
          local_id?: string
          mpesa_ref?: string | null
          phone?: string
          result_code?: string | null
          result_desc?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leo_conversations: {
        Row: {
          error: string | null
          failed_message: string | null
          lease_id: string | null
          lease_until: string | null
          user_id: string
        }
        Insert: {
          error?: string | null
          failed_message?: string | null
          lease_id?: string | null
          lease_until?: string | null
          user_id: string
        }
        Update: {
          error?: string | null
          failed_message?: string | null
          lease_id?: string | null
          lease_until?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leo_service_state: {
        Row: {
          http_status: number | null
          id: string
          lease_id: string | null
          lease_until: string | null
          paused: boolean
          reason: string | null
          retry_at: string | null
        }
        Insert: {
          http_status?: number | null
          id: string
          lease_id?: string | null
          lease_until?: string | null
          paused?: boolean
          reason?: string | null
          retry_at?: string | null
        }
        Update: {
          http_status?: number | null
          id?: string
          lease_id?: string | null
          lease_until?: string | null
          paused?: boolean
          reason?: string | null
          retry_at?: string | null
        }
        Relationships: []
      }
      manual_deposit_requests: {
        Row: {
          amount: number
          country_code: string
          created_at: string
          id: string
          payment_code: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          country_code: string
          created_at?: string
          id?: string
          payment_code: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          country_code?: string
          created_at?: string
          id?: string
          payment_code?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_deposit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_private_profile: {
        Row: {
          full_name: string
          national_id: string
          phone: string
          photo_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          full_name: string
          national_id: string
          phone: string
          photo_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          full_name?: string
          national_id?: string
          phone?: string
          photo_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_private_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          country_code: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          suspended: boolean
        }
        Insert: {
          balance?: number
          country_code?: string | null
          created_at?: string
          email?: string | null
          id: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended?: boolean
        }
        Update: {
          balance?: number
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended?: boolean
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          referred_id: string
          referrer_id: string
          source: string
          source_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          referred_id: string
          referrer_id: string
          source: string
          source_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          referred_id?: string
          referrer_id?: string
          source?: string
          source_id?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          bet_open_at: string
          crash_at: string
          crash_point: number
          created_at: string
          end_at: string
          id: number
          takeoff_at: string
        }
        Insert: {
          bet_open_at: string
          crash_at: string
          crash_point: number
          created_at?: string
          end_at: string
          id?: number
          takeoff_at: string
        }
        Update: {
          bet_open_at?: string
          crash_at?: string
          crash_point?: number
          created_at?: string
          end_at?: string
          id?: number
          takeoff_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_chat_summary: {
        Args: never
        Returns: {
          awaiting_reply: boolean
          last_at: string
          last_body: string
          unread: number
          user_id: string
        }[]
      }
      admin_credit: {
        Args: { p_amount: number; p_user: string }
        Returns: number
      }
      approve_manual_deposit: {
        Args: { p_request_id: string }
        Returns: number
      }
      award_referral: {
        Args: {
          _amount: number
          _referred: string
          _source: string
          _source_id: string
        }
        Returns: undefined
      }
      cancel_bet: {
        Args: { p_bet_id: string }
        Returns: {
          amount: number
          auto_cashout: number | null
          cashed_multiplier: number | null
          created_at: string
          id: string
          round_id: number
          slot: number
          status: string
          user_id: string
          win: number | null
        }
        SetofOptions: {
          from: "*"
          to: "bets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cash_out: {
        Args: { p_bet_id: string }
        Returns: {
          amount: number
          auto_cashout: number | null
          cashed_multiplier: number | null
          created_at: string
          id: string
          round_id: number
          slot: number
          status: string
          user_id: string
          win: number | null
        }
        SetofOptions: {
          from: "*"
          to: "bets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cash_out_at: {
        Args: { p_bet_id: string; p_multiplier: number }
        Returns: {
          amount: number
          auto_cashout: number | null
          cashed_multiplier: number | null
          created_at: string
          id: string
          round_id: number
          slot: number
          status: string
          user_id: string
          win: number | null
        }
        SetofOptions: {
          from: "*"
          to: "bets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_crypto_deposit: {
        Args: { p_id: string; p_payment_id: string }
        Returns: boolean
      }
      current_round_state: { Args: never; Returns: Json }
      ensure_future_rounds: { Args: { p_count?: number }; Returns: undefined }
      finalize_deposit: {
        Args: {
          p_local_id: string
          p_mpesa_ref: string
          p_paid: boolean
          p_result_code: string
          p_result_desc: string
        }
        Returns: {
          amount: number
          confirmation_link: string | null
          created_at: string
          credited: boolean
          id: string
          ld_id: string | null
          local_id: string
          mpesa_ref: string | null
          phone: string
          result_code: string | null
          result_desc: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "deposits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_current_round: {
        Args: never
        Returns: {
          bet_open_at: string
          crash_at: string
          crash_point: number
          created_at: string
          end_at: string
          id: number
          takeoff_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gk_crash_point: { Args: { idx: number }; Returns: number }
      gk_ensure_round: {
        Args: { idx: number }
        Returns: {
          bet_open_at: string
          crash_at: string
          crash_point: number
          created_at: string
          end_at: string
          id: number
          takeoff_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gk_hash32: { Args: { n: number }; Returns: number }
      gk_slot_index: { Args: { ts?: string }; Returns: number }
      leo_backlog_claim: { Args: { p_lease: string }; Returns: boolean }
      leo_claim: { Args: { p_lease: string; p_user: string }; Returns: Json }
      leo_complete: {
        Args: {
          p_body: string
          p_lease: string
          p_message: string
          p_parts: Json
          p_user: string
        }
        Returns: undefined
      }
      leo_unanswered: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      place_bet: {
        Args: {
          p_amount: number
          p_auto_cashout: number
          p_round_id: number
          p_slot: number
        }
        Returns: {
          amount: number
          auto_cashout: number | null
          cashed_multiplier: number | null
          created_at: string
          id: string
          round_id: number
          slot: number
          status: string
          user_id: string
          win: number | null
        }
        SetofOptions: {
          from: "*"
          to: "bets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      round_history: {
        Args: { p_limit?: number }
        Returns: {
          crash_point: number
          id: number
        }[]
      }
      settle_my_bets: { Args: never; Returns: undefined }
      upcoming_rounds: {
        Args: { p_count?: number }
        Returns: {
          bet_open_at: string
          crash_point: number
          id: number
          takeoff_at: string
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
