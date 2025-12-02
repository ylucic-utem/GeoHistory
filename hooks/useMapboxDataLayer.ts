/**
 * Custom hook for managing Mapbox data layers with hover/click interactions
 */

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { GeoJSONFeatureCollection, buildTooltipData, TooltipData } from '../utils/geojson';

export interface MapboxLayerStyle {
  radius: number;
  radiusZoomed: number;
  color: string;
  opacity: number;
}

export interface MapboxLayerConfig {
  sourceId: string;
  layerId: string;
  style: MapboxLayerStyle;
  zoomThreshold: number;
  /** Optional: use Mapbox match expression for color based on property */
  colorExpression?: any;
}

export interface MapboxLayerCallbacks {
  onHover: (x: number, y: number, data: TooltipData) => void;
  onHoverEnd: () => void;
  onPin: (x: number, y: number, data: TooltipData, lat: number, lng: number) => void;
  isPinned: () => boolean;
}

/**
 * Setup a Mapbox circle layer with GeoJSON data.
 * Returns a cleanup function.
 */
export function setupMapboxDataLayer(
  map: mapboxgl.Map,
  geojson: GeoJSONFeatureCollection,
  config: MapboxLayerConfig,
  callbacks: MapboxLayerCallbacks
): () => void {
  const { sourceId, layerId, style, zoomThreshold, colorExpression } = config;

  // Add or update source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: 'geojson', data: geojson as any });
  } else {
    (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson as any);
  }

  // Add layer if it doesn't exist
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'step',
          ['zoom'],
          style.radius,
          zoomThreshold,
          style.radiusZoomed,
        ],
        'circle-color': colorExpression || style.color,
        'circle-opacity': style.opacity,
      },
    });
  }

  // Event handlers
  const onMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
    if (callbacks.isPinned()) return;

    const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
    if (features && features.length > 0) {
      const props = features[0].properties || {};
      callbacks.onHover(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
        buildTooltipData(props)
      );
      map.getCanvas().style.cursor = 'pointer';
    } else {
      callbacks.onHoverEnd();
      map.getCanvas().style.cursor = '';
    }
  };

  const onMouseLeave = () => {
    if (callbacks.isPinned()) return;
    callbacks.onHoverEnd();
    map.getCanvas().style.cursor = '';
  };

  const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
    if (features && features.length > 0) {
      const props = features[0].properties || {};
      const point = map.project([props.lng, props.lat]);
      callbacks.onPin(
        point.x,
        point.y,
        buildTooltipData(props),
        props.lat,
        props.lng
      );
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

/**
 * Create layer config from visualization config
 */
export function createMapboxLayerConfig(
  sourceId: string,
  layerId: string,
  style: MapboxLayerStyle,
  zoomThreshold: number,
  colorExpression?: any
): MapboxLayerConfig {
  return { sourceId, layerId, style, zoomThreshold, colorExpression };
}
