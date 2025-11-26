import React, { useState, useCallback, useEffect } from 'react';
import GlobeViz from './components/GlobeViz';
import MapboxViz from './components/MapboxViz';
import ControlPanel from './components/ControlPanel';
import ImageResult from './components/ImageResult';
import ImageGallery from './components/ImageGallery';
import { Coordinates, DateSelection, GeneratedImageResult } from './types';
import { generateImageFromPrompt, checkApiKeySelection, requestApiKeySelection } from './services/geminiService';
import { loadStoredImages, saveGeneratedImage, clearStoredImages } from './services/storageService';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateSelection>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    era: 'CE'
  });
  const [selectedTime, setSelectedTime] = useState<string>("12:00");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageResult[]>([]);
  const [selectedImageForView, setSelectedImageForView] = useState<GeneratedImageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'mapbox'>('map'); // Default to map, will update on mount
  const [isMobile, setIsMobile] = useState(true); // Assume mobile first for safety
  
  // Panel starts open on desktop, closed on mobile
  // Use useEffect to safely check window dimensions after mount
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  
  // Detect mobile device and set initial states
  React.useEffect(() => {
    const checkMobile = () => {
      // Check for mobile using multiple methods for reliability
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth < 768
        || ('ontouchstart' in window && window.innerWidth < 1024);
      return isMobileDevice;
    };
    
    const mobile = checkMobile();
    setIsMobile(mobile);
    setIsControlPanelOpen(!mobile); // Open panel on desktop
    
    // On mobile, always use map view (Leaflet)
    // On desktop, default to mapbox globe
    setViewMode(mobile ? 'map' : 'mapbox');
  }, []);

  // Load stored images on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const storedImages = await loadStoredImages();
        if (storedImages.length > 0) {
          setGeneratedImages(storedImages);
        }
      } catch (error) {
        console.error('Failed to load stored images:', error);
      }
    };
    loadImages();
  }, []);

  const formatMonth = (m: number) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[m - 1] || "January";
  };

  const constructPrompt = (coords: Coordinates, date: DateSelection, time: string): string => {
    const latStr = `${Math.abs(coords.lat).toFixed(4)}° ${coords.lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(coords.lng).toFixed(4)}° ${coords.lng >= 0 ? 'E' : 'W'}`;
    const dateStr = `${formatMonth(date.month)} ${date.day}, ${date.year} ${date.era}`;
    
    return `Create an image at ${latStr}, ${lngStr}, ${dateStr}, ${time} hours. Capture the historical atmosphere, architecture, and environment accurately for this specific time and place. Photorealistic, high quality.`;
  };

  const handleGenerate = async () => {
    if (!selectedLocation) return;
    setIsGenerating(true);
    setErrorMsg(null);

    const prompt = constructPrompt(selectedLocation, selectedDate, selectedTime);

    try {
      // 1. Check API Key
      const hasKey = await checkApiKeySelection();
      if (!hasKey) {
        setIsGenerating(false);
        try {
            await requestApiKeySelection();
            setErrorMsg("Please click Generate again after selecting your API key.");
            return; 
        } catch (e) {
            console.error("Key selection failed", e);
            setErrorMsg("Billing setup is required for high-quality generation.");
            return;
        }
      }

      // 2. Generate
      const imageUrl = await generateImageFromPrompt(prompt);
      const newImageResult: GeneratedImageResult = { 
        imageUrl, 
        prompt,
        location: selectedLocation,
        date: selectedDate,
        time: selectedTime
      };
      setGeneratedImages(prev => [newImageResult, ...prev]); // Add to front (newest first)
      setSelectedImageForView(newImageResult);
      
      // Save to persistent storage
      await saveGeneratedImage(newImageResult, selectedLocation, selectedDate, selectedTime);
      
      // Optionally close panel on mobile after generation to show result
      if (window.innerWidth < 768) {
        setIsControlPanelOpen(false);
      }

    } catch (error: any) {
      if (error.message === "API_KEY_MISSING") {
         try {
             await requestApiKeySelection();
             setErrorMsg("Please select a project with billing enabled to proceed.");
         } catch (e) {
             setErrorMsg("Failed to select API key.");
         }
      } else {
        setErrorMsg("Failed to generate visualization. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearGallery = useCallback(async () => {
    setGeneratedImages([]);
    setSelectedImageForView(null);
    await clearStoredImages();
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      {/* Background Visualization Switcher */}
      {viewMode === 'map' && (
        <GlobeViz 
          onLocationSelect={setSelectedLocation} 
          selectedLocation={selectedLocation} 
        />
      )}
      {viewMode === 'mapbox' && (
        <MapboxViz
          onLocationSelect={setSelectedLocation}
          selectedLocation={selectedLocation}
        />
      )}

      {/* Branding Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent drop-shadow-lg">
          ChronoGlobe
        </h1>
        <p className="text-sm text-gray-400 font-light mt-1 max-w-xs drop-shadow-md hidden sm:block">
          Explore the visual history of Earth through AI.
        </p>
      </div>

      {/* Controls Panel - Responsive Bottom Sheet / Floating Card */}
      <ControlPanel
        selectedLocation={selectedLocation}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedTime={selectedTime}
        onTimeChange={setSelectedTime}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        isOpen={isControlPanelOpen}
        onToggleOpen={() => setIsControlPanelOpen(prev => !prev)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isMobile={isMobile}
      />

      {/* Floating Toggle Button - Visible only when panel is CLOSED */}
      <div className={`
        fixed bottom-6 left-6 z-30 transition-all duration-300 ease-in-out
        ${isControlPanelOpen ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}
      `}>
        <button
          onClick={() => setIsControlPanelOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-900/30 flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95"
          aria-label="Open time travel controls"
        >
          <Menu className="w-6 h-6" />
          <span className="font-semibold pr-1">Controls</span>
        </button>
      </div>

      {/* Image Gallery */}
      <ImageGallery
        images={generatedImages}
        onImageSelect={setSelectedImageForView}
        onClearGallery={handleClearGallery}
      />

      {/* Result Modal */}
      {selectedImageForView && (
        <ImageResult 
          result={selectedImageForView} 
          onClose={() => setSelectedImageForView(null)}
          location={selectedLocation}
          date={selectedDate}
          time={selectedTime}
        />
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="absolute top-6 right-6 z-50 bg-red-500/90 backdrop-blur border border-red-400 text-white px-4 py-3 rounded-lg shadow-xl animate-bounce">
          <p className="text-sm font-semibold">{errorMsg}</p>
          <button 
            onClick={() => setErrorMsg(null)}
            className="absolute top-1 right-1 p-1 hover:bg-white/20 rounded-full"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}
      
      {/* Billing Link Helper */}
      <div className="absolute bottom-2 right-2 z-10 text-[10px] text-gray-600 pointer-events-auto">
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">
          Billing Information
        </a>
      </div>
    </div>
  );
};

export default App;