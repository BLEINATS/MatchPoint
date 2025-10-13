import React from 'react';
import { motion } from 'framer-motion';

type View = 'inicio' | 'aulas' | 'reservas' | 'perfil';

interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  visible: boolean;
}

interface BottomNavBarProps {
  items: NavItem[];
  activeView: View;
  setActiveView: (view: View) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ items, activeView, setActiveView }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-brand-gray-900/80 backdrop-blur-lg border-t border-brand-gray-200 dark:border-brand-gray-700 shadow-t-lg z-40">
      <div className="flex justify-around items-center h-16">
        {items.filter(item => item.visible).map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
              activeView === item.id ? 'text-brand-blue-500' : 'text-brand-gray-500 dark:text-brand-gray-400'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">{item.label}</span>
            {activeView === item.id && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-brand-blue-500 rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
