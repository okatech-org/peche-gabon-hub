import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Search, Plus, Edit, Trash2, Anchor, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  type: z.string().trim().max(50).optional(),
  description: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

export const EnginsManagement = () => {
  const [engins, setEngins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      type: "",
      description: "",
    },
  });

  useEffect(() => {
    loadEngins();
  }, []);

  const loadEngins = async () => {
    try {
      const { data, error } = await supabase
        .from('engins')
        .select('*')
        .order('nom');

      if (error) throw error;
      setEngins(data || []);
    } catch (error: any) {
      console.error('Error loading engins:', error);
      toast.error("Erreur lors du chargement des engins");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        nom: data.nom,
        type: data.type || null,
        description: data.description || null,
      };

      if (editing) {
        const { error } = await supabase
          .from('engins')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
        toast.success("Engin modifié avec succès");
      } else {
        const { error } = await supabase
          .from('engins')
          .insert([payload]);

        if (error) throw error;
        toast.success("Engin créé avec succès");
      }

      setDialogOpen(false);
      form.reset();
      setEditing(null);
      loadEngins();
    } catch (error: any) {
      console.error('Error saving engin:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (engin: any) => {
    setEditing(engin);
    form.reset({
      nom: engin.nom,
      type: engin.type || "",
      description: engin.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet engin ?")) return;

    try {
      const { error } = await supabase
        .from('engins')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Engin supprimé avec succès");
      loadEngins();
    } catch (error: any) {
      console.error('Error deleting engin:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleNew = () => {
    setEditing(null);
    form.reset({
      nom: "",
      type: "",
      description: "",
    });
    setDialogOpen(true);
  };

  const filtered = engins.filter(e =>
    e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Anchor className="h-5 w-5" />
                Gestion des Engins de Pêche
              </CardTitle>
              <CardDescription>
                Référentiel des engins et techniques de pêche ({filtered.length} engins)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/import')}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel Engin
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un engin..."
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
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucun engin trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((engin) => (
                    <TableRow key={engin.id}>
                      <TableCell className="font-medium">{engin.nom}</TableCell>
                      <TableCell>{engin.type || '-'}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {engin.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(engin)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(engin.id)}>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'engin" : "Nouvel engin"}
            </DialogTitle>
            <DialogDescription>
              Engin ou technique de pêche utilisé dans la zone
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
                      <Input placeholder="Ex: Filet maillant, Senne de plage..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Actif, Passif, Ligne..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Caractéristiques techniques, usage..." 
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
