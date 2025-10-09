import React from 'react';
import { motion } from 'framer-motion';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { ReservationType } from '../../types';

const ReservationLegend: React.FC = () => {
  const types: ReservationType[] = ['normal', 'aula', 'evento', 'bloqueio'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8"
    >
      {types.map(type => {
        const details = getReservationTypeDetails(type);
        return (
          <div key={type} className="flex items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
            <div className={`w-3 h-3 rounded-sm mr-2 ${details.bgColor}`}></div>
            <span>{details.label}</span>
          </div>
        )
      })}
      <div className="flex items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
        <div className="w-3 h-3 rounded-sm mr-2 bg-slate-500"></div>
        <span>Reserva Recorrente (Fixo)</span>
      </div>
    </motion.div>
  );
};

export default ReservationLegend;
