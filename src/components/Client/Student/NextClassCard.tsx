import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, GraduationCap } from 'lucide-react';

interface NextClassCardProps {
  date: Date;
  turmaName: string;
  quadraName?: string;
  professorName?: string;
  startTime: string;
  arenaName?: string;
}

const NextClassCard: React.FC<NextClassCardProps> = ({ date, turmaName, quadraName, professorName, startTime, arenaName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden flex flex-col h-full"
    >
      <div className="p-5 flex-1">
        <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white mb-2">{turmaName}</h3>
        <p className="text-sm text-brand-gray-500 mb-4">Sua próxima aula agendada</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium capitalize">{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">às {startTime.slice(0, 5)}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">{quadraName ? `${quadraName} • ${arenaName}` : (arenaName || 'Local a definir')}</span>
          </div>
           <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <GraduationCap className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">Prof. {professorName || 'Não informado'}</span>
          </div>
        </div>
      </div>
      <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 flex items-center justify-center">
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 font-medium">Prepare-se para evoluir!</p>
      </div>
    </motion.div>
  );
};

export default NextClassCard;
