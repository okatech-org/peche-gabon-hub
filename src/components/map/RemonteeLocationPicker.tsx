import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface RemonteeLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

export function RemonteeLocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  onClose,
}: RemonteeLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const { token: mapboxToken, isLoading, error } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    logger.info("🗺️ Initialisation de RemonteeLocationPicker...");

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: longitude && latitude ? [longitude, latitude] : [9.4544, -0.8037], // Gabon coordinates
        zoom: longitude && latitude ? 12 : 6,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });
      map.current.addControl(geolocateControl, 'top-right');

      // If initial coordinates provided, add marker
      if (longitude && latitude) {
        marker.current = new mapboxgl.Marker({ draggable: true, color: '#3b82f6' })
          .setLngLat([longitude, latitude])
          .addTo(map.current);

        marker.current.on('dragend', () => {
          if (!marker.current) return;
          const lngLat = marker.current.getLngLat();
          setSelectedCoords({ lat: lngLat.lat, lng: lngLat.lng });
        });
      }

      // Add click event to place marker
      map.current.on('click', (e) => {
        if (!map.current) return;

        // Remove existing marker if any
        if (marker.current) {
          marker.current.remove();
        }

        // Create new draggable marker
        marker.current = new mapboxgl.Marker({ draggable: true, color: '#3b82f6' })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map.current);

        setSelectedCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });

        marker.current.on('dragend', () => {
          if (!marker.current) return;
          const lngLat = marker.current.getLngLat();
          setSelectedCoords({ lat: lngLat.lat, lng: lngLat.lng });
        });
      });

      map.current.on("load", () => {
        logger.info("✅ RemonteeLocationPicker chargée");
      });

      map.current.on("error", (e) => {
        logger.warn("⚠️ Erreur RemonteeLocationPicker (ignorée si non critique)", e);
      });

    } catch (err) {
      logger.error("❌ Erreur initialisation RemonteeLocationPicker:", err);
    }

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-4 md:inset-10 bg-background border rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-4 md:inset-10 bg-background border rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 bg-background border rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Sélectionner la localisation</h3>
            <p className="text-sm text-muted-foreground">
              Cliquez sur la carte pour placer un marqueur ou déplacez le marqueur existant
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div ref={mapContainer} className="flex-1" />

        <div className="p-4 border-t bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {selectedCoords ? (
              <>
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  Lat: {selectedCoords.lat.toFixed(6)}, Lng: {selectedCoords.lng.toFixed(6)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Aucune localisation sélectionnée</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedCoords}>
              <MapPin className="h-4 w-4 mr-2" />
              Confirmer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
