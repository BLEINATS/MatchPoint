import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Aluno, Turma } from '../../../types';
import Button from '../../Forms/Button';
import { format, isPast, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../../utils/dateUtils';

interface AttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno;
  turmas: Turma[];
}

const AttendanceReportModal: React.FC<AttendanceReportModalProps> = ({ isOpen, onClose, aluno, turmas }) => {
  const attendanceData = React.useMemo(() => {
    if (!aluno.aulas_agendadas) return [];

    const pastScheduledClasses = aluno.aulas_agendadas.filter(aula =>
      isPast(endOfDay(parseDateStringAsLocal(aula.date)))
    );

    return pastScheduledClasses
      .map(scheduledClass => {
        const turma = turmas.find(t => t.id === scheduledClass.turma_id);
        return {
          date: parseDateStringAsLocal(scheduledClass.date),
          status: 'present' as 'present' | 'absent', // Assumindo presença para aulas agendadas no passado
          turmaName: turma?.name || 'Aula não encontrada',
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [aluno, turmas]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold">Relatório de Frequência</h3>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {attendanceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {item.status === 'present' ? (
                        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-brand-gray-800 dark:text-white capitalize">
                          {format(item.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{item.turmaName}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${item.status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.status === 'present' ? 'Presença' : 'Falta'}
                    </span>
                  </div>
                ))}
                {attendanceData.length === 0 && (
                  <p className="text-center text-brand-gray-500 py-8">Nenhum histórico de frequência encontrado.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceReportModal;
