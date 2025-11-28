import React from 'react';
import { Eye } from 'lucide-react';

export type ConflictInfo = {
  name?: string;
  place?: string;
  country?: string;
  year?: number | string;
  context?: string;
  lat?: number;
  lng?: number;
};

type Props = {
  visible: boolean;
  x: number;
  y: number;
  data?: ConflictInfo;
  onVisualize?: (data: ConflictInfo) => void;
};

const ConflictTooltip: React.FC<Props> = ({ visible, x, y, data, onVisualize }) => {
  if (!visible || !data) return null;

  const title = data.place ?? data.name ?? 'Unknown';
  const subtitle = data.country ? `${data.country}` : '';
  const year = data.year ?? '';
  const context = data.context ?? '';

  const handleVisualize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVisualize && data) {
      onVisualize(data);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: y + 12,
        left: x + 12,
        maxWidth: 280,
        zIndex: 10000,
        background: 'rgba(20,20,24,0.95)',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: 6,
        boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: 12,
        lineHeight: 1.35,
      }}
      aria-live="polite"
      role="tooltip"
    >
      {data.name && <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.name}</div>}
      {data.place && <div style={{ marginBottom: 2 }}>{data.place}</div>}
      {data.country && <div style={{ marginBottom: 2 }}>{data.country}</div>}
      {data.year && <div style={{ marginBottom: 2 }}>{data.year}</div>}
      {data.context && <div style={{ opacity: 0.9, marginBottom: 8 }}>{data.context}</div>}
      
      {onVisualize && (
        <button
          onClick={handleVisualize}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            padding: '6px 10px',
            background: 'rgba(59, 130, 246, 0.9)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
          }}
        >
          <Eye size={14} />
          Visualize Moment
        </button>
      )}
    </div>
  );
};

export default ConflictTooltip;
