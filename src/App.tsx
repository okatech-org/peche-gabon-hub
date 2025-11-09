import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Demo from "./pages/Demo";
import Captures from "./pages/Captures";
import MonCompte from "./pages/MonCompte";
import MesTaxes from "./pages/MesTaxes";
import PecheurRemontees from "./pages/PecheurRemontees";
import MinisterLayout from "./pages/minister/MinisterLayout";
import Overview from "./pages/minister/Overview";
import ArtisanalFishing from "./pages/minister/ArtisanalFishing";
import IndustrialFishing from "./pages/minister/IndustrialFishing";
import Surveillance from "./pages/minister/Surveillance";
import Economy from "./pages/minister/Economy";
import InstitutionalFlows from "./pages/minister/InstitutionalFlows";
import Alerts from "./pages/minister/Alerts";
import ActionsMinisterielles from "./pages/minister/ActionsMinisterielles";
import Formations from "./pages/minister/Formations";
import Remontees from "./pages/minister/Remontees";
import History from "./pages/minister/History";
import Settings from "./pages/minister/Settings";
import PublicDocumentsRegistry from "./pages/PublicDocumentsRegistry";
import DGPADashboard from "./pages/DGPADashboard";
import ANPADashboard from "./pages/ANPADashboard";
import AGASADashboard from "./pages/AGASADashboard";
import DGMMDashboard from "./pages/DGMMDashboard";
import OPRAGDashboard from "./pages/OPRAGDashboard";
import ANPNDashboard from "./pages/ANPNDashboard";
import ArmeurDashboard from "./pages/ArmeurDashboard";
import CooperativeDashboard from "./pages/CooperativeDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/registre-documents" element={<PublicDocumentsRegistry />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/captures"
              element={
                <ProtectedRoute>
                  <Captures />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-remontees"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <PecheurRemontees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-taxes"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <MesTaxes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-compte"
              element={
                <ProtectedRoute allowedRoles={['pecheur']}>
                  <MonCompte />
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
              <Route path="institutional-flows" element={<InstitutionalFlows />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="remontees" element={<Remontees />} />
              <Route path="actions" element={<ActionsMinisterielles />} />
              <Route path="formations" element={<Formations />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
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
                  <ArmeurDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cooperative-dashboard"
              element={
                <ProtectedRoute allowedRoles={['gestionnaire_coop', 'admin']}>
                  <CooperativeDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
