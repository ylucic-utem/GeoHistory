import React from 'react';
import { GeneratedImageResult } from '../types';
import { X, Download } from 'lucide-react';

interface ImageResultProps {
  result: GeneratedImageResult | null;
  onClose: () => void;
}

const ImageResult: React.FC<ImageResultProps> = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-950">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Generated Visualization
          </h3>
          <div className="flex gap-2">
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
            <div className="relative group max-w-full">
              <img 
                src={result.imageUrl} 
                alt="Generated AI View" 
                className="max-h-[60vh] rounded-lg shadow-lg border border-white/5"
              />
              <a 
                href={result.imageUrl} 
                download="chronoglobe-capture.png"
                className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 backdrop-blur-md border border-white/10"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          ) : (
             <div className="text-red-400">Image generation failed.</div>
          )}
          
          <div className="mt-6 w-full max-w-3xl bg-white/5 border border-white/10 rounded-xl p-4">
             <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prompt Used</div>
             <p className="text-gray-300 font-mono text-sm leading-relaxed">
               {result.prompt}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageResult;