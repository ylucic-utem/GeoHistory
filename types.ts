export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DateSelection {
  year: number;
  month: number;
  day: number;
  era: 'CE' | 'BCE';
}

export interface ConflictData {
  name?: string;
  place?: string;
  year?: number | string;
  context?: string;
  lat: number;
  lng: number;
}

// Shared tooltip state for map visualizations
export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data?: {
    name?: string;
    place?: string;
    country?: string;
    year?: number | string;
    context?: string;
    lat?: number;
    lng?: number;
    _kind?: string;
  };
  pinned?: boolean;
  anchorLat?: number;
  anchorLng?: number;
}

// Shared props interface for map visualization components
export interface MapVisualizationProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
  conflicts: any[];
  showConflicts: boolean;
  events: any[];
  showEvents: boolean;
  heritageSites: any[];
  showHeritageSites: boolean;
  onConflictVisualize?: (conflictData: any) => void;
  onEventVisualize?: (eventData: any) => void;
}

export interface GeneratedImageResult {
  imageUrl: string | null;
  prompt: string;
  // Optional metadata for sharing
  location?: Coordinates;
  date?: DateSelection;
  time?: string;
  locationName?: string; // Name of place (used for conflicts)
  conflictData?: ConflictData; // Full conflict data if generated from a conflict
}

export interface ShareCardData {
  imageUrl: string;
  location: Coordinates;
  date: DateSelection;
  time: string;
  locationName?: string;
  context?: string;
}

// Global declaration for the AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}