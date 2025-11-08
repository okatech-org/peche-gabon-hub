import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fish, LogOut, Menu } from "lucide-react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { RolesManagement } from "@/components/admin/RolesManagement";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { EspecesManagement } from "@/components/admin/EspecesManagement";
import { CooperativesManagement } from "@/components/admin/CooperativesManagement";
import { ImportManagement } from "@/components/admin/ImportManagement";
import { EnginsManagement } from "@/components/admin/EnginsManagement";
import { SitesManagement } from "@/components/admin/SitesManagement";
import { TemplatesManagement } from "@/components/admin/TemplatesManagement";
import { PiroguesManagement } from "@/components/admin/PiroguesManagement";
import { NaviresManagement } from "@/components/admin/NaviresManagement";
import { LicencesManagement } from "@/components/admin/LicencesManagement";
import { QuittancesManagement } from "@/components/admin/QuittancesManagement";
import { FinancesDashboard } from "@/components/admin/FinancesDashboard";
import { PrevisionsDashboard } from "@/components/admin/PrevisionsDashboard";
import { PrevisionsHistoryDashboard } from "@/components/admin/PrevisionsHistoryDashboard";
import { ScenarioSimulationDashboard } from "@/components/admin/ScenarioSimulationDashboard";
import { FacteursExternesDashboard } from "@/components/admin/FacteursExternesDashboard";
import { FinancialOverviewDashboard } from "@/components/admin/FinancialOverviewDashboard";
import { ObjectifsPecheManagement } from "@/components/admin/ObjectifsPecheManagement";
import { TaxesRemonteesDashboard } from "@/components/admin/TaxesRemonteesDashboard";
import { SuiviObjectifsDashboard } from "@/components/admin/SuiviObjectifsDashboard";
import { FinancialExportDashboard } from "@/components/admin/FinancialExportDashboard";
import { FinancialCompleteDashboard } from "@/components/admin/FinancialCompleteDashboard";

const Admin = () => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-3">
                <Fish className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Administration</h1>
                  <p className="text-xs text-muted-foreground">PÊCHE GABON</p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                  Retour Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/roles" element={<RolesManagement />} />
              <Route path="/audit" element={<AuditLogsPlaceholder />} />
              <Route path="/especes" element={<EspecesManagement />} />
              <Route path="/engins" element={<EnginsManagement />} />
              <Route path="/sites" element={<SitesManagement />} />
              <Route path="/cooperatives" element={<CooperativesManagement />} />
              <Route path="/templates" element={<TemplatesManagement />} />
              <Route path="/pirogues" element={<PiroguesManagement />} />
              <Route path="/navires" element={<NaviresManagement />} />
              <Route path="/licences" element={<LicencesManagement />} />
              <Route path="/quittances" element={<QuittancesManagement />} />
              <Route path="/financial-overview" element={<FinancialOverviewDashboard />} />
              <Route path="/finances-complet" element={<FinancialCompleteDashboard />} />
              <Route path="/finances-dashboard" element={<FinancesDashboard />} />
              <Route path="/previsions" element={<PrevisionsDashboard />} />
              <Route path="/previsions-history" element={<PrevisionsHistoryDashboard />} />
              <Route path="/scenarios" element={<ScenarioSimulationDashboard />} />
              <Route path="/facteurs-externes" element={<FacteursExternesDashboard />} />
              <Route path="/objectifs-peche" element={<ObjectifsPecheManagement />} />
              <Route path="/taxes-remontees" element={<TaxesRemonteesDashboard />} />
              <Route path="/suivi-objectifs" element={<SuiviObjectifsDashboard />} />
              <Route path="/import" element={<ImportManagement />} />
              <Route path="/export-financial" element={<FinancialExportDashboard />} />
              <Route path="/export" element={<ExportPlaceholder />} />
              <Route path="/data-integrity" element={<DataIntegrityPlaceholder />} />
              <Route path="/settings" element={<SettingsPlaceholder />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Placeholders pour les sections à implémenter
const AuditLogsPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Logs d'Audit</CardTitle>
      <CardDescription>Journal des actions système (qui/quand/quoi)</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement</p>
    </CardContent>
  </Card>
);

const EspecesPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Gestion des Espèces</CardTitle>
      <CardDescription>Référentiel des espèces halieutiques</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement</p>
    </CardContent>
  </Card>
);

const EnginsPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Gestion des Engins</CardTitle>
      <CardDescription>Référentiel des engins de pêche</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement</p>
    </CardContent>
  </Card>
);

const SitesPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Gestion des Sites</CardTitle>
      <CardDescription>Sites de débarquement et strates</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement</p>
    </CardContent>
  </Card>
);

const CooperativesPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Gestion des Coopératives</CardTitle>
      <CardDescription>Coopératives de pêcheurs</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement</p>
    </CardContent>
  </Card>
);

const ImportPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Import de Données</CardTitle>
      <CardDescription>Importation depuis Excel ou CSV</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement - Assistant d'import guidé avec mapping colonnes et prévisualisation</p>
    </CardContent>
  </Card>
);

const ExportPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Export de Données</CardTitle>
      <CardDescription>Exportation vers Excel ou CSV</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement</p>
    </CardContent>
  </Card>
);

const DataIntegrityPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Intégrité des Données</CardTitle>
      <CardDescription>Vérification et nettoyage - détection de doublons</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement - Détection doublons pirogues, licences, règles de cohérence</p>
    </CardContent>
  </Card>
);

const SettingsPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Paramètres Système</CardTitle>
      <CardDescription>Configuration générale, notifications, sécurité</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Section en cours de développement - MFA, chiffrement, paramétrage notifications</p>
    </CardContent>
  </Card>
);

export default Admin;
