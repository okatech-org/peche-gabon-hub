import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { remontees, format, includeFields } = await req.json();

    if (!remontees || remontees.length === 0) {
      throw new Error('Aucune remontée fournie');
    }

    console.log(`Génération résumé groupé pour ${remontees.length} remontées, format: ${format}`);

    // Mapper les types pour un langage naturel
    const typeLabels: Record<string, string> = {
      reclamation: "réclamation",
      suggestion: "suggestion",
      denonciation: "dénonciation",
      article_presse: "article de presse",
      commentaire_reseau: "commentaire réseau social",
      avis_reseau_social: "avis réseau social"
    };

    const prioriteLabels: Record<string, string> = {
      basse: "basse priorité",
      moyenne: "priorité moyenne",
      haute: "haute priorité",
      critique: "priorité critique"
    };

    const statutLabels: Record<string, string> = {
      nouvelle: "nouvelle",
      en_cours: "en cours de traitement",
      traitee: "traitée",
      cloturee: "clôturée",
      archivee: "archivée"
    };

    // Construire le résumé en fonction du format
    let summary = "";

    if (format === "synthetique") {
      summary = `Résumé de ${remontees.length} remontée${remontees.length > 1 ? 's' : ''}. `;
      
      // Statistiques rapides
      const types = remontees.map((r: any) => r.type_remontee);
      const priorites = remontees.map((r: any) => r.priorite);
      const statuts = remontees.map((r: any) => r.statut);
      
      const typesUniques = [...new Set(types)] as string[];
      const hautePriorite = priorites.filter((p: string) => p === 'haute' || p === 'critique').length;
      const nouvellesRemontees = statuts.filter((s: string) => s === 'nouvelle').length;

      summary += `Types: ${typesUniques.map((t: string) => typeLabels[t] || t).join(', ')}. `;
      if (hautePriorite > 0) {
        summary += `${hautePriorite} remontée${hautePriorite > 1 ? 's' : ''} à haute priorité. `;
      }
      if (nouvellesRemontees > 0) {
        summary += `${nouvellesRemontees} nouvelle${nouvellesRemontees > 1 ? 's' : ''} remontée${nouvellesRemontees > 1 ? 's' : ''}. `;
      }

    } else if (format === "standard") {
      summary = `Voici un résumé de ${remontees.length} remontée${remontees.length > 1 ? 's' : ''} terrain:\n\n`;

      remontees.forEach((remontee: any, index: number) => {
        summary += `Remontée ${index + 1}: `;
        
        if (includeFields.includes("reference")) {
          summary += `Référence ${remontee.numero_reference}. `;
        }
        
        if (includeFields.includes("type")) {
          summary += `Il s'agit d'une ${typeLabels[remontee.type_remontee] || remontee.type_remontee}. `;
        }
        
        if (includeFields.includes("priorite")) {
          summary += `Classée ${prioriteLabels[remontee.priorite] || remontee.priorite}. `;
        }
        
        if (includeFields.includes("statut")) {
          summary += `Statut: ${statutLabels[remontee.statut] || remontee.statut}. `;
        }
        
        if (includeFields.includes("localisation") && remontee.localisation) {
          summary += `Localisation: ${remontee.localisation}. `;
        }
        
        if (includeFields.includes("description") && remontee.description) {
          const desc = remontee.description.substring(0, 150);
          summary += `Description: ${desc}${remontee.description.length > 150 ? '...' : ''}. `;
        }

        summary += "\n\n";
      });

    } else if (format === "detaille") {
      summary = `Rapport détaillé de ${remontees.length} remontée${remontees.length > 1 ? 's' : ''} terrain:\n\n`;

      remontees.forEach((remontee: any, index: number) => {
        summary += `\nRemontée numéro ${index + 1}:\n`;
        
        if (includeFields.includes("reference")) {
          summary += `Numéro de référence: ${remontee.numero_reference}.\n`;
        }
        
        if (includeFields.includes("type")) {
          summary += `Type de remontée: ${typeLabels[remontee.type_remontee] || remontee.type_remontee}.\n`;
        }
        
        if (includeFields.includes("priorite")) {
          summary += `Niveau de priorité: ${prioriteLabels[remontee.priorite] || remontee.priorite}.\n`;
        }
        
        if (includeFields.includes("statut")) {
          summary += `Statut actuel: ${statutLabels[remontee.statut] || remontee.statut}.\n`;
        }
        
        if (includeFields.includes("localisation") && remontee.localisation) {
          summary += `Localisation: ${remontee.localisation}.\n`;
        }
        
        if (includeFields.includes("date")) {
          const date = new Date(remontee.date_soumission);
          summary += `Date de soumission: ${date.toLocaleDateString('fr-FR')}.\n`;
        }
        
        if (includeFields.includes("description") && remontee.description) {
          summary += `Description complète: ${remontee.description}.\n`;
        }

        if (remontee.titre) {
          summary += `Titre: ${remontee.titre}.\n`;
        }

        summary += "\n";
      });
    }

    console.log('Résumé généré, longueur:', summary.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: summary.trim(),
        remontees_count: remontees.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erreur generate-grouped-remontee-summary:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
