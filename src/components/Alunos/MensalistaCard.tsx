import React from 'react';
import { motion } from 'framer-motion';
import { Reserva, Aluno, Quadra } from '../../types';
import { Calendar, Clock, MapPin, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface MensalistaCardProps {
  reserva: Reserva;
  aluno?: Aluno;
  quadra?: Quadra;
  onClick: () => void;
  index: number;
  canEdit: boolean;
}

const MensalistaCard: React.FC<MensalistaCardProps> = ({ reserva, aluno, quadra, onClick, index }) => {
  const masterDate = parseDateStringAsLocal(reserva.date);
  const dayOfWeek = format(masterDate, 'EEEE', { locale: ptBR });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-l-4 border-slate-500"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{aluno?.name || reserva.clientName}</h3>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 capitalize">
              Toda {dayOfWeek}
            </p>
          </div>
          <div className="flex items-center text-sm font-medium text-brand-blue-500">
            <Repeat className="h-4 w-4 mr-1" />
            <span>Mensalista</span>
          </div>
        </div>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-brand-gray-400" />
            <span>{reserva.start_time} - {reserva.end_time}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-brand-gray-400" />
            <span>{quadra?.name || 'Quadra não encontrada'}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-brand-gray-400" />
            <span>
              Início em {format(masterDate, 'dd/MM/yyyy')}
              {reserva.recurringEndDate ? ` até ${format(parseDateStringAsLocal(reserva.recurringEndDate), 'dd/MM/yyyy')}` : ' (contínuo)'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MensalistaCard;
