// ============================================================================
// Tipos do banco — GERADOS pelo Supabase a partir do schema real.
// Regenerar quando o schema mudar:
//   supabase gen types typescript --project-id jngrguyuavgmhmwbkppb > src/types/database.ts
// (ou via connector MCP do Supabase). Não editar à mão a parte gerada.
// ============================================================================

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          ticket_id: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          ticket_id?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender"]
          text: string
          ticket_id: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender"]
          text: string
          ticket_id: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender"]
          text?: string
          ticket_id?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          animal_types: Database["public"]["Enums"]["species_type"][]
          city: string | null
          clinic_name: string | null
          cnpj: string | null
          complement: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_24_hours: boolean
          is_emergency_available: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          primary_color: string | null
          rating: number | null
          review_count: number
          schedules: Json
          services: string[]
          specialties: string[]
          state: string | null
          street: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          animal_types?: Database["public"]["Enums"]["species_type"][]
          city?: string | null
          clinic_name?: string | null
          cnpj?: string | null
          complement?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id: string
          is_24_hours?: boolean
          is_emergency_available?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          primary_color?: string | null
          rating?: number | null
          review_count?: number
          schedules?: Json
          services?: string[]
          specialties?: string[]
          state?: string | null
          street?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          animal_types?: Database["public"]["Enums"]["species_type"][]
          city?: string | null
          clinic_name?: string | null
          cnpj?: string | null
          complement?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_24_hours?: boolean
          is_emergency_available?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          primary_color?: string | null
          rating?: number | null
          review_count?: number
          schedules?: Json
          services?: string[]
          specialties?: string[]
          state?: string | null
          street?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          clinic_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          birth_date: string | null
          breed: string
          created_at: string
          id: string
          name: string
          owner_id: string
          photo_url: string | null
          species: Database["public"]["Enums"]["species_type"]
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          breed: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
          photo_url?: string | null
          species: Database["public"]["Enums"]["species_type"]
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          breed?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          photo_url?: string | null
          species?: Database["public"]["Enums"]["species_type"]
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_profile_complete: boolean
          name: string
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_profile_complete?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_profile_complete?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reported_id: string
          reporter_id: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reported_id: string
          reporter_id: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reported_id?: string
          reporter_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          clinic_id: string
          created_at: string
          description: string
          id: string
          is_emergency: boolean
          pet_breed: string
          pet_id: string | null
          pet_name: string
          pet_species: Database["public"]["Enums"]["species_type"]
          referral_file_url: string | null
          rejection_reason: string | null
          scheduled_date: string
          scheduled_time: string
          service: string
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          clinic_id: string
          created_at?: string
          description: string
          id?: string
          is_emergency?: boolean
          pet_breed: string
          pet_id?: string | null
          pet_name: string
          pet_species: Database["public"]["Enums"]["species_type"]
          referral_file_url?: string | null
          rejection_reason?: string | null
          scheduled_date: string
          scheduled_time: string
          service: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          clinic_id?: string
          created_at?: string
          description?: string
          id?: string
          is_emergency?: boolean
          pet_breed?: string
          pet_id?: string | null
          pet_name?: string
          pet_species?: Database["public"]["Enums"]["species_type"]
          referral_file_url?: string | null
          rejection_reason?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_appointments: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          id: string
          patient_name: string | null
          patient_notes: string | null
          patient_pet: string | null
          price: number | null
          status: Database["public"]["Enums"]["slot_status_enum"]
          ticket_id: string | null
          time: string
          vet_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          id?: string
          patient_name?: string | null
          patient_notes?: string | null
          patient_pet?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["slot_status_enum"]
          ticket_id?: string | null
          time: string
          vet_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          id?: string
          patient_name?: string | null
          patient_notes?: string | null
          patient_pet?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["slot_status_enum"]
          ticket_id?: string | null
          time?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_appointments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_appointments_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      veterinarians: {
        Row: {
          avatar_url: string | null
          clinic_id: string
          created_at: string
          crm: string | null
          id: string
          name: string
          service_type: Database["public"]["Enums"]["service_type_enum"]
          specialties: string[]
          updated_at: string
          work_days: number[]
          work_end: string
          work_start: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_id: string
          created_at?: string
          crm?: string | null
          id?: string
          name: string
          service_type?: Database["public"]["Enums"]["service_type_enum"]
          specialties?: string[]
          updated_at?: string
          work_days?: number[]
          work_end?: string
          work_start?: string
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string
          created_at?: string
          crm?: string | null
          id?: string
          name?: string
          service_type?: Database["public"]["Enums"]["service_type_enum"]
          specialties?: string[]
          updated_at?: string
          work_days?: number[]
          work_end?: string
          work_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "veterinarians_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      export_clinic_month_appointments: {
        Args: { p_year: number; p_month: number }
        Returns: {
          appt_date: string
          appt_time: string
          vet_name: string
          price: number
          pet_name: string
          pet_breed: string
          pet_species: string
          tutor_name: string
          tutor_cpf: string
          tutor_email: string
        }[]
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      service_type_enum: "in_person" | "online" | "both"
      slot_status_enum: "booked" | "unavailable" | "cancelled"
      message_sender: "client" | "clinic" | "system"
      message_type: "text" | "system"
      plan_type: "free" | "basic" | "intermediary" | "experience"
      species_type:
        | "dog"
        | "cat"
        | "bird"
        | "rabbit"
        | "hamster"
        | "fish"
        | "reptile"
        | "other"
      ticket_status: "pending" | "confirmed" | "cancelled"
      user_type: "client" | "clinic"
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
      approval_status: ["pending", "approved", "rejected"],
      message_sender: ["client", "clinic", "system"],
      message_type: ["text", "system"],
      plan_type: ["free", "basic", "intermediary", "experience"],
      species_type: [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "hamster",
        "fish",
        "reptile",
        "other",
      ],
      ticket_status: ["pending", "confirmed", "cancelled"],
      user_type: ["client", "clinic"],
    },
  },
} as const

// ─── Aliases de conveniência (usados pela aplicação) ────────────────────────
// Mantêm os imports existentes funcionando sobre os tipos gerados.

export type UserType = Enums<'user_type'>
export type PlanType = Enums<'plan_type'>
export type SpeciesType = Enums<'species_type'>
export type ApprovalStatus = Enums<'approval_status'>
export type TicketStatus = Enums<'ticket_status'>
export type MessageSender = Enums<'message_sender'>
export type MessageType = Enums<'message_type'>

export type ProfileRow = Tables<'profiles'>
export type ClinicRow = Tables<'clinics'>
export type PetRow = Tables<'pets'>
export type TicketRow = Tables<'tickets'>
export type ChatMessageRow = Tables<'chat_messages'>
export type FavoriteRow = Tables<'favorites'>
export type ReportRow = Tables<'reports'>
export type BlockRow = Tables<'blocks'>
