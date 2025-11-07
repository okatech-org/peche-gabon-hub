import { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, UserPlus, Edit, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { AddUserDialog } from "./AddUserDialog";
import { EditUserDialog } from "./EditUserDialog";

const roleLabels: Record<string, string> = {
  pecheur: "Pêcheur",
  agent_collecte: "Agent de Collecte",
  gestionnaire_coop: "Gestionnaire Coopérative",
  inspecteur: "Inspecteur",
  direction_provinciale: "Direction Provinciale",
  direction_centrale: "Direction Centrale",
  admin: "Administrateur",
  armateur_pi: "Armateur PI",
  observateur_pi: "Observateur PI",
  analyste: "Analyste",
  ministre: "Ministre",
};

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  province: string | null;
  cooperative_id: string | null;
  phone: string | null;
  created_at: string;
  user_roles: Array<{ role: string }>;
}

export const UsersManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Charger les rôles séparément
      const profilesWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);
          
          return {
            ...profile,
            user_roles: roles || [],
          };
        })
      );

      setUsers(profilesWithRoles as UserWithRoles[]);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;

      toast.success("Utilisateur supprimé avec succès");
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || 
      user.user_roles?.some(ur => ur.role === roleFilter);

    return matchesSearch && matchesRole;
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
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} 
                {roleFilter !== "all" && ` avec le rôle "${roleLabels[roleFilter]}"`}
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouvel Utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-64">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
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
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Rôles</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.user_roles && user.user_roles.length > 0 ? (
                            user.user_roles.map((ur, idx) => (
                              <Badge key={idx} variant="secondary">
                                {roleLabels[ur.role] || ur.role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Aucun rôle</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.province || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
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

      <AddUserDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadUsers}
      />

      {selectedUser && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
};
