/**
 * Utilities for managing Leaflet data layers with hover/click/touch interactions
 */

import L from 'leaflet';
import { filterValidCoordinates, HasCoordinates } from '../utils/coordinates';
import { buildTooltipData, TooltipData } from '../utils/geojson';

export interface LeafletLayerStyle {
  radius: number;
  radiusZoomed: number;
  fillColor: string;
  color: string;
  weight: number;
  opacity: number;
  fillOpacity: number;
}

export interface LeafletLayerConfig {
  style: LeafletLayerStyle;
  zoomThreshold: number;
}

export interface LeafletLayerCallbacks {
  onHover: (x: number, y: number, data: TooltipData) => void;
  onHoverEnd: () => void;
  onHoverMove: (x: number, y: number) => void;
  onPin: (x: number, y: number, data: TooltipData, lat: number, lng: number) => void;
  isPinned: () => boolean;
  getContainerPoint: (lat: number, lng: number) => { x: number; y: number };
}

/**
 * Populate a Leaflet layer group with circle markers
 */
export function populateLeafletLayer<T extends HasCoordinates>(
  map: L.Map,
  layerGroup: L.LayerGroup,
  items: T[],
  enabled: boolean,
  currentZoom: number,
  config: LeafletLayerConfig,
  callbacks: LeafletLayerCallbacks,
  dataMapper?: (item: T) => TooltipData
): void {
  // Clear existing markers
  layerGroup.clearLayers();

  if (!enabled || items.length === 0) return;

  const { style, zoomThreshold } = config;
  const radius = currentZoom > zoomThreshold ? style.radiusZoomed : style.radius;
  const validItems = filterValidCoordinates(items);

  validItems.forEach(item => {
    const marker = L.circleMarker([item.lat!, item.lng!], {
      radius,
      fillColor: style.fillColor,
      color: style.color,
      weight: style.weight,
      opacity: style.opacity,
      fillOpacity: style.fillOpacity,
    }).addTo(layerGroup);

    const tooltipData = dataMapper ? dataMapper(item) : buildTooltipData(item);

    // Desktop hover events
    if (!L.Browser.mobile) {
      marker.on('mouseover', (e: L.LeafletMouseEvent) => {
        const ev = e.originalEvent as MouseEvent;
        callbacks.onHover(ev.clientX, ev.clientY, tooltipData);
      });

      marker.on('mouseout', () => {
        callbacks.onHoverEnd();
      });

      marker.on('mousemove', (e: L.LeafletMouseEvent) => {
        const ev = e.originalEvent as MouseEvent;
        callbacks.onHoverMove(ev.clientX, ev.clientY);
      });
    }

    // Anchor tooltip helper
    const anchorTooltip = () => {
      const point = callbacks.getContainerPoint(item.lat!, item.lng!);
      callbacks.onPin(point.x, point.y, tooltipData, item.lat!, item.lng!);
    };

    // Click to pin tooltip
    marker.on('click', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      anchorTooltip();
    });

    // Touch support
    marker.on('touchend', (e: L.LeafletEvent) => {
      L.DomEvent.stopPropagation(e);
      anchorTooltip();
    });
  });
}

/**
 * Create layer config from visualization config
 */
export function createLeafletLayerConfig(
  style: LeafletLayerStyle,
  zoomThreshold: number
): LeafletLayerConfig {
  return { style, zoomThreshold };
}

/**
 * Data mapper for conflicts (uses country as place)
 */
export function conflictDataMapper(item: any): TooltipData {
  return {
    name: item.name,
    place: item.country,
    year: item.year,
    context: item.context,
    lat: item.lat,
    lng: item.lng,
  };
}

/**
 * Data mapper for events
 */
export function eventDataMapper(item: any): TooltipData {
  return {
    name: item.name,
    place: item.place,
    country: item.country,
    year: item.year,
    context: item.context,
    lat: item.lat,
    lng: item.lng,
    _kind: item._kind,
  };
}

/**
 * Data mapper for heritage sites
 */
export function heritageDataMapper(item: any): TooltipData {
  return {
    name: item.name,
    place: item.place,
    country: item.country,
    year: item.year,
    context: item.context,
    lat: item.lat,
    lng: item.lng,
  };
}
