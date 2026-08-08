import React from 'react';

interface HospitalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const HospitalLogoIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = "w-10 h-10",
  size
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-lg shadow-emerald-700/20 p-2 flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="skCrossTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="skCrossCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <filter id="skGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer White Glow Ring */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="18"
          stroke="white"
          strokeWidth="3"
          strokeOpacity="0.2"
        />

        {/* Modern Interlocking SK Medical Cross Emblem */}
        <g filter="url(#skGlow)">
          {/* Vertical Cross Pillar */}
          <rect x="38" y="16" width="24" height="68" rx="8" fill="white" />
          {/* Horizontal Cross Pillar */}
          <rect x="16" y="38" width="68" height="24" rx="8" fill="white" />

          {/* Inner Interlocking S-K Ribbon Curve (Teal) */}
          <path
            d="M 44,22 C 34,22 30,28 30,34 C 30,42 42,42 42,48 C 42,54 36,58 26,58 M 58,42 L 72,28 M 58,42 L 74,60"
            stroke="url(#skCrossTeal)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Heartbeat / Pulse Accent */}
          <path
            d="M 22,50 H 36 L 42,34 L 50,66 L 58,44 L 64,50 H 78"
            stroke="#10B981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
};

export const HospitalLogo: React.FC<HospitalLogoProps> = ({
  className = "",
  size = "md",
  variant = "full",
  theme = "light",
  showSubtitle = true
}) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-16 h-16"
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl"
  };

  const subSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
    xl: "text-sm"
  };

  const iconClass = typeof size === 'string' && size in iconSizes 
    ? iconSizes[size as keyof typeof iconSizes] 
    : "w-11 h-11";

  const titleClass = typeof size === 'string' && size in titleSizes 
    ? titleSizes[size as keyof typeof titleSizes] 
    : "text-xl";

  const subClass = typeof size === 'string' && size in subSizes 
    ? subSizes[size as keyof typeof subSizes] 
    : "text-[11px]";

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {/* Icon Emblem */}
      <HospitalLogoIcon 
        className={iconClass} 
        size={typeof size === 'number' ? size : undefined} 
      />

      {/* Brand Typography */}
      {variant === 'full' && (
        <div className="text-left">
          <div className={`font-black tracking-tight leading-none ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          } ${titleClass}`}>
            SHREE KRISHNA
          </div>
          {showSubtitle && (
            <div className={`font-extrabold tracking-wider uppercase leading-snug mt-1 ${
              theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
            } ${subClass}`}>
              MULTISPECIALTY HOSPITAL
            </div>
          )}
        </div>
      )}
    </div>
  );
};
