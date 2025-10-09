import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, BookOpen, GraduationCap, MapPin, Calendar, Clock, Users, Info } from 'lucide-react';
import { Turma, Professor, Quadra } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';

interface TurmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (turma: Omit<Turma, 'id' | 'arena_id' | 'created_at'> | Turma) => void;
  initialData: Turma | null;
  professores: Professor[];
  quadras: Quadra[];
}

const weekDays = [
  { id: 0, label: 'Dom' }, { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' }, { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }
];

const TurmaModal: React.FC<TurmaModalProps> = ({ isOpen, onClose, onSave, initialData, professores, quadras }) => {
  const [formData, setFormData] = useState({
    name: '',
    professor_id: '',
    quadra_id: '',
    sport: '',
    daysOfWeek: [] as number[],
    start_time: '08:00',
    end_time: '09:00',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    capacity: 8,
    student_ids: [] as string[],
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name,
        professor_id: initialData.professor_id,
        quadra_id: initialData.quadra_id,
        sport: initialData.sport,
        daysOfWeek: initialData.daysOfWeek,
        start_time: initialData.start_time,
        end_time: initialData.end_time,
        start_date: initialData.start_date,
        end_date: initialData.end_date || '',
        capacity: initialData.capacity,
        student_ids: initialData.student_ids,
      });
    } else {
      setFormData({
        name: '', professor_id: '', quadra_id: '', sport: '', daysOfWeek: [],
        start_time: '08:00', end_time: '09:00', start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '', capacity: 8, student_ids: [],
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const quadra = quadras.find(q => q.id === formData.quadra_id);
    const dataToSave = {
      ...formData,
      sport: quadra?.sport_type || formData.sport,
      capacity: Number(formData.capacity) || 0,
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

  const toggleDay = (dayId: number) => {
    setFormData(prev => {
      const daysOfWeek = prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter(d => d !== dayId)
        : [...prev.daysOfWeek, dayId];
      return { ...prev, daysOfWeek };
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isEditing ? 'Editar Turma' : 'Criar Nova Turma'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <Input label="Nome da Turma" name="name" value={formData.name} onChange={handleChange} icon={<BookOpen className="h-4 w-4 text-brand-gray-400"/>} placeholder="Ex: Beach Tennis Iniciante - Noite" required />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Professor</label>
                  <select name="professor_id" value={formData.professor_id} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="">Selecione...</option>
                    {professores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                  <select name="quadra_id" value={formData.quadra_id} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="">Selecione...</option>
                    {quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        formData.daysOfWeek.includes(day.id)
                          ? 'bg-brand-blue-600 text-white shadow-md border-brand-blue-600'
                          : 'bg-white text-brand-gray-700 border-brand-gray-300 hover:bg-brand-gray-100 dark:bg-brand-gray-700 dark:text-brand-gray-300 dark:border-brand-gray-600 dark:hover:bg-brand-gray-600'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Horário de Início" name="start_time" type="time" value={formData.start_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Horário de Fim" name="end_time" type="time" value={formData.end_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Data de Início da Turma" name="start_date" type="date" value={formData.start_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Data de Fim (opcional)" name="end_date" type="date" value={formData.end_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
              </div>

              <Input label="Capacidade Máxima de Alunos" name="capacity" type="number" value={formData.capacity.toString()} onChange={handleChange} icon={<Users className="h-4 w-4 text-brand-gray-400"/>} />

              <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
                <h5 className="font-medium mb-2 flex items-center text-blue-900 dark:text-blue-200"><Info className="h-4 w-4 mr-2" />Como funciona?</h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ao salvar, o sistema criará automaticamente reservas recorrentes do tipo "Aula" no Hub de Reservas, bloqueando os horários selecionados para esta turma.
                </p>
              </div>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Criar Turma'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TurmaModal;
