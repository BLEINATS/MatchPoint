import React from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { Reserva, Quadra } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useTheme } from '../../context/ThemeContext';

interface UpcomingReservationCardProps {
  reservation: Reserva;
  quadra?: Quadra;
  index: number;
  arenaName?: string;
}

const UpcomingReservationCard: React.FC<UpcomingReservationCardProps> = ({ reservation, quadra, index, arenaName }) => {
  const { theme } = useTheme();
  if (!quadra) return null;

  const qrCodeColors = {
    light: { fg: '#0f172a', bg: '#f1f5f9' },
    dark: { fg: '#f8fafc', bg: '#1e293b' },
  };
  const currentColors = theme === 'dark' ? qrCodeColors.dark : qrCodeColors.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden flex flex-col h-full"
    >
      <div className="p-5 flex-1">
        <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white mb-2">{quadra.name}</h3>
        <p className="text-sm text-brand-gray-500 mb-4">{quadra.sports.join(', ')}</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium capitalize">{format(parseDateStringAsLocal(reservation.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">{arenaName ? `${quadra.name} • ${arenaName}` : quadra.name}</span>
          </div>
        </div>
      </div>
      <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 flex items-center justify-center">
        <div className="bg-white dark:bg-brand-gray-800 p-2 rounded-md shadow-inner">
           <QRCode
            value={reservation.id}
            size={80}
            fgColor={currentColors.fg}
            bgColor={currentColors.bg}
            level="L"
            includeMargin={false}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default UpcomingReservationCard;
