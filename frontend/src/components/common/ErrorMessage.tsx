import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title = '오류가 발생했습니다', 
  message,
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="bg-red-500/20 rounded-full p-4 mb-4">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-red-400 mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-ff14-blue-600 text-white rounded-lg hover:bg-ff14-blue-500 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
};