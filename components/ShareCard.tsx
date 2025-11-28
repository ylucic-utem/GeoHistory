import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { ShareCardData } from '../types';
import {
  generateShareCardImage,
  downloadOriginalImage,
  shareNative,
  formatLocationText,
  formatDateTimeText,
  downloadShareCard
} from '../services/shareService';

interface ShareCardProps {
  data: ShareCardData;
  isOpen: boolean;
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ data, isOpen, onClose }) => {
  // Blur gradient configuration
  const blurIntensity = 10; // px
  const bottomBlurOpacity = 0.4; // How much blur at bottom
  const topBlurOpacity = 0.0; // How much blur at top (0 = no blur)
  const blurHeightFraction = 0.3; // Fraction of card height for blur gradient (at least 1/5 as requested)
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Generate the card image when opened
  useEffect(() => {
    if (isOpen && data.imageUrl) {
      setIsGenerating(true);
      setError(null);
      
      generateShareCardImage(data)
        .then((url) => {
          setCardImageUrl(url);
          setIsGenerating(false);
        })
        .catch((err) => {
          console.error('Failed to generate share card:', err);
          setError('Failed to generate share card');
          setIsGenerating(false);
        });
    }
  }, [isOpen, data]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    try {
      await downloadShareCard(data);
    } catch (err) {
      setError('Failed to download image');
    }
  };

  const handleShareOnSocials = async () => {
    // Use native share API - lets user choose WhatsApp, Instagram, etc.
    const shared = await shareNative(data);
    if (!shared) {
      // Fallback message if native share not available
      setError('Share not available. Please download and share manually.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!isOpen) return null;

  const locationLines = formatLocationText(data.locationName, data.location.lat, data.location.lng);
  const dateTimeLines = formatDateTimeText(data.date, data.time);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="w-full max-w-sm mx-auto"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
          <div className="relative aspect-[9/16]">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Generating share card...</p>
                </div>
              </div>
            ) : (
              <>
                <img
                  alt="A serene landscape with a futuristic city in the background and a person sitting on a hill of flowers in the foreground."
                  className="absolute inset-0 w-full h-full object-cover"
                  src={data.imageUrl}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                {/* Blur gradient overlay for better text readability */}
                <div
                  className="absolute inset-0"
                  style={{
                    backdropFilter: `blur(${blurIntensity}px)`,
                    maskImage: `linear-gradient(to top, rgba(0,0,0,${bottomBlurOpacity}) 0%, rgba(0,0,0,${topBlurOpacity}) ${blurHeightFraction * 100}%, transparent ${blurHeightFraction * 100}%, transparent 100%)`,
                    WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,${bottomBlurOpacity}) 0%, rgba(0,0,0,${topBlurOpacity}) ${blurHeightFraction * 100}%, transparent ${blurHeightFraction * 100}%, transparent 100%)`,
                  }}
                ></div>
                <div className="absolute top-0 left-0 w-full p-6">
                  <p className="font-mono text-white/90 text-xs font-medium tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Made in ChronoGlobe</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                  <h1 className="font-sans text-4xl font-extrabold leading-tight mb-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{locationLines[0]}</h1>
                  {locationLines.length > 1 && (
                    <h2 className="text-lg font-medium text-white/90 mb-3" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{locationLines.slice(1).join(', ')}</h2>
                  )}
                  <p className="text-sm text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{dateTimeLines.join(' ')}</p>
                </div>
              </>
            )}

            {/* Close Button - Absolute top right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Error message */}
            {error && (
              <div className="absolute bottom-4 left-4 right-4 px-4 py-2 bg-red-500/90 text-white rounded-lg z-10 text-center text-sm">
                {error}
              </div>
            )}
          </div>
          <div className="p-6 flex justify-center items-center space-x-3">
            <button
              onClick={handleDownload}
              disabled={isGenerating || !cardImageUrl}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handleShareOnSocials}
              disabled={isGenerating || !cardImageUrl}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
