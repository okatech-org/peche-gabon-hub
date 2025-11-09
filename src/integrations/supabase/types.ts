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
      actions_remontees: {
        Row: {
          action_type: string
          budget_alloue: number | null
          created_at: string
          date_debut: string | null
          date_fin_prevue: string | null
          date_fin_reelle: string | null
          description: string
          id: string
          institution_responsable: string | null
          remontee_id: string
          responsable: string | null
          resultats: string | null
          statut: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          budget_alloue?: number | null
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          date_fin_reelle?: string | null
          description: string
          id?: string
          institution_responsable?: string | null
          remontee_id: string
          responsable?: string | null
          resultats?: string | null
          statut?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          budget_alloue?: number | null
          created_at?: string
          date_debut?: string | null
          date_fin_prevue?: string | null
          date_fin_reelle?: string | null
          description?: string
          id?: string
          institution_responsable?: string | null
          remontee_id?: string
          responsable?: string | null
          resultats?: string | null
          statut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_remontees_remontee_id_fkey"
            columns: ["remontee_id"]
            isOneToOne: false
            referencedRelation: "remontees_terrain"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      bareme_taxes: {
        Row: {
          actif: boolean
          created_at: string
          date_debut: string
          date_fin: string | null
          description: string | null
          espece_id: string | null
          id: string
          montant_fixe_kg: number | null
          nom: string
          seuil_max_kg: number | null
          seuil_min_kg: number | null
          taux_pourcentage: number | null
          type_taxe: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          date_debut: string
          date_fin?: string | null
          description?: string | null
          espece_id?: string | null
          id?: string
          montant_fixe_kg?: number | null
          nom: string
          seuil_max_kg?: number | null
          seuil_min_kg?: number | null
          taux_pourcentage?: number | null
          type_taxe: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          espece_id?: string | null
          id?: string
          montant_fixe_kg?: number | null
          nom?: string
          seuil_max_kg?: number | null
          seuil_min_kg?: number | null
          taux_pourcentage?: number | null
          type_taxe?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bareme_taxes_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
            referencedColumns: ["id"]
          },
        ]
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
      captures_artisanales_detail: {
        Row: {
          created_at: string | null
          espece_id: string | null
          id: string
          nb_individus: number | null
          poids_kg: number
          sortie_id: string | null
        }
        Insert: {
          created_at?: string | null
          espece_id?: string | null
          id?: string
          nb_individus?: number | null
          poids_kg: number
          sortie_id?: string | null
        }
        Update: {
          created_at?: string | null
          espece_id?: string | null
          id?: string
          nb_individus?: number | null
          poids_kg?: number
          sortie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captures_artisanales_detail_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_artisanales_detail_sortie_id_fkey"
            columns: ["sortie_id"]
            isOneToOne: false
            referencedRelation: "sorties_artisanales"
            referencedColumns: ["id"]
          },
        ]
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
      captures_industrielles_detail: {
        Row: {
          created_at: string | null
          espece_id: string | null
          id: string
          maree_id: string | null
          poids_kg: number
        }
        Insert: {
          created_at?: string | null
          espece_id?: string | null
          id?: string
          maree_id?: string | null
          poids_kg: number
        }
        Update: {
          created_at?: string | null
          espece_id?: string | null
          id?: string
          maree_id?: string | null
          poids_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "captures_industrielles_detail_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captures_industrielles_detail_maree_id_fkey"
            columns: ["maree_id"]
            isOneToOne: false
            referencedRelation: "marees_industrielles"
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
      controles_surveillance: {
        Row: {
          categorie_infraction: string | null
          created_at: string | null
          date_controle: string
          engin_declare: string | null
          engins_trouves: string | null
          id: string
          infraction: boolean | null
          mission_id: string | null
          nationalite_proprietaire: string | null
          navire_id: string | null
          nb_pecheurs_bord: number | null
          observations: string | null
          pirogue_id: string | null
          proprietaire: string | null
          saisies: string | null
          sanctions: string | null
          type_infraction: string | null
        }
        Insert: {
          categorie_infraction?: string | null
          created_at?: string | null
          date_controle: string
          engin_declare?: string | null
          engins_trouves?: string | null
          id?: string
          infraction?: boolean | null
          mission_id?: string | null
          nationalite_proprietaire?: string | null
          navire_id?: string | null
          nb_pecheurs_bord?: number | null
          observations?: string | null
          pirogue_id?: string | null
          proprietaire?: string | null
          saisies?: string | null
          sanctions?: string | null
          type_infraction?: string | null
        }
        Update: {
          categorie_infraction?: string | null
          created_at?: string | null
          date_controle?: string
          engin_declare?: string | null
          engins_trouves?: string | null
          id?: string
          infraction?: boolean | null
          mission_id?: string | null
          nationalite_proprietaire?: string | null
          navire_id?: string | null
          nb_pecheurs_bord?: number | null
          observations?: string | null
          pirogue_id?: string | null
          proprietaire?: string | null
          saisies?: string | null
          sanctions?: string | null
          type_infraction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "controles_surveillance_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions_surveillance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_surveillance_navire_id_fkey"
            columns: ["navire_id"]
            isOneToOne: false
            referencedRelation: "navires_industriels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_surveillance_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      documents_ministeriels: {
        Row: {
          contenu_genere: string
          created_at: string
          created_by: string
          date_publication: string | null
          destinataires: string[] | null
          id: string
          metadata: Json
          notes: string | null
          numero_reference: string
          objet: string
          signataires: Json
          statut: string
          titre: string
          type_document: string
          updated_at: string
        }
        Insert: {
          contenu_genere: string
          created_at?: string
          created_by: string
          date_publication?: string | null
          destinataires?: string[] | null
          id?: string
          metadata?: Json
          notes?: string | null
          numero_reference: string
          objet: string
          signataires?: Json
          statut?: string
          titre: string
          type_document: string
          updated_at?: string
        }
        Update: {
          contenu_genere?: string
          created_at?: string
          created_by?: string
          date_publication?: string | null
          destinataires?: string[] | null
          id?: string
          metadata?: Json
          notes?: string | null
          numero_reference?: string
          objet?: string
          signataires?: Json
          statut?: string
          titre?: string
          type_document?: string
          updated_at?: string
        }
        Relationships: []
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
      exports_historique: {
        Row: {
          erreur_message: string | null
          genere_at: string | null
          genere_par: string | null
          id: string
          nom_fichier: string
          nombre_lignes: number | null
          planification_id: string | null
          statut: string
          taille_kb: number | null
          type_export: string
        }
        Insert: {
          erreur_message?: string | null
          genere_at?: string | null
          genere_par?: string | null
          id?: string
          nom_fichier: string
          nombre_lignes?: number | null
          planification_id?: string | null
          statut: string
          taille_kb?: number | null
          type_export: string
        }
        Update: {
          erreur_message?: string | null
          genere_at?: string | null
          genere_par?: string | null
          id?: string
          nom_fichier?: string
          nombre_lignes?: number | null
          planification_id?: string | null
          statut?: string
          taille_kb?: number | null
          type_export?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_historique_planification_id_fkey"
            columns: ["planification_id"]
            isOneToOne: false
            referencedRelation: "exports_planifies"
            referencedColumns: ["id"]
          },
        ]
      }
      exports_planifies: {
        Row: {
          actif: boolean | null
          created_at: string | null
          created_by: string | null
          dernier_export_at: string | null
          destinataires: Json | null
          frequence: string
          heure_execution: string
          id: string
          jour_mois: number | null
          jour_semaine: number | null
          nom: string
          prochain_export_at: string | null
          sections_incluses: Json | null
          type_export: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          dernier_export_at?: string | null
          destinataires?: Json | null
          frequence: string
          heure_execution?: string
          id?: string
          jour_mois?: number | null
          jour_semaine?: number | null
          nom: string
          prochain_export_at?: string | null
          sections_incluses?: Json | null
          type_export: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          dernier_export_at?: string | null
          destinataires?: Json | null
          frequence?: string
          heure_execution?: string
          id?: string
          jour_mois?: number | null
          jour_semaine?: number | null
          nom?: string
          prochain_export_at?: string | null
          sections_incluses?: Json | null
          type_export?: string
          updated_at?: string | null
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
      marees_industrielles: {
        Row: {
          capture_totale_kg: number | null
          cpue_moyenne: number | null
          created_at: string | null
          date_depart: string
          date_retour: string | null
          duree_mer_jours: number | null
          id: string
          jours_peche: number | null
          navire_id: string | null
          nb_traits_chalut: number | null
          numero_maree: string | null
          observations: string | null
          updated_at: string | null
          zone_peche: string | null
        }
        Insert: {
          capture_totale_kg?: number | null
          cpue_moyenne?: number | null
          created_at?: string | null
          date_depart: string
          date_retour?: string | null
          duree_mer_jours?: number | null
          id?: string
          jours_peche?: number | null
          navire_id?: string | null
          nb_traits_chalut?: number | null
          numero_maree?: string | null
          observations?: string | null
          updated_at?: string | null
          zone_peche?: string | null
        }
        Update: {
          capture_totale_kg?: number | null
          cpue_moyenne?: number | null
          created_at?: string | null
          date_depart?: string
          date_retour?: string | null
          duree_mer_jours?: number | null
          id?: string
          jours_peche?: number | null
          navire_id?: string | null
          nb_traits_chalut?: number | null
          numero_maree?: string | null
          observations?: string | null
          updated_at?: string | null
          zone_peche?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marees_industrielles_navire_id_fkey"
            columns: ["navire_id"]
            isOneToOne: false
            referencedRelation: "navires_industriels"
            referencedColumns: ["id"]
          },
        ]
      }
      missions_surveillance: {
        Row: {
          code_mission: string
          created_at: string | null
          date_debut: string
          date_fin: string | null
          duree_heures: number | null
          id: string
          observations: string | null
          responsable: string | null
          type_mission: string | null
          updated_at: string | null
          zone_surveillee: string | null
        }
        Insert: {
          code_mission: string
          created_at?: string | null
          date_debut: string
          date_fin?: string | null
          duree_heures?: number | null
          id?: string
          observations?: string | null
          responsable?: string | null
          type_mission?: string | null
          updated_at?: string | null
          zone_surveillee?: string | null
        }
        Update: {
          code_mission?: string
          created_at?: string | null
          date_debut?: string
          date_fin?: string | null
          duree_heures?: number | null
          id?: string
          observations?: string | null
          responsable?: string | null
          type_mission?: string | null
          updated_at?: string | null
          zone_surveillee?: string | null
        }
        Relationships: []
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
      navires_industriels: {
        Row: {
          agrement_sanitaire: boolean | null
          armement_id: string | null
          assurance_valide: boolean | null
          certificat_navigabilite: boolean | null
          created_at: string | null
          date_delivrance_licence: string | null
          id: string
          immatriculation: string | null
          montant_licence_euros: number | null
          nationalite: string | null
          nom: string
          ordre_recette: string | null
          pavillon: string | null
          port_attache: string | null
          proprietaire: string | null
          puissance_moteur: number | null
          statut: string | null
          tonnage_brut: number | null
          type_licence: string | null
          type_navire: string | null
          updated_at: string | null
        }
        Insert: {
          agrement_sanitaire?: boolean | null
          armement_id?: string | null
          assurance_valide?: boolean | null
          certificat_navigabilite?: boolean | null
          created_at?: string | null
          date_delivrance_licence?: string | null
          id?: string
          immatriculation?: string | null
          montant_licence_euros?: number | null
          nationalite?: string | null
          nom: string
          ordre_recette?: string | null
          pavillon?: string | null
          port_attache?: string | null
          proprietaire?: string | null
          puissance_moteur?: number | null
          statut?: string | null
          tonnage_brut?: number | null
          type_licence?: string | null
          type_navire?: string | null
          updated_at?: string | null
        }
        Update: {
          agrement_sanitaire?: boolean | null
          armement_id?: string | null
          assurance_valide?: boolean | null
          certificat_navigabilite?: boolean | null
          created_at?: string | null
          date_delivrance_licence?: string | null
          id?: string
          immatriculation?: string | null
          montant_licence_euros?: number | null
          nationalite?: string | null
          nom?: string
          ordre_recette?: string | null
          pavillon?: string | null
          port_attache?: string | null
          proprietaire?: string | null
          puissance_moteur?: number | null
          statut?: string | null
          tonnage_brut?: number | null
          type_licence?: string | null
          type_navire?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navires_industriels_armement_id_fkey"
            columns: ["armement_id"]
            isOneToOne: false
            referencedRelation: "armements"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          channel: string
          document_id: string | null
          document_titre: string | null
          id: string
          message: string
          recipient: string
          sent_at: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          channel: string
          document_id?: string | null
          document_titre?: string | null
          id?: string
          message: string
          recipient: string
          sent_at?: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          channel?: string
          document_id?: string | null
          document_titre?: string | null
          id?: string
          message?: string
          recipient?: string
          sent_at?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "notification_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          interests: Json
          notification_channels: string[]
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          interests?: Json
          notification_channels?: string[]
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          interests?: Json
          notification_channels?: string[]
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
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
      objectifs_peche: {
        Row: {
          annee: number
          created_at: string
          date_attribution_pirogue: string
          id: string
          notes: string | null
          objectif_kg_annuel: number
          objectif_kg_mensuel: number
          pirogue_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          date_attribution_pirogue: string
          id?: string
          notes?: string | null
          objectif_kg_annuel: number
          objectif_kg_mensuel: number
          pirogue_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          date_attribution_pirogue?: string
          id?: string
          notes?: string | null
          objectif_kg_annuel?: number
          objectif_kg_mensuel?: number
          pirogue_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectifs_peche_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_groupes_taxes: {
        Row: {
          cooperative_id: string
          created_at: string | null
          date_paiement: string
          gestionnaire_id: string
          id: string
          mode_paiement: string | null
          montant_total: number
          notes: string | null
          numero_quittance: string | null
          reference_paiement: string | null
          updated_at: string | null
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          date_paiement?: string
          gestionnaire_id: string
          id?: string
          mode_paiement?: string | null
          montant_total: number
          notes?: string | null
          numero_quittance?: string | null
          reference_paiement?: string | null
          updated_at?: string | null
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          date_paiement?: string
          gestionnaire_id?: string
          id?: string
          mode_paiement?: string | null
          montant_total?: number
          notes?: string | null
          numero_quittance?: string | null
          reference_paiement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_groupes_taxes_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_taxes_detail: {
        Row: {
          created_at: string | null
          id: string
          montant_paye: number
          paiement_groupe_id: string
          taxe_capture_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          montant_paye: number
          paiement_groupe_id: string
          taxe_capture_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          montant_paye?: number
          paiement_groupe_id?: string
          taxe_capture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_taxes_detail_paiement_groupe_id_fkey"
            columns: ["paiement_groupe_id"]
            isOneToOne: false
            referencedRelation: "paiements_groupes_taxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_taxes_detail_taxe_capture_id_fkey"
            columns: ["taxe_capture_id"]
            isOneToOne: false
            referencedRelation: "taxes_captures"
            referencedColumns: ["id"]
          },
        ]
      }
      parties_prenantes: {
        Row: {
          actif: boolean | null
          created_at: string | null
          email: string
          fonction: string | null
          id: string
          nom: string
          organisation: string | null
          preferences: Json | null
          prenom: string
          telephone: string | null
          types_rapports: string[] | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          email: string
          fonction?: string | null
          id?: string
          nom: string
          organisation?: string | null
          preferences?: Json | null
          prenom: string
          telephone?: string | null
          types_rapports?: string[] | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          email?: string
          fonction?: string | null
          id?: string
          nom?: string
          organisation?: string | null
          preferences?: Json | null
          prenom?: string
          telephone?: string | null
          types_rapports?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pecheurs_cooperatives: {
        Row: {
          cooperative_id: string
          created_at: string | null
          date_adhesion: string | null
          id: string
          pecheur_user_id: string
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          date_adhesion?: string | null
          id?: string
          pecheur_user_id: string
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          date_adhesion?: string | null
          id?: string
          pecheur_user_id?: string
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pecheurs_cooperatives_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
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
      prix_moyens_unitaires: {
        Row: {
          created_at: string | null
          date_reference: string | null
          espece_id: string | null
          id: string
          prix_moyen_fcfa: number
          source: string | null
          unite: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_reference?: string | null
          espece_id?: string | null
          id?: string
          prix_moyen_fcfa: number
          source?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_reference?: string | null
          espece_id?: string | null
          id?: string
          prix_moyen_fcfa?: number
          source?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prix_moyens_unitaires_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
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
      rapports_automatises: {
        Row: {
          actif: boolean | null
          copie_cachee: string[] | null
          created_at: string | null
          derniere_execution: string | null
          description: string | null
          destinataires: string[]
          filtres: Json | null
          frequence: string
          heure_execution: string | null
          id: string
          jour_execution: number | null
          nom: string
          prochaine_execution: string | null
          template_email: string | null
          type_rapport: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          copie_cachee?: string[] | null
          created_at?: string | null
          derniere_execution?: string | null
          description?: string | null
          destinataires: string[]
          filtres?: Json | null
          frequence?: string
          heure_execution?: string | null
          id?: string
          jour_execution?: number | null
          nom: string
          prochaine_execution?: string | null
          template_email?: string | null
          type_rapport: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          copie_cachee?: string[] | null
          created_at?: string | null
          derniere_execution?: string | null
          description?: string | null
          destinataires?: string[]
          filtres?: Json | null
          frequence?: string
          heure_execution?: string | null
          id?: string
          jour_execution?: number | null
          nom?: string
          prochaine_execution?: string | null
          template_email?: string | null
          type_rapport?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rapports_envois_historique: {
        Row: {
          created_at: string | null
          date_envoi: string | null
          fichier_path: string | null
          id: string
          message_erreur: string | null
          metadata: Json | null
          nb_destinataires: number | null
          rapport_id: string | null
          statut: string
          taille_fichier_kb: number | null
        }
        Insert: {
          created_at?: string | null
          date_envoi?: string | null
          fichier_path?: string | null
          id?: string
          message_erreur?: string | null
          metadata?: Json | null
          nb_destinataires?: number | null
          rapport_id?: string | null
          statut: string
          taille_fichier_kb?: number | null
        }
        Update: {
          created_at?: string | null
          date_envoi?: string | null
          fichier_path?: string | null
          id?: string
          message_erreur?: string | null
          metadata?: Json | null
          nb_destinataires?: number | null
          rapport_id?: string | null
          statut?: string
          taille_fichier_kb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_envois_historique_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports_automatises"
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
      remontees_effectives: {
        Row: {
          created_at: string
          date_virement: string | null
          id: string
          institution_id: string
          montant_remonte: number
          periode_annee: number
          periode_mois: number
          pourcentage_applique: number
          reference_virement: string | null
          statut_virement: string
          taxe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_virement?: string | null
          id?: string
          institution_id: string
          montant_remonte: number
          periode_annee: number
          periode_mois: number
          pourcentage_applique: number
          reference_virement?: string | null
          statut_virement?: string
          taxe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_virement?: string | null
          id?: string
          institution_id?: string
          montant_remonte?: number
          periode_annee?: number
          periode_mois?: number
          pourcentage_applique?: number
          reference_virement?: string | null
          statut_virement?: string
          taxe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remontees_effectives_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "repartition_institutionnelle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remontees_effectives_taxe_id_fkey"
            columns: ["taxe_id"]
            isOneToOne: false
            referencedRelation: "taxes_calculees"
            referencedColumns: ["id"]
          },
        ]
      }
      remontees_syntheses: {
        Row: {
          created_at: string
          id: string
          remontee_id: string
          synthese_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          remontee_id: string
          synthese_id: string
        }
        Update: {
          created_at?: string
          id?: string
          remontee_id?: string
          synthese_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remontees_syntheses_remontee_id_fkey"
            columns: ["remontee_id"]
            isOneToOne: false
            referencedRelation: "remontees_terrain"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remontees_syntheses_synthese_id_fkey"
            columns: ["synthese_id"]
            isOneToOne: false
            referencedRelation: "syntheses_remontees"
            referencedColumns: ["id"]
          },
        ]
      }
      remontees_terrain: {
        Row: {
          categorie: string | null
          commentaire_validation: string | null
          created_at: string
          date_incident: string | null
          date_validation: string | null
          description: string
          id: string
          impact_estime: string | null
          institution_source: string | null
          latitude: number | null
          localisation: string | null
          longitude: number | null
          mots_cles: string[] | null
          nb_personnes_concernees: number | null
          niveau_priorite: string | null
          numero_reference: string | null
          piece_jointe_url: string | null
          sentiment: string | null
          soumis_par: string | null
          source: string | null
          statut: string | null
          titre: string
          type_remontee: string
          updated_at: string
          url_source: string | null
          validation_status: string | null
          valide_par: string | null
        }
        Insert: {
          categorie?: string | null
          commentaire_validation?: string | null
          created_at?: string
          date_incident?: string | null
          date_validation?: string | null
          description: string
          id?: string
          impact_estime?: string | null
          institution_source?: string | null
          latitude?: number | null
          localisation?: string | null
          longitude?: number | null
          mots_cles?: string[] | null
          nb_personnes_concernees?: number | null
          niveau_priorite?: string | null
          numero_reference?: string | null
          piece_jointe_url?: string | null
          sentiment?: string | null
          soumis_par?: string | null
          source?: string | null
          statut?: string | null
          titre: string
          type_remontee: string
          updated_at?: string
          url_source?: string | null
          validation_status?: string | null
          valide_par?: string | null
        }
        Update: {
          categorie?: string | null
          commentaire_validation?: string | null
          created_at?: string
          date_incident?: string | null
          date_validation?: string | null
          description?: string
          id?: string
          impact_estime?: string | null
          institution_source?: string | null
          latitude?: number | null
          localisation?: string | null
          longitude?: number | null
          mots_cles?: string[] | null
          nb_personnes_concernees?: number | null
          niveau_priorite?: string | null
          numero_reference?: string | null
          piece_jointe_url?: string | null
          sentiment?: string | null
          soumis_par?: string | null
          source?: string | null
          statut?: string | null
          titre?: string
          type_remontee?: string
          updated_at?: string
          url_source?: string | null
          validation_status?: string | null
          valide_par?: string | null
        }
        Relationships: []
      }
      repartition_institutionnelle: {
        Row: {
          actif: boolean
          compte_bancaire: string | null
          created_at: string
          id: string
          nom_institution: string
          pourcentage_taxes: number
          responsable: string | null
          type_institution: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          compte_bancaire?: string | null
          created_at?: string
          id?: string
          nom_institution: string
          pourcentage_taxes: number
          responsable?: string | null
          type_institution: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          compte_bancaire?: string | null
          created_at?: string
          id?: string
          nom_institution?: string
          pourcentage_taxes?: number
          responsable?: string | null
          type_institution?: string
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
      sorties_artisanales: {
        Row: {
          capture_totale_kg: number | null
          cpue: number | null
          created_at: string | null
          date_depart: string
          date_retour: string | null
          duree_jours: number | null
          effort_unite: number | null
          engin_id: string | null
          id: string
          observations: string | null
          pirogue_id: string | null
          site_debarquement: string | null
          updated_at: string | null
          zone_peche: string | null
        }
        Insert: {
          capture_totale_kg?: number | null
          cpue?: number | null
          created_at?: string | null
          date_depart: string
          date_retour?: string | null
          duree_jours?: number | null
          effort_unite?: number | null
          engin_id?: string | null
          id?: string
          observations?: string | null
          pirogue_id?: string | null
          site_debarquement?: string | null
          updated_at?: string | null
          zone_peche?: string | null
        }
        Update: {
          capture_totale_kg?: number | null
          cpue?: number | null
          created_at?: string | null
          date_depart?: string
          date_retour?: string | null
          duree_jours?: number | null
          effort_unite?: number | null
          engin_id?: string | null
          id?: string
          observations?: string | null
          pirogue_id?: string | null
          site_debarquement?: string | null
          updated_at?: string | null
          zone_peche?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sorties_artisanales_engin_id_fkey"
            columns: ["engin_id"]
            isOneToOne: false
            referencedRelation: "engins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorties_artisanales_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sorties_artisanales_site_debarquement_fkey"
            columns: ["site_debarquement"]
            isOneToOne: false
            referencedRelation: "sites"
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
      suivi_objectifs: {
        Row: {
          annee: number
          created_at: string
          id: string
          mois: number
          nb_sorties: number
          objectif_id: string
          poids_objectif_kg: number
          poids_realise_kg: number
          taux_realisation_pct: number | null
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          id?: string
          mois: number
          nb_sorties?: number
          objectif_id: string
          poids_objectif_kg: number
          poids_realise_kg?: number
          taux_realisation_pct?: number | null
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          id?: string
          mois?: number
          nb_sorties?: number
          objectif_id?: string
          poids_objectif_kg?: number
          poids_realise_kg?: number
          taux_realisation_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suivi_objectifs_objectif_id_fkey"
            columns: ["objectif_id"]
            isOneToOne: false
            referencedRelation: "objectifs_peche"
            referencedColumns: ["id"]
          },
        ]
      }
      syntheses_remontees: {
        Row: {
          categories: string[] | null
          created_at: string
          genere_automatiquement: boolean | null
          genere_par: string | null
          id: string
          nombre_remontees: number | null
          periode_debut: string
          periode_fin: string
          points_cles: Json | null
          recommandations: Json | null
          statut: string | null
          synthese_texte: string | null
          tendances: Json | null
          titre: string
          types_remontees: string[] | null
          updated_at: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          genere_automatiquement?: boolean | null
          genere_par?: string | null
          id?: string
          nombre_remontees?: number | null
          periode_debut: string
          periode_fin: string
          points_cles?: Json | null
          recommandations?: Json | null
          statut?: string | null
          synthese_texte?: string | null
          tendances?: Json | null
          titre: string
          types_remontees?: string[] | null
          updated_at?: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          genere_automatiquement?: boolean | null
          genere_par?: string | null
          id?: string
          nombre_remontees?: number | null
          periode_debut?: string
          periode_fin?: string
          points_cles?: Json | null
          recommandations?: Json | null
          statut?: string | null
          synthese_texte?: string | null
          tendances?: Json | null
          titre?: string
          types_remontees?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      taxes_artisanales: {
        Row: {
          annee: number
          created_at: string | null
          date_emission: string | null
          date_paiement: string | null
          id: string
          mois: number
          montant_fcfa: number
          observations: string | null
          pirogue_id: string | null
          reference_quittance: string
          statut: string | null
          type_taxe: string | null
          updated_at: string | null
        }
        Insert: {
          annee: number
          created_at?: string | null
          date_emission?: string | null
          date_paiement?: string | null
          id?: string
          mois: number
          montant_fcfa: number
          observations?: string | null
          pirogue_id?: string | null
          reference_quittance: string
          statut?: string | null
          type_taxe?: string | null
          updated_at?: string | null
        }
        Update: {
          annee?: number
          created_at?: string | null
          date_emission?: string | null
          date_paiement?: string | null
          id?: string
          mois?: number
          montant_fcfa?: number
          observations?: string | null
          pirogue_id?: string | null
          reference_quittance?: string
          statut?: string | null
          type_taxe?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taxes_artisanales_pirogue_id_fkey"
            columns: ["pirogue_id"]
            isOneToOne: false
            referencedRelation: "pirogues"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes_calculees: {
        Row: {
          bareme_id: string
          capture_id: string
          created_at: string
          date_paiement: string | null
          id: string
          montant_taxe: number
          poids_taxable_kg: number
          reference_paiement: string | null
          statut_paiement: string
          updated_at: string
        }
        Insert: {
          bareme_id: string
          capture_id: string
          created_at?: string
          date_paiement?: string | null
          id?: string
          montant_taxe: number
          poids_taxable_kg: number
          reference_paiement?: string | null
          statut_paiement?: string
          updated_at?: string
        }
        Update: {
          bareme_id?: string
          capture_id?: string
          created_at?: string
          date_paiement?: string | null
          id?: string
          montant_taxe?: number
          poids_taxable_kg?: number
          reference_paiement?: string | null
          statut_paiement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxes_calculees_bareme_id_fkey"
            columns: ["bareme_id"]
            isOneToOne: false
            referencedRelation: "bareme_taxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxes_calculees_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures_pa"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes_captures: {
        Row: {
          bareme_id: string | null
          capture_pa_id: string | null
          created_at: string | null
          date_paiement: string | null
          espece_id: string | null
          id: string
          maree_industrielle_id: string | null
          montant_taxe: number
          montant_unitaire: number | null
          notes: string | null
          poids_taxable_kg: number
          quittance_numero: string | null
          statut_paiement: string | null
          taux_applique: number | null
          type_taxe: string
        }
        Insert: {
          bareme_id?: string | null
          capture_pa_id?: string | null
          created_at?: string | null
          date_paiement?: string | null
          espece_id?: string | null
          id?: string
          maree_industrielle_id?: string | null
          montant_taxe: number
          montant_unitaire?: number | null
          notes?: string | null
          poids_taxable_kg: number
          quittance_numero?: string | null
          statut_paiement?: string | null
          taux_applique?: number | null
          type_taxe?: string
        }
        Update: {
          bareme_id?: string | null
          capture_pa_id?: string | null
          created_at?: string | null
          date_paiement?: string | null
          espece_id?: string | null
          id?: string
          maree_industrielle_id?: string | null
          montant_taxe?: number
          montant_unitaire?: number | null
          notes?: string | null
          poids_taxable_kg?: number
          quittance_numero?: string | null
          statut_paiement?: string | null
          taux_applique?: number | null
          type_taxe?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxes_captures_bareme_id_fkey"
            columns: ["bareme_id"]
            isOneToOne: false
            referencedRelation: "bareme_taxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxes_captures_capture_pa_id_fkey"
            columns: ["capture_pa_id"]
            isOneToOne: false
            referencedRelation: "captures_pa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxes_captures_espece_id_fkey"
            columns: ["espece_id"]
            isOneToOne: false
            referencedRelation: "especes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxes_captures_maree_industrielle_id_fkey"
            columns: ["maree_industrielle_id"]
            isOneToOne: false
            referencedRelation: "marees_industrielles"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes_industrielles: {
        Row: {
          annee: number
          created_at: string | null
          date_delivrance: string | null
          id: string
          montant_euros: number
          navire_id: string | null
          observations: string | null
          ordre_recette: string | null
          statut_paiement: string | null
          type_licence: string
          updated_at: string | null
        }
        Insert: {
          annee: number
          created_at?: string | null
          date_delivrance?: string | null
          id?: string
          montant_euros: number
          navire_id?: string | null
          observations?: string | null
          ordre_recette?: string | null
          statut_paiement?: string | null
          type_licence: string
          updated_at?: string | null
        }
        Update: {
          annee?: number
          created_at?: string | null
          date_delivrance?: string | null
          id?: string
          montant_euros?: number
          navire_id?: string | null
          observations?: string | null
          ordre_recette?: string | null
          statut_paiement?: string | null
          type_licence?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taxes_industrielles_navire_id_fkey"
            columns: ["navire_id"]
            isOneToOne: false
            referencedRelation: "navires_industriels"
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
      workflow_commentaires: {
        Row: {
          auteur_institution: string
          auteur_user_id: string | null
          commentaire: string
          created_at: string
          est_interne: boolean | null
          id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          auteur_institution: string
          auteur_user_id?: string | null
          commentaire: string
          created_at?: string
          est_interne?: boolean | null
          id?: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          auteur_institution?: string
          auteur_user_id?: string | null
          commentaire?: string
          created_at?: string
          est_interne?: boolean | null
          id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_commentaires_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows_inter_institutionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_documents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom_fichier: string
          taille_bytes: number | null
          type_fichier: string
          uploaded_at: string
          uploaded_by: string | null
          url_fichier: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom_fichier: string
          taille_bytes?: number | null
          type_fichier: string
          uploaded_at?: string
          uploaded_by?: string | null
          url_fichier: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom_fichier?: string
          taille_bytes?: number | null
          type_fichier?: string
          uploaded_at?: string
          uploaded_by?: string | null
          url_fichier?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_documents_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows_inter_institutionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_historique: {
        Row: {
          action: string
          ancien_statut: string | null
          created_at: string
          description_action: string
          details: Json | null
          effectue_par: string | null
          effectue_par_institution: string | null
          id: string
          nouveau_statut: string | null
          workflow_id: string
        }
        Insert: {
          action: string
          ancien_statut?: string | null
          created_at?: string
          description_action: string
          details?: Json | null
          effectue_par?: string | null
          effectue_par_institution?: string | null
          id?: string
          nouveau_statut?: string | null
          workflow_id: string
        }
        Update: {
          action?: string
          ancien_statut?: string | null
          created_at?: string
          description_action?: string
          details?: Json | null
          effectue_par?: string | null
          effectue_par_institution?: string | null
          id?: string
          nouveau_statut?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_historique_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows_inter_institutionnels"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          actif: boolean
          categorie: string
          champs_requis: Json | null
          created_at: string
          created_by: string | null
          delai_traitement_jours: number | null
          description: string | null
          description_template: string | null
          documents_requis: string[] | null
          id: string
          institution_destinataire_defaut: string[] | null
          institution_emettrice_defaut: string[] | null
          nom: string
          objet_template: string
          priorite_defaut: string
          type_donnees: string
          type_workflow: string
          updated_at: string
          utilisation_count: number
        }
        Insert: {
          actif?: boolean
          categorie?: string
          champs_requis?: Json | null
          created_at?: string
          created_by?: string | null
          delai_traitement_jours?: number | null
          description?: string | null
          description_template?: string | null
          documents_requis?: string[] | null
          id?: string
          institution_destinataire_defaut?: string[] | null
          institution_emettrice_defaut?: string[] | null
          nom: string
          objet_template: string
          priorite_defaut?: string
          type_donnees: string
          type_workflow: string
          updated_at?: string
          utilisation_count?: number
        }
        Update: {
          actif?: boolean
          categorie?: string
          champs_requis?: Json | null
          created_at?: string
          created_by?: string | null
          delai_traitement_jours?: number | null
          description?: string | null
          description_template?: string | null
          documents_requis?: string[] | null
          id?: string
          institution_destinataire_defaut?: string[] | null
          institution_emettrice_defaut?: string[] | null
          nom?: string
          objet_template?: string
          priorite_defaut?: string
          type_donnees?: string
          type_workflow?: string
          updated_at?: string
          utilisation_count?: number
        }
        Relationships: []
      }
      workflows_inter_institutionnels: {
        Row: {
          created_at: string
          date_cloture: string | null
          date_creation: string
          date_echeance: string | null
          date_traitement: string | null
          description: string | null
          destinataire_user_id: string | null
          donnees_json: Json | null
          emetteur_user_id: string | null
          id: string
          institution_destinataire: string
          institution_emettrice: string
          metadata: Json | null
          numero_reference: string
          objet: string
          priorite: string
          statut: string
          tags: string[] | null
          type_donnees: string
          type_workflow: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_cloture?: string | null
          date_creation?: string
          date_echeance?: string | null
          date_traitement?: string | null
          description?: string | null
          destinataire_user_id?: string | null
          donnees_json?: Json | null
          emetteur_user_id?: string | null
          id?: string
          institution_destinataire: string
          institution_emettrice: string
          metadata?: Json | null
          numero_reference: string
          objet: string
          priorite?: string
          statut?: string
          tags?: string[] | null
          type_donnees: string
          type_workflow: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_cloture?: string | null
          date_creation?: string
          date_echeance?: string | null
          date_traitement?: string | null
          description?: string | null
          destinataire_user_id?: string | null
          donnees_json?: Json | null
          emetteur_user_id?: string | null
          id?: string
          institution_destinataire?: string
          institution_emettrice?: string
          metadata?: Json | null
          numero_reference?: string
          objet?: string
          priorite?: string
          statut?: string
          tags?: string[] | null
          type_donnees?: string
          type_workflow?: string
          updated_at?: string
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
      taxes_dues_summary: {
        Row: {
          date_plus_ancienne: string | null
          date_plus_recente: string | null
          montant_total: number | null
          nombre_taxes: number | null
          statut_paiement: string | null
          user_id: string | null
        }
        Relationships: []
      }
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
      calculer_prochaine_execution: {
        Args: {
          p_derniere_execution?: string
          p_frequence: string
          p_heure_execution: string
          p_jour_execution: number
        }
        Returns: string
      }
      est_dans_fenetre_paiement: {
        Args: { p_date_echeance: string }
        Returns: boolean
      }
      generer_numero_quittance: { Args: { p_annee?: number }; Returns: string }
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
      user_institution: { Args: never; Returns: string }
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
        | "dgpa"
        | "anpa"
        | "agasa"
        | "dgmm"
        | "oprag"
        | "dgddi"
        | "anpn"
        | "corep"
        | "partenaire_international"
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
        "dgpa",
        "anpa",
        "agasa",
        "dgmm",
        "oprag",
        "dgddi",
        "anpn",
        "corep",
        "partenaire_international",
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
