import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import PecheurLayout from "./pages/pecheur/PecheurLayout";
import PecheurOverview from "./pages/pecheur/PecheurOverview";
import InspecteurLayout from "./pages/inspecteur/InspecteurLayout";
import InspecteurOverview from "./pages/inspecteur/InspecteurOverview";
import Inspections from "./pages/inspecteur/Inspections";
import Carte from "./pages/inspecteur/Carte";
import Licences from "./pages/inspecteur/Licences";
import Infractions from "./pages/inspecteur/Infractions";
import DonneesPubliques from "./pages/DonneesPubliques";
import Actualites from "./pages/Actualites";
import Sensibilisation from "./pages/Sensibilisation";
import Demo from "./pages/Demo";
import Captures from "./pages/Captures";
import MonCompte from "./pages/MonCompte";
import MesTaxes from "./pages/MesTaxes";
import PecheurRemontees from "./pages/PecheurRemontees";
import MesRemontees from "./pages/MesRemontees";
import UserSettings from "./pages/UserSettings";
import MinisterLayout from "./pages/minister/MinisterLayout";
import Overview from "./pages/minister/Overview";
import ArtisanalFishing from "./pages/minister/ArtisanalFishing";
import IndustrialFishing from "./pages/minister/IndustrialFishing";
import Surveillance from "./pages/minister/Surveillance";
import Economy from "./pages/minister/Economy";
import Alerts from "./pages/minister/Alerts";
import ActionsMinisterielles from "./pages/minister/ActionsMinisterielles";
import Formations from "./pages/minister/Formations";
import Remontees from "./pages/minister/Remontees";
import History from "./pages/minister/History";
import Settings from "./pages/minister/Settings";
import IAsted from "./pages/minister/IAsted";
import DailyBriefing from "./pages/minister/DailyBriefing";
import PublicDocumentsRegistry from "./pages/PublicDocumentsRegistry";
import DGPADashboard from "./pages/DGPADashboard";
import ANPADashboard from "./pages/ANPADashboard";
import AGASADashboard from "./pages/AGASADashboard";
import DGMMDashboard from "./pages/DGMMDashboard";
import OPRAGDashboard from "./pages/OPRAGDashboard";
import ANPNDashboard from "./pages/ANPNDashboard";
import ArmeurLayout from "./pages/armeur/ArmeurLayout";
import ArmeurOverview from "./pages/armeur/ArmeurOverview";
import ArmeurFlotte from "./pages/armeur/ArmeurFlotte";
import ArmeurMarees from "./pages/armeur/ArmeurMarees";
import ArmeurTaxes from "./pages/armeur/ArmeurTaxes";
import CooperativeDashboard from "./pages/CooperativeDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
        <BrowserRouter>
          <AuthProvider>
            <PageTransition>
              <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/registre-documents" element={<PublicDocumentsRegistry />} />
          <Route path="/donnees-publiques" element={<DonneesPubliques />} />
          <Route path="/actualites" element={<Actualites />} />
          <Route path="/sensibilisation" element={<Sensibilisation />} />
            {/* Pecheur routes with layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <PecheurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PecheurOverview />} />
            </Route>
            <Route
              path="/captures"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <PecheurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Captures />} />
            </Route>
            <Route
              path="/mes-remontees"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <PecheurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PecheurRemontees />} />
            </Route>
            <Route
              path="/mes-taxes"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <PecheurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MesTaxes />} />
            </Route>
            <Route
              path="/mon-compte"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <PecheurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MonCompte />} />
            </Route>
            <Route
              path="/mes-remontees"
              element={
                <ProtectedRoute allowedRoles={[
                  'pecheur', 'armateur_pi', 'inspecteur', 'cooperative', 'gestionnaire_coop',
                  'dgpa', 'anpa', 'agasa', 'dgmm', 'oprag', 'anpn', 'dgddi', 'corep',
                  'direction_centrale', 'direction_provinciale', 'agent_collecte',
                  'observateur_pi', 'analyste', 'partenaire_international'
                ]}>
                  <MesRemontees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <ProtectedRoute>
                  <UserSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin-dashboard/*"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/minister-dashboard"
              element={
                <ProtectedRoute allowedRoles={['ministre']}>
                  <MinisterLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="artisanal" element={<ArtisanalFishing />} />
              <Route path="industrial" element={<IndustrialFishing />} />
              <Route path="surveillance" element={<Surveillance />} />
              <Route path="economy" element={<Economy />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="remontees" element={<Remontees />} />
              <Route path="actions" element={<ActionsMinisterielles />} />
              <Route path="formations" element={<Formations />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
              <Route path="iasted" element={<IAsted />} />
              <Route path="briefing" element={<DailyBriefing />} />
            </Route>
            <Route
              path="/dgpa-dashboard"
              element={
                <ProtectedRoute allowedRoles={['dgpa', 'admin']}>
                  <DGPADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/anpa-dashboard"
              element={
                <ProtectedRoute allowedRoles={['anpa', 'admin']}>
                  <ANPADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agasa-dashboard"
              element={
                <ProtectedRoute allowedRoles={['agasa', 'admin']}>
                  <AGASADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dgmm-dashboard"
              element={
                <ProtectedRoute allowedRoles={['dgmm', 'admin']}>
                  <DGMMDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/oprag-dashboard"
              element={
                <ProtectedRoute allowedRoles={['oprag', 'admin']}>
                  <OPRAGDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/anpn-dashboard"
              element={
                <ProtectedRoute allowedRoles={['anpn', 'admin']}>
                  <ANPNDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/armeur-dashboard"
              element={
                <ProtectedRoute allowedRoles={['armateur_pi', 'admin']}>
                  <ArmeurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ArmeurOverview />} />
              <Route path="flotte" element={<ArmeurFlotte />} />
              <Route path="marees" element={<ArmeurMarees />} />
              <Route path="remontees" element={<MesRemontees />} />
              <Route path="taxes" element={<ArmeurTaxes />} />
            </Route>
            <Route
              path="/cooperative-dashboard"
              element={
                <ProtectedRoute allowedRoles={['gestionnaire_coop', 'admin']}>
                  <CooperativeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspecteur-dashboard"
              element={
                <ProtectedRoute allowedRoles={['inspecteur', 'admin']}>
                  <InspecteurLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InspecteurOverview />} />
              <Route path="inspections" element={<Inspections />} />
              <Route path="carte" element={<Carte />} />
              <Route path="licences" element={<Licences />} />
              <Route path="infractions" element={<Infractions />} />
              <Route path="remontees" element={<MesRemontees />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </PageTransition>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
