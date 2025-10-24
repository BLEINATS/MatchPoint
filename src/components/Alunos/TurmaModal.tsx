import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, BookOpen, GraduationCap, MapPin, Calendar, Clock, Users, Info } from 'lucide-react';
import { Turma, Professor, Quadra, Aluno, PlanoAula, Matricula, TurmaSchedule } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format, parse, addMinutes, differenceInMinutes } from 'date-fns';
import MatriculaModal from './MatriculaModal';

interface TurmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (turma: Omit<Turma, 'id' | 'arena_id' | 'created_at'> | Turma) => void;
  initialData: Turma | null;
  professores: Professor[];
  quadras: Quadra[];
  alunos: Aluno[];
  planos: PlanoAula[];
  onDataChange: () => void;
}

const weekDays = [
  { id: 0, label: 'Dom' }, { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' }, { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, 'label': 'Sáb' }
];

const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return -1;
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return -1;
        return hours * 60 + minutes;
    } catch (e) {
        return -1;
    }
};

const TurmaModal: React.FC<TurmaModalProps> = ({ isOpen, onClose, onSave, initialData, professores, quadras, alunos, planos, onDataChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    professor_id: '',
    quadra_id: '',
    sport: '',
    schedule: [] as TurmaSchedule[],
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    alunos_por_horario: 8,
    matriculas: [] as Matricula[],
  });
  
  const [isMatriculaModalOpen, setIsMatriculaModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ day: number; time: string } | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      let scheduleData = initialData.schedule || [];
      // Migration logic for old data structure
      if ((!initialData.schedule || initialData.schedule.length === 0) && initialData.daysOfWeek && initialData.daysOfWeek.length > 0) {
        scheduleData = initialData.daysOfWeek.map(day => ({
          day: day,
          start_time: initialData.start_time || '18:00',
          end_time: initialData.end_time || '19:00',
        }));
      }

      setFormData({
        name: initialData.name,
        professor_id: initialData.professor_id,
        quadra_id: initialData.quadra_id,
        sport: initialData.sport,
        schedule: scheduleData,
        start_date: initialData.start_date,
        end_date: initialData.end_date || '',
        alunos_por_horario: initialData.alunos_por_horario || 8,
        matriculas: initialData.matriculas || [],
      });
    } else {
      setFormData({
        name: '', professor_id: '', quadra_id: '', sport: '', schedule: [],
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '', alunos_por_horario: 8, matriculas: [],
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const { daysOfWeek, start_time, end_time, ...restOfData } = formData as any;
    const quadra = quadras.find(q => q.id === restOfData.quadra_id);
    const dataToSave = {
      ...restOfData,
      sport: quadra?.sport_type || restOfData.sport,
      alunos_por_horario: Number(restOfData.alunos_por_horario) || 0,
    };

    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleScheduleDay = (dayId: number) => {
    setFormData(prev => {
      const existingSchedule = prev.schedule.find(s => s.day === dayId);
      if (existingSchedule) {
        return { ...prev, schedule: prev.schedule.filter(s => s.day !== dayId) };
      } else {
        const newSchedule = [...prev.schedule, { day: dayId, start_time: '18:00', end_time: '19:00' }];
        return { ...prev, schedule: newSchedule.sort((a, b) => a.day - b.day) };
      }
    });
  };

  const handleScheduleTimeChange = (day: number, type: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map(s => s.day === day ? { ...s, [type]: value } : s)
    }));
  };
  
  const scheduleGrid = useMemo(() => {
    const allSlots = new Set<string>();
    formData.schedule.forEach(s => {
        try {
            const startTime = parse(s.start_time, 'HH:mm', new Date());
            const endTime = parse(s.end_time, 'HH:mm', new Date());
            let currentTime = startTime;
            while (currentTime < endTime) {
                allSlots.add(format(currentTime, 'HH:mm'));
                currentTime = addMinutes(currentTime, 60);
            }
        } catch (e) { console.error("Invalid time format in schedule", s); }
    });

    const timeSlots = Array.from(allSlots).sort();
    const sortedScheduleDays = formData.schedule.map(s => s.day).sort((a, b) => a - b);

    const grid = timeSlots.map(time => {
      return sortedScheduleDays.map(day => {
        const scheduleForDay = formData.schedule.find(s => s.day === day);
        if (!scheduleForDay) return null;

        const slotTimeMinutes = timeToMinutes(time);
        const startTimeMinutes = timeToMinutes(scheduleForDay.start_time);
        const endTimeMinutes = timeToMinutes(scheduleForDay.end_time);

        if (slotTimeMinutes >= startTimeMinutes && slotTimeMinutes < endTimeMinutes) {
          const matricula = formData.matriculas.find(m => m.dayOfWeek === day && m.time === time);
          return {
            day,
            time,
            enrolled: matricula?.student_ids.length || 0,
            studentIds: matricula?.student_ids || [],
          };
        }
        return null;
      });
    });

    return { timeSlots, sortedScheduleDays, grid };
  }, [formData.schedule, formData.matriculas]);
  
  const handleSlotClick = (day: number, time: string) => {
    setEditingSlot({ day, time });
    setIsMatriculaModalOpen(true);
  };
  
  const handleSaveMatricula = (studentIds: string[]) => {
    if (!editingSlot) return;
    
    setFormData(prev => {
      const existingMatriculaIndex = prev.matriculas.findIndex(m => m.dayOfWeek === editingSlot.day && m.time === editingSlot.time);
      let newMatriculas = [...prev.matriculas];
      
      if (existingMatriculaIndex > -1) {
        newMatriculas[existingMatriculaIndex] = { ...newMatriculas[existingMatriculaIndex], student_ids: studentIds };
      } else {
        newMatriculas.push({ dayOfWeek: editingSlot.day, time: editingSlot.time, student_ids: studentIds });
      }
      
      return { ...prev, matriculas: newMatriculas };
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">{isEditing ? 'Editar Turma' : 'Criar Nova Turma'}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"><X className="h-5 w-5 text-brand-gray-500" /></button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <Input label="Nome da Turma" name="name" value={formData.name} onChange={handleChange} icon={<BookOpen className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Beach Tennis Iniciante - Noite" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Professor</label>
                    <select name="professor_id" value={formData.professor_id} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"><option value="">Selecione...</option>{professores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                    <select name="quadra_id" value={formData.quadra_id} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"><option value="">Selecione...</option>{quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}</select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Dias e Horários</label>
                  <div className="flex flex-wrap gap-2 mb-4">{weekDays.map(day => (<button key={day.id} type="button" onClick={() => toggleScheduleDay(day.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${formData.schedule.some(s => s.day === day.id) ? 'bg-brand-blue-600 text-white shadow-md border-brand-blue-600' : 'bg-white text-brand-gray-700 border-brand-gray-300 hover:bg-brand-gray-100 dark:bg-brand-gray-700 dark:text-brand-gray-300 dark:border-brand-gray-600 dark:hover:bg-brand-gray-600'}`}>{day.label}</button>))}</div>
                  
                  <div className="space-y-4">
                    {formData.schedule.map(s => (
                      <div key={s.day} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                        <span className="font-semibold text-brand-gray-800 dark:text-white">{weekDays.find(wd => wd.id === s.day)?.label}</span>
                        <Input label="Início" type="time" value={s.start_time} onChange={e => handleScheduleTimeChange(s.day, 'start_time', e.target.value)} />
                        <Input label="Fim" type="time" value={s.end_time} onChange={e => handleScheduleTimeChange(s.day, 'end_time', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Input label="Alunos por Horário" name="alunos_por_horario" type="number" value={formData.alunos_por_horario.toString()} onChange={handleChange} icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />
                  <Input label="Data de Início da Turma" name="start_date" type="date" value={formData.start_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                  <Input label="Data de Fim (opcional)" name="end_date" type="date" value={formData.end_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                </div>
                
                {formData.schedule.length > 0 && scheduleGrid.timeSlots.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-lg font-semibold mb-3">Grade de Alunos</h4>
                    <p className="text-sm text-brand-gray-500 mb-4 -mt-2">Clique em um horário para gerenciar os alunos matriculados.</p>
                    <div className="overflow-x-auto">
                      <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${scheduleGrid.sortedScheduleDays.length}, 1fr)` }}>
                        <div />
                        {scheduleGrid.sortedScheduleDays.map(day => <div key={day} className="text-center font-bold text-sm pb-2">{weekDays.find(d=>d.id===day)?.label}</div>)}
                        {scheduleGrid.grid.map((row, rowIndex) => (
                          <React.Fragment key={scheduleGrid.timeSlots[rowIndex]}>
                            <div className="flex items-center justify-center text-xs font-semibold text-brand-gray-500 pr-2">{scheduleGrid.timeSlots[rowIndex]}</div>
                            {row.map((cell, colIndex) => {
                              if (!cell) {
                                return <div key={`${rowIndex}-${colIndex}`} className="p-2 rounded-md bg-brand-gray-100 dark:bg-brand-gray-700/50 opacity-50" />;
                              }
                              return (
                                <button key={`${cell.day}-${cell.time}`} onClick={() => handleSlotClick(cell.day, cell.time)} className={`p-2 rounded-md text-center transition-colors ${cell.enrolled === formData.alunos_por_horario ? 'bg-red-100 dark:bg-red-900/50' : cell.enrolled > 0 ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-brand-gray-100 dark:bg-brand-gray-700/50'} hover:border-brand-blue-500 border-2 border-transparent`}>
                                  <span className="font-bold text-lg">{cell.enrolled}</span><span className="text-sm">/{formData.alunos_por_horario}</span>
                                </button>
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Criar Turma'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {editingSlot && (
        <MatriculaModal 
          isOpen={isMatriculaModalOpen}
          onClose={() => setIsMatriculaModalOpen(false)}
          onSave={handleSaveMatricula}
          allAlunos={alunos}
          enrolledStudentIds={formData.matriculas.find(m => m.dayOfWeek === editingSlot.day && m.time === editingSlot.time)?.student_ids || []}
          capacity={formData.alunos_por_horario}
          planos={planos}
          onDataChange={onDataChange}
        />
      )}
    </>
  );
};

export default TurmaModal;
