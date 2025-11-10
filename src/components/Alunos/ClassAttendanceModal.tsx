import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, UserCheck, UserX, Users, AlertTriangle } from 'lucide-react';
import { Aluno } from '../../types';
import Button from '../Forms/Button';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    updatedAttendance: { [alunoId: string]: 'presente' | 'falta' },
    classDetails: { turma_id: string; date: string; time: string }
  ) => void;
  classData: any;
  allAlunos: Aluno[];
}

const ClassAttendanceModal: React.FC<ClassAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classData,
  allAlunos,
}) => {
  const [attendance, setAttendance] = useState<{ [alunoId: string]: 'presente' | 'falta' }>({});

  const enrolledStudents = useMemo(() => {
    if (!classData || !classData.turma || !classData.turma.matriculas) return [];

    const matricula = classData.turma.matriculas.find(
      (m: any) => m.dayOfWeek === classData.dayOfWeek && m.time === classData.start_time
    );

    if (!matricula || !matricula.student_ids) return [];

    return allAlunos.filter(aluno => matricula.student_ids.includes(aluno.id));
  }, [classData, allAlunos]);

  const isFutureClass = useMemo(() => {
    if (!classData || !classData.date) return false;
    return isAfter(startOfDay(classData.date), startOfDay(new Date()));
  }, [classData]);

  useEffect(() => {
    if (isOpen) {
      const initialAttendance: { [alunoId: string]: 'presente' | 'falta' } = {};
      const classDateStr = format(classData.date, 'yyyy-MM-dd');

      enrolledStudents.forEach(student => {
        const historyEntry = student.attendance_history?.find(
          h => h.turma_id === classData.turma.id && h.date === classDateStr && h.time === classData.start_time
        );
        if (historyEntry) {
          initialAttendance[student.id] = historyEntry.status;
        }
      });
      setAttendance(initialAttendance);
    }
  }, [isOpen, enrolledStudents, classData]);

  const handleAttendanceChange = (alunoId: string, status: 'presente' | 'falta') => {
    if (isFutureClass) return;
    setAttendance(prev => ({
      ...prev,
      [alunoId]: prev[alunoId] === status ? undefined : status,
    }));
  };

  const handleSave = () => {
    onSave(attendance, {
      turma_id: classData.turma.id,
      date: format(classData.date, 'yyyy-MM-dd'),
      time: classData.start_time,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <div>
                <h3 className="text-xl font-semibold">Lista de Presença</h3>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                  {classData.turma.name} - {format(classData.date, 'dd/MM/yyyy')} às {classData.start_time}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 overflow-y-auto">
              {isFutureClass && (
                <div className="p-3 mb-4 rounded-md bg-yellow-50 dark:bg-yellow-900/50 flex items-center gap-3 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    A frequência só pode ser registrada no dia da aula ou após.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {enrolledStudents.length > 0 ? (
                  enrolledStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img src={student.avatar_url || `https://avatar.vercel.sh/${student.id}.svg`} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'presente' ? 'primary' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'presente')}
                          className={attendance[student.id] === 'presente' ? 'bg-green-500 hover:bg-green-600' : ''}
                          disabled={isFutureClass}
                          title={isFutureClass ? "Não é possível dar presença para aulas futuras." : "Marcar presença"}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.id] === 'falta' ? 'danger' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'falta')}
                          className={attendance[student.id] === 'falta' ? 'bg-red-500 hover:bg-red-600' : ''}
                          disabled={isFutureClass}
                          title={isFutureClass ? "Não é possível dar falta para aulas futuras." : "Marcar falta"}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-brand-gray-500 py-8">Nenhum aluno matriculado neste horário.</p>
                )}
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isFutureClass}>
                <Save className="h-4 w-4 mr-2" /> Salvar Frequência
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClassAttendanceModal;
