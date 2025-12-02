/**
 * Coordinate validation and normalization utilities for map visualizations
 */

export interface HasCoordinates {
  lat?: number | null;
  lng?: number | null;
}

/**
 * Check if an item has valid, non-null coordinates
 */
export function isValidCoordinate(item: HasCoordinates): boolean {
  return (
    item.lat != null &&
    item.lng != null &&
    !isNaN(item.lat) &&
    !isNaN(item.lng)
  );
}

/**
 * Filter items that have valid coordinates
 */
export function filterValidCoordinates<T extends HasCoordinates>(items: T[]): T[] {
  return items.filter(isValidCoordinate);
}

/**
 * Normalize longitude to the range -180 to 180
 */
export function normalizeLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}
