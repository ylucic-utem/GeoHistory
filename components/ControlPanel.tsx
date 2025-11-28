import React from 'react';
import { Coordinates, DateSelection } from '../types';
import { Calendar, Clock, MapPin, Loader2, Image as ImageIcon, X, Map as MapIcon, Box } from 'lucide-react';

interface ControlPanelProps {
  selectedLocation: Coordinates | null;
  selectedDate: DateSelection;
  onDateChange: (date: DateSelection) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  viewMode: 'map' | 'mapbox';
  onViewModeChange: (mode: 'map' | 'mapbox') => void;
  isMobile: boolean;
  showConflicts: boolean;
  onToggleShowConflicts: () => void;
  showEvents: boolean;
  onToggleShowEvents: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedLocation,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  onGenerate,
  isGenerating,
  isOpen,
  onToggleOpen,
  viewMode,
  onViewModeChange,
  isMobile,
  showConflicts,
  onToggleShowConflicts,
  showEvents,
  onToggleShowEvents
}) => {

  const formatLat = (lat: number) => {
    return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  };

  const formatLng = (lng: number) => {
    return `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  };

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div 
      className={`
        /* Base styles */
        bg-black/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl z-40 transition-all duration-300 ease-in-out
        
        /* Mobile: Bottom Sheet */
        fixed bottom-0 left-0 right-0 
        rounded-t-2xl 
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}

        /* Tablet & Desktop: Floating Card */
        md:bottom-6 md:left-6 md:right-auto md:top-auto
        md:w-96 md:rounded-2xl
        ${isOpen 
          ? 'md:translate-y-0 md:opacity-100 md:pointer-events-auto' 
          : 'md:translate-y-4 md:opacity-0 md:pointer-events-none'
        }
      `}
    >
      {/* Scrollable Content Container */}
      <div className="flex flex-col h-full max-h-[85vh] md:max-h-[calc(100vh-8rem)]">
        
        {/* Header / Close Button */}
        <div className="flex items-center justify-between p-4 pb-2 md:p-6 md:pb-4 border-b border-white/5 md:border-none">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Time Travel Controls
          </h2>
          <button
            onClick={onToggleOpen}
            className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close controls"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 md:p-6 pt-2 overflow-y-auto custom-scrollbar">
          
          {/* View Mode Selector - Only show on desktop */}
          {!isMobile && (
          <div className="mb-4">
             <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">View Mode</label>
             <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex">
                <button
                  onClick={() => onViewModeChange('map')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    viewMode === 'map' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MapIcon className="w-4 h-4" /> Map
                </button>
                <button
                  onClick={() => onViewModeChange('mapbox')}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    viewMode === 'mapbox' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Box className="w-4 h-4" /> Globe
                </button>
             </div>
          </div>
          )}

          {/* Events Toggle */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Events</label>
            <div className="space-y-3">
              {/* Conflicts Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={onToggleShowConflicts}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                    showConflicts ? 'bg-red-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showConflicts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-white">
                  {showConflicts ? 'Hide Conflicts' : 'Show Conflicts'}
                </span>
              </div>
              {/* Events Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={onToggleShowEvents}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                    showEvents ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showEvents ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-white">
                  {showEvents ? 'Hide Events' : 'Show Events'}
                </span>
              </div>
            </div>
          </div>

          {/* Location Display */}
          <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10 flex items-center space-x-3">
            <MapPin className={`w-5 h-5 ${selectedLocation ? 'text-green-400' : 'text-gray-500'}`} />
            <div className="flex-1">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Coordinates</div>
              {selectedLocation ? (
                <div className="text-sm font-mono text-white">
                  {formatLat(selectedLocation.lat)}, {formatLng(selectedLocation.lng)}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No location selected</div>
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Calendar className="w-3 h-3" /> Date
            </label>

            <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
              <div className="flex gap-2">
                <select 
                  id="month-select"
                  value={selectedDate.month} 
                  onChange={(e) => onDateChange({...selectedDate, month: parseInt(e.target.value)})}
                  className="bg-black/50 border border-white/20 rounded px-2 py-1.5 text-base md:text-sm flex-1 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select 
                  id="day-select"
                  value={selectedDate.day}
                  onChange={(e) => onDateChange({...selectedDate, day: parseInt(e.target.value)})}
                  className="bg-black/50 border border-white/20 rounded px-2 py-1.5 text-base md:text-sm w-20 md:w-16 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 items-center">
                <input 
                  id="year-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={selectedDate.year}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    onDateChange({ ...selectedDate, year: parseInt(value) || 0 });
                  }}
                  placeholder="Year"
                  className="bg-black/50 border border-white/20 rounded px-2 py-1.5 text-base md:text-sm flex-1 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <select 
                  id="era-select"
                  value={selectedDate.era}
                  onChange={(e) => onDateChange({...selectedDate, era: e.target.value as 'CE' | 'BCE'})}
                  className="bg-black/50 border border-white/20 rounded px-2 py-1.5 text-base md:text-sm w-20 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="CE">CE</option>
                  <option value="BCE">BCE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label htmlFor="time-input" className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3" /> Local Time
            </label>
            <input
              id="time-input"
              type="time"
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 text-base md:text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={!selectedLocation || isGenerating}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 font-semibold transition-all duration-200 ${
              !selectedLocation || isGenerating
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Traveling...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                <span>Visualize Moment</span>
              </>
            )}
          </button>

          {/* Helper Text */}
          <p className="mt-4 text-xs text-gray-500 text-center px-4">
            Select a location on the map, choose a date, and visualize history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;