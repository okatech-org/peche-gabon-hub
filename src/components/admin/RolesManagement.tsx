import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Check, X } from "lucide-react";

const rolesConfig = [
  {
    role: "admin",
    label: "Administrateur",
    description: "Accès complet au système",
    permissions: {
      users: { read: true, write: true, delete: true },
      captures: { read: true, write: true, delete: true },
      licences: { read: true, write: true, delete: true },
      surveillance: { read: true, write: true, delete: true },
      analytics: { read: true, write: true, delete: false },
      exports: true,
    },
  },
  {
    role: "pecheur",
    label: "Pêcheur",
    description: "Déclaration de captures personnelles",
    permissions: {
      users: { read: false, write: false, delete: false },
      captures: { read: true, write: true, delete: false },
      licences: { read: true, write: false, delete: false },
      surveillance: { read: false, write: false, delete: false },
      analytics: { read: false, write: false, delete: false },
      exports: false,
    },
  },
  {
    role: "agent_collecte",
    label: "Agent de Collecte",
    description: "Saisie terrain et validation captures",
    permissions: {
      users: { read: false, write: false, delete: false },
      captures: { read: true, write: true, delete: false },
      licences: { read: true, write: true, delete: false },
      surveillance: { read: false, write: false, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: true,
    },
  },
  {
    role: "gestionnaire_coop",
    label: "Gestionnaire Coopérative",
    description: "Gestion pirogues et pêcheurs de la coop",
    permissions: {
      users: { read: true, write: true, delete: false },
      captures: { read: true, write: false, delete: false },
      licences: { read: true, write: false, delete: false },
      surveillance: { read: false, write: false, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: true,
    },
  },
  {
    role: "inspecteur",
    label: "Inspecteur",
    description: "Surveillance et contrôle infractions",
    permissions: {
      users: { read: true, write: false, delete: false },
      captures: { read: true, write: false, delete: false },
      licences: { read: true, write: false, delete: false },
      surveillance: { read: true, write: true, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: true,
    },
  },
  {
    role: "direction_provinciale",
    label: "Direction Provinciale",
    description: "Supervision et validation province",
    permissions: {
      users: { read: true, write: false, delete: false },
      captures: { read: true, write: false, delete: false },
      licences: { read: true, write: true, delete: false },
      surveillance: { read: true, write: false, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: true,
    },
  },
  {
    role: "direction_centrale",
    label: "Direction Centrale",
    description: "Supervision nationale et analytics",
    permissions: {
      users: { read: true, write: false, delete: false },
      captures: { read: true, write: false, delete: false },
      licences: { read: true, write: true, delete: false },
      surveillance: { read: true, write: true, delete: false },
      analytics: { read: true, write: true, delete: false },
      exports: true,
    },
  },
  {
    role: "analyste",
    label: "Analyste",
    description: "Lecture toutes données et exports",
    permissions: {
      users: { read: false, write: false, delete: false },
      captures: { read: true, write: false, delete: false },
      licences: { read: true, write: false, delete: false },
      surveillance: { read: true, write: false, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: true,
    },
  },
  {
    role: "ministre",
    label: "Ministre",
    description: "Dashboards exécutifs",
    permissions: {
      users: { read: false, write: false, delete: false },
      captures: { read: true, write: false, delete: false },
      licences: { read: true, write: false, delete: false },
      surveillance: { read: true, write: false, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: false,
    },
  },
  {
    role: "armateur_pi",
    label: "Armateur Pêche Industrielle",
    description: "Gestion flotte et captures industrielles",
    permissions: {
      users: { read: false, write: false, delete: false },
      captures: { read: true, write: true, delete: false },
      licences: { read: true, write: false, delete: false },
      surveillance: { read: false, write: false, delete: false },
      analytics: { read: true, write: false, delete: false },
      exports: true,
    },
  },
  {
    role: "observateur_pi",
    label: "Observateur Pêche Industrielle",
    description: "Déclaration marées et rejets",
    permissions: {
      users: { read: false, write: false, delete: false },
      captures: { read: false, write: true, delete: false },
      licences: { read: false, write: false, delete: false },
      surveillance: { read: false, write: false, delete: false },
      analytics: { read: false, write: false, delete: false },
      exports: false,
    },
  },
];

const PermissionIcon = ({ value }: { value: boolean }) =>
  value ? (
    <Check className="h-4 w-4 text-green-600" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground" />
  );

export const RolesManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Matrice des Rôles et Permissions
          </CardTitle>
          <CardDescription>
            Configuration RBAC pour les {rolesConfig.length} rôles du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Rôle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Utilisateurs</TableHead>
                  <TableHead className="text-center">Captures</TableHead>
                  <TableHead className="text-center">Licences</TableHead>
                  <TableHead className="text-center">Surveillance</TableHead>
                  <TableHead className="text-center">Analytics</TableHead>
                  <TableHead className="text-center">Exports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesConfig.map((config) => (
                  <TableRow key={config.role}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <Badge variant="outline" className="mt-1">
                          {config.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {config.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <PermissionIcon value={config.permissions.users.read} />
                        <PermissionIcon value={config.permissions.users.write} />
                        <PermissionIcon value={config.permissions.users.delete} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <PermissionIcon value={config.permissions.captures.read} />
                        <PermissionIcon value={config.permissions.captures.write} />
                        <PermissionIcon value={config.permissions.captures.delete} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <PermissionIcon value={config.permissions.licences.read} />
                        <PermissionIcon value={config.permissions.licences.write} />
                        <PermissionIcon value={config.permissions.licences.delete} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <PermissionIcon value={config.permissions.surveillance.read} />
                        <PermissionIcon value={config.permissions.surveillance.write} />
                        <PermissionIcon value={config.permissions.surveillance.delete} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <PermissionIcon value={config.permissions.analytics.read} />
                        <PermissionIcon value={config.permissions.analytics.write} />
                        <PermissionIcon value={config.permissions.analytics.delete} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <PermissionIcon value={config.permissions.exports} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Lecture</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Écriture</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Suppression</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
