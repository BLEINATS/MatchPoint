import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Torneio, Evento } from '../../types';
import { Trophy, PartyPopper, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import Button from '../Forms/Button';
import { cn } from '../../lib/utils';

interface ProximoEventoWidgetProps {
  evento: (Torneio | Evento) | null;
  className?: string;
}

const ProximoEventoWidget: React.FC<ProximoEventoWidgetProps> = ({ evento, className }) => {
  if (!evento) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col justify-between h-full", className)}
      >
        <div className="flex-grow">
          <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-brand-blue-500" />
            Próximo Evento
          </h3>
          <div className="text-center text-brand-gray-500 flex-grow flex flex-col items-center justify-center">
            <p>Nenhum evento futuro agendado.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const isTorneio = 'max_participants' in evento;
  const Icon = isTorneio ? Trophy : PartyPopper;
  const linkTo = isTorneio ? `/torneios/${evento.id}` : `/eventos/${evento.id}`;
  const startDate = parseDateStringAsLocal(isTorneio ? evento.start_date : evento.startDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-full", className)}
    >
      <div className="flex-grow">
        <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex items-center">
          <Icon className="h-5 w-5 mr-2 text-brand-blue-500" />
          Próximo Evento
        </h3>
        <div className="space-y-3">
          <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{evento.name}</p>
          <div className="flex items-center text-sm text-brand-gray-500 dark:text-brand-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{format(startDate, 'dd/MM/yyyy')}</span>
          </div>
        </div>
      </div>
      <Link to={linkTo} className="mt-4">
        <Button variant="outline" size="sm" className="w-full">
          Ver Detalhes <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
};

export default ProximoEventoWidget;
