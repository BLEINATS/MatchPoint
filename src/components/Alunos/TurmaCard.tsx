import React from 'react';
import { motion } from 'framer-motion';
import { Turma, Professor, Quadra } from '../../types';
import Button from '../Forms/Button';
import { Edit2, Trash2, Users, GraduationCap, MapPin, Calendar, Clock } from 'lucide-react';

interface TurmaCardProps {
  turma: Turma;
  professor?: Professor;
  quadra?: Quadra;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TurmaCard: React.FC<TurmaCardProps> = ({ turma, professor, quadra, onEdit, onDelete, index }) => {
  const scheduleString = turma.daysOfWeek.map(d => weekDays[d]).join(' & ');

  return (
    <motion.div
      key={turma.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{turma.name}</h3>
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{turma.sport}</p>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit} className="p-2"><Edit2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <GraduationCap className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{professor?.name || 'Professor não encontrado'}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{quadra?.name || 'Quadra não encontrada'}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{scheduleString}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span>{turma.start_time} - {turma.end_time}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
            <Users className="h-4 w-4 mr-2" />
            Alunos
          </div>
          <span className="font-bold text-brand-gray-900 dark:text-white">{turma.student_ids.length} / {turma.capacity}</span>
        </div>
        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
          <div 
            className="bg-brand-blue-500 h-2.5 rounded-full" 
            style={{ width: `${(turma.student_ids.length / turma.capacity) * 100}%` }}
          ></div>
        </div>
      </div>
    </motion.div>
  );
};

export default TurmaCard;
