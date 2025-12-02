/**
 * Custom hook for managing tooltip state in map visualizations
 */

import React, { useState, useRef, useCallback } from 'react';
import { TooltipState, Coordinates } from '../types';
import { TooltipData } from '../utils/geojson';

export interface UseTooltipOptions {
  onLocationSelect: (coords: Coordinates) => void;
  onConflictVisualize?: (conflictData: any) => void;
}

export interface UseTooltipReturn {
  tooltip: TooltipState;
  pinnedRef: React.MutableRefObject<boolean>;
  showTooltip: (x: number, y: number, data: TooltipData) => void;
  hideTooltip: () => void;
  pinTooltip: (x: number, y: number, data: TooltipData, anchorLat: number, anchorLng: number) => void;
  unpinTooltip: () => void;
  updateTooltipPosition: (x: number, y: number) => void;
  handleVisualize: (data: TooltipData) => void;
}

const initialTooltipState: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  pinned: false,
};

export function useTooltip({ onLocationSelect, onConflictVisualize }: UseTooltipOptions): UseTooltipReturn {
  const [tooltip, setTooltip] = useState<TooltipState>(initialTooltipState);
  const pinnedRef = useRef<boolean>(false);

  const showTooltip = useCallback((x: number, y: number, data: TooltipData) => {
    if (pinnedRef.current) return;
    setTooltip({
      visible: true,
      x,
      y,
      data,
      pinned: false,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    if (pinnedRef.current) return;
    setTooltip(t => ({ ...t, visible: false }));
  }, []);

  const pinTooltip = useCallback((x: number, y: number, data: TooltipData, anchorLat: number, anchorLng: number) => {
    pinnedRef.current = true;
    setTooltip({
      visible: true,
      x,
      y,
      data,
      pinned: true,
      anchorLat,
      anchorLng,
    });
  }, []);

  const unpinTooltip = useCallback(() => {
    pinnedRef.current = false;
    setTooltip({ visible: false, x: 0, y: 0, pinned: false });
  }, []);

  const updateTooltipPosition = useCallback((x: number, y: number) => {
    if (!pinnedRef.current) {
      setTooltip(t => ({ ...t, x, y }));
    }
  }, []);

  const handleVisualize = useCallback((data: TooltipData) => {
    if (onConflictVisualize && data.lat != null && data.lng != null) {
      // Set the location to the conflict coordinates
      onLocationSelect({ lat: data.lat, lng: data.lng });
      // Trigger conflict visualization
      onConflictVisualize(data);
      // Hide tooltip
      pinnedRef.current = false;
      setTooltip({ visible: false, x: 0, y: 0, pinned: false });
    }
  }, [onLocationSelect, onConflictVisualize]);

  return {
    tooltip,
    pinnedRef,
    showTooltip,
    hideTooltip,
    pinTooltip,
    unpinTooltip,
    updateTooltipPosition,
    handleVisualize,
  };
}

/**
 * Utility to update tooltip position when map moves (for anchored tooltips)
 */
export function createMapMoveHandler(
  setTooltip: React.Dispatch<React.SetStateAction<TooltipState>>,
  projectFn: (lng: number, lat: number) => { x: number; y: number }
) {
  return () => {
    setTooltip(t => {
      if (t.pinned && t.anchorLat != null && t.anchorLng != null) {
        const point = projectFn(t.anchorLng, t.anchorLat);
        return { ...t, x: point.x, y: point.y };
      }
      return t;
    });
  };
}
