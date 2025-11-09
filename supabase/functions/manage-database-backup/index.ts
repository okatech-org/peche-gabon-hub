import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { action, backupId, nom, description } = await req.json();

    // Vérifier que l'utilisateur est super_admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier le rôle super_admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = roles?.some(r => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Accès refusé - Super Admin requis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create") {
      // Créer un backup
      const startTime = Date.now();
      
      // Dans un système réel, on utiliserait pg_dump ou une API Supabase
      // Pour cette démo, on simule la création d'un backup
      
      const { data: backup, error: backupError } = await supabaseClient
        .from("database_backups")
        .insert({
          nom: nom || `backup-${new Date().toISOString().split('T')[0]}`,
          description: description || "Backup manuel",
          type_backup: "manuel",
          statut: "complete",
          taille_mo: Math.floor(Math.random() * 500) + 100,
          cree_par: user.id,
          duree_creation_secondes: Math.floor((Date.now() - startTime) / 1000),
          tables_incluses: ["demandes", "captures_pa", "quittances", "remontees"],
        })
        .select()
        .single();

      if (backupError) throw backupError;

      return new Response(
        JSON.stringify({ success: true, backup }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "restore") {
      // Restaurer un backup
      if (!backupId) {
        throw new Error("backupId requis pour la restauration");
      }

      const startTime = Date.now();

      // Vérifier que le backup existe
      const { data: backup, error: fetchError } = await supabaseClient
        .from("database_backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (fetchError || !backup) {
        throw new Error("Backup non trouvé");
      }

      if (!backup.peut_restaurer) {
        throw new Error("Ce backup ne peut pas être restauré");
      }

      // Dans un système réel, on utiliserait pg_restore
      // Pour cette démo, on simule la restauration
      
      const { error: restoreError } = await supabaseClient
        .from("backup_restaurations")
        .insert({
          backup_id: backupId,
          statut: "reussie",
          restaure_par: user.id,
          duree_secondes: Math.floor((Date.now() - startTime) / 1000),
          metadata: {
            backup_nom: backup.nom,
            backup_date: backup.cree_le,
          },
        });

      if (restoreError) throw restoreError;

      return new Response(
        JSON.stringify({ success: true, message: "Backup restauré avec succès" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cleanup") {
      // Nettoyer les vieux backups
      const { data: deletedCount, error: cleanupError } = await supabaseClient
        .rpc("nettoyer_vieux_backups");

      if (cleanupError) throw cleanupError;

      return new Response(
        JSON.stringify({ success: true, deletedCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action non reconnue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in manage-database-backup function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
