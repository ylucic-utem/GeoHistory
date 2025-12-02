import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapVisualizationProps, TooltipState } from '../types';
import ConflictTooltip, { ConflictInfo } from './ConflictTooltip';
import { visualizationConfig } from '../visualizationConfig';
import { normalizeLongitude } from '../utils/coordinates';
import { TooltipData } from '../utils/geojson';
import {
  populateLeafletLayer,
  LeafletLayerCallbacks,
  conflictDataMapper,
  eventDataMapper,
  heritageDataMapper,
} from '../hooks/useLeafletDataLayer';

const MapViz: React.FC<MapVisualizationProps> = ({
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
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const conflictsLayerRef = useRef<L.LayerGroup | null>(null);
  const eventsLayerRef = useRef<L.LayerGroup | null>(null);
  const heritageLayerRef = useRef<L.LayerGroup | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, pinned: false });
  const [currentZoom, setCurrentZoom] = useState<number>(2);
  const pinnedRef = useRef<boolean>(false);

  // Memoized handler for visualizing from tooltip
  const handleVisualize = useCallback((data: ConflictInfo) => {
    if (onConflictVisualize && data.lat != null && data.lng != null) {
      onLocationSelect({ lat: data.lat, lng: data.lng });
      onConflictVisualize(data);
      setTooltip({ visible: false, x: 0, y: 0, pinned: false });
      pinnedRef.current = false;
    }
  }, [onLocationSelect, onConflictVisualize]);

  // Memoized layer callbacks
  const getLayerCallbacks = useCallback((): LeafletLayerCallbacks => ({
    onHover: (x: number, y: number, data: TooltipData) => {
      if (pinnedRef.current) return;
      setTooltip({ visible: true, x, y, data, pinned: false });
      pinnedRef.current = false;
    },
    onHoverEnd: () => {
      if (pinnedRef.current) return;
      setTooltip(t => ({ ...t, visible: false }));
    },
    onHoverMove: (x: number, y: number) => {
      if (pinnedRef.current) return;
      setTooltip(t => ({ ...t, x, y }));
    },
    onPin: (x: number, y: number, data: TooltipData, lat: number, lng: number) => {
      pinnedRef.current = true;
      setTooltip({ visible: true, x, y, data, pinned: true, anchorLat: lat, anchorLng: lng });
    },
    isPinned: () => pinnedRef.current,
    getContainerPoint: (lat: number, lng: number) => {
      const point = mapInstance.current!.latLngToContainerPoint([lat, lng]);
      return { x: point.x, y: point.y };
    },
  }), []);

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
      const normalizedLng = normalizeLongitude(lng);
      // Only place pin and hide tooltip if user clicks on map (not on marker)
      if (pinnedRef.current) {
        // Hide the anchored tooltip when placing a new pin
        pinnedRef.current = false;
        setTooltip({ visible: false, x: 0, y: 0, pinned: false });
      }
      onLocationSelect({ lat, lng: normalizedLng });
    });

    // Zoom handler to update marker sizes
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Update tooltip position when map moves if tooltip is anchored
    map.on('move', () => {
      setTooltip(t => {
        if (t.pinned && t.anchorLat != null && t.anchorLng != null) {
          const point = map.latLngToContainerPoint([t.anchorLat, t.anchorLng]);
          return { ...t, x: point.x, y: point.y };
        }
        return t;
      });
    });

    // Create layer group for conflicts
    conflictsLayerRef.current = L.layerGroup().addTo(map);

    // Create layer group for events
    eventsLayerRef.current = L.layerGroup().addTo(map);

    // Create layer group for heritage sites
    heritageLayerRef.current = L.layerGroup().addTo(map);

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

    populateLeafletLayer(
      mapInstance.current,
      conflictsLayerRef.current,
      conflicts,
      showConflicts,
      currentZoom,
      { style: visualizationConfig.conflicts, zoomThreshold: visualizationConfig.zoomThreshold },
      getLayerCallbacks(),
      conflictDataMapper
    );
  }, [conflicts, showConflicts, currentZoom, getLayerCallbacks]);

  // Handle Event Points
  useEffect(() => {
    if (!mapInstance.current || !eventsLayerRef.current) return;

    populateLeafletLayer(
      mapInstance.current,
      eventsLayerRef.current,
      events,
      showEvents,
      currentZoom,
      { style: visualizationConfig.events, zoomThreshold: visualizationConfig.zoomThreshold },
      getLayerCallbacks(),
      eventDataMapper
    );
  }, [events, showEvents, currentZoom, getLayerCallbacks]);

  // Handle Heritage Site Points
  useEffect(() => {
    if (!mapInstance.current || !heritageLayerRef.current) return;

    populateLeafletLayer(
      mapInstance.current,
      heritageLayerRef.current,
      heritageSites,
      showHeritageSites,
      currentZoom,
      { style: visualizationConfig.heritage, zoomThreshold: visualizationConfig.zoomThreshold },
      getLayerCallbacks(),
      heritageDataMapper
    );
  }, [heritageSites, showHeritageSites, currentZoom, getLayerCallbacks]);

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