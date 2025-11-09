import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { logger } from '@/lib/logger';

interface Remontee {
  id: string;
  titre: string;
  type_remontee: string;
  latitude?: number;
  longitude?: number;
  statut: string;
  numero_reference: string;
}

interface RemonteesMapProps {
  remontees: Remontee[];
  onMarkerClick?: (remonteeId: string) => void;
}

const statusColors: Record<string, string> = {
  nouveau: '#3b82f6',
  en_cours: '#eab308',
  traite: '#22c55e',
  rejete: '#ef4444',
};

export function RemonteesMap({ remontees, onMarkerClick }: RemonteesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { token: mapboxToken, isLoading, error } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    logger.info("🗺️ Initialisation de RemonteesMap...");

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [9.4544, -0.8037], // Gabon coordinates
        zoom: 6,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on("load", () => {
        logger.info("✅ RemonteesMap chargée");
      });

      map.current.on("error", (e) => {
        logger.warn("⚠️ Erreur RemonteesMap (ignorée si non critique)", e);
      });
    } catch (err) {
      logger.error("❌ Erreur initialisation RemonteesMap:", err);
    }

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter remontees with valid coordinates
    const validRemontees = remontees.filter(
      r => r.latitude !== null && r.longitude !== null && r.latitude !== undefined && r.longitude !== undefined
    );

    if (validRemontees.length === 0) return;

    // Add markers for each remontee
    validRemontees.forEach(remontee => {
      if (!map.current || remontee.latitude === null || remontee.longitude === null) return;

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = statusColors[remontee.statut] || '#3b82f6';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      if (onMarkerClick) {
        el.addEventListener('click', () => {
          onMarkerClick(remontee.id);
        });
      }

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${remontee.numero_reference}</div>
          <div style="font-size: 14px; margin-bottom: 4px;">${remontee.titre}</div>
          <div style="font-size: 12px; color: #666;">${remontee.type_remontee}</div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([remontee.longitude!, remontee.latitude!])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validRemontees.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validRemontees.forEach(remontee => {
        if (remontee.latitude && remontee.longitude) {
          bounds.extend([remontee.longitude, remontee.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [remontees, onMarkerClick]);

  if (error) {
    return (
      <div className="w-full h-full rounded-lg bg-muted/50 flex items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full rounded-lg bg-muted/50 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
}
