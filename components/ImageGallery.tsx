import React, { useState } from 'react';
import { GeneratedImageResult } from '../types';
import { GalleryHorizontal, X, Grid2X2 } from 'lucide-react';

interface ImageGalleryProps {
  images: GeneratedImageResult[];
  onImageSelect: (image: GeneratedImageResult) => void;
  onClearGallery: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onImageSelect, onClearGallery }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-6 right-6 z-20">
      <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-2xl transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-80 h-96 p-4' : 'w-16 h-16 p-0 flex items-center justify-center'
      }`}>
        {isExpanded ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                <GalleryHorizontal className="inline-block mr-2 w-5 h-5" />
                Gallery ({images.length})
              </h3>
              <div className="flex items-center gap-2">
                {images.length > 0 && (
                  <button
                    onClick={onClearGallery}
                    className="p-1 text-xs text-red-400 hover:text-red-300 hover:bg-white/10 rounded transition-colors"
                    title="Clear All Images"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  title="Collapse Gallery"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image List */}
            {images.length === 0 ? (
              <p className="text-gray-500 text-center text-sm italic py-8">
                No images generated yet.
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div 
                      key={index} 
                      className="relative group w-full aspect-square rounded-md overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500 transition-all duration-200"
                      onClick={() => onImageSelect(image)}
                    >
                      {image.imageUrl ? (
                        <img 
                          src={image.imageUrl} 
                          alt={`Generated Image ${index + 1}`} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-red-400 text-xs text-center p-2">
                          Failed to load
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-xs text-white text-center">
                        <span className="line-clamp-3">{image.prompt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Open Image Gallery"
          >
            <Grid2X2 className="w-6 h-6" />
            {images.length > 0 && (
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {images.length}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;