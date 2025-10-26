import React, { useMemo } from 'react';
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
  if (!turma) return null;

  const totalUniqueStudents = useMemo(() => {
    const studentIds = (turma.matriculas || []).flatMap(m => m?.student_ids || []);
    return new Set(studentIds).size;
  }, [turma]);

  const scheduleDetails = useMemo(() => {
    if (!turma.schedule || turma.schedule.length === 0) {
      return <p className="text-sm text-brand-gray-500">Sem horário definido</p>;
    }
    const sortedSchedule = [...turma.schedule].sort((a, b) => a.day - b.day);
    return sortedSchedule.map(s => (
      <div key={s.day} className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
        <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
        <span className="w-10 font-medium">{weekDays[s.day]}:</span>
        <span className="font-semibold">{s.start_time} - {s.end_time}</span>
      </div>
    ));
  }, [turma.schedule]);

  return (
    <motion.div
      key={turma.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between border-l-4 border-pink-500"
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
          <div className="space-y-2">{scheduleDetails}</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
            <Users className="h-4 w-4 mr-2" />
            Alunos Matriculados
          </div>
          <span className="font-bold text-brand-gray-900 dark:text-white">{totalUniqueStudents}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TurmaCard;
