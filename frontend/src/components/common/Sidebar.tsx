import React from 'react';

interface SidebarProps {
  items?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ items = [] }) => {
  return (
    <div className="h-screen w-64 bg-gray-800 text-white">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Navigation</h2>
      </div>
      <nav className="mt-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-700 ${
              item.active ? 'bg-gray-700' : ''
            }`}
          >
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 