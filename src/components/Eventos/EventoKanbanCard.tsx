import React from 'react';
import { motion } from 'framer-motion';
import { Evento } from '../../types';
import { Calendar, User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface EventoKanbanCardProps {
  evento: Evento;
}

const EventoKanbanCard: React.FC<EventoKanbanCardProps> = ({ evento }) => {
  const startDate = parseDateStringAsLocal(evento.startDate);
  const endDate = parseDateStringAsLocal(evento.endDate);
  const dateString = isNaN(startDate.getTime()) ? "Data a definir" : 
    format(startDate, 'dd/MM') + (
      !isNaN(endDate.getTime()) && startDate.getTime() !== endDate.getTime() 
      ? ` - ${format(endDate, 'dd/MM')}` 
      : ''
    );

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white dark:bg-brand-gray-800 p-4 rounded-md shadow-sm border border-brand-gray-200 dark:border-brand-gray-700 cursor-pointer hover:shadow-md hover:border-brand-blue-400"
    >
      <h4 className="font-bold text-brand-gray-900 dark:text-white mb-2 pr-2 truncate">{evento.name}</h4>
      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mb-3 capitalize">{evento.type}</p>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-300">
          <User className="h-3.5 w-3.5 mr-2 text-brand-gray-400" />
          <span className="truncate">{evento.clientName}</span>
        </div>
        <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-300">
          <Calendar className="h-3.5 w-3.5 mr-2 text-brand-gray-400" />
          <span>{dateString}</span>
        </div>
        <div className="flex items-center text-green-600 dark:text-green-400">
          <DollarSign className="h-3.5 w-3.5 mr-2" />
          <span className="font-semibold">{formatCurrency(evento.totalValue)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventoKanbanCard;
