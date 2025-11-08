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

      // Ajouter les marqueurs pour les sites
      sites?.forEach((site) => {
        if (site.latitude && site.longitude) {
          // Créer un élément DOM personnalisé pour le marqueur
          const el = document.createElement("div");
          el.className = "marker-site";
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = "hsl(var(--primary))";
          el.style.border = "2px solid white";
          el.style.cursor = "pointer";
          el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

          // Créer le popup
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h4 style="font-weight: bold; margin: 0 0 4px 0;">${site.nom}</h4>
              <p style="margin: 0; font-size: 12px; color: #666;">
                Province: ${site.province || "Non renseigné"}
              </p>
            </div>
          `);

          // Ajouter le marqueur
          new mapboxgl.Marker(el)
            .setLngLat([site.longitude, site.latitude])
            .setPopup(popup)
            .addTo(map.current!);
        }
      });

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
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm"></div>
            <span className="text-sm">Sites de débarquement ({stats.sites})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 opacity-50 border-2 border-red-500 shadow-sm"></div>
            <span className="text-sm">Zones restreintes ({stats.zonesRestreintes})</span>
          </div>
        </div>
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
