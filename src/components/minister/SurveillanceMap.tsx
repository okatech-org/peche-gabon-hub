import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Pencil, Download, X, BarChart3, FileText, History } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import RapportsZonesHistory from "./RapportsZonesHistory";
import RapportMetadataDialog, { RapportMetadata } from "./RapportMetadataDialog";

interface ZoneStats {
  totalCaptures: number;
  nombreSites: number;
  capturesParProvince: { province: string; kg: number }[];
  capturesParEspece: { espece: string; kg: number }[];
  topSites: { nom: string; province: string; kg: number }[];
  moyenneCPUE: number;
  periodeAnalyse: string;
}

const SurveillanceMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [drawMode, setDrawMode] = useState(false);
  const [zoneStats, setZoneStats] = useState<ZoneStats | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [analyzingZone, setAnalyzingZone] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [pendingMetadata, setPendingMetadata] = useState<RapportMetadata | null>(null);
  const [stats, setStats] = useState({
    sites: 0,
    zonesRestreintes: 0,
    capturesTotal: 0,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Vérifier que le token Mapbox est défini
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError("Token Mapbox manquant. Veuillez configurer VITE_MAPBOX_TOKEN dans les secrets.");
      setLoading(false);
      return;
    }

    // Initialize map
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [10.0, -1.0], // Centre sur le Gabon
      zoom: 6,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    // Initialize Mapbox Draw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        // Styles pour le polygone en cours de dessin
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.2,
          },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
          },
        },
        // Points de contrôle
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        },
      ],
    });

    map.current.addControl(draw.current as any);

    map.current.on("load", async () => {
      await loadMapData();
      setLoading(false);
    });

    // Écouter les événements de dessin
    map.current.on("draw.create", handleDrawCreate);
    map.current.on("draw.update", handleDrawCreate);

    // Cleanup
    return () => {
      map.current?.off("draw.create", handleDrawCreate);
      map.current?.off("draw.update", handleDrawCreate);
      map.current?.remove();
    };
  }, []);

  const loadMapData = async () => {
    try {
      // Charger les sites de débarquement
      const { data: sites } = await supabase
        .from("sites")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      // Charger les zones restreintes actives
      const { data: zones } = await supabase
        .from("zones_restreintes")
        .select("*")
        .eq("actif", true);

      // Charger les captures avec les coordonnées des sites
      const currentYear = new Date().getFullYear();
      const { data: captures } = await supabase
        .from("captures_pa")
        .select(`
          poids_kg,
          site:sites!inner(
            id,
            nom,
            latitude,
            longitude,
            province
          )
        `)
        .eq("annee", currentYear)
        .not("site.latitude", "is", null)
        .not("site.longitude", "is", null);

      // Agréger les captures par site pour la heatmap
      const capturesBySite = new Map<string, {
        latitude: number;
        longitude: number;
        nom: string;
        province: string;
        totalKg: number;
        nbCaptures: number;
      }>();

      captures?.forEach((capture: any) => {
        const siteId = capture.site.id;
        if (!capturesBySite.has(siteId)) {
          capturesBySite.set(siteId, {
            latitude: capture.site.latitude,
            longitude: capture.site.longitude,
            nom: capture.site.nom,
            province: capture.site.province || "Non renseigné",
            totalKg: 0,
            nbCaptures: 0,
          });
        }
        const siteData = capturesBySite.get(siteId)!;
        siteData.totalKg += capture.poids_kg || 0;
        siteData.nbCaptures += 1;
      });

      const totalCaptures = Array.from(capturesBySite.values()).reduce(
        (sum, site) => sum + site.totalKg,
        0
      );

      // Créer les données GeoJSON pour la heatmap
      const heatmapData = {
        type: "FeatureCollection",
        features: Array.from(capturesBySite.values()).map((site) => ({
          type: "Feature",
          properties: {
            nom: site.nom,
            province: site.province,
            totalKg: site.totalKg,
            nbCaptures: site.nbCaptures,
            // Poids normalisé pour l'intensité de la heatmap (0-1)
            weight: site.totalKg / (totalCaptures / capturesBySite.size),
          },
          geometry: {
            type: "Point",
            coordinates: [site.longitude, site.latitude],
          },
        })),
      };

      // Ajouter la source pour la heatmap
      if (capturesBySite.size > 0) {
        map.current!.addSource("captures-heat", {
          type: "geojson",
          data: heatmapData as any,
        });

        // Layer heatmap avec gradient vert → jaune → orange → rouge
        map.current!.addLayer(
          {
            id: "captures-heatmap",
            type: "heatmap",
            source: "captures-heat",
            maxzoom: 15,
            paint: {
              // Intensité de la heatmap basée sur le zoom et la densité
              "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", "weight"],
                0,
                0,
                2,
                1,
              ],
              // Intensité augmente avec le zoom
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                1,
                15,
                3,
              ],
              // Gradient de couleurs: vert → jaune → orange → rouge
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0, 0, 0, 0)", // Transparent
                0.2,
                "rgb(34, 197, 94)", // Vert (faible activité)
                0.4,
                "rgb(234, 179, 8)", // Jaune
                0.6,
                "rgb(249, 115, 22)", // Orange
                0.8,
                "rgb(239, 68, 68)", // Rouge
                1,
                "rgb(185, 28, 28)", // Rouge foncé (forte activité)
              ],
              // Rayon de la heatmap augmente avec le zoom
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                2,
                15,
                40,
              ],
              // Opacité de la heatmap
              "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 15, 0.6],
            },
          },
          "waterway-label" // Placer sous les labels pour meilleure lisibilité
        );
      }

      // Convertir les sites en format GeoJSON pour le clustering
      if (sites && sites.length > 0) {
        const geojsonData = {
          type: "FeatureCollection",
          features: sites.map((site) => ({
            type: "Feature",
            properties: {
              id: site.id,
              nom: site.nom,
              province: site.province || "Non renseigné",
              description: site.description || "",
            },
            geometry: {
              type: "Point",
              coordinates: [site.longitude, site.latitude],
            },
          })),
        };

        // Ajouter la source avec clustering
        map.current!.addSource("sites", {
          type: "geojson",
          data: geojsonData as any,
          cluster: true,
          clusterMaxZoom: 14, // Niveau de zoom max pour les clusters
          clusterRadius: 50, // Rayon de regroupement en pixels
        });

        // Layer pour les clusters (cercles avec compteur)
        map.current!.addLayer({
          id: "clusters",
          type: "circle",
          source: "sites",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "hsl(var(--primary))", // < 10 sites
              10,
              "#2563eb", // 10-20 sites
              20,
              "#1e40af", // > 20 sites
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20, // < 10 sites
              10,
              30, // 10-20 sites
              20,
              40, // > 20 sites
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Layer pour le nombre dans les clusters
        map.current!.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "sites",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 14,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // Layer pour les points individuels (non clusterisés)
        map.current!.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "sites",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "hsl(var(--primary))",
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });

        // Interaction: clic sur cluster = zoom
        map.current!.on("click", "clusters", (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });

          if (features.length > 0) {
            const clusterId = features[0].properties?.cluster_id;
            const source = map.current!.getSource("sites") as mapboxgl.GeoJSONSource;

            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;

              const coordinates = (features[0].geometry as any).coordinates;
              map.current!.easeTo({
                center: coordinates,
                zoom: zoom,
                duration: 500,
              });
            });
          }
        });

        // Interaction: clic sur point individuel = popup
        map.current!.on("click", "unclustered-point", (e) => {
          if (e.features && e.features[0]) {
            const coordinates = (e.features[0].geometry as any).coordinates.slice();
            const properties = e.features[0].properties;

            // Assurer que le popup apparaît sur le point visible
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div style="padding: 8px;">
                  <h4 style="font-weight: bold; margin: 0 0 4px 0;">${properties?.nom}</h4>
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    Province: ${properties?.province}
                  </p>
                  ${properties?.description ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">${properties.description}</p>` : ""}
                </div>
              `)
              .addTo(map.current!);
          }
        });

        // Changer le curseur au survol des clusters
        map.current!.on("mouseenter", "clusters", () => {
          map.current!.getCanvas().style.cursor = "pointer";
        });

        map.current!.on("mouseleave", "clusters", () => {
          map.current!.getCanvas().style.cursor = "";
        });

        // Changer le curseur au survol des points
        map.current!.on("mouseenter", "unclustered-point", () => {
          map.current!.getCanvas().style.cursor = "pointer";
        });

        map.current!.on("mouseleave", "unclustered-point", () => {
          map.current!.getCanvas().style.cursor = "";
        });
      }

      // Ajouter les zones restreintes
      zones?.forEach((zone) => {
        const geometrie = zone.geometrie as any;
        if (geometrie && geometrie.coordinates) {
          // Ajouter la source pour la zone
          map.current!.addSource(`zone-${zone.id}`, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {
                nom: zone.nom,
                raison: zone.raison,
                date_debut: zone.date_debut,
                date_fin: zone.date_fin,
              },
              geometry: geometrie as any,
            },
          });

          // Ajouter le remplissage de la zone
          map.current!.addLayer({
            id: `zone-fill-${zone.id}`,
            type: "fill",
            source: `zone-${zone.id}`,
            paint: {
              "fill-color": "#ff0000",
              "fill-opacity": 0.2,
            },
          });

          // Ajouter le contour de la zone
          map.current!.addLayer({
            id: `zone-outline-${zone.id}`,
            type: "line",
            source: `zone-${zone.id}`,
            paint: {
              "line-color": "#ff0000",
              "line-width": 2,
              "line-dasharray": [2, 2],
            },
          });

          // Ajouter l'interaction au survol
          map.current!.on("click", `zone-fill-${zone.id}`, (e) => {
            if (e.features && e.features[0]) {
              const properties = e.features[0].properties;
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="padding: 8px;">
                    <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #ff0000;">Zone Restreinte</h4>
                    <p style="margin: 0 0 4px 0; font-weight: 600;">${properties?.nom}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      ${properties?.raison}
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">
                      Du ${new Date(properties?.date_debut).toLocaleDateString("fr-FR")}
                      ${properties?.date_fin ? ` au ${new Date(properties.date_fin).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                `)
                .addTo(map.current!);
            }
          });

          // Changer le curseur au survol
          map.current!.on("mouseenter", `zone-fill-${zone.id}`, () => {
            map.current!.getCanvas().style.cursor = "pointer";
          });

          map.current!.on("mouseleave", `zone-fill-${zone.id}`, () => {
            map.current!.getCanvas().style.cursor = "";
          });
        }
      });

      setStats({
        sites: sites?.length || 0,
        zonesRestreintes: zones?.length || 0,
        capturesTotal: totalCaptures,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError("Erreur lors du chargement des données cartographiques");
    }
  };

  // Toggle heatmap visibility
  useEffect(() => {
    if (map.current && map.current.getLayer("captures-heatmap")) {
      map.current.setLayoutProperty(
        "captures-heatmap",
        "visibility",
        showHeatmap ? "visible" : "none"
      );
    }
  }, [showHeatmap]);

  // Toggle draw mode
  useEffect(() => {
    if (!draw.current) return;

    if (drawMode) {
      draw.current.changeMode("draw_polygon");
      toast.info("Mode dessin activé - Cliquez pour dessiner votre zone");
    } else {
      draw.current.changeMode("simple_select");
      // Supprimer tous les polygones dessinés
      const features = draw.current.getAll();
      features.features.forEach((feature) => {
        draw.current!.delete(feature.id as string);
      });
      setZoneStats(null);
    }
  }, [drawMode]);

  const handleDrawCreate = async (e: any) => {
    if (!e.features || e.features.length === 0) return;

    const polygon = e.features[0];
    setCurrentPolygon(polygon);
    setAnalyzingZone(true);

    try {
      await analyzeZone(polygon);
      setShowStatsDialog(true);
      toast.success("Analyse de la zone terminée");
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      toast.error("Erreur lors de l'analyse de la zone");
    } finally {
      setAnalyzingZone(false);
    }
  };

  const analyzeZone = async (polygon: any) => {
    try {
      // Charger toutes les captures avec les détails
      const currentYear = new Date().getFullYear();
      const { data: captures } = await supabase
        .from("captures_pa")
        .select(`
          poids_kg,
          cpue,
          site:sites!inner(
            id,
            nom,
            latitude,
            longitude,
            province
          ),
          espece:especes(
            nom
          )
        `)
        .eq("annee", currentYear)
        .not("site.latitude", "is", null)
        .not("site.longitude", "is", null);

      if (!captures || captures.length === 0) {
        setZoneStats({
          totalCaptures: 0,
          nombreSites: 0,
          capturesParProvince: [],
          capturesParEspece: [],
          topSites: [],
          moyenneCPUE: 0,
          periodeAnalyse: `${currentYear}`,
        });
        return;
      }

      // Filtrer les captures dans le polygone
      const capturesInZone = captures.filter((capture: any) => {
        const pt = point([capture.site.longitude, capture.site.latitude]);
        return booleanPointInPolygon(pt, polygon);
      });

      if (capturesInZone.length === 0) {
        setZoneStats({
          totalCaptures: 0,
          nombreSites: 0,
          capturesParProvince: [],
          capturesParEspece: [],
          topSites: [],
          moyenneCPUE: 0,
          periodeAnalyse: `${currentYear}`,
        });
        return;
      }

      // Calculer les statistiques
      const totalCaptures = capturesInZone.reduce((sum, c) => sum + (c.poids_kg || 0), 0);
      
      const sitesUniques = new Set(capturesInZone.map((c: any) => c.site.id));
      
      // Par province
      const parProvince = new Map<string, number>();
      capturesInZone.forEach((c: any) => {
        const province = c.site.province || "Non renseigné";
        parProvince.set(province, (parProvince.get(province) || 0) + (c.poids_kg || 0));
      });

      // Par espèce
      const parEspece = new Map<string, number>();
      capturesInZone.forEach((c: any) => {
        const espece = c.espece?.nom || "Non renseigné";
        parEspece.set(espece, (parEspece.get(espece) || 0) + (c.poids_kg || 0));
      });

      // Top sites
      const parSite = new Map<string, { nom: string; province: string; kg: number }>();
      capturesInZone.forEach((c: any) => {
        const siteId = c.site.id;
        if (!parSite.has(siteId)) {
          parSite.set(siteId, {
            nom: c.site.nom,
            province: c.site.province || "Non renseigné",
            kg: 0,
          });
        }
        parSite.get(siteId)!.kg += c.poids_kg || 0;
      });

      // CPUE moyen
      const cpues = capturesInZone.filter((c: any) => c.cpue).map((c: any) => c.cpue);
      const moyenneCPUE = cpues.length > 0 ? cpues.reduce((a, b) => a + b, 0) / cpues.length : 0;

      setZoneStats({
        totalCaptures,
        nombreSites: sitesUniques.size,
        capturesParProvince: Array.from(parProvince.entries())
          .map(([province, kg]) => ({ province, kg }))
          .sort((a, b) => b.kg - a.kg),
        capturesParEspece: Array.from(parEspece.entries())
          .map(([espece, kg]) => ({ espece, kg }))
          .sort((a, b) => b.kg - a.kg)
          .slice(0, 10), // Top 10
        topSites: Array.from(parSite.values())
          .sort((a, b) => b.kg - a.kg)
          .slice(0, 10), // Top 10
        moyenneCPUE: Number(moyenneCPUE.toFixed(2)),
        periodeAnalyse: `${currentYear}`,
      });
    } catch (error) {
      console.error("Erreur analyse:", error);
      throw error;
    }
  };

  const exportStats = () => {
    if (!zoneStats) return;

    const csv = [
      "Statistiques de la Zone Personnalisée",
      `Période,${zoneStats.periodeAnalyse}`,
      `Total Captures (kg),${zoneStats.totalCaptures.toFixed(2)}`,
      `Nombre de Sites,${zoneStats.nombreSites}`,
      `CPUE Moyen,${zoneStats.moyenneCPUE}`,
      "",
      "Captures par Province",
      "Province,Captures (kg)",
      ...zoneStats.capturesParProvince.map((p) => `${p.province},${p.kg.toFixed(2)}`),
      "",
      "Top 10 Espèces",
      "Espèce,Captures (kg)",
      ...zoneStats.capturesParEspece.map((e) => `${e.espece},${e.kg.toFixed(2)}`),
      "",
      "Top 10 Sites",
      "Site,Province,Captures (kg)",
      ...zoneStats.topSites.map((s) => `${s.nom},${s.province},${s.kg.toFixed(2)}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stats-zone-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Statistiques exportées en CSV");
  };

  const generateAIRecommendations = async (stats: ZoneStats) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-zone', {
        body: { 
          zoneStats: {
            totalCaptures: stats.totalCaptures,
            sitesCount: stats.nombreSites,
            averageCpue: stats.moyenneCPUE,
            provinces: stats.capturesParProvince.map(p => p.province),
            topSpecies: stats.capturesParEspece.map(e => ({ nom: e.espece, total: e.kg })),
            topSites: stats.topSites.map(s => ({ nom: s.nom, total: s.kg }))
          }
        }
      });

      if (error) throw error;
      return data.recommendations;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast.error("Erreur lors de la génération des recommandations IA");
      return "Recommandations indisponibles pour le moment.";
    }
  };

  const generatePDFReport = async (metadata?: RapportMetadata) => {
    if (!zoneStats || !currentPolygon) return;

    // Si pas de metadata fournie, ouvrir le dialog
    if (!metadata) {
      setShowMetadataDialog(true);
      return;
    }

    setIsGeneratingPDF(true);
    toast.info("Génération du rapport PDF en cours...");

    try {
      // Get AI recommendations
      const recommendations = await generateAIRecommendations(zoneStats);
      setAiRecommendations(recommendations);

      // Wait a bit for UI to render with recommendations
      await new Promise(resolve => setTimeout(resolve, 500));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 102, 204);
      pdf.text(metadata.titre.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Région: ${metadata.region} - Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Capture map
      const mapElement = document.querySelector('.mapboxgl-canvas-container canvas') as HTMLCanvasElement;
      if (mapElement) {
        const mapCanvas = await html2canvas(mapElement, { scale: 1 });
        const mapImgData = mapCanvas.toDataURL('image/jpeg', 0.8);
        const mapWidth = pageWidth - 30;
        const mapHeight = (mapCanvas.height * mapWidth) / mapCanvas.width;
        
        if (yPosition + mapHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(mapImgData, 'JPEG', 15, yPosition, mapWidth, Math.min(mapHeight, 80));
        yPosition += Math.min(mapHeight, 80) + 10;
      }

      // Key Statistics
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text("STATISTIQUES CLÉS", 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      const statLines = [
        `Captures totales: ${zoneStats.totalCaptures.toFixed(2)} kg`,
        `Nombre de sites: ${zoneStats.nombreSites}`,
        `CPUE moyen: ${zoneStats.moyenneCPUE}`,
        `Province(s): ${zoneStats.capturesParProvince.map(p => p.province).join(', ')}`,
      ];

      statLines.forEach(stat => {
        pdf.text(stat, 20, yPosition);
        yPosition += 7;
      });
      yPosition += 10;

      // Capture charts
      const chartsContainer = document.getElementById('pdf-charts-container');
      if (chartsContainer) {
        const chartsCanvas = await html2canvas(chartsContainer, { scale: 2 });
        const chartsImgData = chartsCanvas.toDataURL('image/png');
        const chartsWidth = pageWidth - 30;
        const chartsHeight = (chartsCanvas.height * chartsWidth) / chartsCanvas.width;
        
        if (yPosition + chartsHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(chartsImgData, 'PNG', 15, yPosition, chartsWidth, Math.min(chartsHeight, 100));
        yPosition += Math.min(chartsHeight, 100) + 10;
      }

      // AI Recommendations
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text("RECOMMANDATIONS IA", 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const lines = pdf.splitTextToSize(recommendations, pageWidth - 30);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 15, yPosition);
        yPosition += 5;
      });

      // Footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('MINISTÈRE DE LA PÊCHE - CONFIDENTIEL', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      // Convert PDF to blob for storage
      const pdfBlob = pdf.output('blob');
      
      // Generate unique filename
      const timestamp = Date.now();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const fileName = `${user.id}/${timestamp}_rapport_zone.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('rapports-zones')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('rapports_zones')
        .insert([{
          created_by: user.id,
          titre: `Rapport Zone - ${new Date().toLocaleDateString('fr-FR')}`,
          zone_geojson: currentPolygon.geometry as any,
          statistiques: zoneStats as any,
          recommandations_ia: recommendations,
          fichier_path: fileName,
          metadata: {
            generated_at: new Date().toISOString(),
            pdf_pages: pageCount
          } as any
        }]);

      if (dbError) throw dbError;

      // Also download immediately
      pdf.save(`${metadata.titre.replace(/\s+/g, '_')}_${timestamp}.pdf`);
      
      toast.success("Rapport PDF généré et sauvegardé avec succès");
      setShowMetadataDialog(false);
      setPendingMetadata(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Erreur lors de la génération du rapport PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleMetadataConfirm = (metadata: RapportMetadata) => {
    setPendingMetadata(metadata);
    generatePDFReport(metadata);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Carte des Zones de Surveillance</CardTitle>
              <CardDescription>
                Visualisation géographique des sites de débarquement et zones restreintes
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Historique
              </Button>
              <Button
                variant={drawMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawMode(!drawMode)}
                className="gap-2"
              >
                {drawMode ? (
                  <>
                    <X className="h-4 w-4" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Dessiner Zone
                  </>
                )}
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  id="heatmap-toggle"
                  checked={showHeatmap}
                  onCheckedChange={setShowHeatmap}
                  disabled={drawMode}
                />
                <Label htmlFor="heatmap-toggle" className="text-sm cursor-pointer">
                  Heatmap
                </Label>
              </div>
            </div>
          </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary border-2 border-white shadow-sm flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </div>
            <span className="text-sm">Site de débarquement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary border-2 border-white shadow-sm flex items-center justify-center">
              <span className="text-xs text-white font-bold">5+</span>
            </div>
            <span className="text-sm">Cluster de sites ({stats.sites} total)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 opacity-50 border-2 border-red-500 shadow-sm"></div>
            <span className="text-sm">Zones restreintes ({stats.zonesRestreintes})</span>
          </div>
          {showHeatmap && stats.capturesTotal > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex h-4 w-16 rounded overflow-hidden border border-border">
                <div className="flex-1 bg-green-500"></div>
                <div className="flex-1 bg-yellow-500"></div>
                <div className="flex-1 bg-orange-500"></div>
                <div className="flex-1 bg-red-500"></div>
              </div>
              <span className="text-sm">
                Intensité captures ({(stats.capturesTotal / 1000).toFixed(1)}T)
              </span>
            </div>
          )}
        </div>
        <div className="space-y-1 mt-3">
          {drawMode ? (
            <p className="text-xs text-primary font-medium">
              ✏️ Mode dessin actif : Cliquez sur la carte pour créer un polygone
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                💡 Cliquez sur un cluster pour zoomer et voir les sites individuels
              </p>
              {showHeatmap && (
                <p className="text-xs text-muted-foreground">
                  🔥 La heatmap montre l'activité de pêche : vert (faible) → rouge (forte)
                </p>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {analyzingZone && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Analyse de la zone en cours...</p>
              </div>
            </div>
          )}
          {error ? (
            <div className="w-full h-[600px] flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : (
            <div
              ref={mapContainer}
              className="w-full rounded-lg shadow-lg"
              style={{ height: "600px" }}
            />
          )}
        </div>
      </CardContent>
    </Card>

    {/* Dialog des statistiques */}
    <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques de la Zone Personnalisée
          </DialogTitle>
          <DialogDescription>
            Analyse détaillée des captures dans la zone dessinée (Période: {zoneStats?.periodeAnalyse})
          </DialogDescription>
        </DialogHeader>

        {zoneStats && (
          <div className="space-y-6 py-4">
            {/* Résumé */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Captures</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{(zoneStats.totalCaptures / 1000).toFixed(2)}T</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Sites</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{zoneStats.nombreSites}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">CPUE Moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{zoneStats.moyenneCPUE}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Provinces</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{zoneStats.capturesParProvince.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Par Province */}
            {zoneStats.capturesParProvince.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Captures par Province</h3>
                <div className="space-y-2">
                  {zoneStats.capturesParProvince.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{p.province}</span>
                      <Badge variant="secondary">{(p.kg / 1000).toFixed(2)}T</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Espèces */}
            {zoneStats.capturesParEspece.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Top 10 Espèces</h3>
                <div className="space-y-2">
                  {zoneStats.capturesParEspece.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{e.espece}</span>
                      <Badge variant="outline">{e.kg.toFixed(0)} kg</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Sites */}
            {zoneStats.topSites.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Top 10 Sites</h3>
                <div className="space-y-2">
                  {zoneStats.topSites.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">{s.nom}</p>
                        <p className="text-xs text-muted-foreground">{s.province}</p>
                      </div>
                      <Badge>{(s.kg / 1000).toFixed(2)}T</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton Export */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowStatsDialog(false)}>
                Fermer
              </Button>
              <Button variant="outline" onClick={exportStats} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <Button 
                onClick={() => generatePDFReport()}
                disabled={isGeneratingPDF}
                className="gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Rapport PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Hidden charts container for PDF export */}
        {zoneStats && (
          <div id="pdf-charts-container" style={{ position: 'absolute', left: '-9999px', width: '800px', padding: '20px', background: 'white' }}>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Captures par Espèce</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zoneStats.capturesParEspece.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="espece" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    label={{ value: 'Captures (kg)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#0066cc" name="Captures (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Répartition par Site</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={zoneStats.topSites.slice(0, 6)}
                    dataKey="kg"
                    nameKey="nom"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.nom}: ${(entry.kg/1000).toFixed(1)}T`}
                    style={{ fontSize: '11px' }}
                  >
                    {zoneStats.topSites.slice(0, 6).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Répartition par Province</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zoneStats.capturesParProvince}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="province" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    label={{ value: 'Captures (kg)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#22c55e" name="Captures (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Historique des rapports */}
    <RapportsZonesHistory open={showHistory} onOpenChange={setShowHistory} />

    {/* Dialog metadata */}
    <RapportMetadataDialog
      open={showMetadataDialog}
      onOpenChange={setShowMetadataDialog}
      onConfirm={handleMetadataConfirm}
    />
    </>
  );
};

export default SurveillanceMap;
