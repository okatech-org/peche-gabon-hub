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
      armements: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          responsable: string | null
          statut: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          responsable?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          responsable?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cooperatives: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          responsable: string | null
          site_id: string | null
          statut: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          responsable?: string | null
          site_id?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          responsable?: string | null
          site_id?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperatives_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      engins: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      especes: {
        Row: {
          categorie: Database["public"]["Enums"]["espece_categorie"]
          code: string | null
          created_at: string
          description: string | null
          id: string
          nom: string
          nom_scientifique: string | null
          updated_at: string
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["espece_categorie"]
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          nom_scientifique?: string | null
          updated_at?: string
        }
        Update: {
          categorie?: Database["public"]["Enums"]["espece_categorie"]
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          nom_scientifique?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      navires: {
        Row: {
          annee_construction: number | null
          armement_id: string
          capitaine: string | null
          created_at: string
          id: string
          jauge_brute: number | null
          largeur_m: number | null
          longueur_m: number | null
          matricule: string
          nom: string
          pavillon: string | null
          port_attache: string | null
          puissance_moteur_kw: number | null
          statut: string | null
          type_navire: string | null
          updated_at: string
        }
        Insert: {
          annee_construction?: number | null
          armement_id: string
          capitaine?: string | null
          created_at?: string
          id?: string
          jauge_brute?: number | null
          largeur_m?: number | null
          longueur_m?: number | null
          matricule: string
          nom: string
          pavillon?: string | null
          port_attache?: string | null
          puissance_moteur_kw?: number | null
          statut?: string | null
          type_navire?: string | null
          updated_at?: string
        }
        Update: {
          annee_construction?: number | null
          armement_id?: string
          capitaine?: string | null
          created_at?: string
          id?: string
          jauge_brute?: number | null
          largeur_m?: number | null
          longueur_m?: number | null
          matricule?: string
          nom?: string
          pavillon?: string | null
          port_attache?: string | null
          puissance_moteur_kw?: number | null
          statut?: string | null
          type_navire?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navires_armement_id_fkey"
            columns: ["armement_id"]
            isOneToOne: false
            referencedRelation: "armements"
            referencedColumns: ["id"]
          },
        ]
      }
      pirogues: {
        Row: {
          annee_construction: number | null
          cooperative_id: string | null
          created_at: string
          id: string
          immatriculation: string
          largeur_m: number | null
          longueur_m: number | null
          materiau: string | null
          moteur_marque: string | null
          nb_pecheurs: number | null
          nom: string
          proprietaire_id: string
          puissance_cv: number | null
          site_attache_id: string | null
          statut: string | null
          type: Database["public"]["Enums"]["pirogue_type"]
          updated_at: string
        }
        Insert: {
          annee_construction?: number | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          immatriculation: string
          largeur_m?: number | null
          longueur_m?: number | null
          materiau?: string | null
          moteur_marque?: string | null
          nb_pecheurs?: number | null
          nom: string
          proprietaire_id: string
          puissance_cv?: number | null
          site_attache_id?: string | null
          statut?: string | null
          type?: Database["public"]["Enums"]["pirogue_type"]
          updated_at?: string
        }
        Update: {
          annee_construction?: number | null
          cooperative_id?: string | null
          created_at?: string
          id?: string
          immatriculation?: string
          largeur_m?: number | null
          longueur_m?: number | null
          materiau?: string | null
          moteur_marque?: string | null
          nb_pecheurs?: number | null
          nom?: string
          proprietaire_id?: string
          puissance_cv?: number | null
          site_attache_id?: string | null
          statut?: string | null
          type?: Database["public"]["Enums"]["pirogue_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pirogues_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pirogues_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pirogues_site_attache_id_fkey"
            columns: ["site_attache_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cooperative_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          cooperative_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          cooperative_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proprietaires: {
        Row: {
          created_at: string
          date_naissance: string | null
          domicile: string | null
          email: string | null
          id: string
          nationalite: string | null
          nom: string
          piece_id: string | null
          prenom: string
          statut: string | null
          telephone: string | null
          type_carte: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_naissance?: string | null
          domicile?: string | null
          email?: string | null
          id?: string
          nationalite?: string | null
          nom: string
          piece_id?: string | null
          prenom: string
          statut?: string | null
          telephone?: string | null
          type_carte?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_naissance?: string | null
          domicile?: string | null
          email?: string | null
          id?: string
          nationalite?: string | null
          nom?: string
          piece_id?: string | null
          prenom?: string
          statut?: string | null
          telephone?: string | null
          type_carte?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nom: string
          province: string | null
          strate_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom: string
          province?: string | null
          strate_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom?: string
          province?: string | null
          strate_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_strate_id_fkey"
            columns: ["strate_id"]
            isOneToOne: false
            referencedRelation: "strates"
            referencedColumns: ["id"]
          },
        ]
      }
      strates: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
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
      assign_demo_role: {
        Args: {
          user_email: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_action: {
        Args: {
          _action: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "pecheur"
        | "agent_collecte"
        | "gestionnaire_coop"
        | "inspecteur"
        | "direction_provinciale"
        | "direction_centrale"
        | "admin"
        | "armateur_pi"
        | "observateur_pi"
        | "analyste"
        | "ministre"
      espece_categorie: "pelagique" | "demersal" | "crustace" | "autre"
      pirogue_type:
        | "artisanale_motorisee"
        | "artisanale_non_motorisee"
        | "semi_industrielle"
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
      app_role: [
        "pecheur",
        "agent_collecte",
        "gestionnaire_coop",
        "inspecteur",
        "direction_provinciale",
        "direction_centrale",
        "admin",
        "armateur_pi",
        "observateur_pi",
        "analyste",
        "ministre",
      ],
      espece_categorie: ["pelagique", "demersal", "crustace", "autre"],
      pirogue_type: [
        "artisanale_motorisee",
        "artisanale_non_motorisee",
        "semi_industrielle",
      ],
    },
  },
} as const
