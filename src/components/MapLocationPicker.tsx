import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('VITE_MAPBOX_TOKEN is not defined');
      return;
    }
    
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

    // Cleanup
    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, []);

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
