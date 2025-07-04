import React from 'react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon,
  title, 
  description,
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {Icon && (
        <div className="bg-ff14-blue-500/10 rounded-full p-4 mb-4">
          <Icon className="h-12 w-12 text-ff14-blue-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-game"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};