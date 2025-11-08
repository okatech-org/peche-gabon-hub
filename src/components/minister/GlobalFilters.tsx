import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GlobalFiltersProps {
  onFiltersChange?: (filters: {
    annee: string;
    mois: string;
    province: string;
    typePeche: string;
  }) => void;
}

const GlobalFilters = ({ onFiltersChange }: GlobalFiltersProps) => {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: "tous",
    province: "tous",
    typePeche: "tous",
  });

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const loadProvinces = async () => {
    try {
      const { data } = await supabase
        .from("sites")
        .select("province")
        .not("province", "is", null);

      if (data) {
        const uniqueProvinces = [...new Set(data.map((s) => s.province).filter(Boolean))];
        setProvinces(uniqueProvinces as string[]);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="annee">Année</Label>
            <Select
              value={filters.annee}
              onValueChange={(value) => handleFilterChange("annee", value)}
            >
              <SelectTrigger id="annee">
                <SelectValue placeholder="Sélectionner l'année" />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2024, 2023, 2022].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mois">Mois</Label>
            <Select
              value={filters.mois}
              onValueChange={(value) => handleFilterChange("mois", value)}
            >
              <SelectTrigger id="mois">
                <SelectValue placeholder="Sélectionner le mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2000, month - 1).toLocaleDateString("fr-FR", {
                      month: "long",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="province">Province</Label>
            <Select
              value={filters.province}
              onValueChange={(value) => handleFilterChange("province", value)}
            >
              <SelectTrigger id="province">
                <SelectValue placeholder="Sélectionner la province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="typePeche">Type de pêche</Label>
            <Select
              value={filters.typePeche}
              onValueChange={(value) => handleFilterChange("typePeche", value)}
            >
              <SelectTrigger id="typePeche">
                <SelectValue placeholder="Type de pêche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="artisanale">Artisanale</SelectItem>
                <SelectItem value="industrielle">Industrielle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalFilters;
