import { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import type * as GeoJSON from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Locate,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useMapboxToken } from "@/hooks/useMapboxToken";

interface Inspection {
  id: string;
  numero: string;
  type: string;
  cible: string;
  site: string;
  date: string;
  statut: "en_cours" | "terminee" | "conforme" | "non_conforme";
  lat: number;
  lng: number;
  observations?: string;
}

// Données simulées avec coordonnées GPS du Gabon
const mockInspections: Inspection[] = [
  {
    id: "1",
    numero: "INS-2025-001",
    type: "Debarquement",
    cible: "Pirogue PA-1234",
    site: "Port Gentil",
    date: "2025-01-09",
    statut: "conforme",
    lat: -0.7193,
    lng: 8.7815,
    observations: "Inspection de routine - Conforme",
  },
  {
    id: "2",
    numero: "INS-2025-002",
    type: "Licence",
    cible: "Navire NI-5678",
    site: "Libreville",
    date: "2025-01-09",
    statut: "en_cours",
    lat: 0.4162,
    lng: 9.4673,
    observations: "Vérification documents en cours",
  },
  {
    id: "3",
    numero: "INS-2025-003",
    type: "Sanitaire",
    cible: "Site Cap Esterias",
    site: "Cap Esterias",
    date: "2025-01-08",
    statut: "non_conforme",
    lat: 0.6145,
    lng: 9.4157,
    observations: "Non-conformité détectée",
  },
  {
    id: "4",
    numero: "INS-2025-004",
    type: "Engins",
    cible: "Pirogue PA-2890",
    site: "Mayumba",
    date: "2025-01-08",
    statut: "conforme",
    lat: -3.4319,
    lng: 10.6556,
  },
  {
    id: "5",
    numero: "INS-2025-005",
    type: "Debarquement",
    cible: "Pirogue PA-3456",
    site: "Cocobeach",
    date: "2025-01-07",
    statut: "terminee",
    lat: 1.0000,
    lng: 9.5833,
  },
  {
    id: "6",
    numero: "INS-2025-006",
    type: "Captures",
    cible: "Site Gamba",
    site: "Gamba",
    date: "2025-01-06",
    statut: "conforme",
    lat: -2.6500,
    lng: 10.0000,
  },
];

export default function Carte() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>(mockInspections);
  const [filterType, setFilterType] = useState<string>("tous");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState<string>("tous");

  // Token Mapbox via hook sécurisé
  const { token: mapboxToken, isLoading: tokenLoading, error: tokenError } = useMapboxToken();

  // Gérer l'erreur de token via le hook
  useEffect(() => {
    if (tokenError) {
      setErrorMsg(tokenError);
      setIsLoading(false);
    }
  }, [tokenError]);

  // Initialiser la carte une seule fois
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    logger.info("🗺️ Initialisation de la carte Mapbox...");
    logger.info("Token présent:", mapboxToken ? "✅ Oui" : "❌ Non");

    // Petit délai pour s'assurer que le container est bien monté
    const timer = setTimeout(() => {
      try {
        mapboxgl.accessToken = mapboxToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [9.4673, 0.4162], // Libreville, Gabon
          zoom: 6,
        });

        map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
        map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

        map.current.on("load", () => {
          logger.info("✅ Carte Mapbox chargée avec succès");
          setErrorMsg(null);
          setIsMapReady(true);
          setIsLoading(false);
        });

        map.current.on("error", (e) => {
          const err: any = (e as any)?.error;
          const message: string = typeof err === 'string' ? err : err?.message || '';
          const status = err?.status || err?.response?.status;
          const tokenError = /access token|unauthorized|forbidden|invalid token/i.test(message) || [401,403].includes(status);
          const styleError = /style|failed to load style|not found/i.test(message);

          if (tokenError) {
            logger.error("❌ Erreur Mapbox (token):", e);
            setErrorMsg("Clé API Mapbox invalide ou manquante. Mettez à jour le secret et rafraîchissez.");
            setIsLoading(false);
            toast.error("Clé API Mapbox invalide ou manquante");
            return;
          }

          if (styleError && !(map.current && map.current.loaded())) {
            logger.error("❌ Erreur de style Mapbox avant chargement:", e);
            setErrorMsg("Erreur lors du chargement du style de la carte. Réessayez.");
            setIsLoading(false);
            return;
          }

          // Bruit réduit: log en warning sans bloquer l'affichage
          logger.warn?.("⚠️ Erreur Mapbox non critique (ignorée)", e);
        });

      } catch (error) {
        logger.error("❌ Erreur d'initialisation:", error);
        setErrorMsg("Impossible d'initialiser la carte Mapbox.");
        setIsLoading(false);
        toast.error("Erreur d'initialisation");
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Ajouter les marqueurs avec clustering et heatmap
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    logger.info("🎯 Configuration des marqueurs avec clusters et heatmap...");

    // Supprimer les anciennes sources et layers si elles existent
    if (map.current.getLayer('heatmap-layer')) map.current.removeLayer('heatmap-layer');
    if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
    if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
    if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
    if (map.current.getSource('inspections')) map.current.removeSource('inspections');
    if (map.current.getSource('inspections-heatmap')) map.current.removeSource('inspections-heatmap');

    // Filtrer les inspections pour les marqueurs
    let filtered = inspections;
    if (filterType !== "tous") {
      filtered = filtered.filter((i) => i.type === filterType);
    }
    if (filterStatut !== "tous") {
      filtered = filtered.filter((i) => i.statut === filterStatut);
    }

    // Filtrer les inspections pour la heatmap
    let heatmapData = inspections;
    if (heatmapFilter === "infractions") {
      heatmapData = inspections.filter((i) => i.statut === "non_conforme");
    } else if (heatmapFilter !== "tous") {
      heatmapData = inspections.filter((i) => i.statut === heatmapFilter);
    }

    // Créer le GeoJSON pour les inspections (marqueurs/clusters)
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filtered.map((inspection) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [inspection.lng, inspection.lat]
        },
        properties: {
          id: inspection.id,
          numero: inspection.numero,
          type: inspection.type,
          cible: inspection.cible,
          site: inspection.site,
          date: inspection.date,
          statut: inspection.statut,
          observations: inspection.observations || '',
          color: getMarkerColor(inspection.statut)
        }
      }))
    };

    // Créer le GeoJSON pour la heatmap
    const heatmapGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: heatmapData.map((inspection) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [inspection.lng, inspection.lat]
        },
        properties: {
          intensity: inspection.statut === "non_conforme" ? 2 : 1 // Plus d'intensité pour les infractions
        }
      }))
    };

    // Ajouter la source heatmap
    map.current.addSource('inspections-heatmap', {
      type: 'geojson',
      data: heatmapGeojson
    });

    // Layer heatmap
    map.current.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'inspections-heatmap',
      maxzoom: 15,
      paint: {
        // Augmenter le poids en fonction de l'intensité
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, 0,
          6, 1
        ],
        // Augmenter l'intensité par niveau de zoom
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        // Rayon des points de chaleur
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 20,
          15, 40
        ],
        // Transition du rouge au jaune au vert
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        // Opacité de la heatmap
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, showHeatmap ? 0.7 : 0,
          15, showHeatmap ? 0.5 : 0
        ]
      }
    }, 'clusters'); // Ajouter la heatmap sous les clusters

    // Ajouter la source avec clustering
    map.current.addSource('inspections', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Layer pour les clusters
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'inspections',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#3b82f6',
          5,
          '#f59e0b',
          10,
          '#ef4444'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          5,
          30,
          10,
          40
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Layer pour le nombre dans les clusters
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'inspections',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Layer pour les marqueurs individuels
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'inspections',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': 10,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Popup pour survol des clusters
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    // Survol des clusters
    map.current.on('mouseenter', 'clusters', (e) => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = 'pointer';
      
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id;
        const pointCount = features[0].properties?.point_count;
        const coordinates = (features[0].geometry as any).coordinates.slice();

        popup
          .setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 8px; text-align: center;">
              <div style="font-weight: bold; font-size: 16px;">${pointCount}</div>
              <div style="font-size: 12px; color: #666;">inspection${pointCount > 1 ? 's' : ''}</div>
            </div>
          `)
          .addTo(map.current);
      }
    });

    map.current.on('mouseleave', 'clusters', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
      popup.remove();
    });

    // Clic sur cluster pour zoomer
    map.current.on('click', 'clusters', (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id;
        const source = map.current.getSource('inspections') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;
          
          map.current.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      }
    });

    // Popup pour les marqueurs individuels
    map.current.on('click', 'unclustered-point', (e) => {
      if (!map.current || !e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;
      const coordinates = (feature.geometry as any).coordinates.slice();

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${props?.numero}</h3>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              <strong>Type:</strong> ${props?.type}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              <strong>Cible:</strong> ${props?.cible}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              <strong>Site:</strong> ${props?.site}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              <strong>Date:</strong> ${new Date(props?.date).toLocaleDateString("fr-FR")}
            </div>
            ${props?.observations ? `<div style="font-size: 11px; color: #888; margin-top: 8px; font-style: italic;">${props?.observations}</div>` : ''}
          </div>
        `)
        .addTo(map.current);
    });

    // Changement de curseur sur survol des marqueurs individuels
    map.current.on('mouseenter', 'unclustered-point', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'unclustered-point', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });

    logger.info(`✅ ${filtered.length} inspections affichées avec clustering et heatmap`);

  }, [inspections, isMapReady, filterType, filterStatut, showHeatmap, heatmapFilter]);

  const getMarkerColor = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "#f97316"; // orange
      case "terminee":
        return "#3b82f6"; // blue
      case "conforme":
        return "#22c55e"; // green
      case "non_conforme":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const handleLocateMe = () => {
    if (!map.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 12,
          });

          // Ajouter un marqueur pour la position de l'utilisateur
          new mapboxgl.Marker({ color: "#3b82f6" })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML("<div style='padding: 4px;'>Votre position</div>")
            )
            .addTo(map.current!);
        },
        (error) => {
          logger.error("Erreur de géolocalisation:", error);
          toast.error("Impossible de vous localiser");
        }
      );
    } else {
      toast.error("La géolocalisation n'est pas supportée");
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Carte des inspections</h1>
          <p className="text-sm text-muted-foreground">
            Visualisez vos inspections sur la carte
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showHeatmap ? "default" : "outline"}
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="gap-2"
          >
            {showHeatmap ? "🔥" : "🗺️"}
            {showHeatmap ? "Heatmap active" : "Activer Heatmap"}
          </Button>
          <Button onClick={handleLocateMe} variant="outline">
            <Locate className="h-4 w-4 mr-2" />
            Me localiser
          </Button>
        </div>
      </div>

      {/* Filtres et légende */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'inspection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="Debarquement">Débarquement</SelectItem>
                <SelectItem value="Licence">Licence</SelectItem>
                <SelectItem value="Sanitaire">Sanitaire</SelectItem>
                <SelectItem value="Engins">Engins</SelectItem>
                <SelectItem value="Captures">Captures</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="non_conforme">Non conforme</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre heatmap */}
            {showHeatmap && (
              <Select value={heatmapFilter} onValueChange={setHeatmapFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Données heatmap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les inspections</SelectItem>
                  <SelectItem value="infractions">Infractions uniquement</SelectItem>
                  <SelectItem value="non_conforme">Non conformes</SelectItem>
                  <SelectItem value="conforme">Conformes</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Légende */}
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-muted-foreground">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Terminée</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Conforme</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Non conforme</span>
            </div>
            {showHeatmap && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex h-3 w-16 rounded" style={{background: 'linear-gradient(to right, #2166AC, #67A9CF, #D1E5F0, #FEE090, #F88D51, #B2182B)'}} />
                <span className="text-xs text-muted-foreground">Densité</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Carte */}
      <Card className="overflow-hidden relative">
        {(isLoading || tokenLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">{errorMsg}</p>
                <p className="text-xs text-muted-foreground">
                  Vérifiez que la clé API Mapbox est correctement configurée dans les secrets du projet.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  variant="default" 
                  onClick={() => { 
                    setIsLoading(true); 
                    setErrorMsg(null);
                    // Forcer un rechargement complet de la page
                    window.location.reload();
                  }}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        )}

        <div
          ref={mapContainer}
          className="w-full h-[calc(100vh-280px)] md:h-[600px]"
        />
      </Card>
    </div>
  );
}
