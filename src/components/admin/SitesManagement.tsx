import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Plus, Edit, Trash2, Map, Upload, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  province: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
  latitude: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, "Latitude invalide (-90 à 90)"),
  longitude: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, "Longitude invalide (-180 à 180)"),
  strate_id: z.string().uuid().optional(),
});

type FormData = z.infer<typeof formSchema>;

const provinces = [
  "Estuaire",
  "Haut-Ogooué",
  "Moyen-Ogooué",
  "Ngounié",
  "Nyanga",
  "Ogooué-Ivindo",
  "Ogooué-Lolo",
  "Ogooué-Maritime",
  "Woleu-Ntem",
];

export const SitesManagement = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [strates, setStrates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      province: "",
      description: "",
      latitude: "",
      longitude: "",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sitesResult, stratesResult] = await Promise.all([
        supabase.from('sites').select('*, strates(nom)').order('nom'),
        supabase.from('strates').select('id, nom').order('nom'),
      ]);

      if (sitesResult.error) throw sitesResult.error;
      if (stratesResult.error) throw stratesResult.error;

      setSites(sitesResult.data || []);
      setStrates(stratesResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        nom: data.nom,
        province: data.province || null,
        description: data.description || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        strate_id: data.strate_id || null,
      };

      if (editing) {
        const { error } = await supabase
          .from('sites')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
        toast.success("Site modifié avec succès");
      } else {
        const { error } = await supabase
          .from('sites')
          .insert([payload]);

        if (error) throw error;
        toast.success("Site créé avec succès");
      }

      setDialogOpen(false);
      form.reset();
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving site:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (site: any) => {
    setEditing(site);
    form.reset({
      nom: site.nom,
      province: site.province || "",
      description: site.description || "",
      latitude: site.latitude ? String(site.latitude) : "",
      longitude: site.longitude ? String(site.longitude) : "",
      strate_id: site.strate_id || undefined,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce site ?")) return;

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Site supprimé avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting site:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleNew = () => {
    setEditing(null);
    form.reset({
      nom: "",
      province: "",
      description: "",
      latitude: "",
      longitude: "",
    });
    setDialogOpen(true);
  };

  const filtered = sites.filter(s => {
    const matchesSearch = 
      s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.province?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = provinceFilter === "all" || s.province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Gestion des Sites de Débarquement
              </CardTitle>
              <CardDescription>
                Sites et zones de débarquement ({filtered.length} sites)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/import')}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Site
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes provinces</SelectItem>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Strate</TableHead>
                  <TableHead>Coordonnées GPS</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun site trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.nom}</TableCell>
                      <TableCell>
                        {site.province ? (
                          <Badge variant="outline">{site.province}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{site.strates?.nom || '-'}</TableCell>
                      <TableCell>
                        {site.latitude && site.longitude ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {site.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(site)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(site.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le site" : "Nouveau site"}
            </DialogTitle>
            <DialogDescription>
              Site de débarquement et zone de pêche
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Port de Libreville, Plage de..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provinces.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strate_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strate</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {strates.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.000001"
                          placeholder="Ex: 0.4162" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Degrés décimaux (-90 à 90)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.000001"
                          placeholder="Ex: 9.4673" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Degrés décimaux (-180 à 180)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Caractéristiques du site..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
