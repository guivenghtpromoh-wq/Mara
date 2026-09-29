import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionTo?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#E2E4DF] bg-white/50 my-6">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#F7F7F3] border border-[#E2E4DF] flex items-center justify-center text-[#6E746F] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#101312] mb-1.5">{title}</h3>
      <p className="text-sm text-[#6E746F] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
