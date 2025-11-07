import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, TrendingUp, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Switch } from "@/components/ui/switch";

interface FacteurExterne {
  id: string;
  date_debut: string;
  date_fin: string;
  type_facteur: string;
  nom: string;
  description: string;
  impact_prevu: number;
  impact_reel: number | null;
  importance: string;
  valeur_numerique: number | null;
  unite: string | null;
  actif: boolean;
}

interface ModeleSaisonnier {
  mois: number;
  coefficient_saisonnier: number;
  nb_annees_analyse: number;
  fiabilite: number;
  notes: string | null;
}

export const FacteursExternesDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [facteurs, setFacteurs] = useState<FacteurExterne[]>([]);
  const [modeleSaisonnier, setModeleSaisonnier] = useState<ModeleSaisonnier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacteur, setEditingFacteur] = useState<FacteurExterne | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    type_facteur: 'economique',
    nom: '',
    description: '',
    impact_prevu: 0,
    importance: 'moyenne',
    valeur_numerique: null as number | null,
    unite: '',
    actif: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [facteursResult, saisonnierResult] = await Promise.all([
        supabase
          .from('facteurs_externes')
          .select('*')
          .order('date_debut', { ascending: false }),
        supabase
          .from('modeles_saisonniers')
          .select('*')
          .order('mois')
      ]);

      if (facteursResult.error) throw facteursResult.error;
      if (saisonnierResult.error) throw saisonnierResult.error;

      setFacteurs(facteursResult.data || []);
      setModeleSaisonnier(saisonnierResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFacteur = async () => {
    if (!formData.nom || !formData.date_debut || !formData.date_fin) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        created_by: user?.id,
      };

      if (editingFacteur) {
        const { error } = await supabase
          .from('facteurs_externes')
          .update(dataToSave)
          .eq('id', editingFacteur.id);

        if (error) throw error;
        toast.success("Facteur mis à jour avec succès");
      } else {
        const { error } = await supabase
          .from('facteurs_externes')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Facteur ajouté avec succès");
      }

      setDialogOpen(false);
      setEditingFacteur(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving facteur:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFacteur = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce facteur ?")) return;

    try {
      const { error } = await supabase
        .from('facteurs_externes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Facteur supprimé avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting facteur:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActif = async (facteur: FacteurExterne) => {
    try {
      const { error } = await supabase
        .from('facteurs_externes')
        .update({ actif: !facteur.actif })
        .eq('id', facteur.id);

      if (error) throw error;
      toast.success(`Facteur ${!facteur.actif ? 'activé' : 'désactivé'}`);
      loadData();
    } catch (error: any) {
      console.error('Error toggling facteur:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleEditFacteur = (facteur: FacteurExterne) => {
    setEditingFacteur(facteur);
    setFormData({
      date_debut: facteur.date_debut,
      date_fin: facteur.date_fin,
      type_facteur: facteur.type_facteur,
      nom: facteur.nom,
      description: facteur.description || '',
      impact_prevu: facteur.impact_prevu,
      importance: facteur.importance,
      valeur_numerique: facteur.valeur_numerique,
      unite: facteur.unite || '',
      actif: facteur.actif,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date_debut: '',
      date_fin: '',
      type_facteur: 'economique',
      nom: '',
      description: '',
      impact_prevu: 0,
      importance: 'moyenne',
      valeur_numerique: null,
      unite: '',
      actif: true,
    });
  };

  const getMoisLabel = (mois: number) => {
    const labels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return labels[mois - 1];
  };

  const saisonnierChartData = modeleSaisonnier.map(m => ({
    mois: getMoisLabel(m.mois),
    coefficient: (m.coefficient_saisonnier * 100 - 100).toFixed(1),
    fiabilite: m.fiabilite,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facteurs Externes</h2>
          <p className="text-muted-foreground">
            Gérez les facteurs qui influencent le recouvrement des quittances
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingFacteur(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un Facteur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFacteur ? 'Modifier' : 'Ajouter'} un Facteur Externe
              </DialogTitle>
              <DialogDescription>
                Définissez un événement ou une condition qui peut influencer les taux de recouvrement
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date Début *</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date Fin *</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_facteur">Type de Facteur</Label>
                  <Select
                    value={formData.type_facteur}
                    onValueChange={(value) => setFormData({ ...formData, type_facteur: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saison">Saisonnalité</SelectItem>
                      <SelectItem value="economique">Économique</SelectItem>
                      <SelectItem value="carburant">Prix Carburant</SelectItem>
                      <SelectItem value="evenement">Événement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importance">Importance</Label>
                  <Select
                    value={formData.importance}
                    onValueChange={(value) => setFormData({ ...formData, importance: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faible">Faible</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="forte">Forte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Hausse du prix du carburant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails sur le facteur..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impact_prevu">Impact Prévu (%)</Label>
                  <Input
                    id="impact_prevu"
                    type="number"
                    step="0.1"
                    value={formData.impact_prevu}
                    onChange={(e) => setFormData({ ...formData, impact_prevu: parseFloat(e.target.value) || 0 })}
                    placeholder="+5 ou -3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Positif = amélioration, Négatif = dégradation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valeur_numerique">Valeur Numérique</Label>
                  <Input
                    id="valeur_numerique"
                    type="number"
                    step="0.01"
                    value={formData.valeur_numerique || ''}
                    onChange={(e) => setFormData({ ...formData, valeur_numerique: parseFloat(e.target.value) || null })}
                    placeholder="Ex: 650 (FCFA/L)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unite">Unité</Label>
                <Input
                  id="unite"
                  value={formData.unite}
                  onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                  placeholder="Ex: FCFA/L, %, points"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
                <Label htmlFor="actif">Facteur actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                setEditingFacteur(null);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleSaveFacteur} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modèle Saisonnier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Coefficients Saisonniers
          </CardTitle>
          <CardDescription>
            Impact de chaque mois sur le taux de recouvrement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={saisonnierChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Bar dataKey="coefficient" fill="hsl(var(--primary))" name="Impact Saisonnier" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Liste des Facteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Facteurs Externes Enregistrés
          </CardTitle>
          <CardDescription>
            {facteurs.length} facteur(s) configuré(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facteurs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun facteur externe configuré. Ajoutez-en un pour améliorer la précision des prévisions.
            </p>
          ) : (
            <div className="space-y-4">
              {facteurs.map((facteur) => (
                <div
                  key={facteur.id}
                  className={`border rounded-lg p-4 ${!facteur.actif ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{facteur.nom}</h3>
                        <Badge variant={
                          facteur.type_facteur === 'economique' ? 'default' :
                          facteur.type_facteur === 'carburant' ? 'destructive' :
                          facteur.type_facteur === 'evenement' ? 'secondary' :
                          'outline'
                        }>
                          {facteur.type_facteur}
                        </Badge>
                        <Badge variant={
                          facteur.importance === 'forte' ? 'destructive' :
                          facteur.importance === 'moyenne' ? 'secondary' :
                          'outline'
                        }>
                          {facteur.importance}
                        </Badge>
                        {!facteur.actif && <Badge variant="outline">Inactif</Badge>}
                      </div>
                      {facteur.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {facteur.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Période:</span>
                          <br />
                          <span className="font-medium">
                            {new Date(facteur.date_debut).toLocaleDateString('fr-FR')} au{' '}
                            {new Date(facteur.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impact prévu:</span>
                          <br />
                          <span className={`font-medium ${
                            facteur.impact_prevu > 0 ? 'text-green-600' : 
                            facteur.impact_prevu < 0 ? 'text-destructive' : ''
                          }`}>
                            {facteur.impact_prevu > 0 ? '+' : ''}{facteur.impact_prevu}%
                          </span>
                        </div>
                        {facteur.impact_reel !== null && (
                          <div>
                            <span className="text-muted-foreground">Impact réel:</span>
                            <br />
                            <span className="font-medium">
                              {facteur.impact_reel > 0 ? '+' : ''}{facteur.impact_reel}%
                            </span>
                          </div>
                        )}
                        {facteur.valeur_numerique !== null && (
                          <div>
                            <span className="text-muted-foreground">Valeur:</span>
                            <br />
                            <span className="font-medium">
                              {facteur.valeur_numerique} {facteur.unite}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActif(facteur)}
                      >
                        <Switch checked={facteur.actif} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditFacteur(facteur)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFacteur(facteur.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
