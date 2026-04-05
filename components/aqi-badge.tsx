// components/aqi-badge.tsx

import React from 'react';

const getAqiCategory = (aqi: number) => {
  if (aqi <= 50) return { name: 'Good', tint: 'from-emerald-400/35 to-emerald-600/20', ring: 'ring-emerald-300/40', text: 'text-emerald-100' };
  if (aqi <= 100) return { name: 'Moderate', tint: 'from-yellow-300/35 to-yellow-600/20', ring: 'ring-yellow-300/40', text: 'text-yellow-100' };
  if (aqi <= 150) return { name: 'Unhealthy for Sensitive Groups', tint: 'from-orange-300/35 to-orange-600/20', ring: 'ring-orange-300/40', text: 'text-orange-100' };
  if (aqi <= 200) return { name: 'Unhealthy', tint: 'from-red-300/35 to-red-700/20', ring: 'ring-red-300/40', text: 'text-red-100' };
  if (aqi <= 300) return { name: 'Very Unhealthy', tint: 'from-fuchsia-300/35 to-fuchsia-700/20', ring: 'ring-fuchsia-300/40', text: 'text-fuchsia-100' };
  return { name: 'Hazardous', tint: 'from-rose-300/35 to-rose-800/25', ring: 'ring-rose-300/40', text: 'text-rose-100' };
};

interface AQIBadgeProps {
  aqi: number | null;
  size?: 'small' | 'medium' | 'large';
}

const AQIBadge: React.FC<AQIBadgeProps> = ({ aqi, size = 'medium' }) => {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0 || aqi > 500) {
    return (
      <div className="rounded-xl bg-white/10 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/20">
        N/A
      </div>
    );
  }

  const category = getAqiCategory(aqi);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-6 py-2 text-2xl font-extrabold',
  };

  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br shadow-lg backdrop-blur transition-all duration-300
        ${category.tint} ${category.ring} ${category.text} ${sizeClasses[size]} ring-1
      `}
    >
        <span className="text-sm font-light uppercase opacity-80" style={{ fontSize: size === 'large' ? '0.8rem' : '0.6rem' }}>
            {category.name}
        </span>
        <span className="block" style={{ fontSize: size === 'large' ? '3rem' : '1.5rem' }}>
            {aqi}
        </span>
        <span className="text-[9px] uppercase tracking-wide opacity-80">US AQI</span>
    </div>
  );
};

export default AQIBadge;
