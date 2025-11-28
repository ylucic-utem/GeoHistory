/**
 * Geocoding Service - Handles reverse geocoding using OpenCage API
 */

export interface GeocodeResult {
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Reverse geocode coordinates to get location information
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult | null> => {
  const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY || process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    console.error('OpenCage API key not found');
    return null;
  }

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(`${lat},${lng}`)}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const components = data.results[0].components;
      return {
        city: components.city || components.town || components.village,
        state: components.state,
        country: components.country
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
};

/**
 * Format geocode result as a readable location string
 */
export const formatLocationName = (result: GeocodeResult | null): string | undefined => {
  if (!result) return undefined;

  const parts: string[] = [];
  if (result.city) parts.push(result.city);
  if (result.state) parts.push(result.state);
  if (result.country) parts.push(result.country);

  return parts.length > 0 ? parts.join(', ') : undefined;
};