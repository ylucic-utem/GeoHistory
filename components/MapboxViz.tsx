import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapVisualizationProps, TooltipState } from '../types';
import ConflictTooltip, { ConflictInfo } from './ConflictTooltip';
import { visualizationConfig } from '../visualizationConfig';
import { buildGeoJSON, conflictPropertyMapper, eventPropertyMapper, heritagePropertyMapper, TooltipData } from '../utils/geojson';
import { setupMapboxDataLayer, MapboxLayerCallbacks } from '../hooks/useMapboxDataLayer';

// Check WebGL support
const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch (e) {
    return false;
  }
};

const MapboxViz: React.FC<MapVisualizationProps> = ({
  onLocationSelect,
  selectedLocation,
  conflicts,
  showConflicts,
  events,
  showEvents,
  heritageSites,
  showHeritageSites,
  onConflictVisualize,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, pinned: false });
  const pinnedRef = useRef<boolean>(false);

  // Memoized handler for visualizing from tooltip
  const handleVisualize = useCallback((data: ConflictInfo) => {
    if (onConflictVisualize && data.lat != null && data.lng != null) {
      onLocationSelect({ lat: data.lat, lng: data.lng });
      onConflictVisualize(data);
      setTooltip({ visible: false, x: 0, y: 0, pinned: false });
    }
  }, [onLocationSelect, onConflictVisualize]);

  // Memoized layer callbacks
  const layerCallbacks: MapboxLayerCallbacks = useMemo(() => ({
    onHover: (x: number, y: number, data: TooltipData) => {
      if (pinnedRef.current) return;
      setTooltip({ visible: true, x, y, data, pinned: false });
    },
    onHoverEnd: () => {
      if (pinnedRef.current) return;
      setTooltip(t => ({ ...t, visible: false }));
    },
    onPin: (x: number, y: number, data: TooltipData, lat: number, lng: number) => {
      pinnedRef.current = true;
      setTooltip({ visible: true, x, y, data, pinned: true, anchorLat: lat, anchorLng: lng });
    },
    isPinned: () => pinnedRef.current,
  }), []);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Check WebGL support first
    if (!isWebGLSupported()) {
      console.error('WebGL not supported on this device');
      setError('WebGL is not supported on your device. Please try using the Map view instead.');
      return;
    }

    if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN environment variable.');
      setError('Mapbox configuration error.');
      return;
    }

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    try {
    const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/ylucic/cmif9gi5d002k01qrgk1q3jur',
        projection: 'globe' as any, // Cast to any to avoid type version conflicts
        zoom: 2, // Start with world view as per request
        center: [-70.7, -33]
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('style.load', () => {
        map.setFog({
            color: 'rgba(44, 44, 44, 0.2)', // Lower atmosphere
            'high-color': 'rgba(0, 0, 0, 1)', // Upper atmosphere
            'horizon-blend': 0.00, // Atmosphere thickness (default 0.2 at low zooms)
            'space-color': 'rgba(14, 14, 14, 1)', // Background color
            'star-intensity': 0.2 // Background star brightness (default 0.35 at low zoooms )
        });
        setIsStyleLoaded(true);
    });

     map.on('click', (e) => {
       const { lng, lat } = e.lngLat;
       // Only place pin and hide tooltip if user clicks on map (not on marker)
       if (pinnedRef.current) {
         // Hide the anchored tooltip when placing a new pin
         pinnedRef.current = false;
         setTooltip({ visible: false, x: 0, y: 0, pinned: false });
       }
       onLocationSelect({ lat, lng });
     });

    // Update tooltip position when map moves if tooltip is anchored
    map.on('move', () => {
      setTooltip(t => {
        if (t.pinned && t.anchorLat != null && t.anchorLng != null) {
          const point = map.project([t.anchorLng, t.anchorLat]);
          return { ...t, x: point.x, y: point.y };
        }
        return t;
      });
    });

    // Handle WebGL context loss
    map.on('error', (e) => {
      console.error('Mapbox error:', e);
      if (e.error?.message?.includes('WebGL') || e.error?.message?.includes('context')) {
        setError('WebGL error occurred. Please try using the Map view.');
      }
    });

    mapInstance.current = map;
    } catch (err) {
      console.error('Failed to initialize Mapbox:', err);
      setError('Failed to load the globe. Please try using the Map view instead.');
    }

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
        setIsStyleLoaded(false);
    }
  }, []); // Run once on mount

  // Handle Marker Updates
  useEffect(() => {
      if (!mapInstance.current) return;
      const map = mapInstance.current;

      // Remove existing marker
      if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
      }

      // Add new marker
      if (selectedLocation) {
          const marker = new mapboxgl.Marker({ color: '#ef4444' })
              .setLngLat([selectedLocation.lng, selectedLocation.lat])
              .addTo(map);
          
          markerRef.current = marker;

            // Do not change zoom or center automatically
      }
  }, [selectedLocation]);

  // Handle Conflict Points
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const geojson = buildGeoJSON(conflicts, showConflicts, conflictPropertyMapper);

    return setupMapboxDataLayer(map, geojson, {
      sourceId: 'conflicts-source',
      layerId: 'conflicts-layer',
      style: visualizationConfig.conflicts,
      zoomThreshold: visualizationConfig.zoomThreshold,
    }, layerCallbacks);
  }, [conflicts, showConflicts, isStyleLoaded, layerCallbacks]);

  // Handle Event Points
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const geojson = buildGeoJSON(events, showEvents, eventPropertyMapper);

    return setupMapboxDataLayer(map, geojson, {
      sourceId: 'events-source',
      layerId: 'events-layer',
      style: visualizationConfig.events,
      zoomThreshold: visualizationConfig.zoomThreshold,
      colorExpression: [
        'match',
        ['get', '_kind'],
        'heritage', visualizationConfig.heritage.color,
        'events', visualizationConfig.events.color,
        visualizationConfig.events.color,
      ],
    }, layerCallbacks);
  }, [events, showEvents, isStyleLoaded, layerCallbacks]);

  // Handle Heritage Sites Points
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const geojson = buildGeoJSON(heritageSites, showHeritageSites, heritagePropertyMapper);

    return setupMapboxDataLayer(map, geojson, {
      sourceId: 'heritage-source',
      layerId: 'heritage-layer',
      style: visualizationConfig.heritage,
      zoomThreshold: visualizationConfig.zoomThreshold,
    }, layerCallbacks);
  }, [heritageSites, showHeritageSites, isStyleLoaded, layerCallbacks]);

  // Show error state if WebGL failed
  if (error) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gray-900 z-0 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-white text-xl font-semibold mb-2">Globe View Unavailable</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-4">Switch to "Map" view in the controls panel.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-black z-0" />
      <ConflictTooltip 
        visible={tooltip.visible} 
        x={tooltip.x} 
        y={tooltip.y} 
        data={tooltip.data}
        onVisualize={handleVisualize}
      />
    </>
  );
}

export default MapboxViz;