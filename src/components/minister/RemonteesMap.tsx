import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation } from "lucide-react";

interface Remontee {
  id: string;
  numero_reference: string;
  type_remontee: string;
  titre: string;
  description: string;
  localisation?: string;
  niveau_priorite: string;
  statut: string;
  sentiment?: string;
  created_at: string;
  validation_status: string;
  source?: string;
  url_source?: string;
  categorie?: string;
  date_incident?: string;
  impact_estime?: string;
  nb_personnes_concernees?: number;
}

interface RemonteesMapProps {
  remontees: Remontee[];
  onRemonteeSelect?: (remontee: Remontee) => void;
}

// Fonction pour extraire les coordonnées d'une localisation textuelle (approximation)
const parseLocation = (location: string): [number, number] | null => {
  // Gabon bounds approximately: longitude 8.7 to 14.5, latitude -3.9 to 2.3
  const gabonLocations: Record<string, [number, number]> = {
    libreville: [9.4673, 0.4162],
    "port-gentil": [8.7832, -0.7193],
    franceville: [13.5833, -1.6333],
    oyem: [11.5833, 1.6],
    moanda: [13.2, -1.5667],
    lambarene: [10.2333, -0.7],
    mouila: [11.0167, -1.8667],
    tchibanga: [11.0167, -2.85],
    makokou: [12.8667, 0.5667],
    koulamoutou: [12.4833, -1.1333],
    gamba: [10.0, -2.65],
    mayumba: [10.6667, -3.4167],
    mitzic: [11.5667, 0.7833],
    bitam: [11.4833, 2.0833],
    booue: [11.9333, -0.1],
  };

  const locationLower = location.toLowerCase().trim();
  
  // Chercher une correspondance exacte
  for (const [city, coords] of Object.entries(gabonLocations)) {
    if (locationLower.includes(city)) {
      return coords;
    }
  }

  // Par défaut, retourner Libreville
  return [9.4673, 0.4162];
};

export function RemonteesMap({ remontees, onRemonteeSelect }: RemonteesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return "#3b82f6"; // blue
      case "en_analyse":
        return "#eab308"; // yellow
      case "en_traitement":
        return "#f97316"; // orange
      case "resolu":
        return "#22c55e"; // green
      case "rejete":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const getPriorityIcon = (priorite: string) => {
    switch (priorite) {
      case "urgent":
        return "🔴";
      case "haute":
        return "🟠";
      case "moyenne":
        return "🟡";
      case "basse":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reclamation: "Réclamation",
      suggestion: "Suggestion",
      denonciation: "Dénonciation",
      article_presse: "Article de presse",
      commentaire_reseau: "Commentaire réseau",
      avis_reseau_social: "Avis réseau social",
    };
    return labels[type] || type;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with Mapbox token from environment
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error("Mapbox token not found");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [11.6094, -0.8037], // Centre du Gabon
      zoom: 5.5,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for remontees with location
    remontees.forEach((remontee) => {
      if (!remontee.localisation) return;

      const coords = parseLocation(remontee.localisation);
      if (!coords) return;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "remontee-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${getStatutColor(remontee.statut)};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: transform 0.2s;
      `;
      el.innerHTML = getPriorityIcon(remontee.niveau_priorite);

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      el.addEventListener("click", () => {
        if (onRemonteeSelect) {
          onRemonteeSelect(remontee);
        }
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(`
        <div style="padding: 8px; max-width: 250px;">
          <div style="margin-bottom: 6px;">
            <span style="display: inline-block; padding: 2px 8px; background-color: ${getStatutColor(
              remontee.statut
            )}; color: white; border-radius: 12px; font-size: 11px; font-weight: 600;">
              ${remontee.numero_reference}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #1f2937;">
            ${remontee.titre}
          </h4>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${remontee.description}
          </p>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px;">
            <span style="padding: 2px 6px; background-color: #f3f4f6; border-radius: 8px; color: #374151;">
              ${getTypeLabel(remontee.type_remontee)}
            </span>
            <span style="padding: 2px 6px; background-color: #fef3c7; border-radius: 8px; color: #92400e;">
              ${remontee.niveau_priorite}
            </span>
          </div>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [remontees, mapLoaded, onRemonteeSelect]);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserLocation(coords);
          
          if (map.current) {
            map.current.flyTo({
              center: coords,
              zoom: 12,
              essential: true,
            });

            // Add user location marker
            new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat(coords)
              .setPopup(
                new mapboxgl.Popup().setHTML(
                  '<div style="padding: 8px;"><strong>Votre position</strong></div>'
                )
              )
              .addTo(map.current);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const remonteesWithLocation = remontees.filter((r) => r.localisation);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Badge variant="secondary" className="shadow-lg">
          <MapPin className="h-3 w-3 mr-1" />
          {remonteesWithLocation.length} remontées géolocalisées
        </Badge>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button
          size="sm"
          variant="secondary"
          className="shadow-lg"
          onClick={handleLocateUser}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Ma position
        </Button>
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-[600px]" />

      <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Légende</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Nouveau</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>En analyse</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>En traitement</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Résolu</span>
          </div>
        </div>
        <div className="pt-2 border-t space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span>🔴</span>
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>🟠</span>
            <span>Haute</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>🟡</span>
            <span>Moyenne</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>🟢</span>
            <span>Basse</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
