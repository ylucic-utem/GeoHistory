import React, { useState, useEffect, useRef } from 'react';
import { GeneratedImageResult, Coordinates, DateSelection } from '../types';
import { X, Share2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

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
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay text appearance for dramatic effect
    const timer = setTimeout(() => setShowText(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!result) return null;

  // Check if we have all the data needed for sharing
  const canShare = result.imageUrl;

  // Capture the card as an image
  const captureCard = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    try {
      setIsCapturing(true);
      
      // Wait a moment to ensure all animations are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Failed to capture card:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle sharing with web share API
  const handleShare = async () => {
    if (!canShare) return;
    
    const blob = await captureCard();
    if (!blob) {
      console.error('Failed to capture image');
      return;
    }

    const file = new File([blob], 'chronoglobe-moment.png', { type: 'image/png' });
    
    // Format location and date for share text
    const locationText = formatLocation();
    const dateText = formatDate();
    const shareText = `This is a moment in ${locationText} at ${dateText}. Visualized in ChronoGlobe`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: 'ChronoGlobe',
          text: shareText,
          files: [file]
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return;
      }
    }
    
    // Fallback: download if share not available
    handleDownload();
  };

  // Handle downloading the card
  const handleDownload = async () => {
    if (!canShare) return;
    
    const blob = await captureCard();
    if (!blob) {
      console.error('Failed to capture image');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `chronoglobe-${Date.now()}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center safe-screen bg-black/90 backdrop-blur-md animate-in fade-in duration-300" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="relative aspect-[9/16]" ref={cardRef}>
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
                      <p className="font-mono text-white/90 text-xs font-medium tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        Made in ChronoGlobe
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
                    
                    {/* Context display */}
                    {result.conflictData?.context && (
                      <div className={`transition-all duration-1000 delay-700 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <p className="text-sm font-normal text-white/85 mb-3 leading-relaxed" 
                           style={{ 
                             textShadow: '0 2px 4px rgba(0,0,0,0.3)', 
                             whiteSpace: 'pre-wrap'
                           }}>
                          {result.conflictData.context}
                        </p>
                      </div>
                    )}
                    
                    <div className={`transition-all duration-1000 delay-900 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <p className="text-sm text-white/80" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        Moment taken in {formatDate()} at {formatTime()}
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
            </div>
            
            {/* Action buttons */}
            <div className="p-6 flex justify-center items-center space-x-3">
              {canShare && (
                <>
                  {/* Download: icon-only */}
                  <button
                    onClick={handleDownload}
                    disabled={isCapturing}
                    className="flex items-center justify-center w-10 h-10 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    aria-label="Download"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  {/* Share: icon + text */}
                  <button
                    onClick={handleShare}
                    disabled={isCapturing}
                    className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isCapturing ? 'Capturing...' : 'Share'}</span>
                  </button>
                  {/* Close: icon-only */}
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-10 h-10 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageResult;