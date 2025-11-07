import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Activity,
  ArrowLeft,
  UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleLabels: Record<string, string> = {
  pecheur: "Pêcheur",
  agent_collecte: "Agent de Collecte",
  gestionnaire_coop: "Gestionnaire Coopérative",
  inspecteur: "Inspecteur",
  direction_provinciale: "Direction Provinciale",
  direction_centrale: "Direction Centrale",
  admin: "Administrateur",
  armateur_pi: "Armateur Pêche Industrielle",
  observateur_pi: "Observateur Pêche Industrielle",
  analyste: "Analyste",
  ministre: "Ministre",
};

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

const Admin = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate("/dashboard");
      return;
    }
    fetchUsers();
  }, [hasRole, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        roles: (userRoles || [])
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des utilisateurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Administration</h1>
                <p className="text-sm text-muted-foreground">
                  Gestion des rôles et permissions
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rôles Disponibles
              </CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">11</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Logs d'Audit
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Utilisateurs et Rôles</CardTitle>
                <CardDescription>
                  Gérez les utilisateurs et leurs permissions
                </CardDescription>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter un Utilisateur
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="secondary">
                                {roleLabels[role] || role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Aucun rôle
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Roles Matrix */}
        <Card className="shadow-card mt-8">
          <CardHeader>
            <CardTitle>Matrice des Permissions</CardTitle>
            <CardDescription>
              Vue d'ensemble des permissions par rôle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(roleLabels).map(([roleKey, roleLabel]) => (
                <div key={roleKey} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{roleLabel}</h4>
                    <p className="text-sm text-muted-foreground">
                      {roleKey === 'admin' && "Accès complet à toutes les fonctionnalités"}
                      {roleKey === 'ministre' && "Dashboards exécutifs en lecture"}
                      {roleKey === 'direction_centrale' && "Lecture complète + validation + réglementation"}
                      {roleKey === 'direction_provinciale' && "Lecture province + validation demandes"}
                      {roleKey === 'analyste' && "Toutes données en lecture + exports"}
                      {roleKey === 'inspecteur' && "Surveillance, infractions, saisies"}
                      {roleKey === 'agent_collecte' && "Captures PA, licences, demandes, quittances"}
                      {roleKey === 'pecheur' && "Captures PA (ses données), licences (la sienne)"}
                      {roleKey === 'gestionnaire_coop' && "Pirogues, pêcheurs, captures de sa coopérative"}
                      {roleKey === 'armateur_pi' && "Captures PI (son armement), navires"}
                      {roleKey === 'observateur_pi' && "Captures PI, rejets, journal de marée"}
                    </p>
                  </div>
                  <Badge variant="outline">{roleKey}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
