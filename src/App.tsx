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
import MinisterDashboard from "./pages/MinisterDashboard";
import DGPADashboard from "./pages/DGPADashboard";
import ANPADashboard from "./pages/ANPADashboard";
import AGASADashboard from "./pages/AGASADashboard";
import DGMMDashboard from "./pages/DGMMDashboard";
import OPRAGDashboard from "./pages/OPRAGDashboard";
import ANPNDashboard from "./pages/ANPNDashboard";
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
                  <MinisterDashboard />
                </ProtectedRoute>
              }
            />
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
