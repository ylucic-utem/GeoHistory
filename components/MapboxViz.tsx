import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Coordinates } from '../types';

interface MapboxVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
}

const MapboxViz: React.FC<MapboxVizProps> = ({ onLocationSelect, selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoieWx1Y2ljIiwiYSI6IjhqU3dOb0EifQ.158GAx8fevwQ_o2wsTvbOg';

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

    mapInstance.current = map;

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

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-black z-0" />;
}

export default MapboxViz;