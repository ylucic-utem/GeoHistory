import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Coordinates } from '../types';
import ConflictTooltip, { ConflictInfo } from './ConflictTooltip';

interface MapboxVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
  conflicts: any[];
  showConflicts: boolean;
  events: any[];
  showEvents: boolean;
  onConflictVisualize?: (conflictData: ConflictInfo) => void;
}

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

const MapboxViz: React.FC<MapboxVizProps> = ({ onLocationSelect, selectedLocation, conflicts, showConflicts, events, showEvents, onConflictVisualize }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data?: ConflictInfo; pinned?: boolean }>({ visible: false, x: 0, y: 0, pinned: false });
  const pinnedRef = useRef<boolean>(false);

  const handleVisualize = (data: ConflictInfo) => {
    if (onConflictVisualize && data.lat != null && data.lng != null) {
      // Set the location to the conflict coordinates
      onLocationSelect({ lat: data.lat, lng: data.lng });
      // Trigger conflict visualization
      onConflictVisualize(data);
      // Hide tooltip
      setTooltip({ visible: false, x: 0, y: 0, pinned: false });
    }
  };

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
        zoom: 3, // Start with world view as per request
        center: [-74, -24]
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('style.load', () => {
        map.setFog({
            color: 'rgba(151, 151, 151, 0.2)', // Lower atmosphere
            'high-color': 'rgba(0, 0, 0, 1)', // Upper atmosphere
            'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
            'space-color': 'rgb(0, 0, 0)', // Background color
            'star-intensity': 0.2 // Background star brightness (default 0.35 at low zoooms )
        });
        setIsStyleLoaded(true);
    });

     map.on('click', (e) => {
       const { lng, lat } = e.lngLat;
       onLocationSelect({ lat, lng });
       // Hide any visible tooltip when clicking elsewhere
       pinnedRef.current = false;
       setTooltip({ visible: false, x: 0, y: 0, pinned: false });
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

    const sourceId = 'conflicts-source';
    const layerId = 'conflicts-layer';

    // Remove existing layer and source if they exist
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add conflict points if enabled
    if (showConflicts && conflicts.length > 0) {
      const validConflicts = conflicts.filter(conflict => 
        conflict.lat != null && conflict.lng != null && 
        !isNaN(conflict.lat) && !isNaN(conflict.lng)
      );
      const geojson = {
        type: 'FeatureCollection',
        features: validConflicts.map(conflict => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [conflict.lng, conflict.lat]
          },
          properties: {
            name: conflict.name,
            place: conflict.country,
            year: conflict.year,
            context: conflict.context,
            lat: conflict.lat,
            lng: conflict.lng
          }
        }))
      };

      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson
      });

      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 3,
          'circle-color': 'red',
          'circle-opacity': 1
        }
      });

      const onMouseMove = (e: any) => {
        // If tooltip is pinned, don't alter visibility/position based on hover
        if (pinnedRef.current) return;
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features && features.length > 0) {
          const f = features[0];
          const props = f.properties || {};
          setTooltip({
            visible: true,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            data: {
              name: props.name,
              place: props.place,
              year: props.year,
              context: props.context,
              lat: props.lat,
              lng: props.lng,
            },
            pinned: false
          });
          pinnedRef.current = false;
          map.getCanvas().style.cursor = 'pointer';
        } else {
          if (!pinnedRef.current) {
            setTooltip(t => ({ ...t, visible: false }));
          }
          map.getCanvas().style.cursor = '';
        }
      };
      const onMouseLeave = () => {
        if (pinnedRef.current) return;
        setTooltip(t => ({ ...t, visible: false }));
        map.getCanvas().style.cursor = '';
      };

      // Click to pin tooltip and place main pin
      const onClick = (e: any) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features && features.length > 0) {
          const f = features[0];
          const props = f.properties || {};
          setTooltip({
            visible: true,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            data: {
              name: props.name,
              place: props.place,
              year: props.year,
              context: props.context,
              lat: props.lat,
              lng: props.lng,
            },
            pinned: true
          });
          pinnedRef.current = true;
          // Place the user's main pin at the conflict location immediately
          onLocationSelect({ lat: props.lat, lng: props.lng });
        }
      };

      map.on('mousemove', layerId, onMouseMove);
      map.on('mouseleave', layerId, onMouseLeave);
      map.on('click', layerId, onClick);

      return () => {
        map.off('mousemove', layerId, onMouseMove);
        map.off('mouseleave', layerId, onMouseLeave);
        map.off('click', layerId, onClick);
      };
    }
  }, [conflicts, showConflicts, isStyleLoaded]);

  // Handle Event Points
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const sourceId = 'events-source';
    const layerId = 'events-layer';

    // Remove existing layer and source if they exist
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add event points if enabled
    if (showEvents && events.length > 0) {
      const validEvents = events.filter(event => 
        event.lat != null && event.lng != null && 
        !isNaN(event.lat) && !isNaN(event.lng)
      );
      const geojson = {
        type: 'FeatureCollection',
        features: validEvents.map(event => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [event.lng, event.lat]
          },
          properties: {
            name: event.name,
            place: event.place,
            country: event.country,
            year: event.year,
            context: event.context,
            lat: event.lat,
            lng: event.lng
          }
        }))
      };

      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson
      });

      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 3,
          'circle-color': 'yellow',
          'circle-opacity': 1
        }
      });

      const onMouseMove = (e: any) => {
        // If tooltip is pinned, don't alter visibility/position based on hover
        if (pinnedRef.current) return;
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features && features.length > 0) {
          const f = features[0];
          const props = f.properties || {};
          setTooltip({
            visible: true,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            data: {
              name: props.name,
              place: props.place,
              country: props.country,
              year: props.year,
              context: props.context,
              lat: props.lat,
              lng: props.lng,
            },
            pinned: false
          });
          pinnedRef.current = false;
          map.getCanvas().style.cursor = 'pointer';
        } else {
          if (!pinnedRef.current) {
            setTooltip(t => ({ ...t, visible: false }));
          }
          map.getCanvas().style.cursor = '';
        }
      };
      const onMouseLeave = () => {
        if (pinnedRef.current) return;
        setTooltip(t => ({ ...t, visible: false }));
        map.getCanvas().style.cursor = '';
      };

      // Click to pin tooltip and place main pin
      const onClick = (e: any) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features && features.length > 0) {
          const f = features[0];
          const props = f.properties || {};
          setTooltip({
            visible: true,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            data: {
              name: props.name,
              place: props.place,
              country: props.country,
              year: props.year,
              context: props.context,
              lat: props.lat,
              lng: props.lng,
            },
            pinned: true
          });
          pinnedRef.current = true;
          // Place the user's main pin at the event location immediately
          onLocationSelect({ lat: props.lat, lng: props.lng });
        }
      };

      map.on('mousemove', layerId, onMouseMove);
      map.on('mouseleave', layerId, onMouseLeave);
      map.on('click', layerId, onClick);

      return () => {
        map.off('mousemove', layerId, onMouseMove);
        map.off('mouseleave', layerId, onMouseLeave);
        map.off('click', layerId, onClick);
      };
    }
  }, [events, showEvents, isStyleLoaded]);

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