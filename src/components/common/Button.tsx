import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#F4C430] hover:bg-[#e2b528] active:bg-[#d4a822] text-[#101312] font-semibold shadow-xs focus:ring-[#F4C430]',
    secondary:
      'bg-[#123C2F] hover:bg-[#0e2f25] active:bg-[#0a231b] text-white shadow-xs focus:ring-[#123C2F]',
    dark:
      'bg-[#101312] hover:bg-[#181B19] active:bg-black text-white shadow-xs focus:ring-[#101312]',
    outline:
      'border border-[#E2E4DF] hover:border-[#101312] hover:bg-white text-[#101312] bg-white/70 focus:ring-[#101312]',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500',
    ghost:
      'text-[#101312] hover:bg-[#E2E4DF]/50 active:bg-[#E2E4DF] focus:ring-[#101312]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
