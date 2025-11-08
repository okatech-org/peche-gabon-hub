import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Save, X } from "lucide-react";

interface SeuilAlerte {
  id: string;
  nom: string;
  description: string | null;
  indicateur: string;
  type_variation: string;
  seuil_pourcentage: number;
  region: string | null;
  categorie_id: string | null;
  actif: boolean;
  categories_rapports?: {
    nom: string;
    couleur: string;
  };
}

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

const INDICATEURS = [
  { value: "captures_totales", label: "Captures Totales" },
  { value: "cpue_moyen", label: "CPUE Moyen" },
  { value: "nombre_sites", label: "Nombre de Sites" },
  { value: "nombre_sorties", label: "Nombre de Sorties" },
  { value: "captures_par_espece", label: "Captures par Espèce" }
];

const TYPES_VARIATION = [
  { value: "hausse", label: "Hausse" },
  { value: "baisse", label: "Baisse" },
  { value: "tout", label: "Hausse ou Baisse" }
];

const REGIONS = ["Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga", "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"];

export function SeuilsAlertesManagement() {
  const [seuils, setSeuils] = useState<SeuilAlerte[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editedSeuil, setEditedSeuil] = useState<Partial<SeuilAlerte>>({});
  const [newSeuil, setNewSeuil] = useState<Partial<SeuilAlerte>>({
    indicateur: "captures_totales",
    type_variation: "tout",
    seuil_pourcentage: 20,
    actif: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [seuilsRes, categoriesRes] = await Promise.all([
        supabase
          .from("seuils_alertes_rapports")
          .select(`
            *,
            categories_rapports (
              nom,
              couleur
            )
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories_rapports")
          .select("id, nom, couleur")
          .order("nom")
      ]);

      if (seuilsRes.error) throw seuilsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setSeuils(seuilsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des seuils", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (seuil: SeuilAlerte) => {
    setEditingId(seuil.id);
    setEditedSeuil({ ...seuil });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedSeuil({});
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from("seuils_alertes_rapports")
        .update({
          nom: editedSeuil.nom,
          description: editedSeuil.description,
          seuil_pourcentage: editedSeuil.seuil_pourcentage,
          type_variation: editedSeuil.type_variation,
          region: editedSeuil.region,
          categorie_id: editedSeuil.categorie_id,
          actif: editedSeuil.actif
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Seuil mis à jour avec succès");
      setEditingId(null);
      setEditedSeuil({});
      loadData();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.message
      });
    }
  };

  const handleToggleActif = async (id: string, actif: boolean) => {
    try {
      const { error } = await supabase
        .from("seuils_alertes_rapports")
        .update({ actif })
        .eq("id", id);

      if (error) throw error;

      toast.success(actif ? "Seuil activé" : "Seuil désactivé");
      loadData();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.message
      });
    }
  };

  const handleAddSeuil = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("seuils_alertes_rapports")
        .insert({
          nom: newSeuil.nom,
          description: newSeuil.description,
          indicateur: newSeuil.indicateur,
          type_variation: newSeuil.type_variation,
          seuil_pourcentage: newSeuil.seuil_pourcentage,
          region: newSeuil.region || null,
          categorie_id: newSeuil.categorie_id || null,
          actif: newSeuil.actif,
          created_by: userData.user?.id
        });

      if (error) throw error;

      toast.success("Nouveau seuil créé avec succès");
      setShowAddDialog(false);
      setNewSeuil({
        indicateur: "captures_totales",
        type_variation: "tout",
        seuil_pourcentage: 20,
        actif: true
      });
      loadData();
    } catch (error: any) {
      toast.error("Erreur lors de la création", {
        description: error.message
      });
    }
  };

  const getIndicateurLabel = (value: string) => {
    return INDICATEURS.find(i => i.value === value)?.label || value;
  };

  const getTypeVariationLabel = (value: string) => {
    return TYPES_VARIATION.find(t => t.value === value)?.label || value;
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration des Seuils d'Alertes</h2>
          <p className="text-muted-foreground">
            Ajustez les seuils de détection des variations significatives
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Seuil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau seuil d'alerte</DialogTitle>
              <DialogDescription>
                Définissez un seuil personnalisé pour détecter les variations importantes
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-nom">Nom du seuil *</Label>
                <Input
                  id="new-nom"
                  value={newSeuil.nom || ""}
                  onChange={(e) => setNewSeuil({ ...newSeuil, nom: e.target.value })}
                  placeholder="Ex: Variation captures région Estuaire"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newSeuil.description || ""}
                  onChange={(e) => setNewSeuil({ ...newSeuil, description: e.target.value })}
                  placeholder="Description du seuil..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-indicateur">Indicateur *</Label>
                  <Select
                    value={newSeuil.indicateur}
                    onValueChange={(value) => setNewSeuil({ ...newSeuil, indicateur: value })}
                  >
                    <SelectTrigger id="new-indicateur">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDICATEURS.map(ind => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-type">Type de variation *</Label>
                  <Select
                    value={newSeuil.type_variation}
                    onValueChange={(value) => setNewSeuil({ ...newSeuil, type_variation: value })}
                  >
                    <SelectTrigger id="new-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_VARIATION.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-seuil">Seuil de variation (%) *</Label>
                <Input
                  id="new-seuil"
                  type="number"
                  value={newSeuil.seuil_pourcentage || ""}
                  onChange={(e) => setNewSeuil({ ...newSeuil, seuil_pourcentage: parseFloat(e.target.value) })}
                  placeholder="20"
                  min="0"
                  max="100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-region">Région (optionnel)</Label>
                  <Select
                    value={newSeuil.region || ""}
                    onValueChange={(value) => setNewSeuil({ ...newSeuil, region: value || null })}
                  >
                    <SelectTrigger id="new-region">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les régions</SelectItem>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-categorie">Catégorie (optionnel)</Label>
                  <Select
                    value={newSeuil.categorie_id || ""}
                    onValueChange={(value) => setNewSeuil({ ...newSeuil, categorie_id: value || null })}
                  >
                    <SelectTrigger id="new-categorie">
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddSeuil} disabled={!newSeuil.nom || !newSeuil.indicateur}>
                Créer le seuil
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seuils configurés</CardTitle>
          <CardDescription>
            {seuils.length} seuil{seuils.length > 1 ? "s" : ""} configuré{seuils.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Indicateur</TableHead>
                <TableHead>Variation</TableHead>
                <TableHead>Seuil</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seuils.map((seuil) => (
                <TableRow key={seuil.id}>
                  <TableCell>
                    {editingId === seuil.id ? (
                      <Input
                        value={editedSeuil.nom || ""}
                        onChange={(e) => setEditedSeuil({ ...editedSeuil, nom: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <div className="font-medium">{seuil.nom}</div>
                        {seuil.description && (
                          <div className="text-xs text-muted-foreground">{seuil.description}</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getIndicateurLabel(seuil.indicateur)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingId === seuil.id ? (
                      <Select
                        value={editedSeuil.type_variation}
                        onValueChange={(value) => setEditedSeuil({ ...editedSeuil, type_variation: value })}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES_VARIATION.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getTypeVariationLabel(seuil.type_variation)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === seuil.id ? (
                      <Input
                        type="number"
                        value={editedSeuil.seuil_pourcentage || ""}
                        onChange={(e) => setEditedSeuil({ ...editedSeuil, seuil_pourcentage: parseFloat(e.target.value) })}
                        className="h-8 w-20"
                        min="0"
                        max="100"
                      />
                    ) : (
                      <span className="font-semibold">{seuil.seuil_pourcentage}%</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === seuil.id ? (
                      <Select
                        value={editedSeuil.region || ""}
                        onValueChange={(value) => setEditedSeuil({ ...editedSeuil, region: value || null })}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes</SelectItem>
                          {REGIONS.map(region => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      seuil.region || <span className="text-muted-foreground">Toutes</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === seuil.id ? (
                      <Select
                        value={editedSeuil.categorie_id || ""}
                        onValueChange={(value) => setEditedSeuil({ ...editedSeuil, categorie_id: value || null })}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : seuil.categories_rapports ? (
                      <Badge style={{ backgroundColor: seuil.categories_rapports.couleur }}>
                        {seuil.categories_rapports.nom}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Toutes</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={editingId === seuil.id ? editedSeuil.actif : seuil.actif}
                      onCheckedChange={(checked) => {
                        if (editingId === seuil.id) {
                          setEditedSeuil({ ...editedSeuil, actif: checked });
                        } else {
                          handleToggleActif(seuil.id, checked);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === seuil.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(seuil.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(seuil)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
