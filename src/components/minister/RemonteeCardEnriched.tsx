import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  FileDown, 
  Volume2, 
  Loader2, 
  CheckCircle,
  MapPin,
  Calendar,
  Users,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import jsPDF from "jspdf";

interface RemonteeCardEnrichedProps {
  remontee: {
    id: string;
    numero_reference: string;
    type_remontee: string;
    titre: string;
    description: string;
    source?: string;
    url_source?: string;
    localisation?: string;
    niveau_priorite: string;
    statut: string;
    sentiment?: string;
    categorie?: string;
    created_at: string;
    date_incident?: string;
    impact_estime?: string;
    nb_personnes_concernees?: number;
  };
  onViewDetails: () => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export function RemonteeCardEnriched({ remontee, onViewDetails, selected, onSelect }: RemonteeCardEnrichedProps) {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      nouveau: "bg-primary/10 text-primary border-primary/20",
      en_analyse: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      en_traitement: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      resolu: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      rejete: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      archive: "bg-muted text-muted-foreground border-border",
    };
    return colors[statut] || colors.archive;
  };

  const getPrioriteColor = (priorite: string) => {
    const colors: Record<string, string> = {
      critique: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      haut: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      moyen: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
      bas: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
    };
    return colors[priorite] || colors.moyen;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      reclamation: "⚠️",
      suggestion: "💡",
      denonciation: "🚨",
      article_presse: "📰",
      commentaire_reseau: "💬",
      avis_reseau_social: "👥",
    };
    return icons[type] || "📋";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reclamation: "Réclamation",
      suggestion: "Suggestion",
      denonciation: "Dénonciation",
      article_presse: "Article de presse",
      commentaire_reseau: "Commentaire réseau",
      avis_reseau_social: "Avis réseau social",
    };
    return labels[type] || type;
  };

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // En-tête
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("RAPPORT DE REMONTÉE TERRAIN", pageWidth / 2, y, { align: "center" });
      y += 15;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Ministère de la Pêche et de l'Aquaculture - République Gabonaise", pageWidth / 2, y, { align: "center" });
      y += 15;

      // Ligne séparatrice
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Référence et date
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Référence: ${remontee.numero_reference}`, margin, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.text(`Date: ${new Date(remontee.created_at).toLocaleDateString('fr-FR')}`, margin, y);
      y += 10;

      // Informations principales
      pdf.setFont("helvetica", "bold");
      pdf.text("Type:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(getTypeLabel(remontee.type_remontee), margin + 25, y);
      y += 7;

      pdf.setFont("helvetica", "bold");
      pdf.text("Priorité:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(remontee.niveau_priorite.toUpperCase(), margin + 25, y);
      y += 7;

      pdf.setFont("helvetica", "bold");
      pdf.text("Statut:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(remontee.statut.replace('_', ' ').toUpperCase(), margin + 25, y);
      y += 10;

      // Titre
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("TITRE", margin, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const titreLines = pdf.splitTextToSize(remontee.titre, pageWidth - 2 * margin);
      pdf.text(titreLines, margin, y);
      y += titreLines.length * 7 + 5;

      // Description
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("DESCRIPTION", margin, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const descLines = pdf.splitTextToSize(remontee.description, pageWidth - 2 * margin);
      pdf.text(descLines, margin, y);
      y += descLines.length * 7 + 10;

      // Informations complémentaires
      if (remontee.localisation || remontee.source || remontee.impact_estime) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text("INFORMATIONS COMPLÉMENTAIRES", margin, y);
        y += 7;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        if (remontee.localisation) {
          pdf.text(`Localisation: ${remontee.localisation}`, margin, y);
          y += 7;
        }
        if (remontee.source) {
          pdf.text(`Source: ${remontee.source}`, margin, y);
          y += 7;
        }
        if (remontee.impact_estime) {
          pdf.text(`Impact estimé: ${remontee.impact_estime}`, margin, y);
          y += 7;
        }
        if (remontee.nb_personnes_concernees) {
          pdf.text(`Personnes concernées: ${remontee.nb_personnes_concernees}`, margin, y);
          y += 7;
        }
      }

      // Footer
      y = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Document généré automatiquement - Confidentiel", pageWidth / 2, y, { align: "center" });

      // Télécharger
      pdf.save(`Remontee_${remontee.numero_reference}.pdf`);
      toast.success("PDF exporté avec succès");

    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const handleGenerateAndPlayAudio = async () => {
    try {
      setIsGeneratingAudio(true);

      // Étape 1: Générer la synthèse textuelle avec IA
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'generate-remontee-summary',
        { body: { remonteeId: remontee.id } }
      );

      if (summaryError) throw summaryError;
      if (!summaryData?.success) throw new Error(summaryData?.error || 'Erreur génération synthèse');

      console.log('Synthèse générée:', summaryData.summary);

      // Étape 2: Convertir en audio
      const { data: audioData, error: audioError } = await supabase.functions.invoke(
        'generate-audio-summary',
        { body: { text: summaryData.summary } }
      );

      if (audioError) throw audioError;
      if (!audioData?.success) throw new Error(audioData?.error || 'Erreur génération audio');

      // Créer URL audio et lire
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioData.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(url);
      };
      
      setIsPlayingAudio(true);
      await audio.play();
      
      toast.success("Lecture de la synthèse vocale");

    } catch (error) {
      console.error('Erreur génération audio:', error);
      toast.error("Erreur lors de la génération de la synthèse vocale");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/95 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="relative pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1.5 min-w-0">
            {/* Référence et type */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-lg leading-none">{getTypeIcon(remontee.type_remontee)}</span>
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                {remontee.numero_reference}
              </Badge>
              <Badge className={`${getPrioriteColor(remontee.niveau_priorite)} text-[10px] px-1.5 py-0`}>
                {remontee.niveau_priorite}
              </Badge>
            </div>

            {/* Titre */}
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {remontee.titre}
            </h3>
          </div>

          {/* Statut */}
          <Badge className={`${getStatutColor(remontee.statut)} text-[10px] px-1.5 py-0 shrink-0`}>
            {remontee.statut.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-2.5 pt-0 pb-3 px-3 flex-1 flex flex-col">
        {/* Description aperçu */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {remontee.description}
        </p>

        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {remontee.localisation && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{remontee.localisation}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{new Date(remontee.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
          </div>
          {remontee.source && (
            <div className="flex items-center gap-1 text-muted-foreground col-span-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate text-[10px]">Source: {remontee.source}</span>
            </div>
          )}
          {remontee.nb_personnes_concernees && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span>{remontee.nb_personnes_concernees} pers.</span>
            </div>
          )}
        </div>

        {/* Impact estimé */}
        {remontee.impact_estime && (
          <div className="p-2 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Impact estimé</p>
            <p className="text-[11px] leading-snug line-clamp-2">{remontee.impact_estime}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            onClick={onViewDetails}
            className="flex-1 gap-1 h-7 text-[11px] hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            <Eye className="h-3 w-3" />
            <span>Détails</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            className="gap-1 h-7 px-2 hover:bg-accent/5 hover:text-accent hover:border-accent/30 transition-all"
            title="Exporter en PDF"
          >
            <FileDown className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateAndPlayAudio}
            disabled={isGeneratingAudio || isPlayingAudio}
            className="gap-1 h-7 px-2 hover:bg-green-500/5 hover:text-green-600 hover:border-green-500/30 transition-all"
            title="Synthèse vocale IA (15s)"
          >
            {isGeneratingAudio ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isPlayingAudio ? (
              <Volume2 className="h-3 w-3 animate-pulse" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
