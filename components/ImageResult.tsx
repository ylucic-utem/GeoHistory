import React, { useState, useEffect } from 'react';
import { GeneratedImageResult, ShareCardData, Coordinates, DateSelection } from '../types';
import { X, Share2, Sparkles } from 'lucide-react';
import { shareNative } from '../services/shareService';

interface ImageResultProps {
  result: GeneratedImageResult | null;
  onClose: () => void;
  // Share metadata
  location?: Coordinates | null;
  date?: DateSelection;
  time?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ImageResult: React.FC<ImageResultProps> = ({ 
  result, 
  onClose,
  location,
  date,
  time 
}) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Delay text appearance for dramatic effect
    const timer = setTimeout(() => setShowText(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!result) return null;

  // Check if we have all the data needed for sharing
  const canShare = result.imageUrl && location && date && time;

  // Handle sharing directly
  const handleShare = async () => {
    if (!canShare) return;
    
    const shareData: ShareCardData = {
      imageUrl: result.imageUrl!,
      location: location!,
      date: date!,
      time: time!,
      locationName: result.locationName
    };

    const shared = await shareNative(shareData);
    if (!shared) {
      // Fallback: could show a message or something
      console.log('Share not available');
    }
  };

  // Format location for display
  const formatLocation = () => {
    // If we have a location name (from conflict), use it
    if (result.locationName) {
      return result.locationName;
    }
    if (!location) return 'Unknown location';
    const latStr = `${Math.abs(location.lat).toFixed(2)}° ${location.lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(location.lng).toFixed(2)}° ${location.lng >= 0 ? 'E' : 'W'}`;
    return `${latStr}, ${lngStr}`;
  };

  // Format date for display
  const formatDate = () => {
    if (!date) return 'Unknown date';
    return `${MONTHS[date.month - 1]} ${date.day}, ${date.year} ${date.era}`;
  };

  // Format time for display
  const formatTime = () => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="relative aspect-[9/16]">
              {result.imageUrl ? (
                <>
                  <img 
                    src={result.imageUrl} 
                    alt="Generated AI View" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  
                  {/* Animated text overlays */}
                  <div className="absolute top-0 left-0 w-full p-6">
                    <div className={`transition-all duration-1000 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <p className="font-mono text-white/90 text-xs font-medium tracking-wide flex items-center gap-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                        Generated Moment
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                    <div className={`transition-all duration-1000 delay-300 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <h1 className="font-sans text-3xl font-extrabold leading-tight mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {formatLocation().split(',')[0]}
                      </h1>
                    </div>
                    
                    {formatLocation().includes(',') && (
                      <div className={`transition-all duration-1000 delay-500 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <h2 className="text-lg font-medium text-white/90 mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                          {formatLocation().split(',').slice(1).join(',').trim()}
                        </h2>
                      </div>
                    )}
                    
                    <div className={`transition-all duration-1000 delay-700 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <p className="text-sm text-white/80" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {formatDate()} at {formatTime()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                  <div className="text-center">
                    <div className="text-red-400 text-lg font-semibold mb-2">Generation Failed</div>
                    <p className="text-gray-500 dark:text-gray-400">Unable to create the historical moment</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Action buttons */}
            <div className="p-6 flex justify-center">
              {canShare && (
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-full hover:bg-opacity-90 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Moment</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageResult;