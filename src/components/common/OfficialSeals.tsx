import React, { useState, useEffect } from 'react';
import { landingCmsService } from '../../services/landingCmsService';

/**
 * Custom hook to retrieve active configured official logos and re-render
 * whenever Admin updates logos in Logo Configuration / Photo & Media Settings.
 */
export function useOfficialLogos() {
  const getLogoMap = () => {
    const config = landingCmsService.getDraftConfig();
    const map: Record<string, string> = {};
    if (config.systemLogoUrl && config.systemLogoUrl !== '/icon.svg') map['logo-system'] = config.systemLogoUrl;
    if (config.headerLogoUrl && config.headerLogoUrl !== '/icon.svg') map['logo-header'] = config.headerLogoUrl;
    if (config.footerLogoUrl && config.footerLogoUrl !== '/icon.svg') map['logo-footer'] = config.footerLogoUrl;
    if (config.websiteLogoUrl && config.websiteLogoUrl !== '/icon.svg') map['logo-website'] = config.websiteLogoUrl;
    (config.officialLogos || []).forEach(l => {
      if (l.url && l.url.trim()) {
        map[l.id] = l.url;
        if (l.category) map[`cat-${l.category}`] = l.url;
        if (l.placement) map[`placement-${l.placement}`] = l.url;
      }
    });
    return map;
  };

  const [logos, setLogos] = useState<Record<string, string>>(() => getLogoMap());

  useEffect(() => {
    const handleUpdate = (e?: Event) => {
      setTimeout(() => {
        const customEvt = e as CustomEvent;
        const config = customEvt?.detail || landingCmsService.getDraftConfig();
        const map: Record<string, string> = {};
        if (config.systemLogoUrl && config.systemLogoUrl !== '/icon.svg') map['logo-system'] = config.systemLogoUrl;
        if (config.headerLogoUrl && config.headerLogoUrl !== '/icon.svg') map['logo-header'] = config.headerLogoUrl;
        if (config.footerLogoUrl && config.footerLogoUrl !== '/icon.svg') map['logo-footer'] = config.footerLogoUrl;
        if (config.websiteLogoUrl && config.websiteLogoUrl !== '/icon.svg') map['logo-website'] = config.websiteLogoUrl;
        (config.officialLogos || []).forEach((l: any) => {
          if (l.url && l.url.trim()) {
            map[l.id] = l.url;
            if (l.category) map[`cat-${l.category}`] = l.url;
            if (l.placement) map[`placement-${l.placement}`] = l.url;
          }
        });
        setLogos(map);
      }, 0);
    };

    window.addEventListener('da_landing_cms_updated', handleUpdate);
    window.addEventListener('da_landing_draft_updated', handleUpdate);
    return () => {
      window.removeEventListener('da_landing_cms_updated', handleUpdate);
      window.removeEventListener('da_landing_draft_updated', handleUpdate);
    };
  }, []);

  return logos;
}

/**
 * High-fidelity vector seals matching the official Department of Agriculture,
 * Municipality of Hinunangan, and National / Task Force insignias
 * with automatic fallback to custom uploaded images if configured.
 */

export const SealDA: React.FC<{ className?: string; customUrl?: string }> = ({
  className = 'w-9 h-9',
  customUrl,
}) => {
  const logos = useOfficialLogos();
  const activeUrl = customUrl || logos['logo-da'] || logos['cat-da'];

  if (activeUrl && activeUrl.trim() !== '' && activeUrl !== '/icon.svg') {
    return (
      <img
        src={activeUrl}
        alt="Department of Agriculture Seal"
        className={`${className} shrink-0 select-none object-contain rounded-full`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0 select-none shadow-sm rounded-full`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Green Ring */}
      <circle cx="50" cy="50" r="48" fill="#065f46" stroke="#047857" strokeWidth="2" />
      {/* Golden Cog/Gear Border Ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeDasharray="4 2"
      />
      <circle cx="50" cy="50" r="40" fill="#047857" />
      <circle cx="50" cy="50" r="38" fill="#064e3b" />
      
      {/* Sun and Stalk Center */}
      <circle cx="50" cy="50" r="24" fill="#f59e0b" />
      <circle cx="50" cy="50" r="21" fill="#064e3b" />
      {/* Golden rays and Agriculture Sprout */}
      <path
        d="M50 32 L52 38 L58 36 L54 41 L59 44 L53 46 L55 52 L50 48 L45 52 L47 46 L41 44 L46 41 L42 36 L48 38 Z"
        fill="#fbbf24"
      />
      {/* Rice & Swine shield */}
      <path
        d="M44 52 C44 59 50 64 50 64 C50 64 56 59 56 52 L56 46 L44 46 Z"
        fill="#10b981"
        stroke="#fbbf24"
        strokeWidth="1.5"
      />
      <path d="M47 50 C49 53 50 56 50 56 C50 56 51 53 53 50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export const SealMunicipality: React.FC<{ className?: string; customUrl?: string }> = ({
  className = 'w-9 h-9',
  customUrl,
}) => {
  const logos = useOfficialLogos();
  const activeUrl = customUrl || logos['logo-mun'] || logos['cat-municipal'] || logos['logo-municipal'];

  if (activeUrl && activeUrl.trim() !== '' && activeUrl !== '/icon.svg') {
    return (
      <img
        src={activeUrl}
        alt="Municipality of Hinunangan Official Seal"
        className={`${className} shrink-0 select-none object-contain rounded-full`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0 select-none shadow-sm rounded-full`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Seal Blue Band */}
      <circle cx="50" cy="50" r="48" fill="#1e3a8a" stroke="#d97706" strokeWidth="2.5" />
      {/* Inner White Ring */}
      <circle cx="50" cy="50" r="41" fill="#ffffff" />
      {/* Inner Field Sky */}
      <circle cx="50" cy="50" r="37" fill="#38bdf8" />
      
      {/* Mountain & Green Landscape (Mt. Nacolod / Hinunangan hills) */}
      <path d="M22 62 L40 40 L55 55 L78 65 L22 65 Z" fill="#15803d" />
      <path d="M38 60 L54 44 L70 58 L54 64 Z" fill="#166534" />
      
      {/* Radiant Sun in Sky */}
      <circle cx="50" cy="35" r="7" fill="#fbbf24" />
      <path d="M50 24 L50 26 M50 44 L50 46 M39 35 L41 35 M59 35 L61 35" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      
      {/* Sea waves at base */}
      <path
        d="M20 62 Q35 58 50 62 T80 62 L80 75 Q50 78 20 75 Z"
        fill="#0284c7"
      />
      <path
        d="M23 66 Q35 63 50 66 T77 66"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Lower Banner Ribbon */}
      <path d="M26 73 L50 70 L74 73 L68 81 L50 78 L32 81 Z" fill="#d97706" />
      <text
        x="50"
        y="76.5"
        fill="#ffffff"
        fontSize="5.5"
        fontWeight="900"
        textAnchor="middle"
        letterSpacing="0.5"
        fontFamily="sans-serif"
      >
        HINUNANGAN
      </text>
    </svg>
  );
};

export const SealTaskForce: React.FC<{ className?: string; customUrl?: string }> = ({
  className = 'w-9 h-9',
  customUrl,
}) => {
  const logos = useOfficialLogos();
  const activeUrl = customUrl || logos['logo-taskforce'] || logos['cat-taskforce'];

  if (activeUrl && activeUrl.trim() !== '' && activeUrl !== '/icon.svg') {
    return (
      <img
        src={activeUrl}
        alt="Bantay ASF Task Force Seal"
        className={`${className} shrink-0 select-none object-contain rounded-full`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0 select-none shadow-sm rounded-full`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Dark Navy Ring */}
      <circle cx="50" cy="50" r="48" fill="#0b132b" stroke="#dc2626" strokeWidth="2.5" />
      
      {/* Red Crescent Accent Curve */}
      <path
        d="M15 50 C15 30 30 15 50 15 C42 22 38 35 38 50 C38 65 42 78 50 85 C30 85 15 70 15 50 Z"
        fill="#dc2626"
      />
      
      {/* Inner Sunburst / Rays */}
      <circle cx="52" cy="50" r="28" fill="#0f172a" />
      <path
        d="M52 28 L54 36 L62 31 L57 39 L65 42 L57 45 L63 52 L55 52 L57 60 L51 55 L47 62 L47 54 L40 56 L44 49 L37 44 L45 42 L41 34 L48 37 Z"
        fill="#fbbf24"
      />
      
      {/* Inner Blue Shield Center */}
      <circle cx="52" cy="48" r="13" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1" />
      <path
        d="M48 46 L52 43 L56 46 L56 50 C56 53 52 56 52 56 C52 56 48 53 48 50 Z"
        fill="#ffffff"
      />
      
      {/* 3 Golden Stars */}
      <circle cx="49" cy="48" r="1" fill="#f59e0b" />
      <circle cx="55" cy="48" r="1" fill="#f59e0b" />
      <circle cx="52" cy="52" r="1" fill="#f59e0b" />
    </svg>
  );
};

export const SealSLSU: React.FC<{ className?: string; customUrl?: string }> = ({
  className = 'w-9 h-9',
  customUrl,
}) => {
  const logos = useOfficialLogos();
  const activeUrl = customUrl || logos['logo-slsu'] || logos['cat-slsu'];

  if (activeUrl && activeUrl.trim() !== '' && activeUrl !== '/icon.svg') {
    return (
      <img
        src={activeUrl}
        alt="Southern Leyte State University Seal"
        className={`${className} shrink-0 select-none object-contain rounded-full`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0 select-none shadow-sm rounded-full`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Gold Ring */}
      <circle cx="50" cy="50" r="48" fill="#1e3a8a" stroke="#f59e0b" strokeWidth="3" />
      {/* Middle Blue Band */}
      <circle cx="50" cy="50" r="42" fill="#1e40af" stroke="#ffffff" strokeWidth="1" />
      {/* Inner White Field */}
      <circle cx="50" cy="50" r="34" fill="#ffffff" />
      {/* Torch of Knowledge & Open Book */}
      <path d="M47 30 L53 30 L52 46 L48 46 Z" fill="#b45309" />
      {/* Flame */}
      <path d="M50 20 C54 24 55 28 50 31 C45 28 46 24 50 20 Z" fill="#ef4444" />
      <path d="M50 23 C52 25 52 27 50 29 C48 27 48 25 50 23 Z" fill="#f59e0b" />
      {/* Open Book */}
      <path d="M35 48 C42 46 48 48 50 51 C52 48 58 46 65 48 L65 58 C58 56 52 58 50 61 C48 58 42 56 35 58 Z" fill="#1e3a8a" />
      <path d="M36 49 C42 47 48 49 50 52 C52 49 58 47 64 49 L64 57 C58 55 52 57 50 60 C48 57 42 55 36 57 Z" fill="#f8fafc" />
      {/* Laurel / Grain wreath */}
      <path d="M30 40 C28 52 34 68 50 72 C66 68 72 52 70 40" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* University Letters */}
      <text x="50" y="78" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.5" fontFamily="sans-serif">
        SLSU • 2004
      </text>
    </svg>
  );
};

export const SealExtension: React.FC<{ className?: string; customUrl?: string }> = ({
  className = 'w-9 h-9',
  customUrl,
}) => {
  const logos = useOfficialLogos();
  const activeUrl = customUrl || logos['logo-extension'] || logos['cat-extension'];

  if (activeUrl && activeUrl.trim() !== '' && activeUrl !== '/icon.svg') {
    return (
      <img
        src={activeUrl}
        alt="SLSU Extension Center Seal"
        className={`${className} shrink-0 select-none object-contain rounded-full`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} shrink-0 select-none shadow-sm rounded-full`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Emerald & Gold Ring */}
      <circle cx="50" cy="50" r="48" fill="#047857" stroke="#fbbf24" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="42" fill="#065f46" />
      {/* Outreach Hands / Community Center */}
      <circle cx="50" cy="50" r="32" fill="#ecfdf5" />
      {/* Sprout & Tech Node */}
      <path d="M50 32 C46 38 43 45 43 54 C48 54 53 50 54 44 C54 38 52 34 50 32 Z" fill="#10b981" />
      <path d="M50 38 C54 41 57 46 57 52 C53 52 49 49 48 45" fill="#059669" />
      {/* Outreach handshake arc */}
      <path d="M35 58 C38 54 45 54 49 57 L51 57 C55 54 62 54 65 58" stroke="#047857" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Connecting dots */}
      <circle cx="34" cy="58" r="2.5" fill="#f59e0b" />
      <circle cx="66" cy="58" r="2.5" fill="#f59e0b" />
      <circle cx="50" cy="65" r="2" fill="#047857" />
      {/* Text */}
      <text x="50" y="80" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.4" fontFamily="sans-serif">
        EXTENSION & TRAINING
      </text>
    </svg>
  );
};

export const DynamicSeal: React.FC<{
  type: 'da' | 'municipality' | 'mun' | 'taskforce' | 'slsu' | 'extension' | 'system' | 'sidebar' | 'header' | 'footer' | 'login' | string;
  className?: string;
  size?: number;
}> = ({ type, className = 'w-9 h-9', size }) => {
  const logos = useOfficialLogos();
  const normalized = (type || 'da').toLowerCase().replace('logo-', '').replace('seal', '');
  const style = size ? { width: size, height: size } : undefined;

  if (normalized === 'da') {
    return <SealDA className={className} customUrl={logos['logo-da'] || logos['cat-da']} />;
  }
  if (normalized === 'mun' || normalized === 'municipality' || normalized === 'hinunangan') {
    return <SealMunicipality className={className} customUrl={logos['logo-mun'] || logos['cat-municipal']} />;
  }
  if (normalized === 'taskforce' || normalized === 'asf' || normalized === 'bai') {
    return <SealTaskForce className={className} customUrl={logos['logo-taskforce'] || logos['cat-taskforce']} />;
  }
  if (normalized === 'slsu') {
    return <SealSLSU className={className} customUrl={logos['logo-slsu'] || logos['cat-slsu']} />;
  }
  if (normalized === 'extension' || normalized === 'ext') {
    return <SealExtension className={className} customUrl={logos['logo-extension'] || logos['cat-extension']} />;
  }
  if (normalized === 'sidebar' || normalized === 'system' || normalized === 'header' || normalized === 'footer' || normalized === 'login') {
    const custom = logos[`logo-${normalized}`] || logos['logo-system'] || logos['logo-sidebar'] || logos['logo-header'];
    if (custom && custom.trim() !== '' && custom !== '/icon.svg') {
      return (
        <img
          src={custom}
          alt={`${type} Logo`}
          style={style}
          className={`${className} shrink-0 select-none object-contain rounded-full`}
          referrerPolicy="no-referrer"
        />
      );
    }
    return <SealMunicipality className={className} />;
  }

  // Fallback to custom direct logo ID check
  const fallbackUrl = logos[type] || logos[`logo-${type}`];
  if (fallbackUrl && fallbackUrl.trim() !== '' && fallbackUrl !== '/icon.svg') {
    return (
      <img
        src={fallbackUrl}
        alt={`${type} Logo`}
        style={style}
        className={`${className} shrink-0 select-none object-contain rounded-full`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <SealMunicipality className={className} />;
};

export const OfficialSealBadge: React.FC<{
  type: 'da' | 'municipality' | 'taskforce' | 'slsu' | 'extension' | string;
  size?: number;
  className?: string;
  showLabel?: boolean;
  customUrl?: string;
  label?: string;
}> = ({ type, size = 36, className = '', showLabel = true, customUrl, label: customLabel }) => {
  let Seal = SealDA;
  let defaultLabel = 'Department of Agriculture';
  const normalizedType = type ? type.toLowerCase().replace('seal', '') : 'da';

  if (normalizedType === 'municipality' || normalizedType === 'mun' || normalizedType === 'hinunangan') {
    Seal = SealMunicipality;
    defaultLabel = 'Mun. of Hinunangan';
  } else if (normalizedType === 'taskforce' || normalizedType === 'asf' || normalizedType === 'bai') {
    Seal = SealTaskForce;
    defaultLabel = 'Bantay ASF Task Force';
  } else if (normalizedType === 'slsu') {
    Seal = SealSLSU;
    defaultLabel = 'Southern Leyte State U';
  } else if (normalizedType === 'extension' || normalizedType === 'ext') {
    Seal = SealExtension;
    defaultLabel = 'Extension Center';
  }

  const finalLabel = customLabel || defaultLabel;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div style={{ width: size, height: size }} className="shrink-0 flex items-center justify-center">
        <Seal className="w-full h-full" customUrl={customUrl} />
      </div>
      {showLabel && <span className="font-bold text-xs">{finalLabel}</span>}
    </div>
  );
};



