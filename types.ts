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

export interface GeneratedImageResult {
  imageUrl: string | null;
  prompt: string;
  // Optional metadata for sharing
  location?: Coordinates;
  date?: DateSelection;
  time?: string;
}

export interface ShareCardData {
  imageUrl: string;
  location: Coordinates;
  date: DateSelection;
  time: string;
  locationName?: string;
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