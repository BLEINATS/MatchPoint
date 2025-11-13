import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Torneio, Evento } from '../../types';
import { PartyPopper, Calendar, ArrowRight } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import Button from '../Forms/Button';
import { cn } from '../../lib/utils';

interface ProximoEventoWidgetProps {
  eventos: ((Torneio | Evento) & { effectiveDate: Date | null, isTorneio: boolean })[];
  className?: string;
}

const ItemEvento: React.FC<{ evento: any }> = ({ evento }) => {
  const linkTo = evento.isTorneio ? `/torneios/${evento.id}` : `/eventos/${evento.id}`;
  const dateString = evento.effectiveDate ? format(evento.effectiveDate, 'dd/MM/yyyy') : 'Data a definir';
  const isToday = evento.effectiveDate && isSameDay(evento.effectiveDate, new Date());

  return (
    <Link to={linkTo}>
      <motion.div
        whileHover={{ backgroundColor: 'rgba(var(--color-brand-gray-700), 0.7)' }}
        className={cn(
          "p-3 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700/50 transition-colors relative",
          isToday && "border-l-4 border-green-500 bg-green-50 dark:bg-green-900/30"
        )}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">{evento.name}</p>
            <div className="flex items-center text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">
              <Calendar className="h-3 w-3 mr-1.5" />
              <span>{dateString}</span>
            </div>
          </div>
          {isToday && (
            <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
              HOJE
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

const ProximoEventoWidget: React.FC<ProximoEventoWidgetProps> = ({ eventos, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={cn("bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col h-full", className)}
    >
      <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4 flex-shrink-0 flex items-center">
        <PartyPopper className="h-5 w-5 mr-2 text-brand-blue-500" />
        Próximos Eventos
      </h3>
      
      <div className="space-y-3 flex-grow overflow-y-auto pr-2 min-h-0">
        {eventos && eventos.length > 0 ? (
          eventos.map(evento => <ItemEvento key={evento.id} evento={evento} />)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Calendar className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
            <p className="text-sm text-brand-gray-500">Nenhum evento futuro agendado.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProximoEventoWidget;
