import React from 'react';

export type ConflictInfo = {
  name?: string;
  place?: string;
  year?: number | string;
  context?: string;
};

type Props = {
  visible: boolean;
  x: number;
  y: number;
  data?: ConflictInfo;
};

const ConflictTooltip: React.FC<Props> = ({ visible, x, y, data }) => {
  if (!visible || !data) return null;

  const title = data.place ?? data.name ?? 'Unknown';
  const year = data.year ?? '';
  const context = data.context ?? '';

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
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: 12,
        lineHeight: 1.35,
      }}
      aria-live="polite"
      role="tooltip"
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {title}
        {year ? ` — ${year}` : ''}
      </div>
      {context ? <div style={{ opacity: 0.9 }}>{context}</div> : null}
    </div>
  );
};

export default ConflictTooltip;
