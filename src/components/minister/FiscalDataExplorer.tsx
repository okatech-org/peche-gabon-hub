import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2, Download, Search } from "lucide-react";
import { useCSVData } from "@/hooks/useCSVData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AutorisationArtisanale {
  annee: string;
  numero: string;
  nomPirogue: string;
  immatriculation: string;
  proprietaire: string;
  nationalite: string;
  siteAttache: string;
  cooperative: string;
  montant: number;
  typeDemande: string;
  especeCible1: string;
  especeCible2: string;
  engin1: string;
}

const FiscalDataExplorer = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMontant, setFilterMontant] = useState<string>("all");
  
  const { data: autorisationsData } = useCSVData('/data/analytics/artisanal_autorisations_montants_fcfa.csv');
  const { data: quittancesData } = useCSVData('/data/analytics/artisanal_quittances_taxe_production_long.csv');
  const { data: armateursData } = useCSVData('/data/analytics/industriel_top_armateurs_licences_fcfa.csv');
  const { data: naviresData } = useCSVData('/data/analytics/industriel_top_navires_licences_fcfa.csv');

  const [autorisations, setAutorisations] = useState<AutorisationArtisanale[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    montant150k: 0,
    montant100k: 0,
    montant200k: 0,
    montant50k: 0,
    cooperatives: new Set<string>(),
    sites: new Set<string>(),
  });

  useEffect(() => {
    if (autorisationsData && autorisationsData.length > 1) {
      // Parser les données (skip header)
      const parsed = autorisationsData.slice(1).map((row: any) => ({
        annee: row['Annéée'],
        numero: row['Numéro Auto'],
        nomPirogue: row['Nom Pirogue'],
        immatriculation: row['Immatriculation'],
        proprietaire: row['Propriétaire'],
        nationalite: row['Nationalité'],
        siteAttache: row['Site_attache'],
        cooperative: row['Coopérative'],
        montant: Number(row['Montant']) || 0,
        typeDemande: row['Type demande'],
        especeCible1: row['Espèce cible 1'],
        especeCible2: row['Espèce cible 2'],
        engin1: row['Engin utilisé 1'],
      })).filter((a: AutorisationArtisanale) => a.montant > 0); // Filtrer les lignes valides

      setAutorisations(parsed);

      // Calculer statistiques
      const cooperativesSet = new Set(parsed.map((a: AutorisationArtisanale) => a.cooperative).filter(Boolean));
      const sitesSet = new Set(parsed.map((a: AutorisationArtisanale) => a.siteAttache).filter(Boolean));

      setStats({
        total: parsed.length,
        montant150k: parsed.filter((a: AutorisationArtisanale) => a.montant === 150000).length,
        montant100k: parsed.filter((a: AutorisationArtisanale) => a.montant === 100000).length,
        montant200k: parsed.filter((a: AutorisationArtisanale) => a.montant === 200000).length,
        montant50k: parsed.filter((a: AutorisationArtisanale) => a.montant === 50000).length,
        cooperatives: cooperativesSet,
        sites: sitesSet,
      });

      setLoading(false);
    }
  }, [autorisationsData]);

  // Filtrage des données
  const filteredData = autorisations.filter(a => {
    const matchesSearch = !searchTerm || 
      a.nomPirogue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.proprietaire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cooperative?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMontant = filterMontant === "all" || 
      (filterMontant === "150k" && a.montant === 150000) ||
      (filterMontant === "100k" && a.montant === 100000) ||
      (filterMontant === "200k" && a.montant === 200000) ||
      (filterMontant === "50k" && a.montant === 50000);

    return matchesSearch && matchesMontant;
  });

  const exportToCSV = () => {
    const headers = ["Année", "Numéro", "Pirogue", "Immatriculation", "Propriétaire", "Nationalité", "Site", "Coopérative", "Montant", "Type Demande"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(a => [
        a.annee, a.numero, a.nomPirogue, a.immatriculation, a.proprietaire,
        a.nationalite, a.siteAttache, a.cooperative, a.montant, a.typeDemande
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "autorisations_filtrees.csv");
    link.click();
  };

  if (loading || !autorisations.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques Globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Autorisations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Pirogues enregistrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">150k FCFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montant150k}</div>
            <p className="text-xs text-muted-foreground">{((stats.montant150k / stats.total) * 100).toFixed(1)}% du total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">100k FCFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montant100k}</div>
            <p className="text-xs text-muted-foreground">{((stats.montant100k / stats.total) * 100).toFixed(1)}% du total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">200k FCFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montant200k}</div>
            <p className="text-xs text-muted-foreground">{((stats.montant200k / stats.total) * 100).toFixed(1)}% du total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Coopératives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cooperatives.size}</div>
            <p className="text-xs text-muted-foreground">{stats.sites.size} sites de débarquement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Explorer les Autorisations Artisanales</CardTitle>
          <CardDescription>Base de données complète des {stats.total} autorisations 2024-2025</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par pirogue, immatriculation, propriétaire, coopérative..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterMontant === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMontant("all")}
            >
              Tous ({stats.total})
            </Button>
            <Button
              variant={filterMontant === "150k" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMontant("150k")}
            >
              150k FCFA ({stats.montant150k})
            </Button>
            <Button
              variant={filterMontant === "100k" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMontant("100k")}
            >
              100k FCFA ({stats.montant100k})
            </Button>
            <Button
              variant={filterMontant === "200k" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMontant("200k")}
            >
              200k FCFA ({stats.montant200k})
            </Button>
            <Button
              variant={filterMontant === "50k" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMontant("50k")}
            >
              50k FCFA ({stats.montant50k})
            </Button>
          </div>

          <div className="border rounded-lg max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Année</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Pirogue</TableHead>
                  <TableHead>Immatriculation</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Nationalité</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Coopérative</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 100).map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{a.annee}</TableCell>
                    <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                    <TableCell className="font-medium">{a.nomPirogue}</TableCell>
                    <TableCell className="font-mono text-xs">{a.immatriculation}</TableCell>
                    <TableCell>{a.proprietaire}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{a.nationalite}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{a.siteAttache}</TableCell>
                    <TableCell className="text-xs">{a.cooperative}</TableCell>
                    <TableCell className="font-bold">
                      {a.montant.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.typeDemande === 'Nouvelle demande' ? 'default' : 'secondary'} className="text-xs">
                        {a.typeDemande}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Affichage de 100 sur {filteredData.length} résultats. Utilisez les filtres pour affiner la recherche.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Données Industrielles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Armateurs Industriels</CardTitle>
            <CardDescription>Licences navires par armateur</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Armateur</TableHead>
                  <TableHead className="text-right">EUR</TableHead>
                  <TableHead className="text-right">FCFA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {armateursData?.slice(0, 5).map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.Armateur}</TableCell>
                    <TableCell className="text-right">{Number(row.Montant_EUR).toLocaleString()} €</TableCell>
                    <TableCell className="text-right font-bold">
                      {(Number(row.Montant_FCFA_estime) / 1000000).toFixed(1)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Navires</CardTitle>
            <CardDescription>Licences par navire</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navire</TableHead>
                  <TableHead className="text-right">EUR</TableHead>
                  <TableHead className="text-right">FCFA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {naviresData?.slice(0, 5).map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-xs">{row.Navire}</TableCell>
                    <TableCell className="text-right">{Number(row.Montant_EUR).toLocaleString()} €</TableCell>
                    <TableCell className="text-right font-bold">
                      {(Number(row.Montant_FCFA_estime) / 1000000).toFixed(1)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FiscalDataExplorer;