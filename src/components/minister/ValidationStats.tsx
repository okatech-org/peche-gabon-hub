import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Loader2,
  Filter,
  X,
  ArrowRight,
  FileDown
} from "lucide-react";
import { format, differenceInHours, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ValidationStats {
  total: number;
  approuvees: number;
  rejetees: number;
  enAttente: number;
  tauxApprobation: number;
  tempsRevisionMoyen: number;
  raisonsRejet: { raison: string; count: number }[];
}

interface Formateur {
  id: string;
  nom: string;
  prenom: string;
}

interface TendanceData {
  mois: string;
  tauxApprobation: number;
  tempsRevision: number;
  total: number;
  approuvees: number;
  rejetees: number;
}

export function ValidationStats() {
  const [loading, setLoading] = useState(true);
  const [loadingTendances, setLoadingTendances] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    total: 0,
    approuvees: 0,
    rejetees: 0,
    enAttente: 0,
    tauxApprobation: 0,
    tempsRevisionMoyen: 0,
    raisonsRejet: []
  });
  const [statsComparaison, setStatsComparaison] = useState<ValidationStats | null>(null);
  const [tendancesData, setTendancesData] = useState<TendanceData[]>([]);

  // Filtres
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [formateurId, setFormateurId] = useState<string>("");
  const [typeFormation, setTypeFormation] = useState<string>("");
  
  // Mode comparaison
  const [modeComparaison, setModeComparaison] = useState(false);
  const [dateDebutComparaison, setDateDebutComparaison] = useState("");
  const [dateFinComparaison, setDateFinComparaison] = useState("");

  useEffect(() => {
    loadFormateurs();
    loadStats();
    loadTendances();
  }, []);

  useEffect(() => {
    loadStats();
    loadTendances();
    if (modeComparaison && dateDebutComparaison && dateFinComparaison) {
      loadStatsComparaison();
    } else {
      setStatsComparaison(null);
    }
  }, [dateDebut, dateFin, formateurId, typeFormation, modeComparaison, dateDebutComparaison, dateFinComparaison]);

  const loadFormateurs = async () => {
    try {
      const { data, error } = await supabase
        .from("formateurs")
        .select("id, nom, prenom")
        .eq("statut", "actif")
        .order("nom");

      if (error) throw error;
      setFormateurs(data || []);
    } catch (error) {
      console.error("Erreur chargement formateurs:", error);
    }
  };

  const resetFilters = () => {
    setDateDebut("");
    setDateFin("");
    setFormateurId("");
    setTypeFormation("");
    setModeComparaison(false);
    setDateDebutComparaison("");
    setDateFinComparaison("");
  };

  const hasActiveFilters = dateDebut || dateFin || formateurId || typeFormation;

  const loadTendances = async () => {
    try {
      setLoadingTendances(true);

      // Récupérer les données des 6 derniers mois
      const moisData: TendanceData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const dateRef = subMonths(new Date(), i);
        const debut = startOfMonth(dateRef);
        const fin = endOfMonth(dateRef);

        let query = supabase
          .from("formations_validation")
          .select("*")
          .gte("created_at", debut.toISOString())
          .lte("created_at", fin.toISOString());

        if (formateurId) {
          query = query.eq("formateur_id", formateurId);
        }
        if (typeFormation) {
          query = query.eq("type_formation", typeFormation);
        }

        const { data, error } = await query;

        if (error) throw error;

        const total = data?.length || 0;
        const approuvees = data?.filter(f => f.statut === "approuvee").length || 0;
        const rejetees = data?.filter(f => f.statut === "rejetee").length || 0;
        
        const tauxApprobation = total > 0 ? (approuvees / (approuvees + rejetees)) * 100 : 0;

        const formationsRevisees = data?.filter(f => 
          f.reviewed_at && f.created_at && (f.statut === "approuvee" || f.statut === "rejetee")
        ) || [];

        let tempsRevision = 0;
        if (formationsRevisees.length > 0) {
          const totalHeures = formationsRevisees.reduce((sum, f) => {
            const heures = differenceInHours(
              new Date(f.reviewed_at!),
              new Date(f.created_at)
            );
            return sum + heures;
          }, 0);
          tempsRevision = totalHeures / formationsRevisees.length;
        }

        moisData.push({
          mois: format(dateRef, "MMM yyyy", { locale: fr }),
          tauxApprobation: Math.round(tauxApprobation * 10) / 10,
          tempsRevision: Math.round(tempsRevision * 10) / 10,
          total,
          approuvees,
          rejetees
        });
      }

      setTendancesData(moisData);
    } catch (error) {
      console.error("Erreur chargement tendances:", error);
    } finally {
      setLoadingTendances(false);
    }
  };

  const loadStatsComparaison = async () => {
    try {
      let query = supabase.from("formations_validation").select("*");

      if (dateDebutComparaison) {
        query = query.gte("created_at", dateDebutComparaison);
      }
      if (dateFinComparaison) {
        query = query.lte("created_at", dateFinComparaison);
      }
      if (formateurId) {
        query = query.eq("formateur_id", formateurId);
      }
      if (typeFormation) {
        query = query.eq("type_formation", typeFormation);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setStatsComparaison({
          total: 0,
          approuvees: 0,
          rejetees: 0,
          enAttente: 0,
          tauxApprobation: 0,
          tempsRevisionMoyen: 0,
          raisonsRejet: []
        });
        return;
      }

      const total = data.length;
      const approuvees = data.filter(f => f.statut === "approuvee").length;
      const rejetees = data.filter(f => f.statut === "rejetee").length;
      const enAttente = data.filter(f => f.statut === "en_attente").length;

      const tauxApprobation = total > 0 ? (approuvees / (approuvees + rejetees)) * 100 : 0;

      const formationsRevisees = data.filter(f => 
        f.reviewed_at && f.created_at && (f.statut === "approuvee" || f.statut === "rejetee")
      );

      let tempsRevisionMoyen = 0;
      if (formationsRevisees.length > 0) {
        const totalHeures = formationsRevisees.reduce((sum, f) => {
          const heures = differenceInHours(
            new Date(f.reviewed_at!),
            new Date(f.created_at)
          );
          return sum + heures;
        }, 0);
        tempsRevisionMoyen = totalHeures / formationsRevisees.length;
      }

      const formationsRejetees = data.filter(f => 
        f.statut === "rejetee" && f.notes_revision
      );

      const raisonsMap = new Map<string, number>();
      formationsRejetees.forEach(f => {
        const raison = f.notes_revision || "Non spécifié";
        raisonsMap.set(raison, (raisonsMap.get(raison) || 0) + 1);
      });

      const raisonsRejet = Array.from(raisonsMap.entries())
        .map(([raison, count]) => ({ raison, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStatsComparaison({
        total,
        approuvees,
        rejetees,
        enAttente,
        tauxApprobation,
        tempsRevisionMoyen,
        raisonsRejet
      });
    } catch (error) {
      console.error("Erreur chargement stats comparaison:", error);
    }
  };

  const calculerEvolution = (valeurActuelle: number, valeurPrecedente: number) => {
    if (valeurPrecedente === 0) return 0;
    return ((valeurActuelle - valeurPrecedente) / valeurPrecedente) * 100;
  };

  const renderEvolution = (valeurActuelle: number, valeurPrecedente: number, inverse = false) => {
    const evolution = calculerEvolution(valeurActuelle, valeurPrecedente);
    const isPositive = inverse ? evolution < 0 : evolution > 0;
    
    if (Math.abs(evolution) < 0.1) {
      return <Badge variant="outline">Stable</Badge>;
    }

    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {evolution > 0 ? '+' : ''}{evolution.toFixed(1)}%
        </span>
      </div>
    );
  };

  const exportToPDF = async () => {
    try {
      setExportingPdf(true);
      toast.info("Génération du PDF en cours...");

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // En-tête
      pdf.setFontSize(20);
      pdf.setTextColor(33, 33, 33);
      pdf.text("Rapport de Validation des Formations", pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;

      // Période et filtres
      if (dateDebut || dateFin || formateurId || typeFormation) {
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        pdf.text("Filtres appliqués:", 20, yPosition);
        yPosition += 5;
        
        if (dateDebut || dateFin) {
          const periodeText = `Période: ${dateDebut ? format(new Date(dateDebut), "dd/MM/yyyy", { locale: fr }) : "Début"} - ${dateFin ? format(new Date(dateFin), "dd/MM/yyyy", { locale: fr }) : "Fin"}`;
          pdf.text(periodeText, 20, yPosition);
          yPosition += 5;
        }
        if (formateurId) {
          const formateur = formateurs.find(f => f.id === formateurId);
          pdf.text(`Formateur: ${formateur?.prenom} ${formateur?.nom}`, 20, yPosition);
          yPosition += 5;
        }
        if (typeFormation) {
          pdf.text(`Type: ${typeFormation}`, 20, yPosition);
          yPosition += 5;
        }
        yPosition += 5;
      }

      // Métriques principales
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text("Métriques Clés", 20, yPosition);
      yPosition += 8;

      const metrics = [
        { label: "Taux d'approbation", value: `${stats.tauxApprobation.toFixed(1)}%` },
        { label: "Temps de révision moyen", value: `${stats.tempsRevisionMoyen.toFixed(1)}h` },
        { label: "Formations approuvées", value: `${stats.approuvees}` },
        { label: "Formations rejetées", value: `${stats.rejetees}` },
        { label: "En attente", value: `${stats.enAttente}` },
        { label: "Total traité", value: `${stats.total}` }
      ];

      pdf.setFontSize(10);
      metrics.forEach((metric, index) => {
        const x = 20 + (index % 2) * 90;
        const y = yPosition + Math.floor(index / 2) * 8;
        pdf.setTextColor(100, 100, 100);
        pdf.text(metric.label + ":", x, y);
        pdf.setTextColor(33, 33, 33);
        pdf.setFont(undefined, 'bold');
        pdf.text(metric.value, x + 60, y);
        pdf.setFont(undefined, 'normal');
      });

      yPosition += 30;

      // Capture des graphiques
      const graphiquesElement = document.getElementById('graphiques-evolution');
      if (graphiquesElement) {
        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text("Évolution Temporelle", 20, yPosition);
        yPosition += 10;

        const canvas = await html2canvas(graphiquesElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }

      // Distribution des statuts
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text("Distribution des Statuts", 20, yPosition);
      yPosition += 8;

      const barHeight = 6;
      const barWidth = pageWidth - 80;

      // Approuvées
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Approuvées: ${stats.approuvees}`, 20, yPosition);
      yPosition += 5;
      pdf.setFillColor(34, 197, 94);
      pdf.rect(20, yPosition, (stats.approuvees / stats.total) * barWidth, barHeight, 'F');
      yPosition += 10;

      // Rejetées
      pdf.text(`Rejetées: ${stats.rejetees}`, 20, yPosition);
      yPosition += 5;
      pdf.setFillColor(239, 68, 68);
      pdf.rect(20, yPosition, (stats.rejetees / stats.total) * barWidth, barHeight, 'F');
      yPosition += 10;

      // En attente
      pdf.text(`En attente: ${stats.enAttente}`, 20, yPosition);
      yPosition += 5;
      pdf.setFillColor(249, 115, 22);
      pdf.rect(20, yPosition, (stats.enAttente / stats.total) * barWidth, barHeight, 'F');
      yPosition += 15;

      // Raisons de rejet
      if (stats.raisonsRejet.length > 0) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(33, 33, 33);
        pdf.text("Principales Raisons de Rejet", 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        stats.raisonsRejet.forEach((raison, index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setTextColor(100, 100, 100);
          pdf.text(`${index + 1}.`, 20, yPosition);
          pdf.setTextColor(33, 33, 33);
          
          const maxWidth = pageWidth - 50;
          const lines = pdf.splitTextToSize(`(${raison.count}x) ${raison.raison}`, maxWidth);
          pdf.text(lines, 27, yPosition);
          yPosition += 5 * lines.length + 3;
        });
      }

      // Pied de page sur toutes les pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} sur ${totalPages} - Ministère des Pêches`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Sauvegarder le PDF
      const filename = `rapport-validation-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`;
      pdf.save(filename);
      
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);

      let query = supabase.from("formations_validation").select("*");

      // Appliquer les filtres
      if (dateDebut) {
        query = query.gte("created_at", dateDebut);
      }
      if (dateFin) {
        query = query.lte("created_at", dateFin);
      }
      if (formateurId) {
        query = query.eq("formateur_id", formateurId);
      }
      if (typeFormation) {
        query = query.eq("type_formation", typeFormation);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const total = data.length;
      const approuvees = data.filter(f => f.statut === "approuvee").length;
      const rejetees = data.filter(f => f.statut === "rejetee").length;
      const enAttente = data.filter(f => f.statut === "en_attente").length;

      const tauxApprobation = total > 0 ? (approuvees / (approuvees + rejetees)) * 100 : 0;

      // Calculer le temps de révision moyen
      const formationsRevisees = data.filter(f => 
        f.reviewed_at && f.created_at && (f.statut === "approuvee" || f.statut === "rejetee")
      );

      let tempsRevisionMoyen = 0;
      if (formationsRevisees.length > 0) {
        const totalHeures = formationsRevisees.reduce((sum, f) => {
          const heures = differenceInHours(
            new Date(f.reviewed_at!),
            new Date(f.created_at)
          );
          return sum + heures;
        }, 0);
        tempsRevisionMoyen = totalHeures / formationsRevisees.length;
      }

      // Extraire les raisons de rejet
      const formationsRejetees = data.filter(f => 
        f.statut === "rejetee" && f.notes_revision
      );

      const raisonsMap = new Map<string, number>();
      formationsRejetees.forEach(f => {
        const raison = f.notes_revision || "Non spécifié";
        raisonsMap.set(raison, (raisonsMap.get(raison) || 0) + 1);
      });

      const raisonsRejet = Array.from(raisonsMap.entries())
        .map(([raison, count]) => ({ raison, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        total,
        approuvees,
        rejetees,
        enAttente,
        tauxApprobation,
        tempsRevisionMoyen,
        raisonsRejet
      });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Statistiques de Validation
              </CardTitle>
              <CardDescription>
                Vue d'ensemble des performances du système de validation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToPDF}
                disabled={exportingPdf}
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-1" />
                )}
                Exporter PDF
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtres et Comparaison
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="modeComparaison" className="text-sm">Mode comparaison</Label>
              <Switch
                id="modeComparaison"
                checked={modeComparaison}
                onCheckedChange={setModeComparaison}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                {modeComparaison ? "Période 1 (actuelle)" : "Filtres"}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formateur">Formateur</Label>
                  <Select value={formateurId} onValueChange={setFormateurId}>
                    <SelectTrigger id="formateur">
                      <SelectValue placeholder="Tous les formateurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les formateurs</SelectItem>
                      {formateurs.map((formateur) => (
                        <SelectItem key={formateur.id} value={formateur.id}>
                          {formateur.prenom} {formateur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeFormation">Type de formation</Label>
                  <Select value={typeFormation} onValueChange={setTypeFormation}>
                    <SelectTrigger id="typeFormation">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les types</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="gestion">Gestion</SelectItem>
                      <SelectItem value="reglementation">Réglementation</SelectItem>
                      <SelectItem value="securite">Sécurité</SelectItem>
                      <SelectItem value="conservation">Conservation</SelectItem>
                      <SelectItem value="commercialisation">Commercialisation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {modeComparaison && (
              <>
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 border-t" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 border-t" />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Période 2 (comparaison)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateDebutComp">Date début</Label>
                      <Input
                        id="dateDebutComp"
                        type="date"
                        value={dateDebutComparaison}
                        onChange={(e) => setDateDebutComparaison(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFinComp">Date fin</Label>
                      <Input
                        id="dateFinComp"
                        type="date"
                        value={dateFinComparaison}
                        onChange={(e) => setDateFinComparaison(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Taux d'approbation</div>
                {stats.tauxApprobation >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-3xl font-bold text-primary">
                {stats.tauxApprobation.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.approuvees} approuvées / {stats.approuvees + stats.rejetees} traitées
              </div>
              {statsComparaison && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">vs Période 2:</span>
                    {renderEvolution(stats.tauxApprobation, statsComparaison.tauxApprobation)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Temps de révision moyen
              </div>
              <div className="text-3xl font-bold">
                {stats.tempsRevisionMoyen.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">
                Par formation validée
              </div>
              {statsComparaison && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">vs Période 2:</span>
                    {renderEvolution(stats.tempsRevisionMoyen, statsComparaison.tempsRevisionMoyen, true)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Formations approuvées
              </div>
              <div className="text-3xl font-bold text-green-600">
                {stats.approuvees}
              </div>
              <div className="text-xs text-muted-foreground">
                Sur {stats.total} prédictions IA
              </div>
              {statsComparaison && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">vs Période 2:</span>
                    {renderEvolution(stats.approuvees, statsComparaison.approuvees)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" />
                Formations rejetées
              </div>
              <div className="text-3xl font-bold text-red-600">
                {stats.rejetees}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.enAttente} en attente
              </div>
              {statsComparaison && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">vs Période 2:</span>
                    {renderEvolution(stats.rejetees, statsComparaison.rejetees, true)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution des statuts */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approuvées</span>
                <span className="font-medium">{stats.approuvees}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${(stats.approuvees / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rejetées</span>
                <span className="font-medium">{stats.rejetees}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500"
                  style={{ width: `${(stats.rejetees / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En attente</span>
                <span className="font-medium">{stats.enAttente}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500"
                  style={{ width: `${(stats.enAttente / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top raisons de rejet */}
      {stats.raisonsRejet.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Principales Raisons de Rejet</CardTitle>
            <CardDescription>
              Top 5 des motifs de refus de formations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.raisonsRejet.map((raison, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {raison.count}x
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{raison.raison}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques d'évolution temporelle */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution Temporelle (6 derniers mois)</CardTitle>
          <CardDescription>
            Tendances des performances de validation au fil du temps
          </CardDescription>
        </CardHeader>
        <CardContent id="graphiques-evolution">
          {loadingTendances ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Graphique Taux d'approbation */}
              <div>
                <h4 className="text-sm font-medium mb-4">Taux d'approbation (%)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={tendancesData}>
                    <defs>
                      <linearGradient id="colorTaux" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="mois" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tauxApprobation" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTaux)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique Temps de révision */}
              <div>
                <h4 className="text-sm font-medium mb-4">Temps de révision moyen (heures)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tendancesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="mois" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tempsRevision" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique Volume de formations */}
              <div>
                <h4 className="text-sm font-medium mb-4">Volume de formations par statut</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tendancesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="mois" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      name="Total"
                      dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="approuvees" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      name="Approuvées"
                      dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rejetees" 
                      stroke="hsl(var(--chart-5))" 
                      strokeWidth={2}
                      name="Rejetées"
                      dot={{ fill: 'hsl(var(--chart-5))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicateurs de performance */}
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Efficacité du système IA</div>
                <div className="text-xs text-muted-foreground">
                  Basé sur le taux d'approbation des prédictions
                </div>
              </div>
              <Badge 
                variant={stats.tauxApprobation >= 80 ? "default" : stats.tauxApprobation >= 60 ? "secondary" : "destructive"}
              >
                {stats.tauxApprobation >= 80 ? "Excellent" : stats.tauxApprobation >= 60 ? "Bon" : "À améliorer"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Rapidité de validation</div>
                <div className="text-xs text-muted-foreground">
                  Temps moyen de traitement des formations
                </div>
              </div>
              <Badge 
                variant={stats.tempsRevisionMoyen <= 24 ? "default" : stats.tempsRevisionMoyen <= 72 ? "secondary" : "destructive"}
              >
                {stats.tempsRevisionMoyen <= 24 ? "Rapide" : stats.tempsRevisionMoyen <= 72 ? "Normal" : "Lent"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Charge de validation</div>
                <div className="text-xs text-muted-foreground">
                  Formations en attente de traitement
                </div>
              </div>
              <Badge 
                variant={stats.enAttente <= 5 ? "default" : stats.enAttente <= 10 ? "secondary" : "destructive"}
              >
                {stats.enAttente} en attente
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
