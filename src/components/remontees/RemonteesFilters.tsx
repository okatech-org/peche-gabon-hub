import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar as CalendarIcon, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface RemonteeFilters {
  searchText: string;
  type: string;
  statut: string;
  zone: string;
  dateDebut: Date | undefined;
  dateFin: Date | undefined;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface RemonteesFiltersProps {
  filters: RemonteeFilters;
  onFiltersChange: (filters: RemonteeFilters) => void;
  zones?: string[];
}

const REMONTEE_TYPES = [
  { value: "securite", label: "Sécurité" },
  { value: "environnement", label: "Environnement" },
  { value: "economie", label: "Économie" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "reglementation", label: "Réglementation" },
  { value: "social", label: "Social" },
  { value: "autre", label: "Autre" },
];

const STATUTS = [
  { value: "nouveau", label: "Nouveau", color: "bg-blue-500" },
  { value: "en_cours", label: "En cours", color: "bg-yellow-500" },
  { value: "traite", label: "Traité", color: "bg-green-500" },
  { value: "rejete", label: "Rejeté", color: "bg-red-500" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Date de création" },
  { value: "type_remontee", label: "Type" },
  { value: "statut", label: "Statut" },
  { value: "priorite", label: "Priorité" },
];

export function RemonteesFilters({ filters, onFiltersChange, zones = [] }: RemonteesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof RemonteeFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchText: "",
      type: "",
      statut: "",
      zone: "",
      dateDebut: undefined,
      dateFin: undefined,
      sortBy: "created_at",
      sortOrder: "desc",
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.type) count++;
    if (filters.statut) count++;
    if (filters.zone) count++;
    if (filters.dateDebut) count++;
    if (filters.dateFin) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardContent className="pt-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Trier par:</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>

          <CollapsibleContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les remontées..."
                value={filters.searchText}
                onChange={(e) => handleFilterChange("searchText", e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Type de remontée</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    {REMONTEE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={filters.statut}
                  onValueChange={(value) => handleFilterChange("statut", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les statuts</SelectItem>
                    {STATUTS.map((statut) => (
                      <SelectItem key={statut.value} value={statut.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", statut.color)} />
                          {statut.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zone Filter */}
              {zones.length > 0 && (
                <div className="space-y-2">
                  <Label>Zone géographique</Label>
                  <Select
                    value={filters.zone}
                    onValueChange={(value) => handleFilterChange("zone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les zones</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Période</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !filters.dateDebut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateDebut ? (
                          format(filters.dateDebut, "dd/MM/yyyy", { locale: fr })
                        ) : (
                          "Du"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateDebut}
                        onSelect={(date) => handleFilterChange("dateDebut", date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !filters.dateFin && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFin ? (
                          format(filters.dateFin, "dd/MM/yyyy", { locale: fr })
                        ) : (
                          "Au"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFin}
                        onSelect={(date) => handleFilterChange("dateFin", date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {filters.type && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {REMONTEE_TYPES.find((t) => t.value === filters.type)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("type", "")}
                    />
                  </Badge>
                )}
                {filters.statut && (
                  <Badge variant="secondary" className="gap-1">
                    Statut: {STATUTS.find((s) => s.value === filters.statut)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("statut", "")}
                    />
                  </Badge>
                )}
                {filters.zone && (
                  <Badge variant="secondary" className="gap-1">
                    Zone: {filters.zone}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("zone", "")}
                    />
                  </Badge>
                )}
                {filters.dateDebut && (
                  <Badge variant="secondary" className="gap-1">
                    Du: {format(filters.dateDebut, "dd/MM/yyyy", { locale: fr })}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("dateDebut", undefined)}
                    />
                  </Badge>
                )}
                {filters.dateFin && (
                  <Badge variant="secondary" className="gap-1">
                    Au: {format(filters.dateFin, "dd/MM/yyyy", { locale: fr })}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange("dateFin", undefined)}
                    />
                  </Badge>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
