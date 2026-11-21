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
      clients: {
        Row: {
          created_at: string
          email: string | null
          farm_id: string
          id: string
          invoices_count: number
          name: string
          notes: string | null
          phone: string | null
          total_amount: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          farm_id: string
          id?: string
          invoices_count?: number
          name: string
          notes?: string | null
          phone?: string | null
          total_amount?: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          farm_id?: string
          id?: string
          invoices_count?: number
          name?: string
          notes?: string | null
          phone?: string | null
          total_amount?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          farm_id: string
          id: string
          quantity: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          farm_id: string
          id?: string
          quantity?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          farm_id?: string
          id?: string
          quantity?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_name: string
          created_at: string
          date: string
          farm_id: string
          id: string
          items: Json
          number: string
          payment_method: string
          status: string
          total_amount: number
          type: string
          user_id: string
        }
        Insert: {
          client_name: string
          created_at?: string
          date: string
          farm_id: string
          id?: string
          items?: Json
          number: string
          payment_method: string
          status: string
          total_amount: number
          type: string
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          items?: Json
          number?: string
          payment_method?: string
          status?: string
          total_amount?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          created_at: string
          farm_id: string
          id: string
          name: string
          opening_balance: number
          partnership_percentage: number
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          farm_id: string
          id?: string
          name: string
          opening_balance?: number
          partnership_percentage: number
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          opening_balance?: number
          partnership_percentage?: number
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          date: string
          farm_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          date?: string
          farm_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenues: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          date: string
          farm_id: string
          id: string
          notes: string | null
          payment_method: string
          quantity: number | null
          type: string
          unit_price: number | null
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          date: string
          farm_id: string
          id?: string
          notes?: string | null
          payment_method?: string
          quantity?: number | null
          type: string
          unit_price?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          notes?: string | null
          payment_method?: string
          quantity?: number | null
          type?: string
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_farm: { Args: { _farm_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "worker"
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
    Enums: {
      app_role: ["admin", "worker"],
    },
  },
} as const
