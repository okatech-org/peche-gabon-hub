import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, X, Circle, Users, Filter, AlertCircle, Clock, CheckCircle, Zap, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Remontee {
  id: string;
  latitude: number | null;
  longitude: number | null;
  titre: string;
  type_remontee: string;
  statut: string;
  numero_reference: string;
}

interface RemonteeMapProps {
  remontees: Remontee[];
  onRemonteeClick?: (remontee: Remontee) => void;
  height?: string;
}

const getStatusColor = (statut: string): string => {
  const colors: Record<string, string> = {
    nouveau: '#3b82f6',
    en_cours: '#eab308',
    traite: '#22c55e',
    rejete: '#ef4444'
  };
  return colors[statut] || '#6b7280';
};

const statusConfig = [
  { value: 'nouveau', label: 'Nouveau', color: '#3b82f6' },
  { value: 'en_cours', label: 'En cours', color: '#eab308' },
  { value: 'traite', label: 'Traité', color: '#22c55e' },
  { value: 'rejete', label: 'Rejeté', color: '#ef4444' }
];

const typeConfig = [
  { value: 'reclamation', label: 'Réclamation' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'denonciation', label: 'Dénonciation' },
  { value: 'article_presse', label: 'Article de presse' },
  { value: 'commentaire_reseaux', label: 'Commentaire réseaux' },
  { value: 'avis_reseaux', label: 'Avis réseaux' }
];

interface CustomFilter {
  id: string;
  label: string;
  statuses: string[];
  types: string[];
  color: string;
  isCustom: true;
}

const defaultFilters = [
  {
    id: 'all',
    label: 'Tout voir',
    icon: Circle,
    statuses: ['nouveau', 'en_cours', 'traite', 'rejete'],
    types: ['reclamation', 'suggestion', 'denonciation', 'article_presse', 'commentaire_reseaux', 'avis_reseaux'],
    color: 'bg-primary',
    isCustom: false as const
  },
  {
    id: 'urgent',
    label: 'Urgents',
    icon: AlertCircle,
    statuses: ['nouveau', 'rejete'],
    types: ['denonciation', 'reclamation'],
    color: 'bg-red-500',
    isCustom: false as const
  },
  {
    id: 'pending',
    label: 'En attente',
    icon: Clock,
    statuses: ['nouveau', 'en_cours'],
    types: ['reclamation', 'suggestion', 'denonciation', 'article_presse', 'commentaire_reseaux', 'avis_reseaux'],
    color: 'bg-yellow-500',
    isCustom: false as const
  },
  {
    id: 'completed',
    label: 'Traités',
    icon: CheckCircle,
    statuses: ['traite'],
    types: ['reclamation', 'suggestion', 'denonciation', 'article_presse', 'commentaire_reseaux', 'avis_reseaux'],
    color: 'bg-green-500',
    isCustom: false as const
  },
  {
    id: 'critical',
    label: 'Critiques',
    icon: Zap,
    statuses: ['nouveau', 'en_cours'],
    types: ['denonciation'],
    color: 'bg-orange-500',
    isCustom: false as const
  }
];

export function RemonteeMap({ remontees, onRemonteeClick, height = "500px" }: RemonteeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['nouveau', 'en_cours', 'traite', 'rejete']);
  const [activeTypes, setActiveTypes] = useState<string[]>([
    'reclamation', 'suggestion', 'denonciation', 'article_presse', 'commentaire_reseaux', 'avis_reseaux'
  ]);
  
  // Custom filters state
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>(() => {
    const saved = localStorage.getItem('remontee-custom-filters');
    return saved ? JSON.parse(saved) : [];
  });
  const [showCreateFilterDialog, setShowCreateFilterDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterColor, setNewFilterColor] = useState('bg-blue-500');
  
  const quickFilters = [...defaultFilters, ...customFilters];

  const toggleStatus = (status: string) => {
    setActiveStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleType = (type: string) => {
    setActiveTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectAllStatuses = () => {
    setActiveStatuses(statusConfig.map(s => s.value));
  };

  const selectNoStatuses = () => {
    setActiveStatuses([]);
  };

  const selectAllTypes = () => {
    setActiveTypes(typeConfig.map(t => t.value));
  };

  const selectNoTypes = () => {
    setActiveTypes([]);
  };

  const applyQuickFilter = (filterId: string) => {
    const filter = quickFilters.find(f => f.id === filterId);
    if (filter) {
      setActiveStatuses(filter.statuses);
      setActiveTypes(filter.types);
      setActiveQuickFilter(filterId);
    }
  };

  const saveCustomFilter = () => {
    if (!newFilterName.trim()) {
      toast.error('Veuillez entrer un nom pour le filtre');
      return;
    }

    const newFilter: CustomFilter = {
      id: `custom-${Date.now()}`,
      label: newFilterName.trim(),
      statuses: [...activeStatuses],
      types: [...activeTypes],
      color: newFilterColor,
      isCustom: true
    };

    const updatedFilters = [...customFilters, newFilter];
    setCustomFilters(updatedFilters);
    localStorage.setItem('remontee-custom-filters', JSON.stringify(updatedFilters));
    
    setShowCreateFilterDialog(false);
    setNewFilterName('');
    setNewFilterColor('bg-blue-500');
    setActiveQuickFilter(newFilter.id);
    
    toast.success('Filtre personnalisé créé avec succès');
  };

  const deleteCustomFilter = (filterId: string) => {
    const updatedFilters = customFilters.filter(f => f.id !== filterId);
    setCustomFilters(updatedFilters);
    localStorage.setItem('remontee-custom-filters', JSON.stringify(updatedFilters));
    
    if (activeQuickFilter === filterId) {
      setActiveQuickFilter('all');
      applyQuickFilter('all');
    }
    
    toast.success('Filtre personnalisé supprimé');
  };

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Bleu' },
    { value: 'bg-purple-500', label: 'Violet' },
    { value: 'bg-pink-500', label: 'Rose' },
    { value: 'bg-indigo-500', label: 'Indigo' },
    { value: 'bg-teal-500', label: 'Sarcelle' },
    { value: 'bg-cyan-500', label: 'Cyan' },
    { value: 'bg-emerald-500', label: 'Émeraude' },
    { value: 'bg-lime-500', label: 'Citron' },
    { value: 'bg-amber-500', label: 'Ambre' },
    { value: 'bg-rose-500', label: 'Rose vif' }
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('VITE_MAPBOX_TOKEN is not defined');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map centered on Gabon
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [11.6094, -0.8037],
      zoom: 5.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add source with clustering
      map.current.addSource('remontees', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add cluster circles layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'remontees',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#3b82f6',
            10,
            '#eab308',
            30,
            '#ef4444'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add cluster count layer
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'remontees',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Add unclustered points layer
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'remontees',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });

      // Add labels for unclustered points
      map.current.addLayer({
        id: 'unclustered-label',
        type: 'symbol',
        source: 'remontees',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '•',
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Click on cluster to zoom
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = map.current.getSource('remontees') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;

          const coordinates = (features[0].geometry as any).coordinates;
          map.current.easeTo({
            center: coordinates,
            zoom: zoom
          });
        });
      });

      // Show popup on unclustered point click
      map.current.on('click', 'unclustered-point', (e) => {
        if (!map.current || !e.features?.length) return;

        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const properties = e.features[0].properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-sm mb-2">${properties?.titre || 'Sans titre'}</h3>
              <p class="text-xs text-gray-600 mb-2">${properties?.numero_reference || ''}</p>
              <span class="text-xs px-2 py-1 rounded" style="background-color: ${properties?.color}20; color: ${properties?.color}">
                ${properties?.statut || ''}
              </span>
            </div>
          `)
          .addTo(map.current);

        if (onRemonteeClick && properties?.remontee_data) {
          try {
            const remontee = JSON.parse(properties.remontee_data);
            onRemonteeClick(remontee);
          } catch (e) {
            console.error('Error parsing remontee data:', e);
          }
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const validRemontees = remontees.filter(
      r => r.latitude !== null && r.longitude !== null &&
           activeStatuses.includes(r.statut) &&
           activeTypes.includes(r.type_remontee)
    );

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: validRemontees.map((remontee) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [remontee.longitude!, remontee.latitude!]
        },
        properties: {
          id: remontee.id,
          titre: remontee.titre,
          numero_reference: remontee.numero_reference,
          statut: remontee.statut,
          type_remontee: remontee.type_remontee,
          color: getStatusColor(remontee.statut),
          remontee_data: JSON.stringify(remontee)
        }
      }))
    };

    const source = map.current.getSource('remontees') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    }

    // Fit map to show all points
    if (validRemontees.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validRemontees.forEach(remontee => {
        if (remontee.latitude && remontee.longitude) {
          bounds.extend([remontee.longitude, remontee.latitude]);
        }
      });
      
      map.current?.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
        duration: 1000
      });
    }
  }, [remontees, onRemonteeClick, activeStatuses, activeTypes]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg border shadow-sm"
      />
      
      {/* Legend Toggle Button */}
      {!showLegend && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-10 shadow-lg animate-fade-in"
          onClick={() => setShowLegend(true)}
        >
          <Info className="h-4 w-4 mr-2" />
          Légende
        </Button>
      )}

      {/* Interactive Legend */}
      {showLegend && (
        <Card className="absolute top-4 left-4 z-10 shadow-lg animate-scale-in max-w-xs max-h-[calc(100%-2rem)] overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filtres & Légende
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowLegend(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Quick Filters */}
            <div className="space-y-2">
              <div className="font-semibold text-foreground text-xs">
                Filtres rapides
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickFilters.map(filter => {
                  const Icon = 'icon' in filter ? filter.icon : Filter;
                  const count = remontees.filter(r => 
                    r.latitude && r.longitude &&
                    filter.statuses.includes(r.statut) &&
                    filter.types.includes(r.type_remontee)
                  ).length;
                  
                  return (
                    <div key={filter.id} className="relative group">
                      <Badge
                        variant={activeQuickFilter === filter.id ? "default" : "outline"}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          activeQuickFilter === filter.id 
                            ? `${filter.color} text-white hover:opacity-90` 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => applyQuickFilter(filter.id)}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {filter.label}
                        <span className="ml-1 text-[10px] opacity-80">({count})</span>
                      </Badge>
                      {filter.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomFilter(filter.id);
                          }}
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5"
                          title="Supprimer ce filtre"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <Badge
                  variant="outline"
                  className="cursor-pointer transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground border-dashed"
                  onClick={() => setShowCreateFilterDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Créer un filtre
                </Badge>
              </div>
              <p className="text-muted-foreground italic text-[10px] mt-2">
                Cliquez sur un badge pour appliquer le filtre
              </p>
            </div>

            <div className="border-t pt-3" />
            {/* Status Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Circle className="h-3.5 w-3.5" />
                  <span>Statut des remontées</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[10px] hover:bg-primary/10"
                    onClick={selectAllStatuses}
                  >
                    Tout
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[10px] hover:bg-destructive/10"
                    onClick={selectNoStatuses}
                  >
                    Aucun
                  </Button>
                </div>
              </div>
              <div className="space-y-2 pl-5">
                {statusConfig.map(status => (
                  <div 
                    key={status.value} 
                    className="flex items-center gap-2 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer"
                    onClick={() => toggleStatus(status.value)}
                  >
                    <Checkbox 
                      checked={activeStatuses.includes(status.value)}
                      onCheckedChange={() => toggleStatus(status.value)}
                      className="h-3.5 w-3.5"
                    />
                    <Circle 
                      className="h-4 w-4 flex-shrink-0" 
                      fill={status.color} 
                      color="#ffffff" 
                      strokeWidth={2}
                    />
                    <span className={`text-muted-foreground flex-1 ${!activeStatuses.includes(status.value) && 'line-through opacity-50'}`}>
                      {status.label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {remontees.filter(r => r.statut === status.value && r.latitude && r.longitude).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Type de remontée</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[10px] hover:bg-primary/10"
                    onClick={selectAllTypes}
                  >
                    Tout
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[10px] hover:bg-destructive/10"
                    onClick={selectNoTypes}
                  >
                    Aucun
                  </Button>
                </div>
              </div>
              <div className="space-y-2 pl-5">
                {typeConfig.map(type => (
                  <div 
                    key={type.value} 
                    className="flex items-center gap-2 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer"
                    onClick={() => toggleType(type.value)}
                  >
                    <Checkbox 
                      checked={activeTypes.includes(type.value)}
                      onCheckedChange={() => toggleType(type.value)}
                      className="h-3.5 w-3.5"
                    />
                    <span className={`text-muted-foreground flex-1 ${!activeTypes.includes(type.value) && 'line-through opacity-50'}`}>
                      {type.label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {remontees.filter(r => r.type_remontee === type.value && r.latitude && r.longitude).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clusters Info */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Regroupements</span>
              </div>
              <div className="space-y-1.5 pl-5">
                <div className="flex items-center gap-2">
                  <Circle 
                    className="h-5 w-5 flex-shrink-0" 
                    fill="#3b82f6" 
                    color="#ffffff" 
                    strokeWidth={2}
                  />
                  <span className="text-muted-foreground text-[11px]">&lt; 10 remontées</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle 
                    className="h-6 w-6 flex-shrink-0" 
                    fill="#eab308" 
                    color="#ffffff" 
                    strokeWidth={2}
                  />
                  <span className="text-muted-foreground text-[11px]">10-30 remontées</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle 
                    className="h-7 w-7 flex-shrink-0" 
                    fill="#ef4444" 
                    color="#ffffff" 
                    strokeWidth={2}
                  />
                  <span className="text-muted-foreground text-[11px]">&gt; 30 remontées</span>
                </div>
              </div>
              <p className="text-muted-foreground italic pl-5 text-[10px]">
                Cliquez sur un cluster pour zoomer
              </p>
            </div>

            {/* Stats */}
            <div className="pt-2 border-t bg-muted/30 -mx-4 px-4 py-2 rounded-b">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Affichées sur la carte:</span>
                <span className="font-semibold text-foreground">
                  {remontees.filter(r => 
                    r.latitude && r.longitude && 
                    activeStatuses.includes(r.statut) && 
                    activeTypes.includes(r.type_remontee)
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>Total:</span>
                <span className="font-semibold text-foreground">{remontees.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Custom Filter Dialog */}
      <Dialog open={showCreateFilterDialog} onOpenChange={setShowCreateFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un filtre personnalisé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Nom du filtre</Label>
              <Input
                id="filter-name"
                placeholder="Ex: Mes remontées prioritaires"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Couleur du badge</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setNewFilterColor(option.value)}
                    className={`w-8 h-8 rounded-full ${option.value} transition-transform ${
                      newFilterColor === option.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                    }`}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filtres actuels à sauvegarder</Label>
              <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
                <div>
                  <span className="font-semibold">Statuts:</span>{' '}
                  {activeStatuses.length > 0 
                    ? statusConfig.filter(s => activeStatuses.includes(s.value)).map(s => s.label).join(', ')
                    : 'Aucun'}
                </div>
                <div>
                  <span className="font-semibold">Types:</span>{' '}
                  {activeTypes.length > 0
                    ? typeConfig.filter(t => activeTypes.includes(t.value)).map(t => t.label).join(', ')
                    : 'Aucun'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Le filtre sera créé avec la sélection actuelle de statuts et types
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFilterDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveCustomFilter}>
              <Save className="h-4 w-4 mr-2" />
              Créer le filtre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
