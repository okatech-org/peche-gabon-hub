import { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import surveillanceImg from "@/assets/surveillance.jpg";
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
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  const [initNonce, setInitNonce] = useState(0);
  const [inspections, setInspections] = useState<Inspection[]>(mockInspections);
  const [filterType, setFilterType] = useState<string>("tous");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Token Mapbox - mémorisé pour éviter les re-renders
  const mapboxToken = useMemo(
    () => import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY2x4anExeWN6MDdmYzJrcXptbXN4dDZ0ZSJ9.5K6P4BTFQS2bJTjG8KWz0g",
    []
  );

  // Initialiser la carte (une fois + lors d'un retry)
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    console.log("Initialisation de la carte Mapbox...");
    console.log("Token présent:", mapboxToken ? "Oui" : "Non");

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [9.4673, 0.4162], // Libreville, Gabon
        zoom: 6,
      });

      map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

      map.current.on("load", () => {
        console.log("Carte Mapbox chargée avec succès");
        setErrorMsg(null);
        setShowFallbackImage(false);
        setIsMapReady(true);
        setIsLoading(false);
      });

      map.current.on("error", (e) => {
        console.error("Erreur Mapbox:", e);
        setErrorMsg("Erreur lors du chargement des tuiles de carte. Vérifiez le token ou la connexion réseau.");
        setIsLoading(false);
      });

    } catch (error) {
      console.error("Erreur d'initialisation de la carte:", error);
      setErrorMsg("Impossible d'initialiser la carte.");
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initNonce]); // relance via initNonce

  // Ajouter les marqueurs
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filtrer les inspections
    let filtered = inspections;
    if (filterType !== "tous") {
      filtered = filtered.filter((i) => i.type === filterType);
    }
    if (filterStatut !== "tous") {
      filtered = filtered.filter((i) => i.statut === filterStatut);
    }

    // Ajouter les nouveaux marqueurs
    filtered.forEach((inspection) => {
      const color = getMarkerColor(inspection.statut);
      
      // Créer l'élément HTML du marqueur
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      
      // Icône selon le statut
      const icon = document.createElement("div");
      icon.innerHTML = getMarkerIcon(inspection.statut);
      icon.style.color = "white";
      icon.style.fontSize = "14px";
      el.appendChild(icon);

      // Créer le popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${inspection.numero}</h3>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Type:</strong> ${inspection.type}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Cible:</strong> ${inspection.cible}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Site:</strong> ${inspection.site}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Date:</strong> ${new Date(inspection.date).toLocaleDateString("fr-FR")}
          </div>
          ${inspection.observations ? `<div style="font-size: 11px; color: #888; margin-top: 8px; font-style: italic;">${inspection.observations}</div>` : ""}
        </div>
      `);

      // Créer et ajouter le marqueur
      const marker = new mapboxgl.Marker(el)
        .setLngLat([inspection.lng, inspection.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Ajuster la vue pour voir tous les marqueurs
    if (filtered.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filtered.forEach((inspection) => {
        bounds.extend([inspection.lng, inspection.lat]);
      });
      map.current?.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [inspections, isMapReady, filterType, filterStatut]);

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

  const getMarkerIcon = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "⏱";
      case "terminee":
        return "✓";
      case "conforme":
        return "✓";
      case "non_conforme":
        return "✕";
      default:
        return "•";
    }
  };

  const handleLocateMe = () => {
    if (!map.current) return;

    if (navigator.geolocation) {
      toast.loading("Localisation en cours...");
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

          toast.success("Position trouvée");
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
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
        <Button onClick={handleLocateMe} variant="outline">
          <Locate className="h-4 w-4 mr-2" />
          Me localiser
        </Button>
      </div>

      {/* Filtres et légende */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Carte */}
      <Card className="overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full text-center space-y-3">
              <p className="text-sm text-destructive">{errorMsg}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="default" onClick={() => { setIsLoading(true); setErrorMsg(null); setInitNonce((n) => n + 1); }}>
                  Réessayer
                </Button>
                <Button variant="outline" onClick={() => setShowFallbackImage(true)}>
                  Afficher une image
                </Button>
              </div>
            </div>
          </div>
        )}

        {showFallbackImage ? (
          <img src={surveillanceImg} alt="Carte indisponible - Vue de surveillance" className="w-full h-[calc(100vh-280px)] md:h-[600px] object-cover" />
        ) : (
          <div
            ref={mapContainer}
            className="w-full h-[calc(100vh-280px)] md:h-[600px]"
          />
        )}
      </Card>
    </div>
  );
}
