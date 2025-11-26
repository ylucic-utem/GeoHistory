import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Coordinates } from '../types';

interface MapboxVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
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

const MapboxViz: React.FC<MapboxVizProps> = ({ onLocationSelect, selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        style: 'mapbox://styles/ylucic/cmif9gj55006i01qtdjtp75zt/draft',
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
    });

    map.on('click', (e) => {
       const { lng, lat } = e.lngLat;
       onLocationSelect({ lat, lng });
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

          // Fly to location
          map.flyTo({
              center: [selectedLocation.lng, selectedLocation.lat],
              zoom: 4,
              speed: 1.5,
              curve: 1
          });
      }
  }, [selectedLocation]);

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

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-black z-0" />;
}

export default MapboxViz;