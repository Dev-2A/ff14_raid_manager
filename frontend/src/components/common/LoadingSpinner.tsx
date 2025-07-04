import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="h-full w-full rounded-full border-4 border-ff14-blue-500/30"></div>
          <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-ff14-blue-500 border-t-transparent animate-pulse"></div>
        </div>
      </div>
      {message && (
        <p className="mt-4 text-ff14-blue-400 font-game animate-pulse">{message}</p>
      )}
    </div>
  );
};