import React from 'react';
import { motion } from 'framer-motion';

type View = 'inicio' | 'aulas' | 'reservas' | 'perfil';

interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  visible: boolean;
}

interface SideNavBarProps {
  items: NavItem[];
  activeView: View;
  setActiveView: (view: View) => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ items, activeView, setActiveView }) => {
  return (
    <nav className="hidden md:flex flex-col w-64 bg-white dark:bg-brand-gray-900 border-r border-brand-gray-200 dark:border-brand-gray-700 p-4">
      <div className="space-y-2">
        {items.filter(item => item.visible).map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center p-3 rounded-lg text-sm font-semibold transition-colors relative ${
              activeView === item.id ? 'text-white' : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeView === item.id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-brand-blue-500 rounded-lg z-0"
              />
            )}
            <div className="relative z-10 flex items-center">
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </nav>
  );
};

export default SideNavBar;
