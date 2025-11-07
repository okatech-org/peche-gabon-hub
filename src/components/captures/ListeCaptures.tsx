import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Fish, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const ListeCaptures = () => {
  const [captures, setCaptures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaptures();
  }, []);

  const loadCaptures = async () => {
    try {
      const { data, error } = await supabase
        .from('captures_pa')
        .select(`
          *,
          pirogues (nom, immatriculation),
          sites (nom),
          engins (nom),
          especes (nom, categorie)
        `)
        .order('date_capture', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCaptures(data || []);
    } catch (error) {
      console.error('Error loading captures:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (captures.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Fish className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Aucune capture déclarée</p>
          <p className="text-sm text-muted-foreground">
            Commencez par déclarer votre première capture
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Captures Récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pirogue</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Espèce</TableHead>
                <TableHead>Engin</TableHead>
                <TableHead className="text-right">Poids (kg)</TableHead>
                <TableHead className="text-right">Effort (h)</TableHead>
                <TableHead className="text-right">CPUE</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {captures.map((capture) => (
                <TableRow key={capture.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(capture.date_capture), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{capture.pirogues?.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        {capture.pirogues?.immatriculation}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{capture.sites?.nom}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{capture.especes?.nom}</div>
                      <Badge variant="outline" className="text-xs">
                        {capture.especes?.categorie}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{capture.engins?.nom}</TableCell>
                  <TableCell className="text-right font-medium">
                    {capture.poids_kg.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {capture.effort_unite ? capture.effort_unite.toFixed(1) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {capture.cpue ? (
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {capture.cpue.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={capture.valide ? "default" : "secondary"}>
                      {capture.valide ? 'Validée' : 'En attente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
