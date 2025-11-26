import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Coordinates } from '../types';

interface GlobeVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
}

const GlobeViz: React.FC<GlobeVizProps> = ({ onLocationSelect, selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainer.current, {
      zoomControl: false, // We'll add it manually to position it if needed, or stick to default
      attributionControl: true,
      minZoom: 2,
      worldCopyJump: true // Ensures smooth panning across the antimeridian
    }).setView([20, 0], 2);

    // Add OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Add Zoom Control at top-right
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    // Click Handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      // Normalize longitude to -180 to 180
      const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;
      onLocationSelect({ lat, lng: normalizedLng });
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Handle Marker Updates
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Add new marker if location is selected
    if (selectedLocation) {
      // Create a custom icon using a divIcon to avoid asset loading issues and match style
      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40], // Tip of the pin
        popupAnchor: [0, -40]
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: customIcon })
        .addTo(map);
      
      markerRef.current = marker;

      // Pan to the location with a smooth animation
      map.flyTo([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 5), {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedLocation]);

  return (
    <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default GlobeViz;