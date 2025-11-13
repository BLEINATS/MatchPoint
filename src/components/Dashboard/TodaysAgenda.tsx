import React from 'react';
import { motion } from 'framer-motion';
import { Quadra, Reserva } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TodaysAgendaProps {
  reservations?: Reserva[];
  quadras: Quadra[];
  arenaName: string;
  className?: string;
}

const TodaysAgenda: React.FC<TodaysAgendaProps> = ({ reservations = [], quadras, arenaName, className }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1 }} 
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-[28rem]", className)}
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex-shrink-0">Agenda do Dia</h3>
      <div className="space-y-3 flex-grow overflow-y-auto px-2 pb-2 -mx-2 min-h-0">
        {reservations.length > 0 ? reservations.map(r => {
          const quadra = quadras.find(q => q.id === r.quadra_id);
          const typeDetails = getReservationTypeDetails(r.type, r.isRecurring);
          
          return (
            <div key={r.id} className={`flex items-center gap-4 p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 border-l-4 ${typeDetails.borderColor}`}>
              <div className="flex flex-col items-center justify-center rounded-lg p-2 w-20 text-center bg-brand-blue-500 text-white flex-shrink-0">
                <span className="font-bold text-lg">{r.start_time.slice(0, 5)}</span>
                <span className="text-xs">às</span>
                <span className="text-sm">{r.end_time.slice(0, 5)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-gray-900 dark:text-white truncate">{r.clientName}</p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate">
                  {quadra?.name || arenaName} • {r.sport_type || 'Esporte'} ({typeDetails.label})
                </p>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Calendar className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
            <p className="text-sm text-brand-gray-500">Nenhuma reserva para hoje.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TodaysAgenda;
