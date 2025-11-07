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
import { Loader2, Search, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(100),
  nom_scientifique: z.string().trim().max(100).optional(),
  code: z.string().trim().max(20).optional(),
  categorie: z.enum(["pelagique", "demersal", "crustace", "autre"]),
  description: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

const categorieLabels = {
  pelagique: "Pélagique",
  demersal: "Démersal",
  crustace: "Crustacé",
  autre: "Autre",
};

const categorieColors = {
  pelagique: "bg-blue-100 text-blue-800",
  demersal: "bg-green-100 text-green-800",
  crustace: "bg-orange-100 text-orange-800",
  autre: "bg-gray-100 text-gray-800",
};

export const EspecesManagement = () => {
  const [especes, setEspeces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEspece, setEditingEspece] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      nom_scientifique: "",
      code: "",
      categorie: "autre",
      description: "",
    },
  });

  useEffect(() => {
    loadEspeces();
  }, []);

  const loadEspeces = async () => {
    try {
      const { data, error } = await supabase
        .from('especes')
        .select('*')
        .order('nom');

      if (error) throw error;
      setEspeces(data || []);
    } catch (error: any) {
      console.error('Error loading especes:', error);
      toast.error("Erreur lors du chargement des espèces");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        nom: data.nom,
        nom_scientifique: data.nom_scientifique || null,
        code: data.code || null,
        categorie: data.categorie,
        description: data.description || null,
      };

      if (editingEspece) {
        const { error } = await supabase
          .from('especes')
          .update(payload)
          .eq('id', editingEspece.id);

        if (error) throw error;
        toast.success("Espèce modifiée avec succès");
      } else {
        const { error } = await supabase
          .from('especes')
          .insert([payload]);

        if (error) throw error;
        toast.success("Espèce créée avec succès");
      }

      setDialogOpen(false);
      form.reset();
      setEditingEspece(null);
      loadEspeces();
    } catch (error: any) {
      console.error('Error saving espece:', error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (espece: any) => {
    setEditingEspece(espece);
    form.reset(espece);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette espèce ?")) return;

    try {
      const { error } = await supabase
        .from('especes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Espèce supprimée avec succès");
      loadEspeces();
    } catch (error: any) {
      console.error('Error deleting espece:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleNewEspece = () => {
    setEditingEspece(null);
    form.reset({
      nom: "",
      nom_scientifique: "",
      code: "",
      categorie: "autre",
      description: "",
    });
    setDialogOpen(true);
  };

  const filteredEspeces = especes.filter(espece =>
    espece.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    espece.nom_scientifique?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    espece.code?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <CardTitle>Gestion des Espèces</CardTitle>
              <CardDescription>
                Référentiel des espèces halieutiques ({filteredEspeces.length} espèces)
              </CardDescription>
            </div>
            <Button onClick={handleNewEspece}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Espèce
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une espèce..."
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
                  <TableHead>Nom Scientifique</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEspeces.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune espèce trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEspeces.map((espece) => (
                    <TableRow key={espece.id}>
                      <TableCell className="font-medium">{espece.nom}</TableCell>
                      <TableCell className="italic text-muted-foreground">
                        {espece.nom_scientifique || '-'}
                      </TableCell>
                      <TableCell>
                        {espece.code ? (
                          <Badge variant="outline">{espece.code}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={categorieColors[espece.categorie as keyof typeof categorieColors]}>
                          {categorieLabels[espece.categorie as keyof typeof categorieLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(espece)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(espece.id)}
                          >
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
              {editingEspece ? "Modifier l'espèce" : "Nouvelle espèce"}
            </DialogTitle>
            <DialogDescription>
              Référentiel des espèces halieutiques du Gabon
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
                      <Input placeholder="Capitaine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nom_scientifique"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom Scientifique</FormLabel>
                    <FormControl>
                      <Input placeholder="Polydactylus quadrifilis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="CAP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categorie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categorieLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Input placeholder="Informations complémentaires..." {...field} />
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
                  {editingEspece ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
