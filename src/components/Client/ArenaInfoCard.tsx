import React from 'react';
import { Arena } from '../../types';
import { MapPin } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useTheme } from '../../context/ThemeContext';

interface ArenaInfoCardProps {
  arena: Arena;
}

const ArenaInfoCard: React.FC<ArenaInfoCardProps> = ({ arena }) => {
  const { theme } = useTheme();
  const qrCodeColors = {
    light: { fg: '#0f172a', bg: '#f1f5f9' },
    dark: { fg: '#f8fafc', bg: '#1e293b' },
  };
  const currentColors = theme === 'dark' ? qrCodeColors.dark : qrCodeColors.light;
  const publicUrl = `${window.location.origin}/${arena.slug}`;

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden h-48 lg:h-56">
      <div className="p-4 h-full flex flex-col">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white mb-2">{arena.name}</h3>
          <p className="text-sm text-brand-gray-500 mb-3 line-clamp-2">Bem-vindo à {arena.name}! Reserve um horário abaixo.</p>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300 text-sm">
            <MapPin className="h-4 w-4 mr-2 text-brand-blue-500 flex-shrink-0" />
            <span className="font-medium truncate">{arena.city}, {arena.state}</span>
          </div>
        </div>
        <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-3 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Acesse a página pública</p>
          </div>
          <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-1.5 rounded">
            <QRCode
              value={publicUrl}
              size={40}
              fgColor={currentColors.fg}
              bgColor={currentColors.bg}
              level="L"
              includeMargin={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaInfoCard;
