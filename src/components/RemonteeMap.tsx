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

const getStatusColor = (statut: string): string => {
  const colors: Record<string, string> = {
    nouveau: '#3b82f6',
    en_cours: '#eab308',
    traite: '#22c55e',
    rejete: '#ef4444'
  };
  return colors[statut] || '#6b7280';
};

export function RemonteeMap({ remontees, onRemonteeClick, height = "500px" }: RemonteeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

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

    map.current.on('load', () => {
      if (!map.current) return;

      // Add source with clustering
      map.current.addSource('remontees', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add cluster circles layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'remontees',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#3b82f6',
            10,
            '#eab308',
            30,
            '#ef4444'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add cluster count layer
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'remontees',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Add unclustered points layer
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'remontees',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });

      // Add labels for unclustered points
      map.current.addLayer({
        id: 'unclustered-label',
        type: 'symbol',
        source: 'remontees',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '•',
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Click on cluster to zoom
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = map.current.getSource('remontees') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;

          const coordinates = (features[0].geometry as any).coordinates;
          map.current.easeTo({
            center: coordinates,
            zoom: zoom
          });
        });
      });

      // Show popup on unclustered point click
      map.current.on('click', 'unclustered-point', (e) => {
        if (!map.current || !e.features?.length) return;

        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const properties = e.features[0].properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-sm mb-2">${properties?.titre || 'Sans titre'}</h3>
              <p class="text-xs text-gray-600 mb-2">${properties?.numero_reference || ''}</p>
              <span class="text-xs px-2 py-1 rounded" style="background-color: ${properties?.color}20; color: ${properties?.color}">
                ${properties?.statut || ''}
              </span>
            </div>
          `)
          .addTo(map.current);

        if (onRemonteeClick && properties?.remontee_data) {
          try {
            const remontee = JSON.parse(properties.remontee_data);
            onRemonteeClick(remontee);
          } catch (e) {
            console.error('Error parsing remontee data:', e);
          }
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const validRemontees = remontees.filter(
      r => r.latitude !== null && r.longitude !== null
    );

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: validRemontees.map((remontee) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [remontee.longitude!, remontee.latitude!]
        },
        properties: {
          id: remontee.id,
          titre: remontee.titre,
          numero_reference: remontee.numero_reference,
          statut: remontee.statut,
          type_remontee: remontee.type_remontee,
          color: getStatusColor(remontee.statut),
          remontee_data: JSON.stringify(remontee)
        }
      }))
    };

    const source = map.current.getSource('remontees') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    }

    // Fit map to show all points
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
