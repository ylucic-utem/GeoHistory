import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../types';
import ConflictTooltip, { ConflictInfo } from './ConflictTooltip';
import { visualizationConfig } from '../visualizationConfig';

interface MapVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
  conflicts: any[];
  showConflicts: boolean;
  events: any[];
  showEvents: boolean;
  onConflictVisualize?: (conflictData: ConflictInfo) => void;
  onEventVisualize?: (eventData: any) => void;
}

const MapViz: React.FC<MapVizProps> = ({ onLocationSelect, selectedLocation, conflicts, showConflicts, events, showEvents, onConflictVisualize, onEventVisualize }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const conflictsLayerRef = useRef<L.LayerGroup | null>(null);
  const eventsLayerRef = useRef<L.LayerGroup | null>(null);
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
      pinnedRef.current = false;
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      worldCopyJump: true
    }).setView([-33, -70.6], 9); // Center at -74, -24 (lng, lat -> lat, lng for Leaflet)

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
      // Hide any visible tooltip when clicking elsewhere
      pinnedRef.current = false;
      setTooltip({ visible: false, x: 0, y: 0, pinned: false });
    });

    // Create layer group for conflicts
    conflictsLayerRef.current = L.layerGroup().addTo(map);

    // Create layer group for events
    eventsLayerRef.current = L.layerGroup().addTo(map);

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
        html: `<div style="width: ${visualizationConfig.selectedPin.size}px; height: ${visualizationConfig.selectedPin.size}px; background-color: ${visualizationConfig.selectedPin.backgroundColor}; border: ${visualizationConfig.selectedPin.borderWidth}px solid ${visualizationConfig.selectedPin.borderColor}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [visualizationConfig.selectedPin.size, visualizationConfig.selectedPin.size],
        iconAnchor: [visualizationConfig.selectedPin.size / 2, visualizationConfig.selectedPin.size],
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: customIcon })
        .addTo(map);

      markerRef.current = marker;

      // Do not change zoom or center automatically
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
            radius: visualizationConfig.conflicts.radius,
            fillColor: visualizationConfig.conflicts.fillColor,
            color: visualizationConfig.conflicts.color,
            weight: visualizationConfig.conflicts.weight,
            opacity: visualizationConfig.conflicts.opacity,
            fillOpacity: visualizationConfig.conflicts.fillOpacity
          }).addTo(conflictsLayerRef.current!);

          marker.on('mouseover', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            setTooltip({
              visible: true,
              x: ev.clientX,
              y: ev.clientY,
              data: {
                name: conflict.name,
                place: conflict.country,
                year: conflict.year,
                context: conflict.context,
                lat: conflict.lat,
                lng: conflict.lng,
              },
              pinned: false
            });
            pinnedRef.current = false;
          });
          marker.on('mouseout', () => {
            // If pinned, ignore hover-out events to keep tooltip visible
            if (!pinnedRef.current) {
              setTooltip(t => ({ ...t, visible: false }));
            }
          });
          marker.on('mousemove', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            if (!pinnedRef.current) {
              setTooltip(t => ({ ...t, x: ev.clientX, y: ev.clientY }));
            }
          });
          // Pin tooltip and place main pin on click
          marker.on('click', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            // Stop propagation to prevent map click handler from firing
            L.DomEvent.stopPropagation(e);
            setTooltip({
              visible: true,
              x: ev.clientX,
              y: ev.clientY,
              data: {
                name: conflict.name,
                place: conflict.place,
                country: conflict.country,
                year: conflict.year,
                context: conflict.context,
                lat: conflict.lat,
                lng: conflict.lng,
              },
              pinned: true
            });
            pinnedRef.current = true;
            // Place the user's main pin at the conflict location immediately
            onLocationSelect({ lat: conflict.lat, lng: conflict.lng });
          });
        }
      });
    }
  }, [conflicts, showConflicts]);

  // Handle Event Points
  useEffect(() => {
    if (!mapInstance.current || !eventsLayerRef.current) return;

    // Clear existing event markers
    eventsLayerRef.current.clearLayers();

    // Add event points if enabled
    if (showEvents && events.length > 0) {
      events.forEach(event => {
        if (event.lat != null && event.lng != null && !isNaN(event.lat) && !isNaN(event.lng)) {
          const marker = L.circleMarker([event.lat, event.lng], {
            radius: visualizationConfig.events.radius,
            fillColor: visualizationConfig.events.fillColor,
            color: visualizationConfig.events.color,
            weight: visualizationConfig.events.weight,
            opacity: visualizationConfig.events.opacity,
            fillOpacity: visualizationConfig.events.fillOpacity
          }).addTo(eventsLayerRef.current!);

          marker.on('mouseover', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            setTooltip({
              visible: true,
              x: ev.clientX,
              y: ev.clientY,
              data: {
                name: event.name,
                place: event.place,
                country: event.country,
                year: event.year,
                context: event.context,
                lat: event.lat,
                lng: event.lng,
              },
              pinned: false
            });
            pinnedRef.current = false;
          });
          marker.on('mouseout', () => {
            // If pinned, ignore hover-out events to keep tooltip visible
            if (!pinnedRef.current) {
              setTooltip(t => ({ ...t, visible: false }));
            }
          });
          marker.on('mousemove', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            if (!pinnedRef.current) {
              setTooltip(t => ({ ...t, x: ev.clientX, y: ev.clientY }));
            }
          });
          // Pin tooltip and place main pin on click
          marker.on('click', (e: any) => {
            const ev = e.originalEvent as MouseEvent;
            // Stop propagation to prevent map click handler from firing
            L.DomEvent.stopPropagation(e);
            const eventData = {
              name: event.name,
              place: event.place,
              country: event.country,
              year: event.year,
              context: event.context,
              lat: event.lat,
              lng: event.lng,
            };
            setTooltip({
              visible: true,
              x: ev.clientX,
              y: ev.clientY,
              data: eventData,
              pinned: true
            });
            pinnedRef.current = true;
            // Place the user's main pin at the event location immediately
            onLocationSelect({ lat: event.lat, lng: event.lng });
          });
        }
      });
    }
  }, [events, showEvents]);

  return (
    <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      <ConflictTooltip 
        visible={tooltip.visible} 
        x={tooltip.x} 
        y={tooltip.y} 
        data={tooltip.data}
        onVisualize={handleVisualize}
      />
    </div>
  );
};

export default MapViz;