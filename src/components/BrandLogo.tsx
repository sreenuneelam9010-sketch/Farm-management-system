import React from 'react';

export type LogoVariant = 
  | 'main'
  | 'horizontal'
  | 'vertical'
  | 'circular'
  | 'icon'
  | 'favicon'
  | 'app-icon';

export type LogoBgMode = 
  | 'transparent' 
  | 'dark' 
  | 'light' 
  | 'gold-foil' 
  | 'monochrome';

interface BrandLogoProps {
  variant?: LogoVariant;
  bgMode?: LogoBgMode;
  className?: string;
  showTagline?: boolean;
  size?: number | string;
  onClick?: () => void;
  id?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  bgMode = 'transparent',
  className = '',
  showTagline = true,
  size,
  onClick,
  id = 'brand-logo'
}) => {
  // Color palette constants
  const colors = {
    goldDark: '#9A7B3E',
    gold: '#C5A059',
    goldLight: '#E6D3A7',
    goldGleam: '#F7E7C4',
    greenDark: '#04140E',
    greenDeep: '#062C1E',
    greenPasture: '#10563B',
    greenLeaf: '#16A34A',
    brownEarth: '#2D1A10',
    creamWhite: '#F2F2ED',
    pureWhite: '#FFFFFF',
  };

  // Resolve foreground colors based on bgMode
  const isDark = bgMode === 'dark' || bgMode === 'transparent';
  const isGoldFoil = bgMode === 'gold-foil';
  const isMonochrome = bgMode === 'monochrome';

  const primaryText = isGoldFoil ? colors.goldGleam : (isDark ? colors.pureWhite : colors.greenDark);
  const secondaryText = isGoldFoil ? colors.goldLight : colors.gold;
  const accentGold = colors.gold;
  const leafColor = isMonochrome ? (isDark ? colors.pureWhite : colors.greenDark) : colors.greenLeaf;
  const pastureColor = isMonochrome ? (isDark ? colors.gold : colors.greenDark) : colors.greenPasture;

  // Render SVG Emblem Vector Graphic (Realistic Farm & Livestock)
  const renderEmblem = (emblemSize = 100) => {
    return (
      <svg
        width={emblemSize}
        height={emblemSize}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Metallic Gold Gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7E7C4" />
            <stop offset="25%" stopColor="#E6D3A7" />
            <stop offset="55%" stopColor="#C5A059" />
            <stop offset="85%" stopColor="#9A7B3E" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>

          {/* Deep Forest Green Gradient */}
          <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0E4832" />
            <stop offset="50%" stopColor="#0B3C29" />
            <stop offset="100%" stopColor="#04140E" />
          </linearGradient>

          {/* Sunrise Sky Glow Gradient */}
          <radialGradient id="sunGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFF2D1" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#F7E7C4" stopOpacity="0.7" />
            <stop offset="65%" stopColor="#C5A059" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#062C1E" stopOpacity="0" />
          </radialGradient>

          {/* Leaf Green Gradient */}
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          {/* Earth Brown Gradient */}
          <linearGradient id="earthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A2E1B" />
            <stop offset="100%" stopColor="#2D1A10" />
          </linearGradient>

          {/* Gold Glow Filter */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C5A059" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Main Arch Shield Frame */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100 L 180 148 C 180 168 145 186 100 186 C 55 186 20 168 20 148 Z"
          fill="url(#forestGrad)"
          stroke="url(#goldGrad)"
          strokeWidth="3.5"
          filter="url(#goldGlow)"
        />

        {/* Inner Dotted Decorative Bezel */}
        <path
          d="M 26 100 A 74 74 0 0 1 174 100 L 174 145 C 174 162 142 179 100 179 C 58 179 26 162 26 145 Z"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.75"
        />

        {/* 2. Sunrise Disk & Radiant Rays */}
        <circle cx="100" cy="72" r="38" fill="url(#sunGlow)" />
        <circle cx="100" cy="72" r="16" fill="url(#goldGrad)" />
        
        {/* Sun Rays */}
        <g stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
          <line x1="100" y1="46" x2="100" y2="36" />
          <line x1="118" y1="51" x2="125" y2="43" />
          <line x1="128" y1="65" x2="138" y2="60" />
          <line x1="72" y1="65" x2="62" y2="60" />
          <line x1="82" y1="51" x2="75" y2="43" />
          <line x1="130" y1="80" x2="140" y2="82" />
          <line x1="70" y1="80" x2="60" y2="82" />
        </g>

        {/* 3. Realistic Natural Trees Silhouette on Horizon */}
        <g fill="#083824" opacity="0.9">
          {/* Left Tree */}
          <path d="M 32 108 C 30 100 35 92 42 90 C 45 84 53 84 57 88 C 62 86 68 90 68 96 C 72 100 70 106 65 108 Z" />
          <rect x="47" y="105" width="3" height="10" fill="#2D1A10" />

          {/* Right Tree */}
          <path d="M 132 108 C 130 102 134 96 140 94 C 144 88 152 88 156 92 C 160 90 166 94 166 100 C 170 104 168 108 162 108 Z" />
          <rect x="148" y="105" width="3" height="10" fill="#2D1A10" />
        </g>

        {/* 4. Layered Rolling Green Pastures */}
        {/* Back Hill */}
        <path
          d="M 26 118 Q 65 100 100 110 Q 140 120 174 110 L 174 145 C 174 162 142 179 100 179 C 58 179 26 162 26 145 Z"
          fill="#0C5236"
        />
        {/* Front Hill */}
        <path
          d="M 26 128 Q 60 116 100 124 Q 145 132 174 122 L 174 145 C 174 162 142 179 100 179 C 58 179 26 162 26 145 Z"
          fill="#062C1E"
        />

        {/* Farm Wooden Fence Lines */}
        <g stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.5">
          <line x1="38" y1="122" x2="38" y2="134" />
          <line x1="52" y1="120" x2="52" y2="132" />
          <line x1="66" y1="118" x2="66" y2="130" />
          <line x1="134" y1="118" x2="134" y2="130" />
          <line x1="148" y1="120" x2="148" y2="132" />
          <line x1="162" y1="122" x2="162" y2="134" />
          <line x1="34" y1="124" x2="70" y2="120" />
          <line x1="34" y1="129" x2="70" y2="125" />
          <line x1="130" y1="120" x2="166" y2="124" />
          <line x1="130" y1="125" x2="166" y2="129" />
        </g>

        {/* 5. REALISTIC LOCAL SHEEP SILHOUETTE (Left - Standing Grazing) */}
        <g transform="translate(36, 80) scale(0.95)">
          {/* Anatomical Body & Wool Silhouette */}
          <path
            d="M 12 36 C 8 32 6 26 10 20 C 14 14 22 12 28 14 C 34 10 44 11 50 16 C 56 14 62 18 64 24 C 67 29 65 36 60 40 C 56 43 50 44 44 43 C 38 45 30 44 24 43 C 18 44 13 41 12 36 Z"
            fill="url(#goldGrad)"
          />
          {/* Subtle Natural Wool Texturing Shading */}
          <path
            d="M 22 22 C 26 20 30 23 28 27 M 36 18 C 40 16 44 19 42 23 M 32 30 C 36 28 40 31 38 35 M 48 24 C 52 22 56 25 54 29 M 18 28 C 22 26 26 29 24 33"
            stroke="#2D1A10"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
          />
          {/* Head & Muzzle (Indian Jodipi / Palla head profile) */}
          <path
            d="M 58 24 C 62 21 68 22 71 27 C 73 31 69 35 63 34 Z"
            fill="#2D1A10"
          />
          {/* Curled Horn / Ear Contour */}
          <path
            d="M 59 23 C 57 17 62 15 66 18 C 68 20 65 22 62 21"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Eye */}
          <circle cx="65" cy="26" r="1" fill="#FFF2D1" />
          {/* Legs with Hooves */}
          <rect x="20" y="42" width="3.5" height="13" rx="1.5" fill="#2D1A10" />
          <rect x="28" y="42" width="3.5" height="13" rx="1.5" fill="#2D1A10" />
          <rect x="42" y="42" width="3.5" height="13" rx="1.5" fill="#2D1A10" />
          <rect x="50" y="42" width="3.5" height="13" rx="1.5" fill="#2D1A10" />
        </g>

        {/* 6. REALISTIC NATIVE CHICKEN (NATU KOLLA) SILHOUETTE (Right - Proud Stance) */}
        <g transform="translate(108, 76) scale(0.95)">
          {/* Arched Sickle Tail Feathers */}
          <path
            d="M 42 28 C 52 18 56 6 48 -2 C 43 8 38 18 32 22 M 45 30 C 54 22 58 12 52 4 C 47 12 41 20 36 24 M 40 34 C 48 28 52 20 48 14"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Plump Native Body */}
          <path
            d="M 18 28 C 12 26 8 30 12 37 C 16 43 28 45 36 41 C 42 37 42 30 36 28 Z"
            fill="url(#goldGrad)"
          />
          {/* Slender Graceful Neck & Head */}
          <path
            d="M 18 28 C 15 21 17 12 22 7 C 24 5 27 7 25 11 C 23 16 23 23 25 28 Z"
            fill="url(#goldGrad)"
          />
          {/* Detailed Rooster Comb (Crown) */}
          <path
            d="M 22 5 C 20 1 22 -2 24 0 C 26 -2 28 -1 28 2 C 29 0 31 1 30 4 Z"
            fill="#DC2626"
          />
          {/* Sharp Beak & Red Wattle */}
          <path d="M 20 9 L 14 11 L 20 13 Z" fill="url(#goldGrad)" />
          <path d="M 20 13 C 18 18 20 20 21 18 Z" fill="#DC2626" />
          {/* Eye */}
          <circle cx="22" cy="9" r="1.2" fill="#04140E" />
          {/* Legs & Claws standing on grass */}
          <path d="M 24 41 L 22 52 M 22 52 L 17 54 M 22 52 L 22 55 M 22 52 L 26 54" stroke="#2D1A10" strokeWidth="2" strokeLinecap="round" />
          <path d="M 31 40 L 31 52 M 31 52 L 27 54 M 31 52 L 31 55 M 31 52 L 35 54" stroke="#2D1A10" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 7. Foreground Grass Tufts & Fodder Leaf Sprig */}
        <g stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" filter="url(#goldGlow)">
          {/* Left Grass Blades */}
          <path d="M 32 160 Q 28 148 22 142 M 32 160 Q 32 146 36 140 M 32 160 Q 36 148 42 144" />
          {/* Center Organic Leaf Sprig */}
          <path d="M 100 174 C 95 166 88 160 80 156 C 88 152 98 156 100 174 Z" fill="url(#leafGrad)" stroke="none" />
          <path d="M 100 174 C 105 166 112 160 120 156 C 112 152 102 156 100 174 Z" fill="url(#leafGrad)" stroke="none" />
          {/* Right Grass Blades */}
          <path d="M 168 160 Q 164 148 158 144 M 168 160 Q 172 146 168 140 M 168 160 Q 176 148 180 142" />
        </g>

        {/* 8. Bottom Golden Quality Star Seal */}
        <path
          d="M 100 168 L 102 172 L 107 172 L 103 175 L 105 179 L 100 177 L 95 179 L 97 175 L 93 172 L 98 172 Z"
          fill="url(#goldGrad)"
        />
      </svg>
    );
  };

  // Deliverables Variations:

  // 1. CIRCULAR LOGO VARIANT (Seal / Stamp Style with curved text around border)
  if (variant === 'circular') {
    const sizePx = size || 240;
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`inline-flex flex-col items-center justify-center relative cursor-pointer select-none ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        <svg
          width={sizePx}
          height={sizePx}
          viewBox="0 0 300 300"
          className="w-full h-full drop-shadow-2xl"
        >
          <defs>
            <linearGradient id="circGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F7E7C4" />
              <stop offset="40%" stopColor="#C5A059" />
              <stop offset="80%" stopColor="#9A7B3E" />
            </linearGradient>

            {/* Circular Text Path */}
            <path
              id="textCirclePath"
              d="M 150, 150 m -115, 0 a 115,115 0 1,1 230,0 a 115,115 0 1,1 -230,0"
            />
            <path
              id="textCircleBottomPath"
              d="M 150, 150 m 115, 0 a 115,115 0 1,1 -230,0 a 115,115 0 1,1 230,0"
            />
          </defs>

          {/* Background Disk if not transparent */}
          {bgMode !== 'transparent' && (
            <circle
              cx="150"
              cy="150"
              r="145"
              fill={bgMode === 'dark' ? '#04140E' : bgMode === 'light' ? '#FFFFFF' : '#062C1E'}
              stroke="url(#circGold)"
              strokeWidth="4"
            />
          )}

          {/* Outer Ornamental Bezel */}
          <circle cx="150" cy="150" r="142" fill="none" stroke="url(#circGold)" strokeWidth="3" />
          <circle cx="150" cy="150" r="136" fill="none" stroke="url(#circGold)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="150" cy="150" r="94" fill="none" stroke="url(#circGold)" strokeWidth="2" />

          {/* Curved Outer Text */}
          <text fill="url(#circGold)" fontSize="11 font-black" letterSpacing="3.5" className="font-serif-brand">
            <textPath href="#textCirclePath" startOffset="0%">
              LAKSHMI VENKATESHWARA • SHEEP & NATU KOLLA FARM •
            </textPath>
          </text>

          {/* Center Emblem Graphic */}
          <g transform="translate(65, 65)">
            {renderEmblem(170)}
          </g>

          {/* Tagline Ribbon Banner on Bottom */}
          <g transform="translate(150, 262)">
            <rect x="-105" y="-12" width="210" height="22" rx="11" fill="#062C1E" stroke="url(#circGold)" strokeWidth="1.5" />
            <text fill="#F7E7C4" fontSize="8.5" fontWeight="900" textAnchor="middle" y="3" letterSpacing="1">
              AUTHENTIC LOCAL BREED & FREE RANGE
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // 2. ICON-ONLY VARIANT (Clean standalone mark)
  if (variant === 'icon') {
    const sizePx = size || 64;
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`inline-flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        {renderEmblem(typeof sizePx === 'number' ? sizePx : 64)}
      </div>
    );
  }

  // 3. FAVICON VARIANT (Micro 32x32 to 64x64 crisp view)
  if (variant === 'favicon') {
    const sizePx = size || 32;
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-lg bg-[#04140E] p-1 border border-[#C5A059] shadow-lg ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        {renderEmblem(typeof sizePx === 'number' ? sizePx - 8 : 24)}
      </div>
    );
  }

  // 4. MOBILE APP ICON VARIANT (iOS / Android Squircle format)
  if (variant === 'app-icon') {
    const sizePx = size || 120;
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`relative inline-flex items-center justify-center rounded-[28%] bg-gradient-to-br from-[#062C1E] via-[#04140E] to-[#020B07] border-2 border-[#C5A059] shadow-2xl p-3 cursor-pointer group hover:scale-105 transition-transform ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        <div className="absolute inset-1 rounded-[24%] border border-[#C5A059]/30 pointer-events-none"></div>
        {renderEmblem(typeof sizePx === 'number' ? sizePx * 0.75 : 90)}
      </div>
    );
  }

  // 5. VERTICAL LOGO VARIANT (Stacked for Banners, Packaging & Signboards)
  if (variant === 'vertical') {
    return (
      <div 
        id={id}
        onClick={onClick}
        className={`flex flex-col items-center text-center gap-3 cursor-pointer group ${className}`}
      >
        <div className="relative p-2 rounded-3xl bg-[#062C1E]/50 border border-[#C5A059]/30 shadow-2xl backdrop-blur-sm group-hover:border-[#C5A059] transition-all">
          {renderEmblem(130)}
        </div>

        <div className="space-y-1">
          <h2 className="font-serif-brand font-black text-2xl sm:text-3xl tracking-tight text-[#F2F2ED] group-hover:text-[#C5A059] transition-colors">
            Lakshmi Venkateshwara
          </h2>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#C5A059]">
            Sheep & Natu Kolla Farm
          </div>
          {showTagline && (
            <p className="text-[11px] font-semibold text-emerald-200/70 tracking-wider pt-1 border-t border-[#C5A059]/20">
              Authentic Local Sheep & Free Range Natu Kolla
            </p>
          )}
        </div>
      </div>
    );
  }

  // 6. MAIN & HORIZONTAL LOGO VARIANT (Default Inline format for Navbar & Headers)
  return (
    <div 
      id={id}
      onClick={onClick}
      className={`flex items-center gap-3.5 cursor-pointer text-left group select-none ${className}`}
    >
      {/* Emblem Mark */}
      <div className="relative flex-shrink-0 flex items-center justify-center p-1 rounded-2xl bg-[#062C1E] border-2 border-[#C5A059] shadow-xl group-hover:scale-105 group-hover:shadow-[#C5A059]/20 transition-all duration-300">
        {renderEmblem(typeof size === 'number' ? size : 48)}
      </div>

      {/* Typography Brand Name */}
      <div className="flex flex-col justify-center">
        <h1 className="font-serif-brand font-bold text-base sm:text-xl md:text-2xl leading-none tracking-tight text-[#F2F2ED] group-hover:text-[#C5A059] transition-colors">
          Lakshmi Venkateshwara
        </h1>
        <div className="text-[10px] sm:text-xs font-black text-[#C5A059] uppercase tracking-[0.18em] mt-1">
          Sheep & Natu Kolla Farm
        </div>
        {showTagline && variant === 'main' && (
          <div className="text-[10px] font-medium text-emerald-200/70 tracking-wider mt-0.5">
            Authentic Local Sheep & Free Range Natu Kolla
          </div>
        )}
      </div>
    </div>
  );
};
