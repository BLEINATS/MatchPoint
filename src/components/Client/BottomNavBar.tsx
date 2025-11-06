import React from 'react';
import { Dock, DockIcon, DockItem, DockLabel } from '../ui/dock';
import { cn } from '../../lib/utils';

type View = 'inicio' | 'aulas' | 'reservas' | 'loja' | 'amigos' | 'perfil';

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
    <div className="md:hidden fixed bottom-2 left-0 right-0 z-40">
      <Dock 
        className="bg-white/80 dark:bg-brand-gray-900/80 backdrop-blur-lg border border-brand-gray-200 dark:border-brand-gray-700"
        magnification={60}
        distance={80}
        panelHeight={56}
      >
        {items.filter(item => item.visible).map((item) => (
          <DockItem
            key={item.id}
            className={cn(
              'aspect-square rounded-full transition-colors',
              activeView === item.id 
                ? 'bg-blue-100 dark:bg-brand-blue-500/20' 
                : 'bg-transparent hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800'
            )}
            onClick={() => setActiveView(item.id)}
          >
            <DockLabel>{item.label}</DockLabel>
            <DockIcon>
              <item.icon className={cn(
                'h-6 w-6 transition-colors',
                activeView === item.id 
                  ? 'text-brand-blue-500' 
                  : 'text-brand-gray-500 dark:text-brand-gray-400'
              )} />
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
};

export default BottomNavBar;
