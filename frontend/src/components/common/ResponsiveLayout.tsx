import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  maxWidth = 'full',
  padding = 'md',
}) => {
  return (
    <div className={`
      mx-auto w-full
      ${maxWidthClasses[maxWidth]}
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ children, cols = 1, gap = 'md', className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div className={`
      grid ${gridCols[cols]} ${gapClasses[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const ResponsiveCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ children, className = '', padding = 'md' }) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div className={`
      bg-white rounded-lg shadow-sm border border-gray-200
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const ResponsiveSection: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}> = ({ children, title, subtitle, className = '', actions }) => {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}; 