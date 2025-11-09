import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

export function MapLocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange,
  height = "400px" 
}: MapLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { token: mapboxToken, isLoading, error } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    logger.info("🗺️ Initialisation de MapLocationPicker...");

    try {
      mapboxgl.accessToken = mapboxToken;
      
      // Default center on Gabon
      const initialLat = latitude || -0.8037;
      const initialLng = longitude || 11.6094;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [initialLng, initialLat],
        zoom: latitude && longitude ? 12 : 6,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add scale control
      map.current.addControl(
        new mapboxgl.ScaleControl(),
        'bottom-left'
      );

      // Create draggable marker
      marker.current = new mapboxgl.Marker({
        draggable: true,
        color: '#3b82f6'
      })
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);

      // Update location when marker is dragged
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          onLocationChange(lngLat.lat, lngLat.lng);
        }
      });

      // Update marker position on map click
      map.current.on('click', (e) => {
        if (marker.current) {
          marker.current.setLngLat(e.lngLat);
          onLocationChange(e.lngLat.lat, e.lngLat.lng);
        }
      });

      map.current.on("load", () => {
        logger.info("✅ MapLocationPicker chargée");
      });

      map.current.on("error", (e) => {
        logger.warn("⚠️ Erreur MapLocationPicker (ignorée si non critique)", e);
      });

    } catch (err) {
      logger.error("❌ Erreur initialisation MapLocationPicker:", err);
    }

    // Cleanup
    return () => {
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update marker position when props change
  useEffect(() => {
    if (marker.current && latitude && longitude) {
      marker.current.setLngLat([longitude, latitude]);
      if (map.current) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 1000
        });
      }
    }
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationChange(latitude, longitude);
          
          if (marker.current) {
            marker.current.setLngLat([longitude, latitude]);
          }
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 1500
            });
          }
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setIsLocating(false);
      console.error('Geolocation is not supported by this browser.');
    }
  };

  if (error) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border shadow-sm bg-muted/50 flex items-center justify-center p-4" style={{ height }}>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border shadow-sm bg-muted/50 flex items-center justify-center" style={{ height }}>
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Cliquez sur la carte ou déplacez le marqueur pour définir la localisation</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isLocating ? 'Localisation...' : 'Ma position'}
        </Button>
      </div>
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg border shadow-sm"
        style={{ height }}
      />
      {latitude && longitude && (
        <div className="text-xs text-muted-foreground">
          Coordonnées: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
}
