import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../types';
import ConflictTooltip, { ConflictInfo } from './ConflictTooltip';

interface GlobeVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
  conflicts: any[];
  showConflicts: boolean;
}

const GlobeViz: React.FC<GlobeVizProps> = ({ onLocationSelect, selectedLocation, conflicts, showConflicts }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const conflictsLayerRef = useRef<L.LayerGroup | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data?: ConflictInfo }>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      worldCopyJump: true
    }).setView([-24, -74], 3); // Center at -74, -24 (lng, lat -> lat, lng for Leaflet)

    // Add CartoDB Positron Tiles (light style similar to MapTiler Basic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
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

    // Create layer group for conflicts
    conflictsLayerRef.current = L.layerGroup().addTo(map);

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
      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="width: 24px; height: 24px; background-color: #ef4444; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: customIcon })
        .addTo(map);

      markerRef.current = marker;

      map.flyTo([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 5), {
        animate: true,
        duration: 1
      });
    }
  }, [selectedLocation]);

  // Handle Conflict Points
  useEffect(() => {
    if (!mapInstance.current || !conflictsLayerRef.current) return;

    // Clear existing conflict markers
    conflictsLayerRef.current.clearLayers();

    // Add conflict points if enabled
    if (showConflicts && conflicts.length > 0) {
      conflicts.forEach(conflict => {
        if (conflict.lat != null && conflict.lng != null && !isNaN(conflict.lat) && !isNaN(conflict.lng)) {
          const marker = L.circleMarker([conflict.lat, conflict.lng], {
            radius: 3,
            fillColor: 'red',
            color: 'red',
            weight: 0,
            opacity: 1,
            fillOpacity: 1
          }).addTo(conflictsLayerRef.current!);

          marker.on('mouseover', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            setTooltip({
              visible: true,
              x: ev.clientX,
              y: ev.clientY,
              data: {
                name: conflict.name,
                place: conflict.place,
                year: conflict.year,
                context: conflict.context,
              }
            });
          });
          marker.on('mouseout', () => {
            setTooltip(t => ({ ...t, visible: false }));
          });
          marker.on('mousemove', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            setTooltip(t => ({ ...t, x: ev.clientX, y: ev.clientY }));
          });
        }
      });
    }
  }, [conflicts, showConflicts]);

  return (
    <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      <ConflictTooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} data={tooltip.data} />
    </div>
  );
};

export default GlobeViz;