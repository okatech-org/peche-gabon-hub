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
      actions_correctives: {
        Row: {
          action_description: string
          alerte_id: string
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_fin_prevue: string | null
          date_fin_reelle: string | null
          efficacite: number | null
          id: string
          notes: string | null
          responsable: string | null
          resultats: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          action_description: string
          alerte_id: string
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin_prevue?: string | null
          date_fin_reelle?: string | null
          efficacite?: number | null
          id?: string
          notes?: string | null
          responsable?: string | null
          resultats?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          action_description?: string
          alerte_id?: string
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_fin_prevue?: string | null
          date_fin_reelle?: string | null
          efficacite?: number | null
          id?: string
          notes?: string | null
          responsable?: string | null
          resultats?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_correctives_alerte_id_fkey"
            columns: ["alerte_id"]
            isOneToOne: false
            referencedRelation: "alertes_rapports"
            referencedColumns: ["id"]
          },
        ]
      }
      alerte_historique: {
        Row: {
          created_at: string
          destinataires: string[]
          erreur_details: string | null
          id: string
          message: string
          seuil_declenche: number
          seuil_id: string | null
          statut: string
          type_indicateur: string
          valeur_actuelle: number
        }
        Insert: {
          created_at?: string
          destinataires: string[]
          erreur_details?: string | null
          id?: string
          message: string
          seuil_declenche: number
          seuil_id?: string | null
          statut?: string
          type_indicateur: string
          valeur_actuelle: number
        }
        Update: {
          created_at?: string
          destinataires?: string[]
          erreur_details?: string | null
          id?: string
          message?: string
          seuil_declenche?: number
          seuil_id?: string | null
          statut?: string
          type_indicateur?: string
          valeur_actuelle?: number
        }
        Relationships: [
          {
            foreignKeyName: "alerte_historique_seuil_id_fkey"
            columns: ["seuil_id"]
            isOneToOne: false
            referencedRelation: "alerte_seuils"
            referencedColumns: ["id"]
          },
        ]
      }
      alerte_seuils: {
        Row: {
          actif: boolean
          created_at: string
          description: string | null
          destinataires: string[]
          id: string
          nom: string
          seuil_valeur: number
          type_indicateur: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description?: string | null
          destinataires?: string[]
          id?: string
          nom: string
          seuil_valeur: number
          type_indicateur: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description?: string | null
          destinataires?: string[]
          id?: string
          nom?: string
          seuil_valeur?: number
          type_indicateur?: string
          updated_at?: string
        }
        Relationships: []
      }
      alertes_rapports: {
        Row: {
          created_at: string
          id: string
          indicateur: string
          notes: string | null
          rapport_nouveau_id: string
          rapport_reference_id: string
          recommandations_ia: string | null
          seuil_id: string
          severite: string
          statut: string
          traitee_le: string | null
          traitee_par: string | null
          type_variation: string
          valeur_actuelle: number
          valeur_precedente: number
          variation_pourcentage: number
          vue_le: string | null
          vue_par: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          indicateur: string
          notes?: string | null
          rapport_nouveau_id: string
          rapport_reference_id: string
          recommandations_ia?: string | null
          seuil_id: string
          severite?: string
          statut?: string
          traitee_le?: string | null
          traitee_par?: string | null
          type_variation: string
          valeur_actuelle: number
          valeur_precedente: number
          variation_pourcentage: number
          vue_le?: string | null
          vue_par?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          indicateur?: string
          notes?: string | null
          rapport_nouveau_id?: string
          rapport_reference_id?: string
          recommandations_ia?: string | null
          seuil_id?: string
          severite?: string
          statut?: string
          traitee_le?: string | null
          traitee_par?: string | null
          type_variation?: string
          valeur_actuelle?: number
          valeur_precedente?: number
          variation_pourcentage?: number
          vue_le?: string | null
          vue_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertes_rapports_rapport_nouveau_id_fkey"
            columns: ["rapport_nouveau_id"]
            isOneToOne: false
            referencedRelation: "rapports_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_rapports_rapport_reference_id_fkey"
            columns: ["rapport_reference_id"]
            isOneToOne: false
            referencedRelation: "rapports_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_rapports_seuil_id_fkey"
            columns: ["seuil_id"]
            isOneToOne: false
            referencedRelation: "seuils_alertes_rapports"
            referencedColumns: ["id"]
          },
        ]
      }
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
      audit_ministeriel: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      calendrier_presence: {
        Row: {
          created_at: string
          id: string
          last_seen: string
          metadata: Json | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      captures_detail: {
        Row: {
          created_at: string
          espece_id: string
          id: string
          nb_individus: number | null
          poids_kg: number
          sortie_id: string
        }
        Insert: {
          created_at?: string
          espece_id: string
          id?: string
          nb_individus?: number | null
          poids_kg: number
          sortie_id: string
        }
        Update: {
          created_at?: string
          espece_id?: string
          id?: string
          nb_individus?: number | null
          poids_kg?: number
          sortie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "captures_detail_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_detail_sortie_id_fkey"
            columns: ["sortie_id"]
            isOneToOne: false
            referencedRelation: "sorties_peche"
            referencedColumns: ["id"]
          },
        ]
      }
      captures_pa: {
        Row: {
          annee: number
          cpue: number | null
          created_at: string
          date_capture: string
          declare_par: string | null
          effort_unite: number | null
          engin_id: string
          espece_id: string
          id: string
          mois: number
          nb_individus: number | null
          observations: string | null
          pirogue_id: string
          poids_kg: number
          site_id: string
          updated_at: string
          valide: boolean | null
          valide_le: string | null
          valide_par: string | null
          zone_peche: string | null
        }
        Insert: {
          annee: number
          cpue?: number | null
          created_at?: string
          date_capture: string
          declare_par?: string | null
          effort_unite?: number | null
          engin_id: string
          espece_id: string
          id?: string
          mois: number
          nb_individus?: number | null
          observations?: string | null
          pirogue_id: string
          poids_kg: number
          site_id: string
          updated_at?: string
          valide?: boolean | null
          valide_le?: string | null
          valide_par?: string | null
          zone_peche?: string | null
        }
        Update: {
          annee?: number
          cpue?: number | null
          created_at?: string
          date_capture?: string
          declare_par?: string | null
          effort_unite?: number | null
          engin_id?: string
          espece_id?: string
          id?: string
          mois?: number
          nb_individus?: number | null
          observations?: string | null
          pirogue_id?: string
          poids_kg?: number
          site_id?: string
          updated_at?: string
          valide?: boolean | null
          valide_le?: string | null
          valide_par?: string | null
          zone_peche?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captures_pa_engin_id_fkey"
            columns: ["engin_id"]
            isOneToOne: false
            referencedRelation: "engins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_pa_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_pa_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_pa_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_rapports: {
        Row: {
          couleur: string
          created_at: string
          description: string | null
          icone: string | null
          id: string
          nom: string
        }
        Insert: {
          couleur?: string
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom: string
        }
        Update: {
          couleur?: string
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      commentaires_actions: {
        Row: {
          action_id: string
          commentaire: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          commentaire: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          commentaire?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commentaires_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions_correctives"
            referencedColumns: ["id"]
          },
        ]
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
      facteurs_externes: {
        Row: {
          actif: boolean
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          description: string | null
          id: string
          impact_prevu: number
          impact_reel: number | null
          importance: string
          nom: string
          type_facteur: string
          unite: string | null
          updated_at: string
          valeur_numerique: number | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          description?: string | null
          id?: string
          impact_prevu: number
          impact_reel?: number | null
          importance?: string
          nom: string
          type_facteur: string
          unite?: string | null
          updated_at?: string
          valeur_numerique?: number | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          description?: string | null
          id?: string
          impact_prevu?: number
          impact_reel?: number | null
          importance?: string
          nom?: string
          type_facteur?: string
          unite?: string | null
          updated_at?: string
          valeur_numerique?: number | null
        }
        Relationships: []
      }
      formateurs: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          nb_formations_donnees: number | null
          nom: string
          note_moyenne: number | null
          prenom: string
          specialites: string[]
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nb_formations_donnees?: number | null
          nom: string
          note_moyenne?: number | null
          prenom: string
          specialites?: string[]
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nb_formations_donnees?: number | null
          nom?: string
          note_moyenne?: number | null
          prenom?: string
          specialites?: string[]
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      formateurs_disponibilites: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          disponible: boolean
          formateur_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          disponible?: boolean
          formateur_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          disponible?: boolean
          formateur_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formateurs_disponibilites_formateur_id_fkey"
            columns: ["formateur_id"]
            isOneToOne: false
            referencedRelation: "formateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      formateurs_evaluations: {
        Row: {
          commentaires: string | null
          created_at: string
          date_evaluation: string
          evaluateur_id: string | null
          formateur_id: string
          formation_id: string
          id: string
          note_communication: number
          note_expertise: number
          note_globale: number | null
          note_organisation: number
          note_pedagogie: number
          points_amelioration: string | null
          points_forts: string | null
          updated_at: string
        }
        Insert: {
          commentaires?: string | null
          created_at?: string
          date_evaluation?: string
          evaluateur_id?: string | null
          formateur_id: string
          formation_id: string
          id?: string
          note_communication: number
          note_expertise: number
          note_globale?: number | null
          note_organisation: number
          note_pedagogie: number
          points_amelioration?: string | null
          points_forts?: string | null
          updated_at?: string
        }
        Update: {
          commentaires?: string | null
          created_at?: string
          date_evaluation?: string
          evaluateur_id?: string | null
          formateur_id?: string
          formation_id?: string
          id?: string
          note_communication?: number
          note_expertise?: number
          note_globale?: number | null
          note_organisation?: number
          note_pedagogie?: number
          points_amelioration?: string | null
          points_forts?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formateurs_evaluations_formateur_id_fkey"
            columns: ["formateur_id"]
            isOneToOne: false
            referencedRelation: "formateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formateurs_evaluations_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations_planifiees"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_evaluations: {
        Row: {
          amelioration_pct: number | null
          created_at: string
          date_evaluation: string
          efficacite_apres: number
          efficacite_avant: number
          evaluateur_id: string | null
          formation_id: string
          id: string
          indicateurs_impactes: string[]
          nb_actions_analysees: number
          notes: string | null
          periode_apres_debut: string
          periode_apres_fin: string
          periode_avant_debut: string
          periode_avant_fin: string
          recommandations: string | null
          updated_at: string
        }
        Insert: {
          amelioration_pct?: number | null
          created_at?: string
          date_evaluation: string
          efficacite_apres: number
          efficacite_avant: number
          evaluateur_id?: string | null
          formation_id: string
          id?: string
          indicateurs_impactes?: string[]
          nb_actions_analysees?: number
          notes?: string | null
          periode_apres_debut: string
          periode_apres_fin: string
          periode_avant_debut: string
          periode_avant_fin: string
          recommandations?: string | null
          updated_at?: string
        }
        Update: {
          amelioration_pct?: number | null
          created_at?: string
          date_evaluation?: string
          efficacite_apres?: number
          efficacite_avant?: number
          evaluateur_id?: string | null
          formation_id?: string
          id?: string
          indicateurs_impactes?: string[]
          nb_actions_analysees?: number
          notes?: string | null
          periode_apres_debut?: string
          periode_apres_fin?: string
          periode_avant_debut?: string
          periode_avant_fin?: string
          recommandations?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_evaluations_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations_planifiees"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_participants: {
        Row: {
          commentaires: string | null
          competences_acquises: string[] | null
          created_at: string
          date_completion: string | null
          date_inscription: string
          formation_id: string
          id: string
          note_satisfaction: number | null
          statut_participation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commentaires?: string | null
          competences_acquises?: string[] | null
          created_at?: string
          date_completion?: string | null
          date_inscription?: string
          formation_id: string
          id?: string
          note_satisfaction?: number | null
          statut_participation?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commentaires?: string | null
          competences_acquises?: string[] | null
          created_at?: string
          date_completion?: string | null
          date_inscription?: string
          formation_id?: string
          id?: string
          note_satisfaction?: number | null
          statut_participation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_participants_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations_planifiees"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_planifiees: {
        Row: {
          budget_prevu: number | null
          budget_reel: number | null
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          description: string | null
          formateur: string | null
          formateur_id: string | null
          id: string
          indicateurs_cibles: string[]
          lieu: string | null
          nb_participants_inscrits: number | null
          nb_participants_max: number | null
          objectifs: string[]
          participants_cibles: string[]
          priorite: string
          statut: string
          titre: string
          type_formation: string
          updated_at: string
        }
        Insert: {
          budget_prevu?: number | null
          budget_reel?: number | null
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          description?: string | null
          formateur?: string | null
          formateur_id?: string | null
          id?: string
          indicateurs_cibles?: string[]
          lieu?: string | null
          nb_participants_inscrits?: number | null
          nb_participants_max?: number | null
          objectifs?: string[]
          participants_cibles?: string[]
          priorite?: string
          statut?: string
          titre: string
          type_formation: string
          updated_at?: string
        }
        Update: {
          budget_prevu?: number | null
          budget_reel?: number | null
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          description?: string | null
          formateur?: string | null
          formateur_id?: string | null
          id?: string
          indicateurs_cibles?: string[]
          lieu?: string | null
          nb_participants_inscrits?: number | null
          nb_participants_max?: number | null
          objectifs?: string[]
          participants_cibles?: string[]
          priorite?: string
          statut?: string
          titre?: string
          type_formation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_planifiees_formateur_id_fkey"
            columns: ["formateur_id"]
            isOneToOne: false
            referencedRelation: "formateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_validation: {
        Row: {
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          description: string | null
          formateur_id: string | null
          formateur_nom: string
          id: string
          indicateurs_cibles: string[]
          metadata: Json | null
          nb_participants_max: number | null
          notes_revision: string | null
          objectifs: string[]
          participants_cibles: string[]
          priorite: string
          raison_prediction: string
          reviewed_at: string | null
          reviewed_by: string | null
          score_adequation_formateur: number
          score_confiance_prediction: number
          statut: string
          titre: string
          type_formation: string
          updated_at: string
          urgence: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          description?: string | null
          formateur_id?: string | null
          formateur_nom: string
          id?: string
          indicateurs_cibles?: string[]
          metadata?: Json | null
          nb_participants_max?: number | null
          notes_revision?: string | null
          objectifs?: string[]
          participants_cibles?: string[]
          priorite?: string
          raison_prediction: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score_adequation_formateur: number
          score_confiance_prediction: number
          statut?: string
          titre: string
          type_formation: string
          updated_at?: string
          urgence?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          description?: string | null
          formateur_id?: string | null
          formateur_nom?: string
          id?: string
          indicateurs_cibles?: string[]
          metadata?: Json | null
          nb_participants_max?: number | null
          notes_revision?: string | null
          objectifs?: string[]
          participants_cibles?: string[]
          priorite?: string
          raison_prediction?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score_adequation_formateur?: number
          score_confiance_prediction?: number
          statut?: string
          titre?: string
          type_formation?: string
          updated_at?: string
          urgence?: number
        }
        Relationships: [
          {
            foreignKeyName: "formations_validation_formateur_id_fkey"
            columns: ["formateur_id"]
            isOneToOne: false
            referencedRelation: "formateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      licences: {
        Row: {
          annee: number
          created_at: string
          date_debut: string
          date_fin: string
          engins_autorises: string[]
          especes_cibles: string[]
          id: string
          montant_total: number
          numero: string
          observations: string | null
          pirogue_id: string
          statut: string
          updated_at: string
          valide_le: string | null
          valide_par: string | null
        }
        Insert: {
          annee: number
          created_at?: string
          date_debut: string
          date_fin: string
          engins_autorises?: string[]
          especes_cibles?: string[]
          id?: string
          montant_total: number
          numero: string
          observations?: string | null
          pirogue_id: string
          statut?: string
          updated_at?: string
          valide_le?: string | null
          valide_par?: string | null
        }
        Update: {
          annee?: number
          created_at?: string
          date_debut?: string
          date_fin?: string
          engins_autorises?: string[]
          especes_cibles?: string[]
          id?: string
          montant_total?: number
          numero?: string
          observations?: string | null
          pirogue_id?: string
          statut?: string
          updated_at?: string
          valide_le?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licences_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licences_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      model_performance: {
        Row: {
          bias: number
          created_at: string
          evaluation_date: string
          id: string
          mape: number
          nb_predictions: number
          notes: string | null
          periode_analyse: number
          periode_test_debut: string
          periode_test_fin: string
          precision: number
          updated_at: string
        }
        Insert: {
          bias: number
          created_at?: string
          evaluation_date: string
          id?: string
          mape: number
          nb_predictions: number
          notes?: string | null
          periode_analyse: number
          periode_test_debut: string
          periode_test_fin: string
          precision: number
          updated_at?: string
        }
        Update: {
          bias?: number
          created_at?: string
          evaluation_date?: string
          id?: string
          mape?: number
          nb_predictions?: number
          notes?: string | null
          periode_analyse?: number
          periode_test_debut?: string
          periode_test_fin?: string
          precision?: number
          updated_at?: string
        }
        Relationships: []
      }
      modeles_saisonniers: {
        Row: {
          coefficient_saisonnier: number
          created_at: string
          fiabilite: number
          id: string
          mois: number
          nb_annees_analyse: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          coefficient_saisonnier?: number
          created_at?: string
          fiabilite?: number
          id?: string
          mois: number
          nb_annees_analyse?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          coefficient_saisonnier?: number
          created_at?: string
          fiabilite?: number
          id?: string
          mois?: number
          nb_annees_analyse?: number
          notes?: string | null
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
      notifications_nationales: {
        Row: {
          audience: string[]
          created_at: string
          created_by: string | null
          document_url: string | null
          id: string
          message: string
          priorite: string
          titre: string
          url_ressource: string | null
        }
        Insert: {
          audience?: string[]
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          id?: string
          message: string
          priorite?: string
          titre: string
          url_ressource?: string | null
        }
        Update: {
          audience?: string[]
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          id?: string
          message?: string
          priorite?: string
          titre?: string
          url_ressource?: string | null
        }
        Relationships: []
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
      previsions_history: {
        Row: {
          annee_prevu: number
          created_at: string
          created_by: string | null
          ecart_type: number
          id: string
          intervalle_confiance: number
          mois_prevu: number
          montant_prevu: number
          moyenne_taux: number
          periode_analyse: number
          recouvrement_prevu: number
          taux_prevu: number
          tendance: string
          updated_at: string
          version_date: string
          volatilite: string
        }
        Insert: {
          annee_prevu: number
          created_at?: string
          created_by?: string | null
          ecart_type: number
          id?: string
          intervalle_confiance: number
          mois_prevu: number
          montant_prevu: number
          moyenne_taux: number
          periode_analyse: number
          recouvrement_prevu: number
          taux_prevu: number
          tendance: string
          updated_at?: string
          version_date: string
          volatilite: string
        }
        Update: {
          annee_prevu?: number
          created_at?: string
          created_by?: string | null
          ecart_type?: number
          id?: string
          intervalle_confiance?: number
          mois_prevu?: number
          montant_prevu?: number
          moyenne_taux?: number
          periode_analyse?: number
          recouvrement_prevu?: number
          taux_prevu?: number
          tendance?: string
          updated_at?: string
          version_date?: string
          volatilite?: string
        }
        Relationships: []
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
          sexe: string | null
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
          sexe?: string | null
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
          sexe?: string | null
          statut?: string | null
          telephone?: string | null
          type_carte?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quittances: {
        Row: {
          annee: number
          created_at: string
          date_echeance: string
          date_paiement: string | null
          id: string
          licence_id: string
          mois: number
          montant: number
          numero_recu: string | null
          observations: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          date_echeance: string
          date_paiement?: string | null
          id?: string
          licence_id: string
          mois: number
          montant: number
          numero_recu?: string | null
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          date_echeance?: string
          date_paiement?: string | null
          id?: string
          licence_id?: string
          mois?: number
          montant?: number
          numero_recu?: string | null
          observations?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quittances_licence_id_fkey"
            columns: ["licence_id"]
            isOneToOne: false
            referencedRelation: "licences"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports_zones: {
        Row: {
          categorie_id: string | null
          created_at: string
          created_by: string
          fichier_path: string
          id: string
          metadata: Json | null
          periode_debut: string | null
          periode_fin: string | null
          recommandations_ia: string | null
          region: string | null
          statistiques: Json
          tags: string[]
          titre: string
          zone_geojson: Json
        }
        Insert: {
          categorie_id?: string | null
          created_at?: string
          created_by: string
          fichier_path: string
          id?: string
          metadata?: Json | null
          periode_debut?: string | null
          periode_fin?: string | null
          recommandations_ia?: string | null
          region?: string | null
          statistiques: Json
          tags?: string[]
          titre: string
          zone_geojson: Json
        }
        Update: {
          categorie_id?: string | null
          created_at?: string
          created_by?: string
          fichier_path?: string
          id?: string
          metadata?: Json | null
          periode_debut?: string | null
          periode_fin?: string | null
          recommandations_ia?: string | null
          region?: string | null
          statistiques?: Json
          tags?: string[]
          titre?: string
          zone_geojson?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rapports_zones_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_rapports"
            referencedColumns: ["id"]
          },
        ]
      }
      recommandations_formateurs: {
        Row: {
          adequation_experience: number
          adequation_performance: number
          adequation_specialites: number
          choisi: boolean | null
          choisi_par: string | null
          created_at: string
          date_choix: string | null
          formateur_id: string
          id: string
          justification: string
          points_attention: string[] | null
          points_forts: string[]
          raison_non_choix: string | null
          rang: number
          recommandation_id: string
          score: number
        }
        Insert: {
          adequation_experience: number
          adequation_performance: number
          adequation_specialites: number
          choisi?: boolean | null
          choisi_par?: string | null
          created_at?: string
          date_choix?: string | null
          formateur_id: string
          id?: string
          justification: string
          points_attention?: string[] | null
          points_forts?: string[]
          raison_non_choix?: string | null
          rang: number
          recommandation_id: string
          score: number
        }
        Update: {
          adequation_experience?: number
          adequation_performance?: number
          adequation_specialites?: number
          choisi?: boolean | null
          choisi_par?: string | null
          created_at?: string
          date_choix?: string | null
          formateur_id?: string
          id?: string
          justification?: string
          points_attention?: string[] | null
          points_forts?: string[]
          raison_non_choix?: string | null
          rang?: number
          recommandation_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "recommandations_formateurs_formateur_id_fkey"
            columns: ["formateur_id"]
            isOneToOne: false
            referencedRelation: "formateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommandations_formateurs_recommandation_id_fkey"
            columns: ["recommandation_id"]
            isOneToOne: false
            referencedRelation: "recommandations_historique"
            referencedColumns: ["id"]
          },
        ]
      }
      recommandations_historique: {
        Row: {
          analyse_globale: string | null
          created_at: string
          date_debut: string
          date_fin: string
          demandeur_id: string
          id: string
          lieu: string | null
          nombre_participants: number | null
          specialites_requises: string[]
          total_formateurs_analyses: number
          type_formation: string
        }
        Insert: {
          analyse_globale?: string | null
          created_at?: string
          date_debut: string
          date_fin: string
          demandeur_id: string
          id?: string
          lieu?: string | null
          nombre_participants?: number | null
          specialites_requises: string[]
          total_formateurs_analyses?: number
          type_formation: string
        }
        Update: {
          analyse_globale?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string
          demandeur_id?: string
          id?: string
          lieu?: string | null
          nombre_participants?: number | null
          specialites_requises?: string[]
          total_formateurs_analyses?: number
          type_formation?: string
        }
        Relationships: []
      }
      recommandations_metriques: {
        Row: {
          created_at: string
          formateurs_plus_choisis: Json | null
          formateurs_plus_recommandes: Json | null
          id: string
          periode_debut: string
          periode_fin: string
          rang_moyen_choisi: number | null
          recommandations_suivies: number
          score_moyen_choisis: number | null
          score_moyen_non_choisis: number | null
          specialites_plus_demandees: string[] | null
          taux_precision: number | null
          total_recommandations: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          formateurs_plus_choisis?: Json | null
          formateurs_plus_recommandes?: Json | null
          id?: string
          periode_debut: string
          periode_fin: string
          rang_moyen_choisi?: number | null
          recommandations_suivies?: number
          score_moyen_choisis?: number | null
          score_moyen_non_choisis?: number | null
          specialites_plus_demandees?: string[] | null
          taux_precision?: number | null
          total_recommandations?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          formateurs_plus_choisis?: Json | null
          formateurs_plus_recommandes?: Json | null
          id?: string
          periode_debut?: string
          periode_fin?: string
          rang_moyen_choisi?: number | null
          recommandations_suivies?: number
          score_moyen_choisis?: number | null
          score_moyen_non_choisis?: number | null
          specialites_plus_demandees?: string[] | null
          taux_precision?: number | null
          total_recommandations?: number
          updated_at?: string
        }
        Relationships: []
      }
      reglementations: {
        Row: {
          created_at: string
          created_by: string | null
          date_effet: string
          destination: string[]
          fichier_url: string | null
          id: string
          texte: string
          titre: string
          type_document: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_effet: string
          destination?: string[]
          fichier_url?: string | null
          id?: string
          texte: string
          titre: string
          type_document: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_effet?: string
          destination?: string[]
          fichier_url?: string | null
          id?: string
          texte?: string
          titre?: string
          type_document?: string
          updated_at?: string
        }
        Relationships: []
      }
      seuils_alertes_rapports: {
        Row: {
          actif: boolean
          categorie_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          indicateur: string
          nom: string
          region: string | null
          seuil_pourcentage: number
          type_variation: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          indicateur: string
          nom: string
          region?: string | null
          seuil_pourcentage?: number
          type_variation: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          indicateur?: string
          nom?: string
          region?: string | null
          seuil_pourcentage?: number
          type_variation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seuils_alertes_rapports_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_rapports"
            referencedColumns: ["id"]
          },
        ]
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
      sorties_peche: {
        Row: {
          annee: number
          capitaine: string | null
          capture_totale_kg: number | null
          cooperative_id: string | null
          cpue: number | null
          created_at: string
          crustaces_kg: number | null
          date_depart: string
          date_retour: string | null
          declare_par: string | null
          demersaux_kg: number | null
          effort_heures: number | null
          engin_id: string | null
          id: string
          mois: number
          nb_pecheurs: number | null
          observations: string | null
          pelagiques_kg: number | null
          pirogue_id: string
          site_id: string
          strate_id: string | null
          updated_at: string
          valide: boolean | null
          zone_peche: string | null
        }
        Insert: {
          annee: number
          capitaine?: string | null
          capture_totale_kg?: number | null
          cooperative_id?: string | null
          cpue?: number | null
          created_at?: string
          crustaces_kg?: number | null
          date_depart: string
          date_retour?: string | null
          declare_par?: string | null
          demersaux_kg?: number | null
          effort_heures?: number | null
          engin_id?: string | null
          id?: string
          mois: number
          nb_pecheurs?: number | null
          observations?: string | null
          pelagiques_kg?: number | null
          pirogue_id: string
          site_id: string
          strate_id?: string | null
          updated_at?: string
          valide?: boolean | null
          zone_peche?: string | null
        }
        Update: {
          annee?: number
          capitaine?: string | null
          capture_totale_kg?: number | null
          cooperative_id?: string | null
          cpue?: number | null
          created_at?: string
          crustaces_kg?: number | null
          date_depart?: string
          date_retour?: string | null
          declare_par?: string | null
          demersaux_kg?: number | null
          effort_heures?: number | null
          engin_id?: string | null
          id?: string
          mois?: number
          nb_pecheurs?: number | null
          observations?: string | null
          pelagiques_kg?: number | null
          pirogue_id?: string
          site_id?: string
          strate_id?: string | null
          updated_at?: string
          valide?: boolean | null
          zone_peche?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sorties_peche_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorties_peche_engin_id_fkey"
            columns: ["engin_id"]
            isOneToOne: false
            referencedRelation: "engins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorties_peche_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorties_peche_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorties_peche_strate_id_fkey"
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
      zones_restreintes: {
        Row: {
          actif: boolean
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string | null
          especes_concernees: string[]
          geometrie: Json
          id: string
          nom: string
          raison: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin?: string | null
          especes_concernees?: string[]
          geometrie: Json
          id?: string
          nom: string
          raison: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string | null
          especes_concernees?: string[]
          geometrie?: Json
          id?: string
          nom?: string
          raison?: string
          updated_at?: string
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
      calculer_metriques_precision: {
        Args: { p_date_debut: string; p_date_fin: string }
        Returns: Json
      }
      est_dans_fenetre_paiement: {
        Args: { p_date_echeance: string }
        Returns: boolean
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
      log_action_ministerielle: {
        Args: { _action_type: string; _description: string; _metadata?: Json }
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
