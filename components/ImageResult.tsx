import React, { useState } from 'react';
import { GeneratedImageResult, ShareCardData, Coordinates, DateSelection } from '../types';
import { X, Share2, MapPin, Calendar } from 'lucide-react';
import ShareCard from './ShareCard';

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
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!result) return null;

  // Check if we have all the data needed for sharing
  const canShare = result.imageUrl && location && date && time;
  
  const shareData: ShareCardData | null = canShare ? {
    imageUrl: result.imageUrl!,
    location: location!,
    date: date!,
    time: time!,
    locationName: result.locationName // Include location name if available (from conflicts)
  } : null;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-950">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Generated Moment
            </h3>
            <div className="flex gap-1">
              {/* Share Button */}
              {canShare && (
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-green-400 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-black/50">
            {result.imageUrl ? (
              <img 
                src={result.imageUrl} 
                alt="Generated AI View" 
                className="max-h-[60vh] rounded-lg shadow-lg border border-white/5"
              />
            ) : (
              <div className="text-red-400">Image generation failed.</div>
            )}
            
            {/* Location and Date Info */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>{formatLocation()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{formatDate()} • {formatTime()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Share Card Modal */}
      {shareData && (
        <ShareCard 
          data={shareData}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </>
  );
};

export default ImageResult;