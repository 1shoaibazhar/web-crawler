import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="sr-only"
      />
      <div
        className={`
          w-4 h-4 border-2 rounded flex items-center justify-center
          transition-colors duration-200 cursor-pointer
          ${disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : checked || indeterminate
              ? 'bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700'
              : 'bg-white border-gray-300 hover:border-blue-500'
          }
        `}
        onClick={() => !disabled && onChange(!checked)}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        {(checked || indeterminate) && (
          <Check 
            className={`w-3 h-3 text-white ${indeterminate ? 'opacity-50' : ''}`}
            strokeWidth={3}
          />
        )}
      </div>
    </div>
  );
}; 