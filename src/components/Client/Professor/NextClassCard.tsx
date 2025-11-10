import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface ProfessorNextClassCardProps {
  nextClass: {
    date: Date;
    turma: { name: string };
    quadra?: { name: string };
    start_time: string;
    enrolledCount: number;
    capacity: number;
  };
  onClick?: () => void;
}

const ProfessorNextClassCard: React.FC<ProfessorNextClassCardProps> = ({ nextClass, onClick }) => {
  if (!nextClass) return null;

  const cardContent = (
    <>
      <div className="p-5 flex-1">
        <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white mb-2">{nextClass.turma.name}</h3>
        <p className="text-sm text-brand-gray-500 mb-4">Sua próxima aula como professor</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-purple-500" />
            <span className="font-medium capitalize">{format(nextClass.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-purple-500" />
            <span className="font-medium">às {nextClass.start_time?.slice(0, 5) || 'Horário indefinido'}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
            <span className="font-medium">{nextClass.quadra?.name || 'Local a definir'}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Users className="h-4 w-4 mr-2 text-purple-500" />
            <span className="font-medium">{nextClass.enrolledCount} / {nextClass.capacity} alunos</span>
          </div>
        </div>
      </div>
      <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 flex items-center justify-center mt-auto">
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 font-medium">Clique para ver os alunos</p>
      </div>
    </>
  );

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden flex flex-col w-full text-left hover:border-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 border-l-4 border-purple-500"
    >
      {cardContent}
    </motion.button>
  );
};

export default ProfessorNextClassCard;
