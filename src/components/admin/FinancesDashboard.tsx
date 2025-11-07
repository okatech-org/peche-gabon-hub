import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Receipt, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";

export const FinancesDashboard = () => {
  const [quittances, setQuittances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('quittances')
        .select('*')
        .eq('annee', selectedYear)
        .order('mois');

      if (error) throw error;
      setQuittances(data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Calculs statistiques
  const totalAttendu = quittances.reduce((sum, q) => sum + (q.montant || 0), 0);
  const totalPaye = quittances.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0);
  const totalEnAttente = quittances.filter(q => q.statut === 'en_attente').reduce((sum, q) => sum + (q.montant || 0), 0);
  const totalRetard = quittances.filter(q => q.statut === 'retard').reduce((sum, q) => sum + (q.montant || 0), 0);
  const tauxRecouvrement = totalAttendu > 0 ? (totalPaye / totalAttendu) * 100 : 0;

  const nbQuittances = quittances.length;
  const nbPayees = quittances.filter(q => q.statut === 'paye').length;
  const nbEnAttente = quittances.filter(q => q.statut === 'en_attente').length;
  const nbRetard = quittances.filter(q => q.statut === 'retard').length;

  // Données pour le graphique par mois
  const getMoisLabel = (mois: number) => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return labels[mois - 1];
  };

  const paiementsParMois = Array.from({ length: 12 }, (_, i) => {
    const mois = i + 1;
    const quittancesMois = quittances.filter(q => q.mois === mois);
    const attendu = quittancesMois.reduce((sum, q) => sum + (q.montant || 0), 0);
    const paye = quittancesMois.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0);
    
    return {
      mois: getMoisLabel(mois),
      attendu: attendu / 1000, // Convertir en milliers
      paye: paye / 1000,
      difference: (attendu - paye) / 1000,
    };
  });

  // Données pour le graphique en camembert (répartition des statuts)
  const repartitionStatuts = [
    { name: 'Payé', value: nbPayees, color: '#22c55e' },
    { name: 'En attente', value: nbEnAttente, color: '#f97316' },
    { name: 'Retard', value: nbRetard, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Données pour le graphique de tendance (taux de recouvrement mensuel)
  const tauxParMois = Array.from({ length: 12 }, (_, i) => {
    const mois = i + 1;
    const quittancesMois = quittances.filter(q => q.mois === mois);
    const attendu = quittancesMois.reduce((sum, q) => sum + (q.montant || 0), 0);
    const paye = quittancesMois.filter(q => q.statut === 'paye').reduce((sum, q) => sum + (q.montant || 0), 0);
    const taux = attendu > 0 ? (paye / attendu) * 100 : 0;
    
    return {
      mois: getMoisLabel(mois),
      taux: Math.round(taux),
    };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur d'année */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord Financier</h2>
          <p className="text-muted-foreground">
            Suivi des paiements et recouvrement des quittances
          </p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total Attendu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendu.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {nbQuittances} quittances émises
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPaye.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {nbPayees} quittances payées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
            {tauxRecouvrement >= 70 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${tauxRecouvrement >= 70 ? 'text-green-600' : 'text-destructive'}`}>
              {tauxRecouvrement.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Objectif: 80%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente / Retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(totalEnAttente + totalRetard).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {nbEnAttente + nbRetard} quittances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Graphique des paiements par mois */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des Paiements Mensuels</CardTitle>
            <CardDescription>Comparaison montants attendus vs payés (en milliers FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paiementsParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${(value * 1000).toLocaleString()} FCFA`}
                />
                <Legend />
                <Bar dataKey="attendu" fill="#3b82f6" name="Attendu" />
                <Bar dataKey="paye" fill="#22c55e" name="Payé" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique du taux de recouvrement */}
        <Card>
          <CardHeader>
            <CardTitle>Taux de Recouvrement Mensuel</CardTitle>
            <CardDescription>Pourcentage des paiements reçus par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tauxParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Line 
                  type="monotone" 
                  dataKey="taux" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Taux (%)"
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des statuts */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Quittances</CardTitle>
            <CardDescription>Par statut de paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={repartitionStatuts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repartitionStatuts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {repartitionStatuts.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <Badge variant="outline">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau récapitulatif mensuel */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif Mensuel Détaillé</CardTitle>
          <CardDescription>Vue d'ensemble des paiements mois par mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Mois</th>
                  <th className="text-right py-3 px-4 font-medium">Attendu</th>
                  <th className="text-right py-3 px-4 font-medium">Payé</th>
                  <th className="text-right py-3 px-4 font-medium">Reste à payer</th>
                  <th className="text-right py-3 px-4 font-medium">Taux</th>
                </tr>
              </thead>
              <tbody>
                {paiementsParMois.map((data, idx) => {
                  const attendu = data.attendu * 1000;
                  const paye = data.paye * 1000;
                  const reste = attendu - paye;
                  const taux = attendu > 0 ? (paye / attendu) * 100 : 0;
                  
                  return (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{data.mois}</td>
                      <td className="text-right py-3 px-4">{attendu.toLocaleString()} FCFA</td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        {paye.toLocaleString()} FCFA
                      </td>
                      <td className="text-right py-3 px-4 text-orange-600">
                        {reste.toLocaleString()} FCFA
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge 
                          variant={taux >= 80 ? "default" : taux >= 50 ? "secondary" : "destructive"}
                        >
                          {taux.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-muted">
                  <td className="py-3 px-4">TOTAL</td>
                  <td className="text-right py-3 px-4">{totalAttendu.toLocaleString()} FCFA</td>
                  <td className="text-right py-3 px-4 text-green-600">
                    {totalPaye.toLocaleString()} FCFA
                  </td>
                  <td className="text-right py-3 px-4 text-orange-600">
                    {(totalAttendu - totalPaye).toLocaleString()} FCFA
                  </td>
                  <td className="text-right py-3 px-4">
                    <Badge 
                      variant={tauxRecouvrement >= 80 ? "default" : tauxRecouvrement >= 50 ? "secondary" : "destructive"}
                    >
                      {tauxRecouvrement.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alertes et recommandations */}
      {tauxRecouvrement < 70 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Taux de Recouvrement Faible
            </CardTitle>
            <CardDescription>
              Le taux de recouvrement actuel ({tauxRecouvrement.toFixed(1)}%) est inférieur à l'objectif de 80%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• {nbRetard} quittances en retard pour un montant de {totalRetard.toLocaleString()} FCFA</li>
              <li>• {nbEnAttente} quittances en attente pour un montant de {totalEnAttente.toLocaleString()} FCFA</li>
              <li>• Recommandation: Relancer les propriétaires pour les paiements en retard</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};