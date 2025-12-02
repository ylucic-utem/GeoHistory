import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Coordinates } from '../types';
import ConflictTooltip, { ConflictInfo } from './ConflictTooltip';
import { visualizationConfig } from '../visualizationConfig';

interface MapboxVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
  conflicts: any[];
  showConflicts: boolean;
  events: any[];
  showEvents: boolean;
  heritageSites: any[];
  showHeritageSites: boolean;
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

const MapboxViz: React.FC<MapboxVizProps> = ({ onLocationSelect, selectedLocation, conflicts, showConflicts, events, showEvents, heritageSites, showHeritageSites, onConflictVisualize }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data?: ConflictInfo; pinned?: boolean; anchorLat?: number; anchorLng?: number }>({ visible: false, x: 0, y: 0, pinned: false });
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

  // Handle Conflict Points (add or update source/layer without re-creating to avoid flicker)
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const sourceId = 'conflicts-source';
    const layerId = 'conflicts-layer';

    const validConflicts = (showConflicts ? conflicts : []).filter(conflict => 
      conflict.lat != null && conflict.lng != null && 
      !isNaN(conflict.lat) && !isNaN(conflict.lng)
    );
    const geojson: any = {
      type: 'FeatureCollection',
      features: validConflicts.map(conflict => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [conflict.lng, conflict.lat] },
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

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: geojson });
    } else {
      (map.getSource(sourceId) as any).setData(geojson);
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'step',
            ['zoom'],
            visualizationConfig.conflicts.radius,
            visualizationConfig.zoomThreshold,
            visualizationConfig.conflicts.radiusZoomed
          ],
          'circle-color': visualizationConfig.conflicts.color,
          'circle-opacity': visualizationConfig.conflicts.opacity
        }
      });
    }

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
          const point = map.project([props.lng, props.lat]);
          setTooltip({
            visible: true,
            x: point.x,
            y: point.y,
            data: {
              name: props.name,
              place: props.place,
              year: props.year,
              context: props.context,
              lat: props.lat,
              lng: props.lng,
            },
            pinned: true,
            anchorLat: props.lat,
            anchorLng: props.lng
          });
          pinnedRef.current = true;
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
  }, [conflicts, showConflicts, isStyleLoaded]);

  // Handle Event/Heritage Points (update source data to avoid flicker, color by kind)
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const sourceId = 'events-source';
    const layerId = 'events-layer';
    const validEvents = (showEvents ? events : []).filter(event => (
      event.lat != null && event.lng != null && 
      !isNaN(event.lat) && !isNaN(event.lng)
    ));
    const geojson: any = {
      type: 'FeatureCollection',
      features: validEvents.map(event => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [event.lng, event.lat] },
        properties: {
          name: event.name,
          place: event.place,
          country: event.country,
          year: event.year,
          context: event.context,
          lat: event.lat,
          lng: event.lng,
          _kind: event._kind || 'events'
        }
      }))
    };

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: geojson });
    } else {
      (map.getSource(sourceId) as any).setData(geojson);
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'step',
            ['zoom'],
            visualizationConfig.events.radius,
            visualizationConfig.zoomThreshold,
            visualizationConfig.events.radiusZoomed
          ],
          'circle-color': [
            'match',
            ['get', '_kind'],
            'heritage', visualizationConfig.heritage.color,
            'events', visualizationConfig.events.color,
            visualizationConfig.events.color
          ],
          'circle-opacity': visualizationConfig.events.opacity
        }
      });
    }

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

      // Click to pin tooltip
      const onClick = (e: any) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
        if (features && features.length > 0) {
          const f = features[0];
          const props = f.properties || {};
          const point = map.project([props.lng, props.lat]);
          setTooltip({
            visible: true,
            x: point.x,
            y: point.y,
            data: {
              name: props.name,
              place: props.place,
              country: props.country,
              year: props.year,
              context: props.context,
              lat: props.lat,
              lng: props.lng,
            },
            pinned: true,
            anchorLat: props.lat,
            anchorLng: props.lng
          });
          pinnedRef.current = true;
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
  }, [events, showEvents, isStyleLoaded]);

  // Handle Heritage Sites Points
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const map = mapInstance.current;

    const sourceId = 'heritage-source';
    const layerId = 'heritage-layer';
    const validSites = (showHeritageSites ? heritageSites : []).filter(site => (
      site.lat != null && site.lng != null && 
      !isNaN(site.lat) && !isNaN(site.lng)
    ));
    const geojson: any = {
      type: 'FeatureCollection',
      features: validSites.map(site => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [site.lng, site.lat] },
        properties: {
          name: site.name,
          place: site.place,
          country: site.country,
          year: site.year,
          context: site.context,
          lat: site.lat,
          lng: site.lng,
          _kind: 'heritage'
        }
      }))
    };

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: geojson });
    } else {
      (map.getSource(sourceId) as any).setData(geojson);
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'step',
            ['zoom'],
            visualizationConfig.heritage.radius,
            visualizationConfig.zoomThreshold,
            visualizationConfig.heritage.radiusZoomed
          ],
          'circle-color': visualizationConfig.heritage.color,
          'circle-opacity': visualizationConfig.heritage.opacity
        }
      });
    }

    const onMouseMove = (e: any) => {
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

    const onClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
      if (features && features.length > 0) {
        const f = features[0];
        const props = f.properties || {};
        const point = map.project([props.lng, props.lat]);
        setTooltip({
          visible: true,
          x: point.x,
          y: point.y,
          data: {
            name: props.name,
            place: props.place,
            country: props.country,
            year: props.year,
            context: props.context,
            lat: props.lat,
            lng: props.lng,
          },
          pinned: true,
          anchorLat: props.lat,
          anchorLng: props.lng
        });
        pinnedRef.current = true;
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
  }, [heritageSites, showHeritageSites, isStyleLoaded]);

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