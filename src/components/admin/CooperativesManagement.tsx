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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  responsable: z.string().trim().max(100).optional(),
  telephone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Email invalide").max(255).optional().or(z.literal("")),
  adresse: z.string().trim().max(200).optional(),
  site_id: z.string().uuid().optional(),
  statut: z.enum(["active", "inactive"]).default("active"),
});

type FormData = z.infer<typeof formSchema>;

export const CooperativesManagement = () => {
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      responsable: "",
      telephone: "",
      email: "",
      adresse: "",
      statut: "active",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coopResult, sitesResult] = await Promise.all([
        supabase.from('cooperatives').select('*, sites(nom)').order('nom'),
        supabase.from('sites').select('id, nom').order('nom'),
      ]);

      if (coopResult.error) throw coopResult.error;
      if (sitesResult.error) throw sitesResult.error;

      setCooperatives(coopResult.data || []);
      setSites(sitesResult.data || []);
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
        responsable: data.responsable || null,
        telephone: data.telephone || null,
        email: data.email || null,
        adresse: data.adresse || null,
        site_id: data.site_id || null,
        statut: data.statut,
      };

      if (editing) {
        const { error } = await supabase
          .from('cooperatives')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
        toast.success("Coopérative modifiée avec succès");
      } else {
        const { error } = await supabase
          .from('cooperatives')
          .insert([payload]);

        if (error) throw error;
        toast.success("Coopérative créée avec succès");
      }

      setDialogOpen(false);
      form.reset();
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving cooperative:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coop: any) => {
    setEditing(coop);
    form.reset({
      nom: coop.nom,
      responsable: coop.responsable || "",
      telephone: coop.telephone || "",
      email: coop.email || "",
      adresse: coop.adresse || "",
      site_id: coop.site_id || undefined,
      statut: coop.statut || "active",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette coopérative ?")) return;

    try {
      const { error } = await supabase
        .from('cooperatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Coopérative supprimée avec succès");
      loadData();
    } catch (error: any) {
      console.error('Error deleting cooperative:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleNew = () => {
    setEditing(null);
    form.reset({
      nom: "",
      responsable: "",
      telephone: "",
      email: "",
      adresse: "",
      statut: "active",
    });
    setDialogOpen(true);
  };

  const filtered = cooperatives.filter(c =>
    c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <Building2 className="h-5 w-5" />
                Gestion des Coopératives
              </CardTitle>
              <CardDescription>
                Organisations de pêcheurs ({filtered.length} coopératives)
              </CardDescription>
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Coopérative
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune coopérative trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((coop) => (
                    <TableRow key={coop.id}>
                      <TableCell className="font-medium">{coop.nom}</TableCell>
                      <TableCell>{coop.responsable || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {coop.telephone && <div>{coop.telephone}</div>}
                          {coop.email && <div className="text-muted-foreground">{coop.email}</div>}
                          {!coop.telephone && !coop.email && '-'}
                        </div>
                      </TableCell>
                      <TableCell>{coop.sites?.nom || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={coop.statut === 'active' ? 'default' : 'secondary'}>
                          {coop.statut === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(coop)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(coop.id)}>
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
              {editing ? "Modifier la coopérative" : "Nouvelle coopérative"}
            </DialogTitle>
            <DialogDescription>
              Informations sur la coopérative de pêcheurs
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
                      <Input placeholder="Coopérative de..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du responsable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.nom}
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
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+241 XX XX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="coop@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse complète..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
