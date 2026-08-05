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
      api_versions: {
        Row: {
          api_id: string
          breaking_count: number
          change_count: number
          created_at: string
          endpoint_count: number
          id: string
          is_current: boolean
          source: string
          spec: Json
          version: string
        }
        Insert: {
          api_id: string
          breaking_count?: number
          change_count?: number
          created_at?: string
          endpoint_count?: number
          id?: string
          is_current?: boolean
          source?: string
          spec: Json
          version: string
        }
        Update: {
          api_id?: string
          breaking_count?: number
          change_count?: number
          created_at?: string
          endpoint_count?: number
          id?: string
          is_current?: boolean
          source?: string
          spec?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_versions_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
        ]
      }
      apis: {
        Row: {
          base_url: string
          created_at: string
          current_version_id: string | null
          genome: number
          github_repo: string | null
          id: string
          kind: Database["public"]["Enums"]["api_kind"]
          last_checked: string | null
          monitor_interval: string
          name: string
          org_id: string
          owning_team: string | null
          spec_url: string | null
          status: Database["public"]["Enums"]["api_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          base_url: string
          created_at?: string
          current_version_id?: string | null
          genome?: number
          github_repo?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["api_kind"]
          last_checked?: string | null
          monitor_interval?: string
          name: string
          org_id: string
          owning_team?: string | null
          spec_url?: string | null
          status?: Database["public"]["Enums"]["api_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          base_url?: string
          created_at?: string
          current_version_id?: string | null
          genome?: number
          github_repo?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["api_kind"]
          last_checked?: string | null
          monitor_interval?: string
          name?: string
          org_id?: string
          owning_team?: string | null
          spec_url?: string | null
          status?: Database["public"]["Enums"]["api_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apis_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "api_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_changes: {
        Row: {
          after_snippet: string | null
          api_id: string
          before_snippet: string | null
          created_at: string
          endpoint_path: string | null
          from_version_id: string | null
          id: string
          kind: Database["public"]["Enums"]["change_kind"]
          method: string | null
          severity: Database["public"]["Enums"]["change_severity"]
          summary: string
          target: string
          to_version_id: string
        }
        Insert: {
          after_snippet?: string | null
          api_id: string
          before_snippet?: string | null
          created_at?: string
          endpoint_path?: string | null
          from_version_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["change_kind"]
          method?: string | null
          severity: Database["public"]["Enums"]["change_severity"]
          summary: string
          target: string
          to_version_id: string
        }
        Update: {
          after_snippet?: string | null
          api_id?: string
          before_snippet?: string | null
          created_at?: string
          endpoint_path?: string | null
          from_version_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["change_kind"]
          method?: string | null
          severity?: Database["public"]["Enums"]["change_severity"]
          summary?: string
          target?: string
          to_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_changes_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_changes_from_version_id_fkey"
            columns: ["from_version_id"]
            isOneToOne: false
            referencedRelation: "api_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_changes_to_version_id_fkey"
            columns: ["to_version_id"]
            isOneToOne: false
            referencedRelation: "api_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_messages: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          id: string
          org_id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          id?: string
          org_id: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dependencies: {
        Row: {
          created_at: string
          endpoint_path: string | null
          id: string
          method: string | null
          org_id: string
          source_service: string
          target_api_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          endpoint_path?: string | null
          id?: string
          method?: string | null
          org_id: string
          source_service: string
          target_api_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          endpoint_path?: string | null
          id?: string
          method?: string | null
          org_id?: string
          source_service?: string
          target_api_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "dependencies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependencies_target_api_id_fkey"
            columns: ["target_api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoints: {
        Row: {
          api_id: string
          created_at: string
          id: string
          method: string
          operation_id: string | null
          path: string
          spec: Json
          version_id: string
        }
        Insert: {
          api_id: string
          created_at?: string
          id?: string
          method: string
          operation_id?: string | null
          path: string
          spec: Json
          version_id: string
        }
        Update: {
          api_id?: string
          created_at?: string
          id?: string
          method?: string
          operation_id?: string | null
          path?: string
          spec?: Json
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "endpoints_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "api_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_events: {
        Row: {
          at: string
          detail: string | null
          id: string
          incident_id: string
          kind: string
          label: string
        }
        Insert: {
          at?: string
          detail?: string | null
          id?: string
          incident_id: string
          kind: string
          label: string
        }
        Update: {
          at?: string
          detail?: string | null
          id?: string
          incident_id?: string
          kind?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_endpoints: number
          affected_services: number
          api_id: string | null
          assignee: string | null
          code: string
          github_pr_number: number | null
          github_pr_url: string | null
          id: string
          opened_at: string
          org_id: string
          root_cause: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          affected_endpoints?: number
          affected_services?: number
          api_id?: string | null
          assignee?: string | null
          code: string
          github_pr_number?: number | null
          github_pr_url?: string | null
          id?: string
          opened_at?: string
          org_id: string
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          affected_endpoints?: number
          affected_services?: number
          api_id?: string | null
          assignee?: string | null
          code?: string
          github_pr_number?: number | null
          github_pr_url?: string | null
          id?: string
          opened_at?: string
          org_id?: string
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      api_kind: "internal" | "third-party"
      api_status: "stable" | "drifting" | "breaking" | "analyzing"
      change_kind: "added" | "removed" | "modified"
      change_severity: "breaking" | "risky" | "safe"
      incident_severity: "critical" | "high" | "medium" | "low"
      incident_status:
        | "detected"
        | "analyzing"
        | "identified"
        | "mitigating"
        | "resolved"
      org_role: "owner" | "admin" | "member"
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
      api_kind: ["internal", "third-party"],
      api_status: ["stable", "drifting", "breaking", "analyzing"],
      change_kind: ["added", "removed", "modified"],
      change_severity: ["breaking", "risky", "safe"],
      incident_severity: ["critical", "high", "medium", "low"],
      incident_status: [
        "detected",
        "analyzing",
        "identified",
        "mitigating",
        "resolved",
      ],
      org_role: ["owner", "admin", "member"],
    },
  },
} as const
