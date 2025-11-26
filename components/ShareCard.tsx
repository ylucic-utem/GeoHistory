import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { ShareCardData } from '../types';
import {
  generateShareCardImage,
  downloadOriginalImage,
  shareNative
} from '../services/shareService';

interface ShareCardProps {
  data: ShareCardData;
  isOpen: boolean;
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ data, isOpen, onClose }) => {
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
      await downloadOriginalImage(data.imageUrl);
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
      >
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-gray-950 flex-shrink-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-green-400" />
            Share Creation
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-gray-950 overflow-y-auto flex-1 min-h-0">
          {isGenerating ? (
            <div className="w-full aspect-[3/4] max-w-[280px] bg-white/5 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Generating share card...</p>
              </div>
            </div>
          ) : cardImageUrl ? (
            <img
              src={cardImageUrl}
              alt="Share Card Preview"
              className="w-full max-w-[280px] rounded-xl shadow-2xl border border-white/10"
            />
          ) : null}

          {/* Error message - shown below card */}
          {error && (
            <div className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Share Actions - Simplified */}
        <div className="p-3 border-t border-white/10 bg-gray-950 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating || !cardImageUrl}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Original
            </button>
            
            <button
              onClick={handleShareOnSocials}
              disabled={isGenerating || !cardImageUrl}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>

          {/* Tip */}
          <p className="text-[11px] text-gray-500 text-center">
            Share directly to WhatsApp, Instagram, or any app!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
