import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-[#E2E4DF]/60 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};
