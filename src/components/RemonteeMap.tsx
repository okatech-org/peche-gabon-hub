import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

export function RemonteeMap({ remontees, onRemonteeClick, height = "500px" }: RemonteeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

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

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter remontees with valid coordinates
    const validRemontees = remontees.filter(
      r => r.latitude !== null && r.longitude !== null
    );

    if (validRemontees.length === 0) return;

    // Add markers for each remontee
    validRemontees.forEach((remontee) => {
      if (remontee.latitude === null || remontee.longitude === null) return;

      // Color based on status
      const markerColor = 
        remontee.statut === 'nouveau' ? '#3b82f6' :
        remontee.statut === 'en_cours' ? '#eab308' :
        remontee.statut === 'traite' ? '#22c55e' :
        '#ef4444';

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([remontee.longitude, remontee.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1">${remontee.titre}</h3>
                <p class="text-xs text-gray-600 mb-1">${remontee.numero_reference}</p>
                <span class="text-xs px-2 py-1 rounded" style="background-color: ${markerColor}20; color: ${markerColor}">
                  ${remontee.statut}
                </span>
              </div>
            `)
        )
        .addTo(map.current!);

      if (onRemonteeClick) {
        marker.getElement().addEventListener('click', () => {
          onRemonteeClick(remontee);
        });
      }

      markers.current.push(marker);
    });

    // Fit map to show all markers
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
  }, [remontees, onRemonteeClick]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full rounded-lg border shadow-sm"
      style={{ height }}
    />
  );
}
