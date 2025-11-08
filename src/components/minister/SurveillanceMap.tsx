import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";

const SurveillanceMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    sites: 0,
    zonesRestreintes: 0,
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

    map.current.on("load", async () => {
      await loadMapData();
      setLoading(false);
    });

    // Cleanup
    return () => {
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
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError("Erreur lors du chargement des données cartographiques");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carte des Zones de Surveillance</CardTitle>
        <CardDescription>
          Visualisation géographique des sites de débarquement et zones restreintes
        </CardDescription>
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
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Cliquez sur un cluster pour zoomer et voir les sites individuels
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  );
};

export default SurveillanceMap;
