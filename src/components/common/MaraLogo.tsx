import React from 'react';
import { Link } from 'react-router-dom';

interface MaraLogoProps {
  variant?: 'combined' | 'symbol' | 'wordmark';
  color?: 'default' | 'white' | 'yellow' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  to?: string;
}

export const MaraLogo: React.FC<MaraLogoProps> = ({
  variant = 'combined',
  color = 'default',
  size = 'md',
  className = '',
  to = '/'
}) => {
  // Size metrics
  const symbolSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-lg tracking-wider',
    md: 'text-xl tracking-wider',
    lg: 'text-2xl tracking-widest',
    xl: 'text-4xl tracking-widest'
  };

  // Color mappings
  const markFill =
    color === 'yellow'
      ? '#F4C430'
      : color === 'white'
      ? '#FFFFFF'
      : color === 'monochrome'
      ? '#101312'
      : '#101312'; // Default black mark

  const markAccent =
    color === 'yellow'
      ? '#101312'
      : color === 'white'
      ? '#F4C430'
      : color === 'monochrome'
      ? '#6E746F'
      : '#F4C430'; // Default MARA yellow accent

  const textColor =
    color === 'yellow'
      ? 'text-[#F4C430]'
      : color === 'white'
      ? 'text-white'
      : color === 'monochrome'
      ? 'text-[#101312]'
      : 'text-[#101312]';

  // Geometric Monogram Logomark: Two solid architectural arches converging to form an iconic "M"
  const Logomark = (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${symbolSizes[size]} transition-transform duration-200 shrink-0`}
      aria-label="MARA Emblem"
    >
      {/* Outer base container */}
      <rect width="40" height="40" rx="8" fill={color === 'yellow' ? '#101312' : '#F7F7F3'} />
      {/* Left pillar & arch */}
      <path
        d="M8 32V16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16V32H18V16C18 14.8954 17.1046 14 16 14C14.8954 14 14 14.8954 14 16V32H8Z"
        fill={markFill}
      />
      {/* Right converging arch */}
      <path
        d="M24 16C24 11.5817 27.5817 8 32 8V14C30.8954 14 30 14.8954 30 16V32H24V16Z"
        fill={markAccent}
      />
      {/* Precision junction dot */}
      <circle cx="20" cy="24" r="2.5" fill={markAccent} />
    </svg>
  );

  const Wordmark = (
    <span className={`font-bold font-['Inter',sans-serif] ${textSizes[size]} ${textColor} leading-none`}>
      MARA
    </span>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant !== 'wordmark' && Logomark}
      {variant !== 'symbol' && Wordmark}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-[#F4C430] rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};
