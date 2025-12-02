/**
 * GeoJSON and tooltip data utilities for map visualizations
 */

import { filterValidCoordinates, HasCoordinates } from './coordinates';

export interface TooltipData {
  name?: string;
  place?: string;
  country?: string;
  year?: number | string;
  context?: string;
  lat?: number;
  lng?: number;
  _kind?: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: TooltipData;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Build tooltip data from a raw data item
 */
export function buildTooltipData(item: any): TooltipData {
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
 * Build a GeoJSON FeatureCollection from an array of items with coordinates
 */
export function buildGeoJSON<T extends HasCoordinates>(
  items: T[],
  enabled: boolean,
  propertyMapper?: (item: T) => Record<string, any>
): GeoJSONFeatureCollection {
  const validItems = enabled ? filterValidCoordinates(items) : [];
  
  return {
    type: 'FeatureCollection',
    features: validItems.map(item => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [item.lng!, item.lat!] as [number, number],
      },
      properties: propertyMapper ? propertyMapper(item) : buildTooltipData(item),
    })),
  };
}

/**
 * Default property mapper for conflicts (uses country as place)
 */
export function conflictPropertyMapper(item: any): Record<string, any> {
  return {
    name: item.name,
    place: item.country, // conflicts use country as place
    year: item.year,
    context: item.context,
    lat: item.lat,
    lng: item.lng,
  };
}

/**
 * Default property mapper for events
 */
export function eventPropertyMapper(item: any): Record<string, any> {
  return {
    name: item.name,
    place: item.place,
    country: item.country,
    year: item.year,
    context: item.context,
    lat: item.lat,
    lng: item.lng,
    _kind: item._kind || 'events',
  };
}

/**
 * Default property mapper for heritage sites
 */
export function heritagePropertyMapper(item: any): Record<string, any> {
  return {
    name: item.name,
    place: item.place,
    country: item.country,
    year: item.year,
    context: item.context,
    lat: item.lat,
    lng: item.lng,
    _kind: 'heritage',
  };
}
