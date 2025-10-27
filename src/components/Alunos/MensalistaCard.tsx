import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Reserva, Aluno, Quadra } from '../../types';
import Button from '../Forms/Button';
import { Edit2, Trash2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

interface MensalistaCardProps {
  reserva: Reserva;
  aluno?: Aluno;
  quadra?: Quadra;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  canEdit: boolean;
}

const MensalistaCard: React.FC<MensalistaCardProps> = ({ reserva, aluno, quadra, onEdit, onDelete, index, canEdit }) => {
  
  const recurringDayOfWeek = useMemo(() => {
    if (!reserva.date) return '';
    const masterDate = parseDateStringAsLocal(reserva.date);
    return format(masterDate, 'EEEE', { locale: ptBR });
  }, [reserva.date]);

  const scheduleDetails = (
    <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
        <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
        <span className="w-10 font-medium capitalize">{recurringDayOfWeek.substring(0,3)}:</span>
        <span className="font-semibold">{reserva.start_time.slice(0,5)} - {reserva.end_time.slice(0,5)}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between border-l-4 border-slate-500"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{aluno?.name || reserva.clientName}</h3>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{reserva.sport_type}</p>
          </div>
          {canEdit && (
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2"><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{quadra?.name || 'Quadra não encontrada'}</span>
          </div>
          {scheduleDetails}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
            <DollarSign className="h-4 w-4 mr-2" />
            Valor por Horário
          </div>
          <span className="font-bold text-brand-gray-900 dark:text-white">{formatCurrency(reserva.total_price)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MensalistaCard;
